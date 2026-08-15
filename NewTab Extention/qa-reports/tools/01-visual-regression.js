// Visual regression across breakpoints. Run: node 01-visual-regression.js
// Writes screenshots to qa-reports/screenshots/<width>px/{clean,seeded}.png and prints a
// JSON summary (overflow/scroll checks) that 01-visual-regression-3-breakpoints.md is built from.
'use strict';
const fs = require('fs');
const path = require('path');
const { launchPage, gotoNewtab } = require('./launch-page');

const WIDTHS = [1100, 1400, 1920]; // per task spec; real CSS breakpoints noted separately in the report
const OUT_DIR = path.resolve(__dirname, '..', 'screenshots');

const SEED = {
  ib_newtab_v2: JSON.stringify({
    theme: 'dark', layout: 'scroll', accent: '#3a6df0', showGrid: true,
    jalaliCalendar: true, name: 'محمد', engine: 'google',
    coins: 'bitcoin,ethereum,solana,ripple,dogecoin',
    showCrypto: true, tipIndex: 2, bgMode: 'default', bgIndex: 0,
    pxTab: 'crypto', mktAxis: 0, newsCatIds: [],
  }),
  ib_journal_v1: JSON.stringify({
    trades: [
      { id: 't1', symbol: 'XAUUSD', direction: 'long', entryPrice: 2410.5, exitPrice: 2432.1, lotSize: 0.5, status: 'closed', entryDate: '2026-08-10', preEmotion: 'confident' },
      { id: 't2', symbol: 'EURUSD', direction: 'short', entryPrice: 1.0921, exitPrice: 1.0958, lotSize: 1, status: 'closed', entryDate: '2026-08-12', preEmotion: 'anxious' },
      { id: 't3', symbol: 'BTC', direction: 'long', entryPrice: 61200, exitPrice: '', lotSize: 0.1, status: 'open', entryDate: '2026-08-14', preEmotion: 'calm' },
    ],
  }),
  ib_hub_v2: JSON.stringify({ tasks: [{ id: 1, text: 'بررسی اخبار فردا', done: false }], quickLinks: [] }),
  ib_focus_v3: JSON.stringify({ mode: 'pomodoro', volume: 50 }),
  ib_airo_conversations: JSON.stringify([{ id: 'c1', title: 'بروکر مناسب', messages: [{ role: 'user', content: 'بهترین بروکر برای شروع چیه؟', t: '10:00' }, { role: 'assistant', content: 'بستگی به بازار موردنظرت داره — فارکس، کریپتو یا بورس؟', t: '10:00' }] }]),
};

async function seedLocalStorage(page) {
  await page.evaluate((seed) => {
    for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, v);
  }, SEED);
}

async function checkOverflow(page) {
  return page.evaluate(() => {
    const de = document.documentElement;
    return {
      hasHorizontalScroll: de.scrollWidth > de.clientWidth + 1,
      scrollWidth: de.scrollWidth,
      clientWidth: de.clientWidth,
      overflowingEls: Array.from(document.querySelectorAll('*')).filter((el) => {
        const r = el.getBoundingClientRect();
        return r.right > de.clientWidth + 2 && r.width > 0;
      }).slice(0, 10).map((el) => el.className ? `${el.tagName}.${String(el.className).split(' ')[0]}` : el.tagName),
    };
  });
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const results = [];

  for (const width of WIDTHS) {
    const dir = path.join(OUT_DIR, `${width}px`);
    fs.mkdirSync(dir, { recursive: true });

    // Clean state
    let { browser, page, consoleMessages, pageErrors } = await launchPage({ width, height: 900 });
    await gotoNewtab(page);
    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(dir, 'clean.png'), fullPage: true });
    const cleanOverflow = await checkOverflow(page);
    const cleanErrors = pageErrors.length;
    await browser.close();

    // Seeded state
    ({ browser, page, consoleMessages, pageErrors } = await launchPage({ width, height: 900 }));
    await gotoNewtab(page);
    await seedLocalStorage(page);
    await gotoNewtab(page); // reload with seed applied
    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(dir, 'seeded.png'), fullPage: true });
    const seededOverflow = await checkOverflow(page);
    const seededErrors = pageErrors.length;
    await browser.close();

    results.push({ width, cleanOverflow, seededOverflow, cleanErrors, seededErrors });
    console.log(`width ${width}px done`);
  }

  console.log(JSON.stringify(results, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, 'results.json'), JSON.stringify(results, null, 2));
})().catch((e) => { console.error('FAILED:', e); process.exit(1); });
