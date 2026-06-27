/* =========================================================
   IranBroker New Tab — newtab.js
   ========================================================= */

/* ---------- Config: IranBroker tools & links ----------
   لینک‌ها بر اساس ساختار رایج سایت تنظیم شده‌اند و در صورت
   تغییر دامنه/مسیر، فقط همین آبجکت را ویرایش کنید.
*/
const IB_BASE = 'https://iranbroker.net';

const TOOLS = [
  { id: 'brokers',  label: 'لیست بروکرها',     sub: 'فارکس',     url: IB_BASE + '/forex-brokers/',          color: '#2563eb', icon: 'broker' },
  { id: 'spread',   label: 'مقایسه اسپرد',      sub: 'لحظه‌ای',   url: IB_BASE + '/spread-comparison/',      color: '#22c55e', icon: 'spread' },
  { id: 'calendar', label: 'تقویم اقتصادی',     sub: 'رویدادها',  url: IB_BASE + '/economic-calendar/',      color: '#f59e0b', icon: 'calendar' },
  { id: 'prices',   label: 'قیمت ارز دیجیتال',  sub: 'زنده',      url: IB_BASE + '/cryptocurrency-prices/',  color: '#8b5cf6', icon: 'coin' },
  { id: 'exchange', label: 'صرافی‌ها',          sub: 'ارز دیجیتال', url: IB_BASE + '/crypto-exchanges/',     color: '#06b6d4', icon: 'exchange' },
  { id: 'prop',     label: 'پراپ فرم‌ها',       sub: 'سرمایه',    url: IB_BASE + '/prop-firms/',             color: '#ec4899', icon: 'prop' },
  { id: 'analysis', label: 'تحلیل بازار',       sub: 'روزانه',    url: IB_BASE + '/market-analysis/',        color: '#14b8a6', icon: 'chart' },
  { id: 'news',     label: 'اخبار',             sub: 'بازار',     url: IB_BASE + '/news/',                   color: '#ef4444', icon: 'news' },
  { id: 'fraud',    label: 'هشدار کلاهبرداری',  sub: 'آگاهی',     url: IB_BASE + '/fraud-alert/',            color: '#f97316', icon: 'shield' },
  { id: 'edu',      label: 'آموزش فارکس',       sub: 'رایگان',    url: IB_BASE + '/forex-education/',        color: '#3b82f6', icon: 'book' },
];

const QUICK_LINKS = [
  { label: 'صفحه اصلی', url: IB_BASE + '/' },
  { label: 'ورود اعضا', url: IB_BASE + '/login/' },
  { label: 'تماس با ما', url: IB_BASE + '/contact-us/' },
  { label: 'صندوق‌های طلا', url: IB_BASE + '/gold-funds/' },
  { label: 'بروکرهای بورس', url: IB_BASE + '/stock-brokers/' },
];

/* SVG icons (inline, stroke-based) */
const ICONS = {
  broker:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V8l7-4 7 4v13M9 21v-6h6v6"/></svg>',
  spread:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M4 12h10M4 17h7"/><path d="M18 14l3 3-3 3"/></svg>',
  calendar:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4M8 14h.01M12 14h.01M16 14h.01"/></svg>',
  coin:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.2c0-1.2 1.1-1.9 2.5-1.9s2.5.8 2.5 2-1.1 1.6-2.5 1.6-2.5.6-2.5 1.8 1.1 2 2.5 2 2.5-.8 2.5-1.9"/></svg>',
  exchange:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 8h13l-3-3M17 16H4l3 3"/></svg>',
  prop:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.5 5 5.5.8-4 3.9.9 5.5L12 20l-4.9 2.6.9-5.5-4-3.9 5.5-.8z"/></svg>',
  chart:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18M7 14l3-4 3 3 4-6"/></svg>',
  news:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/><path d="M7 7h10M7 11h10M7 15h6"/></svg>',
  shield:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5z"/><path d="M9 12l2 2 4-4"/></svg>',
  book:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20"/></svg>',
};

/* Fraud-awareness & education tips (IranBroker Sage voice) */
const TIPS = [
  { tag: 'آگاهی از کلاهبرداری', text: 'هیچ نهاد مالی معتبری «سود تضمینی» بالای ۷۰٪ نمی‌دهد. چنین وعده‌هایی توجیه اقتصادی ندارند و معمولاً پشت‌شان چیزی پنهان است.' },
  { tag: 'انتخاب بروکر', text: 'قبل از افتتاح حساب، رگوله بروکر را بررسی کنید. رگوله‌های معتبر مثل FCA، ASIC و CySEC سطح حفاظت بالاتری دارند.' },
  { tag: 'مدیریت ریسک', text: 'هیچ‌گاه بیش از ۱ تا ۲ درصد سرمایه‌تان را روی یک معامله ریسک نکنید. حفظ سرمایه مقدم بر کسب سود است.' },
  { tag: 'اسپرد', text: 'اسپرد پایین همیشه به معنی هزینه کمتر نیست؛ حساب‌های ECN اسپرد نزدیک صفر دارند اما کمیسیون جداگانه می‌گیرند.' },
  { tag: 'آگاهی از کلاهبرداری', text: 'پراپ‌فرم معتبر هرگز برای «برداشت سود» از شما هزینه اضافه نمی‌خواهد. مراقب درخواست‌های پرداخت مشکوک باشید.' },
  { tag: 'آموزش', text: 'سودآوری مداوم در فارکس یک‌شبه به‌دست نمی‌آید؛ نیاز به سال‌ها تمرین، تجربه و پشتکار دارد.' },
  { tag: 'صرافی ارز دیجیتال', text: 'برای انتخاب صرافی خارجی محتاط باشید؛ کاربران ایرانی به‌دلیل تحریم‌ها ممکن است با مسدودشدن حساب روبرو شوند.' },
  { tag: 'شفافیت', text: 'نظرات واقعی کاربران را بخوانید. تجربه دیگران درباره سرعت برداشت و کیفیت پشتیبانی، ارزشمندترین داده تصمیم‌گیری است.' },
];

/* Forex trading sessions (UTC hours) */
const SESSIONS = [
  { name: 'سیدنی',  open: 21, close: 6,  city: 'Sydney' },
  { name: 'توکیو',  open: 0,  close: 9,  city: 'Tokyo' },
  { name: 'لندن',   open: 7,  close: 16, city: 'London' },
  { name: 'نیویورک', open: 12, close: 21, city: 'New York' },
];

/* ---------- State ---------- */
const DEFAULTS = {
  name: '',
  engine: 'google',
  showCrypto: true,
  bgAnim: true,
  coins: 'bitcoin,ethereum,tether,binancecoin,ripple',
  theme: 'dark',
  tipIndex: 0,
};
let state = { ...DEFAULTS };

/* ---------- Storage helpers (chrome.storage with localStorage fallback) ---------- */
const store = {
  get(cb) {
    if (window.chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get('ib_newtab', (r) => cb(r.ib_newtab || {}));
    } else {
      try { cb(JSON.parse(localStorage.getItem('ib_newtab') || '{}')); }
      catch { cb({}); }
    }
  },
  set(data) {
    if (window.chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ ib_newtab: data });
    } else {
      localStorage.setItem('ib_newtab', JSON.stringify(data));
    }
  }
};

/* ---------- Persian date & clock ---------- */
function updateClock() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  document.getElementById('clock').textContent = `${hh}:${mm}`;

  // Persian (Jalali) date via Intl
  try {
    const fa = new Intl.DateTimeFormat('fa-IR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }).format(now);
    document.getElementById('date').textContent = fa;
  } catch {
    document.getElementById('date').textContent = now.toLocaleDateString('fa-IR');
  }
}

function updateGreeting() {
  const h = new Date().getHours();
  let g = 'سلام';
  if (h >= 5 && h < 12) g = 'صبح‌تان بخیر';
  else if (h >= 12 && h < 17) g = 'ظهر بخیر';
  else if (h >= 17 && h < 21) g = 'عصرتان بخیر';
  else g = 'شب‌تان بخیر';
  const name = state.name ? `، ${state.name}` : ' معامله‌گر';
  document.getElementById('greeting').textContent = `${g}${name}`;
}

/* ---------- Tools grid ---------- */
function renderTools() {
  const grid = document.getElementById('tools-grid');
  grid.innerHTML = '';
  TOOLS.forEach(t => {
    const a = document.createElement('a');
    a.className = 'tool-card';
    a.href = t.url;
    a.style.setProperty('--tc', hexToRgba(t.color, 0.22));
    a.innerHTML = `
      <div class="tool-icon" style="--tc-bg:${hexToRgba(t.color,0.15)};--tc-fg:${t.color}">${ICONS[t.icon] || ''}</div>
      <div class="tool-label">${t.label}</div>
      <div class="tool-sub">${t.sub}</div>`;
    grid.appendChild(a);
  });
}

function renderQuickLinks() {
  const wrap = document.getElementById('quick-links');
  wrap.innerHTML = '';
  QUICK_LINKS.forEach(l => {
    const a = document.createElement('a');
    a.className = 'quick-link';
    a.href = l.url;
    a.innerHTML = `<span class="ql-dot"></span>${l.label}`;
    wrap.appendChild(a);
  });
}

function hexToRgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`;
}

/* ---------- Search ---------- */
const ENGINES = {
  google: { label: 'گوگل', url: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}` },
  ib:     { label: 'ایران بروکر', url: (q) => `${IB_BASE}/?s=${encodeURIComponent(q)}` },
  tv:     { label: 'تریدینگ‌ویو', url: (q) => `https://www.tradingview.com/symbols/${encodeURIComponent(q.toUpperCase())}/` },
};
let activeEngine = 'google';
let suggestItems = [];
let suggestActive = -1;

function setEngine(eng) {
  activeEngine = eng;
  document.getElementById('search-scope').textContent = ENGINES[eng].label;
  document.querySelectorAll('.search-tabs button').forEach(b => {
    b.classList.toggle('active', b.dataset.engine === eng);
  });
  document.getElementById('search-input').focus();
}

function doSearch(q) {
  q = q.trim();
  if (!q) return;
  window.location.href = ENGINES[activeEngine].url(q);
}

function updateSuggest(q) {
  const ul = document.getElementById('suggest');
  q = q.trim().toLowerCase();
  suggestActive = -1;
  if (!q) { ul.classList.remove('show'); ul.innerHTML = ''; suggestItems = []; return; }

  // match IranBroker tools + quick links
  const pool = [
    ...TOOLS.map(t => ({ label: t.label, sub: t.sub, url: t.url, tag: 'ابزار' })),
    ...QUICK_LINKS.map(l => ({ label: l.label, sub: '', url: l.url, tag: 'لینک' })),
  ];
  suggestItems = pool.filter(p =>
    p.label.toLowerCase().includes(q) || (p.sub && p.sub.toLowerCase().includes(q))
  ).slice(0, 5);

  if (!suggestItems.length) { ul.classList.remove('show'); ul.innerHTML = ''; return; }

  ul.innerHTML = suggestItems.map((s, i) => `
    <li data-url="${s.url}" data-i="${i}">
      <span class="s-icon">🔎</span>
      <span>${s.label}${s.sub ? ` <span style="color:var(--text-dim);font-size:11px">· ${s.sub}</span>` : ''}</span>
      <span class="s-tag">${s.tag}</span>
    </li>`).join('');
  ul.classList.add('show');

  ul.querySelectorAll('li').forEach(li => {
    li.addEventListener('click', () => { window.location.href = li.dataset.url; });
  });
}

function moveSuggest(dir) {
  const lis = document.querySelectorAll('#suggest li');
  if (!lis.length) return;
  suggestActive = (suggestActive + dir + lis.length) % lis.length;
  lis.forEach((li, i) => li.classList.toggle('active', i === suggestActive));
}

/* ---------- Crypto widget (CoinGecko) ---------- */
const COIN_META = {
  bitcoin:     { sym: 'BTC', name: 'بیت‌کوین' },
  ethereum:    { sym: 'ETH', name: 'اتریوم' },
  tether:      { sym: 'USDT', name: 'تتر' },
  binancecoin: { sym: 'BNB', name: 'بایننس‌کوین' },
  ripple:      { sym: 'XRP', name: 'ریپل' },
  solana:      { sym: 'SOL', name: 'سولانا' },
  cardano:     { sym: 'ADA', name: 'کاردانو' },
  dogecoin:    { sym: 'DOGE', name: 'دوج‌کوین' },
  tron:        { sym: 'TRX', name: 'ترون' },
};

function fmtPrice(p) {
  if (p >= 1000) return '$' + p.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (p >= 1) return '$' + p.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return '$' + p.toLocaleString('en-US', { maximumFractionDigits: 4 });
}

async function loadCrypto() {
  const list = document.getElementById('crypto-list');
  const foot = document.getElementById('crypto-foot');
  const ids = state.coins.split(',').map(s => s.trim()).filter(Boolean).slice(0, 6);
  if (!ids.length) return;

  list.innerHTML = '<div class="crypto-loading">در حال دریافت قیمت‌ها…</div>';
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids.join(',')}&order=market_cap_desc&price_change_percentage=24h`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) throw new Error('empty');

    list.innerHTML = '';
    data.forEach((c, i) => {
      const meta = COIN_META[c.id] || { sym: (c.symbol || '').toUpperCase(), name: c.name };
      const chg = c.price_change_percentage_24h ?? 0;
      const up = chg >= 0;
      const row = document.createElement('div');
      row.className = 'crypto-row';
      row.innerHTML = `
        <span class="c-rank">${i + 1}</span>
        <div class="c-mid">
          <span class="c-sym">${meta.sym}</span>
          <span class="c-name">${meta.name}</span>
        </div>
        <div class="c-price">${fmtPrice(c.current_price)}
          <div class="c-chg ${up ? 'c-up' : 'c-down'}">${up ? '▲' : '▼'} ${Math.abs(chg).toFixed(2)}٪</div>
        </div>`;
      list.appendChild(row);
    });
    foot.textContent = 'به‌روزرسانی: ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) + ' · داده از CoinGecko';
  } catch (e) {
    list.innerHTML = `<div class="crypto-error">دریافت قیمت‌ها ممکن نشد.<br>اتصال اینترنت یا فیلترشکن را بررسی کنید.</div>`;
    foot.textContent = '';
  }
}

/* ---------- Forex sessions ---------- */
function isOpen(s, h) {
  if (s.open < s.close) return h >= s.open && h < s.close;
  return h >= s.open || h < s.close; // wraps midnight
}
function renderSessions() {
  const wrap = document.getElementById('session-list');
  const utcH = new Date().getUTCHours();
  wrap.innerHTML = '';
  SESSIONS.forEach(s => {
    const open = isOpen(s, utcH);
    const row = document.createElement('div');
    row.className = 'session-row';
    row.innerHTML = `
      <span class="session-dot ${open ? 'open' : 'closed'}"></span>
      <span class="session-name">${s.name}</span>
      <span class="session-time">${String(s.open).padStart(2,'0')}:00–${String(s.close).padStart(2,'0')}:00 UTC</span>
      <span class="session-status ${open ? 'open' : 'closed'}">${open ? 'باز' : 'بسته'}</span>`;
    wrap.appendChild(row);
  });
}

/* ---------- Tips ---------- */
function renderTip() {
  const t = TIPS[state.tipIndex % TIPS.length];
  document.getElementById('tip-badge').textContent = t.tag;
  document.getElementById('tip-text').textContent = t.text;
}
function nextTip() {
  state.tipIndex = (state.tipIndex + 1) % TIPS.length;
  renderTip();
  persist();
}

/* ---------- Theme ---------- */
function applyTheme() {
  document.body.classList.toggle('light', state.theme === 'light');
  const p = document.getElementById('theme-icon-path');
  if (state.theme === 'light') {
    p.setAttribute('d', 'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 1v3M12 20v3M4 12H1M23 12h-3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2');
    p.parentElement.setAttribute('fill','none');
    p.setAttribute('stroke','currentColor'); p.setAttribute('stroke-width','2'); p.setAttribute('stroke-linecap','round');
  } else {
    p.setAttribute('d', 'M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.39 5.39 0 0 1-7.54-7.54C12.92 3.04 12.46 3 12 3z');
    p.setAttribute('fill','currentColor'); p.removeAttribute('stroke');
  }
}
function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  applyTheme();
  persist();
}

/* ---------- Background animation (financial chart lines) ---------- */
let bgRaf = null;
function startBg() {
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  let W, H, lines;

  function resize() {
    W = canvas.width = window.innerWidth * devicePixelRatio;
    H = canvas.height = window.innerHeight * devicePixelRatio;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    initLines();
  }
  function initLines() {
    lines = [];
    const count = 5;
    for (let i = 0; i < count; i++) {
      const pts = [];
      const seg = 7;
      let y = Math.random() * H;
      for (let j = 0; j <= seg; j++) {
        pts.push({ x: (W / seg) * j, y, vy: (Math.random() - 0.5) * 0.4 });
        y += (Math.random() - 0.5) * H * 0.18;
      }
      lines.push({ pts, hue: i % 2 ? 145 : 217, speed: 0.15 + Math.random() * 0.25, off: Math.random() * 1000 });
    }
  }
  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    lines.forEach((ln, idx) => {
      ctx.beginPath();
      ln.pts.forEach((p, i) => {
        const yy = p.y + Math.sin(t * 0.0003 * ln.speed + i + ln.off) * 22 * devicePixelRatio;
        if (i === 0) ctx.moveTo(p.x, yy);
        else {
          const prev = ln.pts[i - 1];
          const yPrev = prev.y + Math.sin(t * 0.0003 * ln.speed + (i - 1) + ln.off) * 22 * devicePixelRatio;
          const cx = (prev.x + p.x) / 2;
          ctx.bezierCurveTo(cx, yPrev, cx, yy, p.x, yy);
        }
      });
      const isLight = document.body.classList.contains('light');
      const alpha = isLight ? 0.05 : 0.07;
      ctx.strokeStyle = `hsla(${ln.hue}, 80%, 60%, ${alpha})`;
      ctx.lineWidth = 1.5 * devicePixelRatio;
      ctx.stroke();
    });
    bgRaf = requestAnimationFrame(draw);
  }
  resize();
  window.addEventListener('resize', resize);
  bgRaf = requestAnimationFrame(draw);
}
function stopBg() {
  if (bgRaf) cancelAnimationFrame(bgRaf);
  const c = document.getElementById('bg-canvas');
  c.getContext('2d').clearRect(0, 0, c.width, c.height);
}

/* ---------- Settings modal ---------- */
function openSettings() {
  document.getElementById('set-name').value = state.name;
  document.getElementById('set-engine').value = state.engine;
  document.getElementById('set-crypto').checked = state.showCrypto;
  document.getElementById('set-bg').checked = state.bgAnim;
  document.getElementById('set-coins').value = state.coins;
  document.getElementById('settings-modal').hidden = false;
}
function closeSettings() { document.getElementById('settings-modal').hidden = true; }
function saveSettings() {
  state.name = document.getElementById('set-name').value.trim();
  state.engine = document.getElementById('set-engine').value;
  state.showCrypto = document.getElementById('set-crypto').checked;
  state.bgAnim = document.getElementById('set-bg').checked;
  state.coins = document.getElementById('set-coins').value.trim() || DEFAULTS.coins;
  persist();
  applyAll();
  closeSettings();
}
function resetSettings() {
  state = { ...DEFAULTS };
  persist();
  applyAll();
  openSettings();
}

function applyAll() {
  updateGreeting();
  applyTheme();
  setEngine(state.engine);
  document.body.classList.toggle('no-crypto', !state.showCrypto);
  if (state.showCrypto) loadCrypto();
  if (state.bgAnim) { stopBg(); startBg(); } else { stopBg(); }
}

function persist() { store.set(state); }

/* ---------- Init ---------- */
function bindEvents() {
  const input = document.getElementById('search-input');
  input.addEventListener('input', (e) => updateSuggest(e.target.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      if (suggestActive >= 0 && suggestItems[suggestActive]) {
        window.location.href = suggestItems[suggestActive].url;
      } else doSearch(input.value);
    } else if (e.key === 'ArrowDown') { e.preventDefault(); moveSuggest(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); moveSuggest(-1); }
    else if (e.key === 'Tab') {
      e.preventDefault();
      const order = ['google', 'ib', 'tv'];
      const next = order[(order.indexOf(activeEngine) + 1) % order.length];
      setEngine(next);
    } else if (e.key === 'Escape') {
      document.getElementById('suggest').classList.remove('show');
    }
  });
  document.getElementById('search-go').addEventListener('click', () => doSearch(input.value));
  document.querySelectorAll('.search-tabs button').forEach(b => {
    b.addEventListener('click', () => setEngine(b.dataset.engine));
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-section')) {
      document.getElementById('suggest').classList.remove('show');
    }
  });

  document.getElementById('crypto-refresh').addEventListener('click', (e) => {
    e.currentTarget.classList.add('spin');
    loadCrypto().finally(() => setTimeout(() => e.currentTarget.classList.remove('spin'), 800));
  });

  document.getElementById('tip-next').addEventListener('click', nextTip);
  document.getElementById('theme-btn').addEventListener('click', toggleTheme);
  document.getElementById('settings-btn').addEventListener('click', openSettings);
  document.getElementById('settings-close').addEventListener('click', closeSettings);
  document.getElementById('settings-save').addEventListener('click', saveSettings);
  document.getElementById('settings-reset').addEventListener('click', resetSettings);
  document.getElementById('settings-modal').addEventListener('click', (e) => {
    if (e.target.id === 'settings-modal') closeSettings();
  });
  // brand logo -> homepage
  document.getElementById('brand-logo').style.cursor = 'pointer';
  document.getElementById('brand-logo').addEventListener('click', () => window.location.href = IB_BASE + '/');
}

function init() {
  store.get((saved) => {
    state = { ...DEFAULTS, ...saved };

    renderTools();
    renderQuickLinks();
    renderSessions();
    renderTip();
    applyAll();
    bindEvents();

    updateClock();
    setInterval(updateClock, 1000 * 15);
    setInterval(renderSessions, 1000 * 60);
    // refresh crypto every 90s
    setInterval(() => { if (state.showCrypto) loadCrypto(); }, 90000);

    setTimeout(() => document.getElementById('search-input').focus(), 300);
  });
}

document.addEventListener('DOMContentLoaded', init);
