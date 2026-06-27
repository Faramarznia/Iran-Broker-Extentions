/* Feature 1: Personal Watchlist — live prices, drag-reorder, up to 12 items */

import { fmtPrice, showToast, svg } from './utils.js';

const MAX_ITEMS = 12;

const SEARCH_POOL = [
  { id: 'bitcoin', type: 'crypto', symbol: 'BTC', label: 'بیت‌کوین' },
  { id: 'ethereum', type: 'crypto', symbol: 'ETH', label: 'اتریوم' },
  { id: 'tether', type: 'crypto', symbol: 'USDT', label: 'تتر' },
  { id: 'binancecoin', type: 'crypto', symbol: 'BNB', label: 'بایننس‌کوین' },
  { id: 'ripple', type: 'crypto', symbol: 'XRP', label: 'ریپل' },
  { id: 'solana', type: 'crypto', symbol: 'SOL', label: 'سولانا' },
  { id: 'dogecoin', type: 'crypto', symbol: 'DOGE', label: 'دوج‌کوین' },
  { id: 'cardano', type: 'crypto', symbol: 'ADA', label: 'کاردانو' },
  { id: 'tron', type: 'crypto', symbol: 'TRX', label: 'ترون' },
  { id: 'litecoin', type: 'crypto', symbol: 'LTC', label: 'لایت‌کوین' },
  { id: 'EURUSD', type: 'forex', symbol: 'EUR/USD', label: 'یورو / دلار' },
  { id: 'GBPUSD', type: 'forex', symbol: 'GBP/USD', label: 'پوند / دلار' },
  { id: 'XAUUSD', type: 'forex', symbol: 'XAU/USD', label: 'طلا / دلار' },
  { id: 'USDJPY', type: 'forex', symbol: 'USD/JPY', label: 'دلار / ین' },
  { id: 'USDTRY', type: 'forex', symbol: 'USD/TRY', label: 'دلار / لیر' },
  { id: 'USDCAD', type: 'forex', symbol: 'USD/CAD', label: 'دلار / کانادا' },
];

let prices = {};
let dragSrc = null;

function renderTable(store, onAlertClick) {
  const state = store.get();
  const wl = state.watchlist || [];

  const tableEl = document.getElementById('watchlist-table');
  const emptyEl = document.getElementById('watchlist-empty');
  if (!tableEl) return;

  if (!wl.length) {
    if (emptyEl) emptyEl.style.display = '';
    tableEl.querySelectorAll('.wl-row').forEach(r => r.remove());
    return;
  }
  if (emptyEl) emptyEl.style.display = 'none';

  tableEl.querySelectorAll('.wl-row').forEach(r => r.remove());

  wl.forEach((item, idx) => {
    const p = prices[item.id] || {};
    const price = p.price;
    const chg = p.chg;
    const up = chg >= 0;
    const chgStr = chg != null ? (up ? '▲ ' : '▼ ') + Math.abs(chg).toFixed(2) + '%' : '—';
    const hasAlert = item.alert && !item.alert.triggered;
    const alertIcon = item.alert && item.alert.triggered ? '🔔✅' : hasAlert ? '🔔🟡' : '🔔';

    const row = document.createElement('div');
    row.className = 'wl-row';
    row.dataset.id = item.id;
    row.dataset.idx = idx;
    row.draggable = false;

    row.innerHTML =
      '<span class="wl-sym">' + item.symbol + '</span>' +
      '<span class="wl-name">' + item.label + '</span>' +
      '<span class="wl-price" dir="ltr">' + (price != null ? (item.type === 'crypto' ? fmtPrice(price) : price.toFixed(4)) : '—') + '</span>' +
      '<span class="wl-chg ' + (chg != null ? (up ? 'up' : 'down') : '') + '">' + chgStr + '</span>' +
      '<button class="wl-alert-btn' + (item.alert ? ' active' : '') + '" data-idx="' + idx + '" title="هشدار قیمتی">' + alertIcon + '</button>' +
      '<button class="wl-del" data-idx="' + idx + '" title="حذف">✕</button>';

    row.querySelector('.wl-alert-btn').addEventListener('click', e => {
      e.stopPropagation();
      if (typeof onAlertClick === 'function') onAlertClick(idx, e.target.closest('button'));
    });

    row.querySelector('.wl-del').addEventListener('click', e => {
      e.stopPropagation();
      const s = store.get();
      const newList = [...(s.watchlist || [])];
      newList.splice(idx, 1);
      store.set({ watchlist: newList });
      renderTable(store, onAlertClick);
    });

    // Drag-and-drop reorder
    row.addEventListener('mousedown', () => { row.draggable = true; });
    row.addEventListener('dragstart', e => {
      dragSrc = idx;
      e.dataTransfer.effectAllowed = 'move';
      setTimeout(() => row.classList.add('wl-dragging'), 0);
    });
    row.addEventListener('dragend', () => {
      row.draggable = false;
      row.classList.remove('wl-dragging');
      dragSrc = null;
      document.querySelectorAll('.wl-row').forEach(r => r.classList.remove('wl-drag-over'));
    });
    row.addEventListener('dragover', e => {
      e.preventDefault();
      if (dragSrc !== null && parseInt(row.dataset.idx) !== dragSrc) {
        document.querySelectorAll('.wl-row').forEach(r => r.classList.remove('wl-drag-over'));
        row.classList.add('wl-drag-over');
      }
    });
    row.addEventListener('drop', e => {
      e.preventDefault();
      row.classList.remove('wl-drag-over');
      const dstIdx = parseInt(row.dataset.idx);
      if (dragSrc === null || dragSrc === dstIdx) return;
      const s = store.get();
      const newList = [...(s.watchlist || [])];
      const [moved] = newList.splice(dragSrc, 1);
      newList.splice(dstIdx, 0, moved);
      store.set({ watchlist: newList });
      renderTable(store, onAlertClick);
    });

    tableEl.appendChild(row);
  });
}

async function fetchPrices(store) {
  const state = store.get();
  const wl = state.watchlist || [];
  if (!wl.length) return;

  const cryptoIds = wl.filter(i => i.type === 'crypto').map(i => i.id);
  const forexIds = wl.filter(i => i.type === 'forex').map(i => i.id);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    if (cryptoIds.length) {
      const url = 'https://api.coingecko.com/api/v3/simple/price?ids=' + cryptoIds.join(',') + '&vs_currencies=usd&include_24hr_change=true';
      const res = await fetch(url, { signal: controller.signal });
      if (res.ok) {
        const data = await res.json();
        cryptoIds.forEach(id => {
          if (data[id]) prices[id] = { price: data[id].usd, chg: data[id].usd_24h_change };
        });
      }
    }

    if (forexIds.length) {
      const res = await fetch('https://api.frankfurter.app/latest?from=USD', { signal: controller.signal });
      if (res.ok) {
        const data = await res.json();
        forexIds.forEach(id => {
          if (id === 'EURUSD' && data.rates.EUR) prices[id] = { price: 1 / data.rates.EUR, chg: 0 };
          else if (id === 'GBPUSD' && data.rates.GBP) prices[id] = { price: 1 / data.rates.GBP, chg: 0 };
          else if (id === 'USDJPY' && data.rates.JPY) prices[id] = { price: data.rates.JPY, chg: 0 };
          else if (id === 'USDTRY' && data.rates.TRY) prices[id] = { price: data.rates.TRY, chg: 0 };
          else if (id === 'USDCAD' && data.rates.CAD) prices[id] = { price: data.rates.CAD, chg: 0 };
          else if (id === 'XAUUSD') prices[id] = prices[id] || { price: null, chg: 0 };
        });
      }
    }
  } catch (e) {
    // keep last cached prices
  } finally {
    clearTimeout(timeout);
  }
}

function openModal() {
  const modal = document.getElementById('watchlist-modal');
  if (modal) {
    modal.hidden = false;
    const input = document.getElementById('watchlist-search-input');
    if (input) { input.value = ''; input.focus(); renderSearchResults('', null, null); }
  }
}

function closeModal() {
  const modal = document.getElementById('watchlist-modal');
  if (modal) modal.hidden = true;
}

function renderSearchResults(q, store, onAlertClick) {
  const list = document.getElementById('watchlist-results');
  if (!list) return;
  const filtered = q
    ? SEARCH_POOL.filter(item =>
        item.symbol.toLowerCase().includes(q.toLowerCase()) ||
        item.label.toLowerCase().includes(q.toLowerCase()) ||
        item.id.toLowerCase().includes(q.toLowerCase())
      )
    : SEARCH_POOL;

  const state = store ? store.get() : { watchlist: [] };
  const existingIds = new Set((state.watchlist || []).map(i => i.id));

  list.innerHTML = filtered.slice(0, 8).map(item => {
    const exists = existingIds.has(item.id);
    return '<li data-id="' + item.id + '" ' + (exists ? 'style="opacity:.5;pointer-events:none"' : '') + '>' +
      '<span class="wr-sym">' + item.symbol + '</span>' +
      '<span class="wr-name">' + item.label + '</span>' +
      '<span class="wr-type">' + (item.type === 'crypto' ? 'کریپتو' : 'فارکس') + '</span>' +
    '</li>';
  }).join('');

  list.querySelectorAll('li').forEach(li => {
    li.addEventListener('click', () => {
      const id = li.dataset.id;
      const found = SEARCH_POOL.find(p => p.id === id);
      if (!found || !store) return;
      const s = store.get();
      const wl = [...(s.watchlist || [])];
      if (wl.length >= MAX_ITEMS) { showToast('حداکثر ' + MAX_ITEMS + ' آیتم در واچ‌لیست امکان‌پذیر است', 'error'); return; }
      if (wl.some(i => i.id === id)) return;
      wl.push({ id: found.id, type: found.type, symbol: found.symbol, label: found.label, alert: null });
      store.set({ watchlist: wl });
      closeModal();
      renderTable(store, onAlertClick);
      fetchPrices(store).then(() => renderTable(store, onAlertClick));
    });
  });
}

export function initWatchlist(store, onAlertClick) {
  const addBtn = document.getElementById('watchlist-add-btn');
  if (addBtn) addBtn.addEventListener('click', openModal);

  const closeBtn = document.getElementById('watchlist-modal-close');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  const closeIconEl = document.getElementById('watchlist-close-icon');
  if (closeIconEl) closeIconEl.innerHTML = svg('close');

  const overlay = document.getElementById('watchlist-modal');
  if (overlay) overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

  const searchInput = document.getElementById('watchlist-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', e => renderSearchResults(e.target.value, store, onAlertClick));
  }

  renderTable(store, onAlertClick);
  renderSearchResults('', store, onAlertClick);

  fetchPrices(store).then(() => renderTable(store, onAlertClick));
  setInterval(() => {
    fetchPrices(store).then(() => renderTable(store, onAlertClick));
  }, 60000);

  return {
    getPrices: () => prices,
    refresh: () => fetchPrices(store).then(() => renderTable(store, onAlertClick)),
    renderTable: () => renderTable(store, onAlertClick)
  };
}
