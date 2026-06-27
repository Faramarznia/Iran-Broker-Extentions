/* Live CoinGecko crypto prices widget */

import { fmtPrice, sparkPts, svg } from './utils.js';

const COIN_META = {
  bitcoin: { sym: 'BTC', name: 'بیت‌کوین' }, ethereum: { sym: 'ETH', name: 'اتریوم' },
  tether: { sym: 'USDT', name: 'تتر' }, solana: { sym: 'SOL', name: 'سولانا' },
  ripple: { sym: 'XRP', name: 'ریپل' }, dogecoin: { sym: 'DOGE', name: 'دوج‌کوین' },
  binancecoin: { sym: 'BNB', name: 'بایننس‌کوین' }, cardano: { sym: 'ADA', name: 'کاردانو' },
  tron: { sym: 'TRX', name: 'ترون' }, litecoin: { sym: 'LTC', name: 'لایت‌کوین' }
};

const SEED = [
  { id: 'bitcoin', price: 96480, chg: 1.84 }, { id: 'ethereum', price: 3342, chg: 2.41 },
  { id: 'tether', price: 1.0, chg: 0.02 }, { id: 'binancecoin', price: 605, chg: -0.5 },
  { id: 'ripple', price: 2.27, chg: 3.06 }
];

let cryptoLive = false;

function renderCrypto(state, cryptoData, err, lastTime) {
  const list = document.getElementById('crypto-list');
  const foot = document.getElementById('crypto-foot');
  if (!list) return;

  list.innerHTML = (cryptoData || SEED).map((c, i) => {
    const meta = COIN_META[c.id] || { sym: c.id.toUpperCase(), name: c.id };
    const up = (c.chg || 0) >= 0;
    const chgColor = up ? 'var(--green)' : 'var(--red)';
    const chgBg = up ? 'var(--greenSoft)' : 'var(--redSoft)';
    const chgStr = (up ? '▲ ' : '▼ ') + Math.abs(c.chg || 0).toFixed(2) + '%';
    return '<div class="c-row">' +
      '<span class="c-rank">' + (i + 1) + '</span>' +
      '<div class="c-id"><span class="c-sym">' + meta.sym + '</span><span class="c-name">' + meta.name + '</span></div>' +
      '<svg class="c-spark" viewBox="0 0 64 22" width="56" height="20" preserveAspectRatio="none">' +
        '<polyline points="' + sparkPts(c) + '" fill="none" stroke="' + (up ? 'var(--green)' : 'var(--red)') + '" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></polyline>' +
      '</svg>' +
      '<div class="c-price-col">' +
        '<span class="c-price">' + fmtPrice(c.price) + '</span>' +
        '<span class="c-chg" style="color:' + chgColor + ';background:' + chgBg + '">' + chgStr + '</span>' +
      '</div></div>';
  }).join('');

  if (foot) {
    if (err) foot.innerHTML = '<span class="err">دریافت زنده ممکن نشد — نمایش آخرین داده</span>';
    else if (lastTime) foot.innerHTML = '<span>به‌روزرسانی ' + lastTime + ' · داده از CoinGecko</span>';
    else foot.innerHTML = '';
  }
}

async function loadCrypto(store) {
  const state = store.get();
  if (!state.showCrypto) return;

  const refreshBtn = document.getElementById('crypto-refresh');
  if (refreshBtn) refreshBtn.classList.add('spinning');

  const ids = (state.coins || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 6);
  if (!ids.length) { if (refreshBtn) refreshBtn.classList.remove('spinning'); return; }

  const controller = new AbortController();
  setTimeout(() => controller.abort(), 8000);

  try {
    const url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=' + ids.join(',') + '&order=market_cap_desc&sparkline=true&price_change_percentage=24h';
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error('http');
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) throw new Error('empty');

    const byId = {};
    data.forEach(c => { byId[c.id] = c; });
    const rows = ids.map(id => byId[id]).filter(Boolean).map(c => ({
      id: c.id,
      price: c.current_price,
      chg: c.price_change_percentage_24h ?? 0,
      spark: c.sparkline_in_7d?.price || null
    }));

    cryptoLive = true;
    const now = new Date();
    const timeStr = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');
    renderCrypto(state, rows, false, timeStr);
  } catch (e) {
    renderCrypto(state, SEED, !cryptoLive, null);
  } finally {
    if (refreshBtn) refreshBtn.classList.remove('spinning');
  }
}

export function initCrypto(store) {
  const refreshBtn = document.getElementById('crypto-refresh');
  if (refreshBtn) {
    refreshBtn.innerHTML = svg('refresh');
    refreshBtn.addEventListener('click', () => loadCrypto(store));
  }

  const state = store.get();
  renderCrypto(state, SEED, false, null);

  if (state.showCrypto) {
    setTimeout(() => loadCrypto(store), 400);
    setInterval(() => { if (store.get().showCrypto) loadCrypto(store); }, 90000);
  }
}
