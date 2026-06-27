/* ===================================================================
   ایران بروکر — تب جدید v2.0
   Main entry point — imports all modules, orchestrates init
   =================================================================== */

import { store } from './store.js';
import { initClock } from './clock.js';
import { initSearch } from './search.js';
import { initTools } from './tools.js';
import { initSessions } from './sessions.js';
import { initTips } from './tips.js';
import { initShaderBg, initSparkles } from './bg.js';
import { initSettings } from './settings.js';
import { initWatchlist } from './watchlist.js';
import { initAlerts, checkAlerts } from './alerts.js';
import { initIranMarket } from './iran-market.js';
import { initCalendar } from './calendar.js';
import { initFeed } from './feed.js';
import { initCommunity } from './community.js';
import { initCalculator } from './calculator.js';
import { initRadar } from './radar.js';
import { initNotes } from './notes.js';
import { initTimer } from './timer.js';
import { initCrypto } from './crypto.js';

async function main() {
  // 1. Load persisted state
  const state = await store.load();

  // 2. Settings (theme + grid + crypto visibility applied immediately)
  const searchHandlers = {};
  const settingsAPI = initSettings(store, {
    setEngine: (k) => { if (searchHandlers.setEngine) searchHandlers.setEngine(k); }
  });

  // 3. Clock + date
  initClock(state);

  // 4. Search box
  const searchAPI = initSearch(state);
  if (searchAPI) searchHandlers.setEngine = searchAPI.setEngine;

  // 5. Background
  initShaderBg();
  initSparkles();

  // 6. Tools grid + quick links
  initTools();

  // 7. Forex sessions ring
  initSessions();

  // 8. Tips
  initTips(state, store);

  // 9. Crypto widget
  initCrypto(store);

  // 10. Iran Market Rates (Feature 5)
  initIranMarket(store);

  // 11. Economic Calendar (Feature 6)
  initCalendar(store);

  // 12. Content Feed (Feature 2)
  initFeed(store);

  // 13. Community Hot Topics (Feature 3)
  initCommunity();

  // 14. Price Alerts (Feature 4) — must init before watchlist so openPopover is available
  let watchlistAPI = null;
  const alertsAPI = initAlerts(store, () => { if (watchlistAPI) watchlistAPI.renderTable(); });

  // 15. Watchlist (Feature 1) — pass alert click handler
  watchlistAPI = initWatchlist(store, (idx, anchor) => {
    alertsAPI.openPopover(idx, anchor);
  });

  // Hook alert checking into watchlist refresh
  const origRefresh = watchlistAPI.refresh;
  watchlistAPI.refresh = async () => {
    await origRefresh();
    checkAlerts(store, watchlistAPI.getPrices, watchlistAPI.renderTable);
  };
  setInterval(() => checkAlerts(store, watchlistAPI.getPrices, watchlistAPI.renderTable), 60000);

  // 16. Calculator (Feature 7)
  initCalculator();

  // 17. Broker Radar (Feature 8)
  initRadar(store);

  // 18. Quick Note (Feature 9)
  initNotes(store);

  // 19. Session Timer (Feature 10)
  initTimer(store);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
