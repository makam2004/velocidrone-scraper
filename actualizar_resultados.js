import fs from 'fs/promises';
import puppeteer from 'puppeteer';

const puntos_posicion = [10, 8, 6, 4, 5];
const puntos_default = 1;

const urls = [
  'https://www.velocidrone.com/leaderboard/33/1527/All',
  'https://www.velocidrone.com/leaderboard/16/1795/All'
];

async function leerJugadores() {
  try {
    const data = await fs.readFile('jugadores.txt', 'utf8');
    return data.split('\n').map(x => x.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

async function obtenerResultados(url, jugadores) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  try {
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('a')).filter(el => el.textContent.includes('Race Mode'));
      if (tabs.length > 0) tabs[0].click();
    });
    await page.waitForSelector('tbody tr', { timeout: 10000 });

    const track = await page.$eval('div.container h3', el => el.innerText.trim());
    const escenario = await page.$eval('h2.text-center', el => el.innerText.trim());

    const resultados = await page.$$eval('tbody tr', (filas, jugadores) => {
      return filas.slice(0, 100).map((fila, i) => {
        const celdas = fila.querySelectorAll('td');
        const tiempo = celdas[1]?.innerText.trim();
        const jugador = celdas[2]?.innerText.trim();
        if (jugadores.includes(jugador)) {
          return { tiempo, jugador };
        }
        return null;
      }).filter(Boolean);
    }, jugadores);

    await browser.close();
    return { escenario, track, resultados };
  } catch (e) {
    await browser.close();
    return { escenario: 'Error', track: 'Error', resultados: [] };
  }
}

async function main() {
  const jugadores = await leerJugadores();
  const semana = Math.ceil((((new Date()) - new Date(new Date().getFullYear(), 0, 1)) / 86400000 + new Date().getDay() + 1) / 7);
  const ranking = {};
  const tracks = [];

  for (const url of urls) {
    const { escenario, track, resultados } = await obtenerResultados(url, jugadores);
    const datos = resultados.map((r, i) => {
      const puntos = i < puntos_posicion.length ? puntos_posicion[i] : puntos_default;
      ranking[r.jugador] = (ranking[r.jugador] || 0) + puntos;
      return `${i + 1}\t${r.tiempo}\t${r.jugador}`;
    });
    tracks.push({ nombre: `${escenario} - ${track}`, datos });
  }

  const ranking_semanal = Object.entries(ranking)
    .sort((a, b) => b[1] - a[1])
    .map(([jugador, puntos], i) => `${i + 1}. ${jugador} - ${puntos} pts`);

  const resultadoFinal = {
    semana,
    tracks,
    ranking_semanal
  };

  await fs.writeFile('/tmp/resultados.json', JSON.stringify(resultadoFinal, null, 2));
  console.log('✅ Archivo resultados.json actualizado');
}

main();
