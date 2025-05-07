const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs/promises');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', async (req, res) => {
  const jugadores = (await fs.readFile('jugadores.txt', 'utf8'))
    .split('\n')
    .map(j => j.trim())
    .filter(j => j.length > 0);

  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  });

  const page = await browser.newPage();
  await page.goto('https://www.velocidrone.com/leaderboard/16/1777/All', { waitUntil: 'networkidle2' });

  try {
    await page.click('a:has-text("Race Mode")');
    await page.waitForSelector('tbody tr', { timeout: 5000 });

    const datos = await page.$$eval('tbody tr', (filas, jugadores) => {
      return filas.slice(0, 50).map((fila, i) => {
        const celdas = fila.querySelectorAll('td');
        const time = celdas[1]?.innerText.trim();
        const player = celdas[2]?.innerText.trim();
        if (jugadores.includes(player)) {
          return `${i + 1}\t${time}\t${player}`;
        }
        return null;
      }).filter(Boolean);
    }, jugadores);

    await browser.close();

    res.send(`
      <h1>Resultados Velocidrone</h1>
      <pre>${datos.join('\n')}</pre>
    `);
  } catch (error) {
    await browser.close();
    res.send(`<pre>Error: ${error.message}</pre>`);
  }
});

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});
