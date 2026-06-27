/* Feature 4: Price Alerts — visual toast when target price is hit */

import { showToast } from './utils.js';

let activeIdx = null;
let activeAnchor = null;

function positionPopover(anchor) {
  const pop = document.getElementById('alert-popover');
  if (!pop || !anchor) return;
  const rect = anchor.getBoundingClientRect();
  pop.style.top = (rect.bottom + window.scrollY + 8) + 'px';
  pop.style.right = (window.innerWidth - rect.right) + 'px';
  pop.style.left = 'auto';
}

function openPopover(idx, anchor, store) {
  activeIdx = idx;
  activeAnchor = anchor;

  const state = store.get();
  const item = (state.watchlist || [])[idx];
  if (!item) return;

  const pop = document.getElementById('alert-popover');
  const labelEl = document.getElementById('alert-pop-label');
  const dirEl = document.getElementById('alert-pop-dir');
  const priceEl = document.getElementById('alert-pop-price');

  if (labelEl) labelEl.textContent = 'هشدار برای ' + item.symbol;
  if (dirEl) dirEl.value = item.alert ? item.alert.direction : 'above';
  if (priceEl) priceEl.value = item.alert ? item.alert.target : '';

  if (pop) {
    pop.hidden = false;
    positionPopover(anchor);
  }
}

function closePopover() {
  const pop = document.getElementById('alert-popover');
  if (pop) pop.hidden = true;
  activeIdx = null;
  activeAnchor = null;
}

function saveAlert(store, renderFn) {
  if (activeIdx === null) return;
  const priceEl = document.getElementById('alert-pop-price');
  const dirEl = document.getElementById('alert-pop-dir');
  const target = parseFloat(priceEl ? priceEl.value : '');
  if (isNaN(target)) { showToast('قیمت هدف معتبر نیست', 'error', 4000); return; }

  const state = store.get();
  const wl = [...(state.watchlist || [])];
  if (!wl[activeIdx]) return;
  wl[activeIdx] = { ...wl[activeIdx], alert: { target, direction: dirEl ? dirEl.value : 'above', triggered: false } };
  store.set({ watchlist: wl });
  closePopover();
  if (typeof renderFn === 'function') renderFn();
  showToast('هشدار ذخیره شد 🔔', 'success', 4000);
}

function clearAlert(store, renderFn) {
  if (activeIdx === null) return;
  const state = store.get();
  const wl = [...(state.watchlist || [])];
  if (!wl[activeIdx]) return;
  wl[activeIdx] = { ...wl[activeIdx], alert: null };
  store.set({ watchlist: wl });
  closePopover();
  if (typeof renderFn === 'function') renderFn();
}

export function checkAlerts(store, getPrices, renderFn) {
  const state = store.get();
  const wl = state.watchlist || [];
  const prices = getPrices();
  let changed = false;

  const newWl = wl.map(item => {
    if (!item.alert || item.alert.triggered) return item;
    const p = prices[item.id];
    if (!p || p.price == null) return item;
    const { target, direction } = item.alert;
    const triggered = direction === 'above' ? p.price >= target : p.price <= target;
    if (triggered) {
      changed = true;
      const dir = direction === 'above' ? 'بالاتر از' : 'پایین‌تر از';
      showToast('🔔 ' + item.symbol + ' به ' + dir + ' ' + target + ' رسید!', 'success', 10000);
      return { ...item, alert: { ...item.alert, triggered: true } };
    }
    return item;
  });

  if (changed) {
    store.set({ watchlist: newWl });
    if (typeof renderFn === 'function') renderFn();
  }
}

export function initAlerts(store, renderFn) {
  const closeBtn = document.getElementById('alert-pop-close');
  if (closeBtn) closeBtn.addEventListener('click', closePopover);

  const saveBtn = document.getElementById('alert-pop-save');
  if (saveBtn) saveBtn.addEventListener('click', () => saveAlert(store, renderFn));

  const clearBtn = document.getElementById('alert-pop-clear');
  if (clearBtn) clearBtn.addEventListener('click', () => clearAlert(store, renderFn));

  document.addEventListener('click', e => {
    const pop = document.getElementById('alert-popover');
    if (pop && !pop.hidden && !pop.contains(e.target) && e.target !== activeAnchor) {
      closePopover();
    }
  });

  return {
    openPopover: (idx, anchor) => openPopover(idx, anchor, store)
  };
}
