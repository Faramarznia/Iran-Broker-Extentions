// For each real localStorage key used by the live app: corrupt it (invalid JSON, then empty
// string), reload, and record whether the whole page dies (uncaught error blocking every
// other widget) or just that one widget degrades. Also runs a quota-exhaustion test.
// Run: node 05-localstorage-integrity.js
'use strict';
const fs = require('fs');
const path = require('path');
const { launchPage, gotoNewtab } = require('./launch-page');

// Every localStorage key actually written by the 8 live files (grep -rn "localStorage\." js/*.js newtab.js).
const KEYS = [
  'ib_newtab_v2',       // newtab.js PERSIST_KEY (also written by js/tour.js as MAIN_KEY — shared key)
  'ib_bg_image',        // newtab.js BG_IMAGE_KEY
  'ib_news_read',       // newtab.js NEWS_READ_KEY
  'ib_sb_comm',         // newtab.js inline (community sidebar collapsed state)
  'ib_airo_conversations', // js/airo.js HIST_KEY
  'ib_hub_v2',          // js/hub.js PERSIST_KEY
  'ib_journal_v1',      // js/journal.js SK
  'ib_focus_v3',        // js/focus.js STORE_KEY
  'ib_articles_v1',     // js/articles.js CACHE_KEY
  'ib_sb_art',          // js/articles.js COLLAPSE_KEY
  'ib_tour_v1_done',    // js/tour.js DONE_KEY
];

async function testKeyCorruption(key, badValue, label) {
  const { browser, page, pageErrors, consoleMessages } = await launchPage({ width: 1400, height: 900 });
  await gotoNewtab(page); // first load to establish baseline localStorage (seed defaults)
  await page.evaluate((k, v) => { localStorage.setItem(k, v); }, key, badValue);
  await gotoNewtab(page); // reload with the corrupted key present
  await new Promise((r) => setTimeout(r, 1500));

  const domHealth = await page.evaluate(() => ({
    bodyHasContent: document.body.textContent.trim().length > 50,
    heroVisible: !!document.querySelector('.hero-search-wrap, #search-input'),
    toolsGridChildren: (document.getElementById('tools-grid') || { children: [] }).children.length,
    cryptoListChildren: (document.getElementById('crypto-list') || { children: [] }).children.length,
  }));

  await browser.close();
  return { key, label, pageErrorsThrown: pageErrors.length, pageErrors, domHealth };
}

async function testQuotaExhaustion() {
  const { browser, page, pageErrors } = await launchPage({ width: 1400, height: 900 });
  await gotoNewtab(page);
  const fillResult = await page.evaluate(() => {
    let written = 0;
    let threw = null;
    try {
      const chunk = 'x'.repeat(1024 * 1024); // 1MB
      for (let i = 0; i < 20; i++) { // try up to ~20MB, well past typical 5-10MB quota
        localStorage.setItem('qa_filler_' + i, chunk);
        written++;
      }
    } catch (e) {
      threw = { name: e.name, message: e.message };
    }
    return { mbWritten: written, threwOnWrite: threw };
  });
  // now try to load the real app on top of a full-quota localStorage
  await gotoNewtab(page);
  await new Promise((r) => setTimeout(r, 1500));
  const domHealth = await page.evaluate(() => ({
    bodyHasContent: document.body.textContent.trim().length > 50,
    toolsGridChildren: (document.getElementById('tools-grid') || { children: [] }).children.length,
  }));
  // cleanup
  await page.evaluate(() => {
    for (let i = 0; i < 20; i++) { try { localStorage.removeItem('qa_filler_' + i); } catch (e) {} }
  });
  await browser.close();
  return { fillResult, pageErrorsThrown: pageErrors.length, pageErrors, domHealth };
}

(async () => {
  const results = { corruption: [], quota: null };

  for (const key of KEYS) {
    console.log(`testing corruption: ${key} = invalid JSON ...`);
    results.corruption.push(await testKeyCorruption(key, '{not valid json!!', 'invalid-json'));
    console.log(`testing corruption: ${key} = '' (empty string) ...`);
    results.corruption.push(await testKeyCorruption(key, '', 'empty-string'));
  }

  console.log('testing quota exhaustion ...');
  results.quota = await testQuotaExhaustion();

  fs.writeFileSync(path.resolve(__dirname, '..', 'localstorage-integrity-results.json'), JSON.stringify(results, null, 2));
  console.log('\n=== CORRUPTION SUMMARY ===');
  results.corruption.forEach((r) => {
    console.log(`${r.key} [${r.label}]: pageErrors=${r.pageErrorsThrown} bodyHasContent=${r.domHealth.bodyHasContent} tools=${r.domHealth.toolsGridChildren} crypto=${r.domHealth.cryptoListChildren}`);
  });
  console.log('\n=== QUOTA SUMMARY ===');
  console.log(JSON.stringify(results.quota, null, 2));
})();
