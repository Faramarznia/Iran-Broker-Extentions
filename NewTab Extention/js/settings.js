/* Settings modal — theme, accent, engine, coins, feed categories, broker */

import { svg, hexA, lighten } from './utils.js';

export function initSettings(store, { setEngine } = {}) {
  const themeBtn = document.getElementById('theme-btn');
  const themeIcon = document.getElementById('theme-icon');
  const settingsBtn = document.getElementById('settings-btn');
  const settingsIcon = document.getElementById('settings-icon');
  const modal = document.getElementById('settings-modal');
  const closeBtn = document.getElementById('settings-close');
  const closeIconEl = document.getElementById('settings-close-icon');
  const saveBtn = document.getElementById('settings-save');

  const setNameEl = document.getElementById('set-name');
  const setEngineEl = document.getElementById('set-engine');
  const setLayoutEl = document.getElementById('set-layout');
  const setCoinsEl = document.getElementById('set-coins');
  const setCryptoEl = document.getElementById('set-crypto');
  const setGridEl = document.getElementById('set-grid');
  const setAccentEl = document.getElementById('set-accent');
  const setFeedCatsEl = document.getElementById('set-feed-cats');

  function applyLayout() {
    const l = store.get().layout;
    document.body.setAttribute('data-layout', (l === 'fit' || l === 'fullvp') ? l : 'scroll');
  }

  function syncLayout() {
    if (!setLayoutEl) return;
    const l = store.get().layout || 'scroll';
    setLayoutEl.querySelectorAll('button').forEach(b => {
      b.classList.toggle('active', b.dataset.layout === l);
    });
  }

  function applyTheme() {
    const state = store.get();
    document.body.setAttribute('data-theme', state.theme);
    if (themeIcon) themeIcon.innerHTML = svg(state.theme === 'light' ? 'moon' : 'sun');
    applyAccent();
  }

  function applyAccent() {
    const state = store.get();
    const a = state.accent;
    if (!a || a[0] !== '#') return;
    document.body.style.setProperty('--primaryStrong', a);
    document.body.style.setProperty('--primary', state.theme === 'light' ? a : lighten(a, 0.32));
    document.body.style.setProperty('--primarySoft', hexA(a, 0.14));
  }

  function applyGrid() {
    const bgGrid = document.getElementById('bg-grid');
    if (bgGrid) bgGrid.hidden = !store.get().showGrid;
  }

  function applyCrypto() {
    const cc = document.getElementById('crypto-card');
    if (cc) cc.style.display = store.get().showCrypto ? '' : 'none';
  }

  function syncSwatches() {
    const state = store.get();
    if (!setAccentEl) return;
    setAccentEl.querySelectorAll('button').forEach(b => {
      b.classList.toggle('active', b.dataset.accent.toLowerCase() === (state.accent || '').toLowerCase());
    });
  }

  function syncFeedCats() {
    const state = store.get();
    const cats = state.feedCategories || [];
    if (!setFeedCatsEl) return;
    setFeedCatsEl.querySelectorAll('input[data-cat]').forEach(chk => {
      chk.checked = cats.includes(chk.dataset.cat);
    });
  }

  function openSettings() {
    const state = store.get();
    if (setNameEl) setNameEl.value = state.name || '';
    if (setEngineEl) setEngineEl.value = state.engine || 'google';
    if (setCoinsEl) setCoinsEl.value = state.coins || '';
    if (setCryptoEl) setCryptoEl.checked = state.showCrypto !== false;
    if (setGridEl) setGridEl.checked = state.showGrid !== false;
    syncSwatches();
    syncFeedCats();
    syncLayout();
    if (modal) modal.hidden = false;
  }

  function closeSettings() {
    if (modal) modal.hidden = true;
  }

  // Icons
  if (settingsIcon) settingsIcon.innerHTML = svg('equalizer');
  if (closeIconEl) closeIconEl.innerHTML = svg('close');

  // Theme toggle
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const s = store.get();
      store.set({ theme: s.theme === 'light' ? 'dark' : 'light' });
      applyTheme();
    });
  }

  // Open/close
  if (settingsBtn) settingsBtn.addEventListener('click', openSettings);
  if (closeBtn) closeBtn.addEventListener('click', closeSettings);
  if (saveBtn) saveBtn.addEventListener('click', closeSettings);
  if (modal) modal.addEventListener('click', e => { if (e.target === modal) closeSettings(); });

  // Inline settings changes
  if (setNameEl) setNameEl.addEventListener('input', e => {
    store.set({ name: e.target.value });
    const grEl = document.getElementById('hero-greeting');
    if (grEl) {
      const h = new Date().getHours();
      const g = h >= 5 && h < 12 ? 'صبح‌تان بخیر' : h >= 12 && h < 17 ? 'ظهر بخیر' : h >= 17 && h < 21 ? 'عصرتان بخیر' : 'شب‌تان بخیر';
      grEl.textContent = g + (e.target.value ? '، ' + e.target.value : ' معامله‌گر');
    }
  });

  if (setEngineEl) setEngineEl.addEventListener('change', e => {
    store.set({ engine: e.target.value });
    if (typeof setEngine === 'function') setEngine(e.target.value);
  });

  if (setCoinsEl) setCoinsEl.addEventListener('input', e => store.set({ coins: e.target.value }));

  if (setCryptoEl) setCryptoEl.addEventListener('change', e => {
    store.set({ showCrypto: e.target.checked });
    applyCrypto();
  });

  if (setGridEl) setGridEl.addEventListener('change', e => {
    store.set({ showGrid: e.target.checked });
    applyGrid();
  });

  if (setLayoutEl) {
    setLayoutEl.querySelectorAll('button').forEach(b => {
      b.addEventListener('click', () => {
        store.set({ layout: b.dataset.layout });
        applyLayout();
        syncLayout();
      });
    });
  }

  if (setAccentEl) {
    setAccentEl.querySelectorAll('button').forEach(b => {
      b.addEventListener('click', () => {
        store.set({ accent: b.dataset.accent });
        applyAccent();
        syncSwatches();
      });
    });
  }

  if (setFeedCatsEl) {
    setFeedCatsEl.querySelectorAll('input[data-cat]').forEach(chk => {
      chk.addEventListener('change', () => {
        const cats = [];
        setFeedCatsEl.querySelectorAll('input[data-cat]:checked').forEach(c => cats.push(c.dataset.cat));
        store.set({ feedCategories: cats });
      });
    });
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal && !modal.hidden) closeSettings();
  });

  // Apply on load
  applyTheme();
  applyLayout();
  applyGrid();
  applyCrypto();

  return { applyTheme, applyAccent };
}
