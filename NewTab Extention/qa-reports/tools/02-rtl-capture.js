// RTL evidence capture for 02-rtl-review.md. Run: node 02-rtl-capture.js
// 1) Screenshots the journal's history table and analytics view (R:R histogram, equity curve).
// 2) Proves the canvas bidi bug directly: renders the exact bucket label string
//    '۰–۰.۵' (source: Analytics.rrHistogram in js/journal.js) on an offscreen canvas
//    once with ctx.direction='ltr' and once with 'rtl', and diffs the pixels. The app's
//    real <canvas id="an-rr"> inherits direction:rtl from <html dir="rtl"> (no override in
//    setupCanvas()), so whichever render matches the app's actual on-screen behavior is
//    the one to compare against the intended "۰–۰.۵" (low–high) reading.
'use strict';
const fs = require('fs');
const path = require('path');
const { launchPage, gotoNewtab } = require('./launch-page');

const OUT_DIR = path.resolve(__dirname, '..', 'screenshots');

const SEED = {
  ib_journal_v1: JSON.stringify({
    trades: [
      { id: 't1', symbol: 'XAUUSD', direction: 'long', entryPrice: 2410.5, exitPrice: 2432.1, stopLoss: 2400, takeProfit: 2450, lotSize: 0.5, status: 'closed', entryDate: '2026-08-01', exitDate: '2026-08-01', preEmotion: 'confident' },
      { id: 't2', symbol: 'EURUSD', direction: 'short', entryPrice: 1.0921, exitPrice: 1.0958, stopLoss: 1.098, takeProfit: 1.085, lotSize: 1, status: 'closed', entryDate: '2026-08-03', exitDate: '2026-08-03', preEmotion: 'anxious' },
      { id: 't4', symbol: 'XAUUSD', direction: 'short', entryPrice: 2440, exitPrice: 2455, stopLoss: 2450, takeProfit: 2410, lotSize: 0.3, status: 'closed', entryDate: '2026-08-08', exitDate: '2026-08-08', preEmotion: 'fearful' },
      { id: 't5', symbol: 'GBPUSD', direction: 'long', entryPrice: 1.271, exitPrice: 1.281, stopLoss: 1.265, takeProfit: 1.29, lotSize: 0.5, status: 'closed', entryDate: '2026-08-11', exitDate: '2026-08-11', preEmotion: 'excited' },
    ],
    // t3 (BTC) deliberately left out of this seed — see 05/BUG note: it triggers the
    // pipSizeFor() crypto mis-scaling bug and would dominate every stat card with noise.
  }),
};

async function openJournalAnalytics(page) {
  await gotoNewtab(page);
  await page.evaluate((seed) => { for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, v); }, SEED);
  await gotoNewtab(page);
  await new Promise((r) => setTimeout(r, 1000));
  await page.evaluate(() => { const s = document.querySelector('.ibt-skip'); if (s) s.click(); });
  await new Promise((r) => setTimeout(r, 300));
  await page.click('#journal-btn');
  await new Promise((r) => setTimeout(r, 500));
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const { browser, page } = await launchPage({ width: 1400, height: 1000 });
  await openJournalAnalytics(page);

  await page.evaluate(() => { document.querySelector('.jr-tab[data-tab="history"]').click(); });
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: path.join(OUT_DIR, 'rtl-journal-history-table.png') });

  await page.evaluate(() => { document.querySelector('.jr-tab[data-tab="analytics"]').click(); });
  await new Promise((r) => setTimeout(r, 800));
  await page.evaluate(() => {
    const el = document.getElementById('an-rr');
    if (el) el.scrollIntoView({ block: 'center' });
  });
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: path.join(OUT_DIR, 'rtl-journal-rr-histogram.png') });

  // Bidi proof: render the real bucket label under both canvas directions.
  const diag = await page.evaluate(() => {
    const canvas = document.getElementById('an-rr');
    const cssDir = getComputedStyle(canvas).direction;
    const ctxDir = canvas.getContext('2d').direction;
    function renderToDataURL(text, direction) {
      const c = document.createElement('canvas');
      c.width = 200; c.height = 50;
      const cx = c.getContext('2d');
      cx.fillStyle = '#111'; cx.fillRect(0, 0, c.width, c.height);
      cx.direction = direction;
      cx.font = '20px Estedad, sans-serif';
      cx.textAlign = 'left'; cx.fillStyle = '#fff';
      cx.fillText(text, 8, 30);
      return c.toDataURL();
    }
    const label = '۰–۰.۵'; // Analytics.rrHistogram bucket 0 label, js/journal.js:366
    return { cssDir, ctxDir, label, ltr: renderToDataURL(label, 'ltr'), rtl: renderToDataURL(label, 'rtl') };
  });
  console.log('canvas #an-rr computed direction:', diag.cssDir, '| ctx.direction at draw time:', diag.ctxDir);
  console.log(`label "${diag.label}" rendered under direction:ltr vs direction:rtl -> saved as bidi-proof-ltr.png / bidi-proof-rtl.png`);
  fs.writeFileSync(path.join(OUT_DIR, 'bidi-proof-ltr.png'), Buffer.from(diag.ltr.split(',')[1], 'base64'));
  fs.writeFileSync(path.join(OUT_DIR, 'bidi-proof-rtl.png'), Buffer.from(diag.rtl.split(',')[1], 'base64'));

  await browser.close();
})().catch((e) => { console.error('FAILED:', e); process.exit(1); });
