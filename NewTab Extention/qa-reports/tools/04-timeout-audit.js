// Proves the timeout audit table with a real stalled-network test: holds every intercepted
// request open forever (never fulfills, never aborts on our end) and watches which widgets
// recover via their own AbortController and which stay stuck in "loading" forever.
// Run: node 04-timeout-audit.js
'use strict';
const fs = require('fs');
const path = require('path');
const { launchPage, gotoNewtab } = require('./launch-page');

const HOSTS_TO_STALL = [
  'api.coingecko.com', 'query1.finance.yahoo.com', 'call2.tgju.org', 'call3.tgju.org',
  'cdn.tsetmc.com', 'forum.iranbroker.net', 'iranbroker.net', 'nfs.faireconomy.media',
  'api.open-meteo.com', 'geocoding-api.open-meteo.com',
];

(async () => {
  const { browser, page, consoleMessages, pageErrors } = await launchPage({ width: 1400, height: 900 });
  const stallStart = {};
  const interceptedLog = [];
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const url = req.url();
    if (HOSTS_TO_STALL.some((h) => url.includes(h))) {
      stallStart[url] = Date.now();
      interceptedLog.push(url);
      // never respond, never abort — simulates a connection that hangs (packet loss / dead host)
      return;
    }
    return req.continue();
  });

  // waitUntil:'networkidle2' would never resolve here since we intentionally keep several
  // requests open forever — domcontentloaded is enough, the app renders its own skeleton.
  await gotoNewtab(page, { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 500));
  await page.evaluate(() => { const s = document.querySelector('.ibt-skip'); if (s) s.click(); }).catch(() => {});
  await new Promise((r) => setTimeout(r, 300));
  // switch to the "iran" tab, which is the one with a real 9s AbortController timeout
  // (fetchTgju / TGJU_HOSTS, newtab.js:1030-1042) — crypto (default tab) has none.
  const tabState = await page.evaluate(() => {
    const b = document.querySelector('[data-ptab="iran"]');
    if (b) b.click();
    return { found: !!b, activeAfterClick: b ? b.classList.contains('active') : null };
  });
  console.log('iran tab button found & clicked:', JSON.stringify(tabState));

  console.log('Requests to TGJU/CoinGecko/etc. are now stalling forever (never resolve, never reject from the network side).');
  console.log('Sampling the "iran" tab widget state at 3s / 7s / 10s / 15s — TGJU has a 9000ms AbortController timeout, so it should flip from "loading" to an error/fallback state around t=9000ms if the timeout actually fires.');
  const timestamps = [3000, 7000, 9500, 15000, 18500, 20000];
  const samples = [];
  let elapsed = 0;
  for (const t of timestamps) {
    await new Promise((r) => setTimeout(r, t - elapsed));
    elapsed = t;
    const state = await page.evaluate(() => {
      const list = document.getElementById('crypto-list');
      return {
        listText: list ? list.textContent.trim().slice(0, 60) : null,
        isLoadingPlaceholder: !!(list && list.querySelector('.px-empty') && list.textContent.includes('حال دریافت')),
        isErrorPlaceholder: !!(list && list.querySelector('.px-empty') && list.textContent.includes('ممکن نشد')),
        refreshSpinning: !!(document.getElementById('crypto-refresh') && document.getElementById('crypto-refresh').classList.contains('spinning')),
      };
    });
    samples.push({ atMs: t, tab: 'iran (TGJU, 9000ms timeout)', ...state });
    console.log(`  t=${t}ms:`, JSON.stringify(state));
  }

  console.log('\nintercepted (stalled) URLs:', JSON.stringify(interceptedLog, null, 2));
  console.log('\nconsole messages from the page:', JSON.stringify(consoleMessages, null, 2));
  console.log('\nuncaught page errors:', JSON.stringify(pageErrors, null, 2));

  fs.writeFileSync(path.resolve(__dirname, '..', 'timeout-audit-samples.json'), JSON.stringify({ samples, interceptedLog, consoleMessages, pageErrors }, null, 2));
  await browser.close();
})().catch((e) => { console.error('FAILED:', e); process.exit(1); });
