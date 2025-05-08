import express from 'express';
import puppeteer from 'puppeteer';
import fs from 'fs/promises';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', async (req, res) => {
  const jugadores = (await fs.readFile('jugadores.txt', 'utf8'))
    .split('\n')
    .map(j => j.trim())
    .filter(Boolean);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox']
    });

    const page = await browser.newPage();
    await page.goto('https://www.velocidrone.com/leaderboard/16/1777/All', { waitUntil: 'networkidle2' });

    // Clic en la pestaña Race Mode de forma más estable
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('a')).filter(el => el.textContent.includes('Race Mode'));
      if (tabs.length > 0) tabs[0].click();
    });

    await page.waitForSelector('tbody tr', { timeout: 10000 });

    const resultados = await page.$$eval('tbody tr', (filas, jugadores) => {
      return filas.slice(0, 50).map((fila, i) => {
        const celdas = fila.querySelectorAll('td');
        const tiempo = celdas[1]?.innerText.trim();
        const jugador = celdas[2]?.innerText.trim();
        if (jugadores.includes(jugador)) {
          return `${i + 1}\t${tiempo}\t${jugador}`;
        }
        return null;
      }).filter(Boolean);
    }, jugadores);

    res.send(`<h1>Resultados Velocidrone</h1><pre>${resultados.join('\n')}</pre>`);
  } catch (e) {
    res.send(`<pre>Error: ${e.message}</pre>`);
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
