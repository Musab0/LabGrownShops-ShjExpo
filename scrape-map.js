// Loads the official show map in local Chromium, records every JSON/API response
// (exhibitors, zones, booth geometry) and screenshots the Lab Grown zone.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs'), path = require('path');
const OUT = process.argv[2] || './mapdump';
const URLS = [
  'https://map.mideastjewellery.com/categories/zones/lab-grown?mapId=JP8Dg98DGOYjr',
  'https://wj58.invisual.app/qr-code/58-qr-sc14?mapId=JP8Dg98DGOYjr',
];
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(() => chromium.launch());
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  let n = 0; const log = [];
  page.on('response', async r => {
    const ct = r.headers()['content-type'] || '', u = r.url();
    log.push(`${r.status()} ${ct.split(';')[0]} ${u}`);
    if (/json|graphql/.test(ct) || /\/api\//.test(u)) {
      try { fs.writeFileSync(path.join(OUT, `resp_${String(++n).padStart(3,'0')}.json`), JSON.stringify({ url: u, body: await r.text() })); } catch {}
    }
  });
  for (const u of URLS) {
    await page.goto(u, { waitUntil: 'networkidle', timeout: 90000 }).catch(e => console.log('goto:', e.message));
    await page.waitForTimeout(8000);
    await page.screenshot({ path: path.join(OUT, `shot_${URLS.indexOf(u)}.png`), fullPage: true });
    fs.writeFileSync(path.join(OUT, `text_${URLS.indexOf(u)}.txt`), await page.evaluate(() => document.body.innerText));
  }
  fs.writeFileSync(path.join(OUT, 'network.txt'), log.join('\n'));
  console.log(`saved ${n} JSON responses, ${log.length} requests → ${OUT}`);
  await browser.close();
})();
