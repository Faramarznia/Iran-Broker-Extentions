// Generates the 5 store screenshots from screenshots-plan.md using realistic seed data
// (not live API data where avoidable, so most render identically every run — no CORS/
// rate-limit flakiness; the crypto tab still hits real CoinGecko since that succeeds
// reliably even under file:// and looks better with genuine numbers).
// Output: store-submission/screenshots/0{1..5}-*.png, all 1280x800.
// Run: node 09-generate-store-screenshots.js
'use strict';
const fs = require('fs');
const path = require('path');
const { launchPage, gotoNewtab } = require('./launch-page');

const OUT_DIR = path.resolve(__dirname, '..', '..', 'store-submission', 'screenshots');
const W = 1280, H = 800;

function todayKey() {
  const n = new Date();
  const p2 = (x) => String(x).padStart(2, '0');
  return `${n.getFullYear()}-${p2(n.getMonth() + 1)}-${p2(n.getDate())}`;
}

const BASE_SEED = {
  ib_newtab_v2: JSON.stringify({
    theme: 'dark', layout: 'simple', accent: '#3a6df0', showGrid: true,
    jalaliCalendar: true, name: 'رضا', engine: 'google',
    coins: 'bitcoin,ethereum,solana,ripple,dogecoin',
    showCrypto: true, tipIndex: 1, bgMode: 'default', bgIndex: 0,
    pxTab: 'crypto', mktAxis: 0, newsCatIds: [],
  }),
  ib_tour_v1_done: '1',
  ib_journal_v1: JSON.stringify({
    trades: [
      { id: 't1', symbol: 'XAUUSD', direction: 'long', entryPrice: 2410.5, exitPrice: 2432.1, stopLoss: 2400, takeProfit: 2450, lotSize: 0.5, status: 'closed', entryDate: '2026-08-01', exitDate: '2026-08-01', preEmotion: 'confident' },
      { id: 't2', symbol: 'EURUSD', direction: 'short', entryPrice: 1.0921, exitPrice: 1.0958, stopLoss: 1.098, takeProfit: 1.085, lotSize: 1, status: 'closed', entryDate: '2026-08-03', exitDate: '2026-08-03', preEmotion: 'anxious' },
      { id: 't3', symbol: 'BTC', direction: 'long', entryPrice: 61200, exitPrice: 63750, stopLoss: 59500, takeProfit: 66000, lotSize: 0.15, status: 'closed', entryDate: '2026-08-05', exitDate: '2026-08-06', preEmotion: 'calm' },
      { id: 't4', symbol: 'GBPUSD', direction: 'long', entryPrice: 1.271, exitPrice: 1.281, stopLoss: 1.265, takeProfit: 1.29, lotSize: 0.5, status: 'closed', entryDate: '2026-08-11', exitDate: '2026-08-11', preEmotion: 'excited' },
      { id: 't5', symbol: 'XAUUSD', direction: 'short', entryPrice: 2455, exitPrice: 2441, stopLoss: 2465, takeProfit: 2430, lotSize: 0.3, status: 'closed', entryDate: '2026-08-13', exitDate: '2026-08-13', preEmotion: 'calm' },
    ],
  }),
  ib_airo_conversations: JSON.stringify([
    {
      id: 'demo1', title: 'بهترین بروکر برای شروع فارکس', updatedAt: Date.now(),
      messages: [
        { role: 'user', content: 'سلام، تازه می‌خوام فارکس رو شروع کنم. بهترین بروکر برای شروع چیه؟', t: '10:14' },
        { role: 'assistant', content: 'سلام! خوش اومدی 👋 برای شروع، چند نکته مهم‌تر از "بهترین بروکر" هست:\n\n- **رگوله معتبر**: بروکرهایی با رگوله FCA، ASIC یا CySEC امنیت بیشتری دارن.\n- **حداقل سپرده پایین**: برای شروع بهتره با حساب کوچیک تمرین کنی.\n- **اسپرد و کمیسیون**: قبل از انتخاب مقایسه کن.\n\nمی‌تونی فهرست بروکرهای بررسی‌شده رو تو بخش «بروکرهای فارکس» ایران بروکر ببینی. سؤال دیگه‌ای هم هست؟', t: '10:14' },
      ],
    },
  ]),
};

function hubSeed() {
  return JSON.stringify({
    theme: 'dark', layout: 'hub', accent: '#3a6df0', showGrid: true,
    jalaliCalendar: true, name: 'رضا', engine: 'google',
    coins: 'bitcoin,ethereum,solana,ripple,dogecoin', showCrypto: true, pxTab: 'crypto',
  });
}

async function seed(page, extra) {
  await gotoNewtab(page);
  await page.evaluate((seed) => { for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, v); }, { ...BASE_SEED, ...extra });
  await gotoNewtab(page);
  await new Promise((r) => setTimeout(r, 1500));
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const { browser, page } = await launchPage({ width: W, height: H });
  await seed(page);

  // 1) Overview
  await page.screenshot({ path: path.join(OUT_DIR, '01-overview.png') });
  console.log('1/5 overview done');

  // 2) Hub (daily calendar/tasks/weather). Two things this needs that the other 4
  // shots don't:
  //  - data-layout="hub", NOT "simple" — .hub-panels is empty/zero-height under "simple".
  //  - The hub's desktop grid CSS only applies at >=1400px (newtab.css:6439); "simple"'s
  //    1280x800 is below that breakpoint. So render at 1600x1000 (same 16:10 ratio as the
  //    required 1280x800) and downscale, rather than truncating a narrow capture.
  await page.setViewport({ width: 1600, height: 1000 });
  await seed(page, {
    ib_newtab_v2: hubSeed(),
    ib_hub_v2: JSON.stringify({
      tasks: {
        [todayKey()]: [
          { id: 1, text: 'بررسی اخبار NFP آمریکا', cat: null, at: '14:30', pri: true, done: false, star: false },
          { id: 2, text: 'تحلیل هفتگی طلا', cat: null, at: null, pri: false, done: true, star: false },
          { id: 3, text: 'بستن پوزیشن EURUSD', cat: null, at: '20:00', pri: false, done: false, star: false },
        ],
      },
    }),
  });
  await new Promise((r) => setTimeout(r, 2000)); // extra time for the weather fetch
  const wideShot = path.join(OUT_DIR, '02-hub-calendar-wide.png');
  await page.screenshot({ path: wideShot });
  await page.setViewport({ width: W, height: H });
  console.log('2/5 hub/calendar done (1600x1000, downscale it — see note at bottom of this file)');

  // 3) Journal — analytics tab (equity curve + stats, more visual than the raw table)
  await seed(page); // back to "simple" layout + the other widgets for shots 3-5
  await page.click('#journal-btn');
  await new Promise((r) => setTimeout(r, 600));
  await page.evaluate(() => { const t = document.querySelector('.jr-tab[data-tab="analytics"]'); if (t) t.click(); });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(OUT_DIR, '03-journal-analytics.png') });
  console.log('3/5 journal done');
  await page.evaluate(() => { const b = document.getElementById('jr-close'); if (b) b.click(); });
  await new Promise((r) => setTimeout(r, 400));

  // 4) Airo — open with a pre-loaded demo conversation
  await page.evaluate(() => { if (window.AiroChat) window.AiroChat.open(); });
  await new Promise((r) => setTimeout(r, 500));
  await page.evaluate(() => { const b = document.getElementById('airo-hist-btn'); if (b) b.click(); });
  await new Promise((r) => setTimeout(r, 400));
  await page.evaluate(() => {
    const item = document.querySelector('.airo-hist-item[data-id="demo1"]');
    if (item) item.click();
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(OUT_DIR, '04-airo-chat.png') });
  console.log('4/5 airo done');
  await page.evaluate(() => { const b = document.getElementById('airo-close'); if (b) b.click(); });
  await new Promise((r) => setTimeout(r, 400));

  // 5) Focus mode — use the built-in preview switcher to reach the running-timer screen
  // without actually starting a real session, then hide the dev-only preview bar itself.
  await page.click('#focus-btn');
  await new Promise((r) => setTimeout(r, 500));
  await page.evaluate(() => {
    const pill = document.querySelector('.fc-preview-pill[data-screen="focus-timer-screen"]');
    if (pill) pill.click();
  });
  await new Promise((r) => setTimeout(r, 500));
  await page.addStyleTag({ content: '.fc-preview-bar { display: none !important; }' });
  await page.screenshot({ path: path.join(OUT_DIR, '05-focus-mode.png') });
  console.log('5/5 focus mode done');

  await browser.close();
  console.log('\nAll screenshots written to', OUT_DIR);
  console.log('NOTE: 02-hub-calendar-wide.png (1600x1000) still needs downscaling — run:');
  console.log(`  magick "${wideShot}" -resize ${W}x${H} "${path.join(OUT_DIR, '02-hub-calendar.png')}" && rm "${wideShot}"`);
})().catch((e) => { console.error('FAILED:', e); process.exit(1); });
