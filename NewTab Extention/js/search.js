/* Search box, engine switcher, inline suggestions */

import { svg } from './utils.js';

const TOOLS = [
  { label: 'لیست بروکرها', sub: 'فارکس', url: 'https://iranbroker.net/forex-brokers/', icon: 'bank' },
  { label: 'مقایسه اسپرد', sub: 'لحظه‌ای', url: 'https://iranbroker.net/spread-comparison/', icon: 'barChart' },
  { label: 'تقویم اقتصادی', sub: 'رویدادها', url: 'https://iranbroker.net/economic-calendar/', icon: 'calendar' },
  { label: 'قیمت ارز دیجیتال', sub: 'زنده', url: 'https://iranbroker.net/cryptocurrency-prices/', icon: 'coin' },
  { label: 'صرافی‌ها', sub: 'کریپتو', url: 'https://iranbroker.net/crypto-exchanges/', icon: 'swap' },
  { label: 'پراپ فرم‌ها', sub: 'سرمایه', url: 'https://iranbroker.net/prop-firms/', icon: 'trophy' },
  { label: 'تحلیل بازار', sub: 'روزانه', url: 'https://iranbroker.net/market-analysis/', icon: 'lineChart' },
  { label: 'اخبار', sub: 'بازار', url: 'https://iranbroker.net/news/', icon: 'newspaper' },
  { label: 'هشدار کلاهبرداری', sub: 'آگاهی', url: 'https://iranbroker.net/fraud-alert/', icon: 'shieldCheck' },
  { label: 'آموزش فارکس', sub: 'رایگان', url: 'https://iranbroker.net/forex-education/', icon: 'graduation' }
];

const QUICK = [
  { label: 'صفحه اصلی', url: 'https://iranbroker.net/' },
  { label: 'ورود اعضا', url: 'https://iranbroker.net/login/' },
  { label: 'صندوق‌های طلا', url: 'https://iranbroker.net/gold-funds/' },
  { label: 'بروکرهای بورس', url: 'https://iranbroker.net/stock-brokers/' }
];

const ENGINES = {
  google: { label: 'گوگل', icon: 'google', url: q => 'https://www.google.com/search?q=' + encodeURIComponent(q) },
  ib: { label: 'ایران بروکر', icon: 'search', url: q => 'https://iranbroker.net/?s=' + encodeURIComponent(q) },
  tv: { label: 'تریدینگ‌ویو', icon: 'lineChart', url: q => 'https://www.tradingview.com/symbols/' + encodeURIComponent(q.toUpperCase()) + '/' }
};

let activeEngine = 'google';
let query = '';
let sugIdx = -1;

function getMatches() {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const pool = [
    ...TOOLS.map(t => ({ label: t.label, sub: t.sub, url: t.url, tag: 'ابزار', icon: t.icon })),
    ...QUICK.map(l => ({ label: l.label, sub: '', url: l.url, tag: 'لینک', icon: 'link' }))
  ];
  return pool.filter(p => p.label.toLowerCase().includes(q) || (p.sub && p.sub.toLowerCase().includes(q))).slice(0, 5);
}

function renderEngines() {
  const container = document.getElementById('engines');
  if (!container) return;
  container.innerHTML = ['google', 'ib', 'tv'].map(k => {
    const active = activeEngine === k ? ' active' : '';
    return '<button data-engine="' + k + '" class="' + active.trim() + '">' + svg(ENGINES[k].icon) + ENGINES[k].label + '</button>';
  }).join('');
  container.querySelectorAll('button').forEach(b => {
    b.addEventListener('click', () => setEngine(b.dataset.engine));
  });
}

function renderSuggest() {
  const list = document.getElementById('suggest');
  if (!list) return;
  const m = getMatches();
  if (!m.length) { list.hidden = true; list.innerHTML = ''; return; }
  list.hidden = false;
  list.innerHTML = m.map((s, i) => {
    const active = i === sugIdx ? ' active' : '';
    const sub = s.sub ? '<span class="s-sub"> · ' + s.sub + '</span>' : '';
    return '<li class="' + active.trim() + '" data-url="' + s.url + '">' +
      '<span class="s-ic">' + svg(s.icon) + '</span>' +
      '<span class="s-label">' + s.label + sub + '</span>' +
      '<span class="s-tag">' + s.tag + '</span></li>';
  }).join('');
  list.querySelectorAll('li').forEach(li => {
    li.addEventListener('mousedown', e => { e.preventDefault(); window.location.href = li.dataset.url; });
  });
}

function setEngine(k) {
  activeEngine = k;
  sugIdx = -1;
  const scopeEl = document.getElementById('scope-label');
  if (scopeEl) scopeEl.textContent = ENGINES[k].label;
  renderEngines();
  renderSuggest();
}

function submitSearch() {
  const q = query.trim();
  if (!q) return;
  window.location.href = ENGINES[activeEngine].url(q);
}

export function initSearch(state) {
  activeEngine = state.engine || 'google';

  const iconEl = document.getElementById('search-icon');
  if (iconEl) iconEl.innerHTML = svg('search');

  const goBtn = document.getElementById('search-go');
  if (goBtn) goBtn.innerHTML = svg('arrowLeft');

  const scopeEl = document.getElementById('scope-label');
  if (scopeEl) scopeEl.textContent = ENGINES[activeEngine].label;

  renderEngines();

  const input = document.getElementById('search-input');
  if (!input) return;

  input.addEventListener('input', e => {
    query = e.target.value;
    sugIdx = -1;
    renderSuggest();
  });

  input.addEventListener('keydown', e => {
    const m = getMatches();
    if (e.key === 'Enter') {
      if (sugIdx >= 0 && m[sugIdx]) window.location.href = m[sugIdx].url;
      else submitSearch();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      sugIdx = Math.min(sugIdx + 1, m.length - 1);
      renderSuggest();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      sugIdx = Math.max(sugIdx - 1, -1);
      renderSuggest();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const order = ['google', 'ib', 'tv'];
      setEngine(order[(order.indexOf(activeEngine) + 1) % 3]);
    } else if (e.key === 'Escape') {
      query = '';
      input.value = '';
      sugIdx = -1;
      renderSuggest();
    }
  });

  input.addEventListener('blur', () => setTimeout(() => {
    const list = document.getElementById('suggest');
    if (list) list.hidden = true;
  }, 120));

  const goEl = document.getElementById('search-go');
  if (goEl) goEl.addEventListener('click', submitSearch);

  input.focus();

  return { setEngine, getActiveEngine: () => activeEngine };
}
