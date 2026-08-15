// Simulates each live data source failing, and observes whether the app degrades gracefully.
// Run: node 03-api-fallback.js
'use strict';
const fs = require('fs');
const path = require('path');
const { launchPage, gotoNewtab } = require('./launch-page');

const OUT_DIR = path.resolve(__dirname, '..', 'screenshots', 'fallback');

// Each scenario: which price tab to select (default 'crypto' needs no click), which host(s)
// to intercept, and how to fail them.
const SCENARIOS = [
  { name: 'coingecko-block', tab: null, hosts: ['api.coingecko.com'], mode: 'abort' },
  { name: 'coingecko-429', tab: null, hosts: ['api.coingecko.com'], mode: 'status429' },
  { name: 'yahoo-forex-block', tab: 'forex', hosts: ['query1.finance.yahoo.com'], mode: 'abort' },
  { name: 'tgju-call2-only-blocked', tab: 'iran', hosts: ['call2.tgju.org'], mode: 'abort' }, // call3 should still work -> tests failover
  { name: 'tgju-both-blocked', tab: 'iran', hosts: ['call2.tgju.org', 'call3.tgju.org'], mode: 'abort' },
  { name: 'tsetmc-block', tab: 'bourse', hosts: ['cdn.tsetmc.com'], mode: 'abort' },
];

async function runScenario(scn) {
  const { browser, page, pageErrors, failedRequests } = await launchPage({ width: 1400, height: 900 });
  const seenRequests = [];

  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const url = req.url();
    const hit = scn.hosts.find((h) => url.includes(h));
    if (hit) {
      seenRequests.push(url);
      if (scn.mode === 'abort') return req.abort('failed');
      if (scn.mode === 'status429') return req.respond({ status: 429, contentType: 'application/json', body: '{"error":"rate limited"}' });
    }
    return req.continue();
  });

  await gotoNewtab(page);
  await page.evaluate(() => { const s = document.querySelector('.ibt-skip'); if (s) s.click(); }).catch(() => {});
  if (scn.tab) {
    await page.evaluate((tab) => {
      const b = document.querySelector(`[data-ptab="${tab}"]`);
      if (b) b.click();
    }, scn.tab);
  }
  await new Promise((r) => setTimeout(r, 4000)); // let fetch/catch chains resolve

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const shotPath = path.join(OUT_DIR, `${scn.name}.png`);
  await page.screenshot({ path: shotPath });

  // Read the visible state of the price widget after the failure.
  const widgetState = await page.evaluate(() => {
    const list = document.getElementById('crypto-list');
    if (!list) return { found: false };
    return {
      found: true,
      isEmpty: list.querySelector('.px-empty') ? list.querySelector('.px-empty').textContent.trim() : null,
      rowCount: list.querySelectorAll('.c-row').length,
      refreshTitle: (document.getElementById('crypto-refresh') || {}).title || null,
      staleClass: !!(document.getElementById('crypto-refresh') && document.getElementById('crypto-refresh').classList.contains('is-stale')),
    };
  });

  await browser.close();
  return {
    scenario: scn.name,
    requestsIntercepted: seenRequests.length,
    interceptedUrls: [...new Set(seenRequests)],
    pageErrorsThrown: pageErrors.length,
    pageErrors: pageErrors,
    widgetState,
    screenshot: shotPath,
  };
}

(async () => {
  const results = [];
  for (const scn of SCENARIOS) {
    console.log(`running: ${scn.name} ...`);
    try {
      const r = await runScenario(scn);
      results.push(r);
      console.log(`  intercepted ${r.requestsIntercepted} request(s), ${r.pageErrorsThrown} uncaught page error(s)`);
    } catch (e) {
      results.push({ scenario: scn.name, crashed: true, error: String(e) });
      console.log(`  SCRIPT-LEVEL FAILURE: ${e.message}`);
    }
  }
  fs.writeFileSync(path.join(__dirname, '..', 'screenshots', 'fallback', 'results.json'), JSON.stringify(results, null, 2));
  console.log('\n=== SUMMARY ===');
  console.log(JSON.stringify(results, null, 2));
})();
