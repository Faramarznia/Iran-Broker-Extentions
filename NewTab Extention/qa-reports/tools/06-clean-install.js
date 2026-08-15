// Simulates a clean install: brand-new profile, zero prior localStorage. Checks console
// health, seed/default rendering, and that the welcome tour appears once and stays dismissed.
// Run: node 06-clean-install.js
'use strict';
const fs = require('fs');
const path = require('path');
const { launchPage, gotoNewtab } = require('./launch-page');

(async () => {
  // --- Pass 1: absolute first load, nothing in localStorage ---
  const pass1 = await launchPage({ width: 1400, height: 900 });
  await gotoNewtab(pass1.page);
  await new Promise((r) => setTimeout(r, 2000));

  // NOTE: js/tour.js's injectReplayButton() permanently adds a `.ibt-replay-sec` element to
  // the settings panel on every load (before the done-flag check), so a broad selector like
  // `[class*="ibt-"]` false-positives on every load regardless of whether the tour actually
  // shows. The real overlay only exists while start() has run: `.ibt-backdrop` / `.ibt-pop`.
  const tourVisible1 = await pass1.page.evaluate(() => !!document.querySelector('.ibt-backdrop, .ibt-pop'));
  const widgetHealth1 = await pass1.page.evaluate(() => {
    function txt(id) { const e = document.getElementById(id); return e ? e.textContent.trim().slice(0, 60) : '(missing element)'; }
    return {
      toolsGridCount: (document.getElementById('tools-grid') || { children: [] }).children.length,
      cryptoListState: txt('crypto-list'),
      heroGreeting: txt('hero-greeting'),
      heroDate: txt('hero-date'),
      clock: txt('clock'),
      anyNaNOrUndefinedInBody: /\bNaN\b|\bundefined\b/.test(document.body.textContent),
    };
  });
  const consoleErrors1 = pass1.consoleMessages.filter((m) => m.type === 'error');
  console.log('=== PASS 1 (first ever load) ===');
  console.log('tour visible:', tourVisible1);
  console.log('console errors:', consoleErrors1.length, JSON.stringify(consoleErrors1, null, 2));
  console.log('page (uncaught) errors:', pass1.pageErrors.length, JSON.stringify(pass1.pageErrors, null, 2));
  console.log('widget health:', JSON.stringify(widgetHealth1, null, 2));

  // dismiss the tour the way a real user would, so ib_tour_v1_done gets persisted
  await pass1.page.evaluate(() => { const s = document.querySelector('.ibt-skip'); if (s) s.click(); });
  await new Promise((r) => setTimeout(r, 300));
  const localStorageAfterDismiss = await pass1.page.evaluate(() => localStorage.getItem('ib_tour_v1_done'));
  console.log('ib_tour_v1_done after dismissing:', JSON.stringify(localStorageAfterDismiss));

  // carry the same in-memory profile forward is not possible across launches without
  // userDataDir, so persist just the one flag the way the browser's localStorage would,
  // by reusing the SAME page (no reload of the browser process) for pass 2:
  await gotoNewtab(pass1.page);
  await new Promise((r) => setTimeout(r, 1500));
  const tourVisible2 = await pass1.page.evaluate(() => !!document.querySelector('.ibt-backdrop, .ibt-pop'));
  console.log('\n=== PASS 2 (same profile, reload after dismissing tour) ===');
  console.log('tour visible (should be false now):', tourVisible2);

  await pass1.browser.close();

  fs.writeFileSync(path.resolve(__dirname, '..', 'clean-install-results.json'), JSON.stringify({
    tourVisibleOnFirstLoad: tourVisible1,
    consoleErrorsOnFirstLoad: consoleErrors1,
    pageErrorsOnFirstLoad: pass1.pageErrors,
    widgetHealthOnFirstLoad: widgetHealth1,
    tourDoneFlagAfterDismiss: localStorageAfterDismiss,
    tourVisibleAfterReload: tourVisible2,
  }, null, 2));
})().catch((e) => { console.error('FAILED:', e); process.exit(1); });
