// Browser checks, Scryfall answered locally: node test/browser.js <base-url> <card.jpg> [screenshot-dir]
const { chromium } = require('playwright-core');
const fs = require('fs');
const [base, imgPath, out] = process.argv.slice(2);
const img = fs.readFileSync(imgPath);
let fails = 0;
const say = (good, msg) => { if (!good) fails++; console.log(`${good ? 'ok  ' : 'FAIL'} ${msg}`); };
const fake = (c, asked) => c.route('https://api.scryfall.com/**', r => {
  asked.push(r.request().url());
  return /Jace/.test(decodeURIComponent(r.request().url())) ? r.fulfill({ status: 404, body: '' }) : r.fulfill({ status: 200, contentType: 'image/jpeg', body: img });
});
const shot = (p, name, opt = {}) => out && p.screenshot({ path: `${out}/${name}.png`, ...opt });
(async () => {
  const browser = await chromium.launch();
  {
    const asked = [], c = await browser.newContext({ viewport: { width: 1000, height: 700 } }); await fake(c, asked);
    const p = await c.newPage(); await p.goto(base + '/home', { waitUntil: 'networkidle' });
    const before = asked.length;
    const vis = () => p.evaluate(() => !document.querySelector('.scryfall-pop').hidden);
    await p.hover('a[data-card="Foudre"]'); await p.waitForTimeout(300);
    const st = await p.evaluate(() => { const i = document.querySelector('.scryfall-pop img'); return [i.complete && i.naturalWidth > 0, decodeURIComponent(i.src)]; });
    const shown = await vis();
    await shot(p, 'hover', { clip: { x: 0, y: 0, width: 1000, height: 500 } });
    const box = await p.locator('.scryfall-pop img').boundingBox();
    await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 5 }); await p.waitForTimeout(400);
    const stays = await vis();
    await p.mouse.move(5, 5); await p.waitForTimeout(400);
    const gone = !(await vis());
    say(before === 0 && shown && st[0] && /fuzzy=Foudre/.test(st[1]) && stays && gone, `hover: ${before} request before, shown ${shown}, image ${st[0]}, stays over the card ${stays}, hidden after ${gone}`);
    await p.focus('a[data-card="Llanowar Elves"]'); const kb = await vis();
    await p.keyboard.press('Escape'); const esc = !(await vis());
    say(kb && esc, `keyboard focus shows ${kb}, Escape closes ${esc}`);
    await p.hover('a[data-card^="Jace"]'); await p.waitForTimeout(300);
    const miss = await p.evaluate(() => !document.querySelector('.scryfall-pop-msg').hidden && document.querySelector('.scryfall-pop-msg').textContent);
    say(miss === 'Card not found on Scryfall.', `missing card: ${miss}`);
    await c.close();
  }
  {
    const asked = [], c = await browser.newContext({ viewport: { width: 390, height: 700 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }); await fake(c, asked);
    const p = await c.newPage(); await p.goto(base + '/home', { waitUntil: 'networkidle' });
    await p.tap('a[data-card="Foudre"]'); await p.waitForTimeout(300);
    const st = await p.evaluate(() => { const q = document.querySelector('dialog.scryfall-sheet'); return [!!(q && q.open), location.pathname, q && q.querySelector('.scryfall-pop-bar a').href, document.activeElement.textContent]; });
    await shot(p, 'sheet');
    await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    const closed = await p.evaluate(() => !document.querySelector('dialog.scryfall-sheet').open);
    say(st[0] && st[1] === '/home' && /scryfall\.com\/search\?q=%21%22Foudre%22/.test(st[2]) && st[3] && closed, `touch: sheet ${st[0]}, stays on ${st[1]}, link ${st[2]}, focus "${st[3]}", Escape closes ${closed}`);
    await c.close();
  }
  await browser.close();
  process.exit(fails ? 1 : 0);
})();
