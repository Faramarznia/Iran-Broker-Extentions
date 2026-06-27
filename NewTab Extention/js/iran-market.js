/* Feature 5: Iran Market Rates Widget — USD, Gold, Coin, BTC in Toman */

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const STATIC_DATA = [
  { id: 'usd', name: 'دلار آزاد', price: '93,500', chg: '+0.8', unit: 'تومان' },
  { id: 'gold18', name: 'طلا ۱۸ عیار', price: '4,850,000', chg: '+1.2', unit: 'ت/گرم' },
  { id: 'coin', name: 'سکه تمام', price: '42,300,000', chg: '+0.5', unit: 'تومان' },
  { id: 'btc', name: 'بیت‌کوین', price: '9,150,000,000', chg: '+2.1', unit: 'تومان' }
];

function renderItems(items, isStatic = false) {
  const container = document.getElementById('im-items');
  const statusEl = document.getElementById('im-status');
  if (!container) return;

  if (isStatic && statusEl) {
    statusEl.textContent = '(قیمت‌ها تقریبی هستند)';
  }

  container.innerHTML = items.map(item => {
    const chgNum = parseFloat((item.chg || '0').replace('+', ''));
    const isUp = chgNum >= 0;
    return '<div class="im-item">' +
      '<div class="im-name">' + item.name + '</div>' +
      '<div class="im-price">' + item.price + ' ' + (item.unit || '') + '</div>' +
      '<div class="im-chg ' + (isUp ? 'up' : 'down') + '">' + (isUp ? '▲ ' : '▼ ') + Math.abs(chgNum).toFixed(1) + '%</div>' +
      '<div class="im-tooltip">منبع: بازار آزاد</div>' +
    '</div>';
  }).join('');
}

async function fetchIranRates(store) {
  const state = store.get();
  const cache = state.iranRatesCache;
  if (cache && cache.timestamp && (Date.now() - cache.timestamp < CACHE_TTL)) {
    renderItems(cache.data);
    return;
  }

  const controller = new AbortController();
  setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch('https://call4.tgju.org/c/currency/price-all', { signal: controller.signal });
    if (!res.ok) throw new Error('http');
    const data = await res.json();

    const items = [];
    if (data.current) {
      const d = data.current;
      if (d.price_dollar_rl) items.push({ id: 'usd', name: 'دلار آزاد', price: Math.round(parseInt(d.price_dollar_rl) / 10).toLocaleString('en-US'), chg: d.change_dollar || '0', unit: 'تومان' });
      if (d.price_gold_18 || d.geram18) items.push({ id: 'gold18', name: 'طلا ۱۸ عیار', price: Math.round(parseInt(d.price_gold_18 || d.geram18) / 10).toLocaleString('en-US'), chg: '0', unit: 'ت/گرم' });
    }

    if (items.length > 0) {
      store.set({ iranRatesCache: { data: items, timestamp: Date.now() } });
      renderItems(items);
    } else {
      throw new Error('empty');
    }
  } catch (e) {
    const cached = store.get().iranRatesCache;
    if (cached && cached.data) {
      renderItems(cached.data);
      const statusEl = document.getElementById('im-status');
      if (statusEl) statusEl.textContent = '(داده‌ی کش)';
    } else {
      renderItems(STATIC_DATA, true);
    }
  }
}

export function initIranMarket(store) {
  fetchIranRates(store);
  setInterval(() => fetchIranRates(store), CACHE_TTL);
}
