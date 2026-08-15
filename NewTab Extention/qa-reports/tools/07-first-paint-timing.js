// Measures First Contentful Paint and time-to-widget-content, under normal network and under
// a throttled "poor Iran connectivity" simulation (low throughput + high latency).
// Run: node 07-first-paint-timing.js
'use strict';
const fs = require('fs');
const path = require('path');
const { launchPage, gotoNewtab, NEWTAB_URL } = require('./launch-page');

async function measure(label, networkConditions) {
  const { browser, page } = await launchPage({ width: 1400, height: 900 });
  const client = await page.target().createCDPSession();
  if (networkConditions) {
    await client.send('Network.enable');
    await client.send('Network.emulateNetworkConditions', networkConditions);
  }

  const navStart = Date.now();
  await page.goto(NEWTAB_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Poll for paint timing + widget content until it appears or we give up.
  const deadline = Date.now() + 20000;
  let paintTimes = null;
  let widgetTimes = { toolsGridAt: null, cryptoSkeletonAt: null, cryptoLiveDataAt: null, heroAt: null };
  while (Date.now() < deadline) {
    const snap = await page.evaluate(() => {
      const paints = performance.getEntriesByType('paint').reduce((acc, e) => { acc[e.name] = e.startTime; return acc; }, {});
      const tools = document.getElementById('tools-grid');
      const crypto = document.getElementById('crypto-list');
      const hero = document.getElementById('hero-greeting');
      return {
        paints,
        toolsReady: !!(tools && tools.children.length > 0),
        cryptoSkeleton: !!(crypto && crypto.textContent.includes('حال دریافت')),
        cryptoLive: !!(crypto && crypto.querySelector('.c-row')),
        heroReady: !!(hero && hero.textContent.trim().length > 0),
        now: performance.now(),
      };
    });
    const elapsed = Date.now() - navStart;
    if (!paintTimes && snap.paints['first-contentful-paint']) paintTimes = snap.paints;
    if (widgetTimes.toolsGridAt === null && snap.toolsReady) widgetTimes.toolsGridAt = elapsed;
    if (widgetTimes.heroAt === null && snap.heroReady) widgetTimes.heroAt = elapsed;
    if (widgetTimes.cryptoSkeletonAt === null && snap.cryptoSkeleton) widgetTimes.cryptoSkeletonAt = elapsed;
    if (widgetTimes.cryptoLiveDataAt === null && snap.cryptoLive) widgetTimes.cryptoLiveDataAt = elapsed;
    if (paintTimes && widgetTimes.toolsGridAt !== null && widgetTimes.heroAt !== null &&
        (widgetTimes.cryptoLiveDataAt !== null || elapsed > 12000)) break;
    await new Promise((r) => setTimeout(r, 100));
  }

  await browser.close();
  return { label, networkConditions, paintTimes, widgetTimes };
}

(async () => {
  const results = [];

  console.log('measuring: normal network ...');
  results.push(await measure('normal', null));

  console.log('measuring: throttled ("poor Iran connectivity" approximation — 400kbps down/up, 400ms RTT latency) ...');
  results.push(await measure('throttled-poor-iran', {
    offline: false,
    downloadThroughput: (400 * 1024) / 8, // 400kbps
    uploadThroughput: (400 * 1024) / 8,
    latency: 400, // ms added round-trip latency, approximating high-latency/lossy links
  }));

  fs.writeFileSync(path.resolve(__dirname, '..', 'first-paint-results.json'), JSON.stringify(results, null, 2));
  console.log('\n=== RESULTS ===');
  console.log(JSON.stringify(results, null, 2));
})().catch((e) => { console.error('FAILED:', e); process.exit(1); });
