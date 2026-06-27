/* ===================================================================
   ایران بروکر — تب جدید (ریدیزاین)
   Vanilla port of the Claude Design component "IranBroker NewTab".
   Features: glowing clock + Jalali date + hourly greeting, forex
   world-markets ring, live CoinGecko crypto with sparklines, tools
   grid, daily tip, quick links, dark/light theme, accent / grid /
   layout tweaks, and a settings modal — all persisted locally.
   =================================================================== */
(function () {
  'use strict';

  /* ----------------------------- Icons (inline SVG) ----------------------------- */
  const ICONS = {
    search: '<path fill="currentColor" d="M18.031 16.617l4.283 4.282-1.415 1.415-4.282-4.283A8.96 8.96 0 0 1 11 20c-4.968 0-9-4.032-9-9s4.032-9 9-9 9 4.032 9 9a8.96 8.96 0 0 1-1.969 5.617zm-2.006-.742A6.977 6.977 0 0 0 18 11c0-3.868-3.133-7-7-7-3.868 0-7 3.132-7 7 0 3.867 3.132 7 7 7a6.977 6.977 0 0 0 4.875-1.975l.15-.15z"/>',
    arrowLeft: '<path fill="currentColor" d="M10.828 12l4.95 4.95-1.414 1.414L8 12l6.364-6.364 1.414 1.414z"/>',
    equalizer: '<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></g><g fill="currentColor"><circle cx="9" cy="7" r="2.4"/><circle cx="15" cy="12" r="2.4"/><circle cx="10" cy="17" r="2.4"/></g>',
    sun: '<circle cx="12" cy="12" r="4" fill="currentColor"/><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="2" x2="12" y2="4.5"/><line x1="12" y1="19.5" x2="12" y2="22"/><line x1="2" y1="12" x2="4.5" y2="12"/><line x1="19.5" y1="12" x2="22" y2="12"/><line x1="4.9" y1="4.9" x2="6.7" y2="6.7"/><line x1="17.3" y1="17.3" x2="19.1" y2="19.1"/><line x1="19.1" y1="4.9" x2="17.3" y2="6.7"/><line x1="6.7" y1="17.3" x2="4.9" y2="19.1"/></g>',
    moon: '<path fill="currentColor" d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.39 5.39 0 0 1-7.54-7.54C12.92 3.04 12.46 3 12 3z"/>',
    google: '<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>',
    lineChart: '<path fill="currentColor" d="M3 3h2v16h16v2H3V3zm15.293 3.293l1.414 1.414L14 13.414l-3-3-4.293 4.293-1.414-1.414L11 7.586l3 3z"/>',
    refresh: '<path fill="currentColor" d="M5.463 4.433A9.961 9.961 0 0 1 12 2c5.523 0 10 4.477 10 10 0 2.136-.67 4.116-1.81 5.74L17 12h3A8 8 0 0 0 6.46 6.228l-.997-1.795zm13.074 15.134A9.961 9.961 0 0 1 12 22C6.477 22 2 17.523 2 12c0-2.136.67-4.116 1.81-5.74L7 12H4a8 8 0 0 0 13.54 5.772l.997 1.795z"/>',
    shieldCheck: '<path fill="currentColor" d="M12 1l8.217 1.826a1 1 0 0 1 .783.976v9.987a6 6 0 0 1-2.672 4.992L12 23l-6.328-4.219A6 6 0 0 1 3 13.79V3.802a1 1 0 0 1 .783-.976L12 1zm0 2.049L5 4.604v9.185a4 4 0 0 0 1.781 3.328L12 20.597l5.219-3.48A4 4 0 0 0 19 13.79V4.604L12 3.05zm4.452 5.173l1.415 1.414L11.503 16 7.26 11.757l1.414-1.414 2.828 2.828 4.95-4.95z"/>',
    close: '<path fill="currentColor" d="M12 10.586l4.95-4.95 1.414 1.414L13.414 12l4.95 4.95-1.414 1.414L12 13.414l-4.95 4.95-1.414-1.414L10.586 12 5.636 7.05 7.05 5.636z"/>',
    bank: '<path fill="currentColor" d="M2 20h20v2H2v-2zm2-8h2v7H4v-7zm5 0h2v7H9v-7zm4 0h2v7h-2v-7zm5 0h2v7h-2v-7zM2 7l10-5 10 5v4H2V7zm2 1.236V9h16v-.764l-8-4-8 4z"/>',
    barChart: '<path fill="currentColor" d="M3 3h2v16h16v2H3V3zm5 8h2v6H8v-6zm4-4h2v10h-2V7zm4 6h2v4h-2v-4z"/>',
    calendar: '<path fill="currentColor" d="M17 3h4a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4V1h2v2h6V1h2v2zm3 8H4v8h16v-8zM9 5H7v1H4v3h16V6h-3V5h-2v1H9V5zm-2 8h5v4H7v-4z"/>',
    coin: '<path fill="currentColor" d="M12 1c6.075 0 11 4.925 11 11s-4.925 11-11 11S1 18.075 1 12 5.925 1 12 1zm0 2a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm1 3v1.5h2v2h-4.5a.5.5 0 0 0-.09.992L13 11a2.5 2.5 0 0 1 .5 4.95V18h-2v-1.5H9v-2h4.5a.5.5 0 0 0 .09-.992L11 11a2.5 2.5 0 0 1-.5-4.95V6h2.5z"/>',
    swap: '<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10h8m-2-2 2 2-2 2"/><path d="M16 14H8m2 2-2-2 2-2"/></g>',
    trophy: '<path fill="currentColor" d="M13 16.938V19h5v2H6v-2h5v-2.062A8.001 8.001 0 0 1 4 9V3h16v6a8.001 8.001 0 0 1-7 7.938zM6 5v4a6 6 0 1 0 12 0V5H6zM1 5h2v4H1V5zm20 0h2v4h-2V5z"/>',
    newspaper: '<path fill="currentColor" d="M20 3v16a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3V5h2v13a1 1 0 0 0 2 0V3h14zM7 7v6h8V7H7zm2 2h4v2H9V9zm-2 6h8v2H7v-2z"/>',
    graduation: '<path fill="currentColor" d="M12 2l11 6-11 6L3.545 9.385 3 9.09V14H1V8l11-6zm6.16 9.674L19 12v3.5c0 1.933-3.134 3.5-7 3.5s-7-1.567-7-3.5V12l.84-.326L12 14.276l6.16-2.602z"/>',
    link: '<path fill="currentColor" d="M18.364 15.536L16.95 14.12l1.414-1.414a5 5 0 1 0-7.071-7.071L9.879 7.05 8.464 5.636 9.88 4.222a7 7 0 0 1 9.9 9.9l-1.415 1.414zm-2.828 2.828l-1.415 1.414a7 7 0 0 1-9.9-9.9l1.415-1.414L7.05 9.88l-1.414 1.414a5 5 0 1 0 7.071 7.071l1.414-1.414 1.415 1.414zm-.708-10.607l1.415 1.415-7.072 7.07-1.414-1.414 7.071-7.07z"/>'
  };
  function svg(name) {
    return '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' + (ICONS[name] || '') + '</svg>';
  }

  /* ----------------------------- Data ----------------------------- */
  const TOOLS = [
    { label: 'لیست بروکرها', sub: 'فارکس', url: 'https://iranbroker.net/forex-brokers/', icon: 'bank', c: '#6f9bf3' },
    { label: 'مقایسه اسپرد', sub: 'لحظه‌ای', url: 'https://iranbroker.net/spread-comparison/', icon: 'barChart', c: '#1fc16b' },
    { label: 'تقویم اقتصادی', sub: 'رویدادها', url: 'https://iranbroker.net/economic-calendar/', icon: 'calendar', c: '#f6a723' },
    { label: 'قیمت ارز دیجیتال', sub: 'زنده', url: 'https://iranbroker.net/cryptocurrency-prices/', icon: 'coin', c: '#a78bfa' },
    { label: 'صرافی‌ها', sub: 'کریپتو', url: 'https://iranbroker.net/crypto-exchanges/', icon: 'swap', c: '#35d0c0' },
    { label: 'پراپ فرم‌ها', sub: 'سرمایه', url: 'https://iranbroker.net/prop-firms/', icon: 'trophy', c: '#f6679f' },
    { label: 'تحلیل بازار', sub: 'روزانه', url: 'https://iranbroker.net/market-analysis/', icon: 'lineChart', c: '#6f9bf3' },
    { label: 'اخبار', sub: 'بازار', url: 'https://iranbroker.net/news/', icon: 'newspaper', c: '#fb3748' },
    { label: 'هشدار کلاهبرداری', sub: 'آگاهی', url: 'https://iranbroker.net/fraud-alert/', icon: 'shieldCheck', c: '#f6a723' },
    { label: 'آموزش فارکس', sub: 'رایگان', url: 'https://iranbroker.net/forex-education/', icon: 'graduation', c: '#a78bfa' }
  ];
  const QUICK = [
    { label: 'صفحه اصلی', url: 'https://iranbroker.net/' },
    { label: 'ورود اعضا', url: 'https://iranbroker.net/login/' },
    { label: 'صندوق‌های طلا', url: 'https://iranbroker.net/gold-funds/' },
    { label: 'بروکرهای بورس', url: 'https://iranbroker.net/stock-brokers/' },
    { label: 'تماس با ما', url: 'https://iranbroker.net/contact-us/' }
  ];
  const TIPS = [
    { tag: 'آگاهی از کلاهبرداری', text: 'هیچ نهاد مالی معتبری «سود تضمینی» بالای ۷۰٪ نمی‌دهد. چنین وعده‌هایی توجیه اقتصادی ندارند و معمولاً چیزی پشتشان پنهان است.' },
    { tag: 'انتخاب بروکر', text: 'قبل از افتتاح حساب، رگوله بروکر را بررسی کنید. رگوله‌های معتبر مثل FCA، ASIC و CySEC سطح حفاظت بالاتری دارند.' },
    { tag: 'مدیریت ریسک', text: 'هیچ‌گاه بیش از ۱ تا ۲ درصد سرمایه‌تان را روی یک معامله ریسک نکنید. حفظ سرمایه مقدم بر کسب سود است.' },
    { tag: 'اسپرد', text: 'اسپرد پایین همیشه یعنی هزینهٔ کمتر نیست؛ حساب‌های ECN اسپرد نزدیک صفر دارند اما کمیسیون جداگانه می‌گیرند.' },
    { tag: 'پراپ فرم', text: 'پراپ‌فرم معتبر هرگز برای «برداشت سود» هزینهٔ اضافه نمی‌خواهد. مراقب درخواست‌های پرداخت مشکوک باشید.' },
    { tag: 'آموزش', text: 'سودآوری مداوم در فارکس یک‌شبه به‌دست نمی‌آید؛ نیاز به سال‌ها تمرین، تجربه و پشتکار دارد.' }
  ];
  const SESSIONS = [
    { name: 'سیدنی', open: 21, close: 6, c: '#35d0c0' },
    { name: 'توکیو', open: 0, close: 9, c: '#a78bfa' },
    { name: 'لندن', open: 7, close: 16, c: '#6f9bf3' },
    { name: 'نیویورک', open: 12, close: 21, c: '#f6a723' }
  ];
  const COIN_META = {
    bitcoin: { sym: 'BTC', name: 'بیت‌کوین' }, ethereum: { sym: 'ETH', name: 'اتریوم' }, tether: { sym: 'USDT', name: 'تتر' },
    solana: { sym: 'SOL', name: 'سولانا' }, ripple: { sym: 'XRP', name: 'ریپل' }, dogecoin: { sym: 'DOGE', name: 'دوج‌کوین' },
    binancecoin: { sym: 'BNB', name: 'بایننس‌کوین' }, cardano: { sym: 'ADA', name: 'کاردانو' }, tron: { sym: 'TRX', name: 'ترون' }
  };
  const SEED = [
    { id: 'bitcoin', price: 96480, chg: 1.84 }, { id: 'ethereum', price: 3342, chg: 2.41 },
    { id: 'tether', price: 1.0, chg: 0.02 }, { id: 'solana', price: 198.3, chg: -1.12 },
    { id: 'ripple', price: 2.27, chg: 3.06 }, { id: 'dogecoin', price: 0.382, chg: -0.74 }
  ];
  const ENGINES = {
    google: { label: 'گوگل', icon: 'google', url: function (q) { return 'https://www.google.com/search?q=' + encodeURIComponent(q); } },
    ib: { label: 'ایران بروکر', icon: 'search', url: function (q) { return 'https://iranbroker.net/?s=' + encodeURIComponent(q); } },
    tv: { label: 'تریدینگ‌ویو', icon: 'lineChart', url: function (q) { return 'https://www.tradingview.com/symbols/' + encodeURIComponent(q.toUpperCase()) + '/'; } }
  };

  /* ----------------------------- State ----------------------------- */
  const PERSIST_KEY = 'ib_newtab_v2';
  const state = {
    theme: 'dark', layout: 'scroll', accent: '#185adb', showGrid: true,
    name: '', engine: 'google', activeEngine: 'google',
    coins: 'bitcoin,ethereum,tether,solana,ripple,dogecoin',
    showCrypto: true, query: '', sugIdx: -1, tipIndex: 0,
    crypto: SEED.slice(), cryptoErr: false, cryptoTime: '', refreshing: false, cryptoLive: false
  };

  function load() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(PERSIST_KEY) || '{}'); } catch (e) {}
    ['theme', 'layout', 'accent', 'showGrid', 'name', 'engine', 'coins', 'showCrypto', 'tipIndex'].forEach(function (k) {
      if (saved[k] !== undefined) state[k] = saved[k];
    });
    state.activeEngine = state.engine;
  }
  function persist() {
    const o = {
      theme: state.theme, layout: state.layout, accent: state.accent, showGrid: state.showGrid,
      name: state.name, engine: state.engine, coins: state.coins,
      showCrypto: state.showCrypto, tipIndex: state.tipIndex
    };
    try { localStorage.setItem(PERSIST_KEY, JSON.stringify(o)); } catch (e) {}
  }

  /* ----------------------------- Color helpers ----------------------------- */
  function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }
  function lighten(hex, amt) {
    const n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const m = function (v) { return Math.round(v + (255 - v) * amt); };
    return 'rgb(' + m(r) + ',' + m(g) + ',' + m(b) + ')';
  }
  function applyAccent() {
    const a = state.accent; if (!a || a[0] !== '#') return;
    document.body.style.setProperty('--primaryStrong', a);
    document.body.style.setProperty('--primary', state.theme === 'light' ? a : lighten(a, 0.32));
    document.body.style.setProperty('--primarySoft', hexA(a, 0.14));
  }

  /* ----------------------------- Forex ring geometry ----------------------------- */
  function polar(cx, cy, r, deg) { const a = (deg - 90) * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }
  function arc(cx, cy, r, sH, eH) {
    let s = sH, e = eH; if (e <= s) e += 24;
    const a0 = (s / 24) * 360, a1 = (e / 24) * 360;
    const p0 = polar(cx, cy, r, a0), p1 = polar(cx, cy, r, a1);
    const large = (a1 - a0) > 180 ? 1 : 0;
    return 'M ' + p0[0].toFixed(2) + ' ' + p0[1].toFixed(2) + ' A ' + r + ' ' + r + ' 0 ' + large + ' 1 ' + p1[0].toFixed(2) + ' ' + p1[1].toFixed(2);
  }
  function isOpen(s, h) { return s.open < s.close ? (h >= s.open && h < s.close) : (h >= s.open || h < s.close); }

  /* ----------------------------- Crypto helpers ----------------------------- */
  function fmtPrice(p) {
    if (p >= 1000) return '$' + p.toLocaleString('en-US', { maximumFractionDigits: 0 });
    if (p >= 1) return '$' + p.toLocaleString('en-US', { maximumFractionDigits: 2 });
    return '$' + p.toLocaleString('en-US', { maximumFractionDigits: 4 });
  }
  function sparkPts(coin) {
    let arr = coin.spark;
    if (!arr || arr.length < 4) {
      let seed = 0; for (const ch of coin.id) seed += ch.charCodeAt(0);
      arr = []; const n = 24; const trend = (coin.chg || 0) / 100;
      for (let i = 0; i < n; i++) arr.push(1 + trend * (i / n) + Math.sin(i * 0.7 + seed) * 0.012 + Math.sin(i * 1.9 + seed) * 0.006);
    } else { arr = arr.slice(-24); }
    const min = Math.min.apply(null, arr), max = Math.max.apply(null, arr), rng = (max - min) || 1;
    const W = 64, H = 22;
    return arr.map(function (v, i) {
      return (W - (i / (arr.length - 1)) * W).toFixed(1) + ',' + (H - ((v - min) / rng) * H).toFixed(1);
    }).join(' ');
  }

  /* ----------------------------- DOM refs ----------------------------- */
  const $ = function (id) { return document.getElementById(id); };
  const els = {};

  /* ----------------------------- Static renders ----------------------------- */
  function renderTools() {
    els.toolsGrid.innerHTML = TOOLS.map(function (t) {
      return '<a href="' + t.url + '">' +
        '<div class="t-ic" style="background:' + hexA(t.c, 0.13) + ';color:' + t.c + '">' + svg(t.icon) + '</div>' +
        '<div class="t-txt"><span class="t-label">' + t.label + '</span><span class="t-sub">' + t.sub + '</span></div>' +
        '</a>';
    }).join('');
  }
  function renderQuick() {
    els.quickLinks.innerHTML = QUICK.map(function (q) {
      return '<a href="' + q.url + '"><span class="ql-dot"></span>' + q.label + '</a>';
    }).join('');
  }
  function renderEngines() {
    els.engines.innerHTML = ['google', 'ib', 'tv'].map(function (k) {
      const active = state.activeEngine === k ? ' active' : '';
      return '<button data-engine="' + k + '" class="' + active.trim() + '">' + svg(ENGINES[k].icon) + ENGINES[k].label + '</button>';
    }).join('');
    bindEngineButtons();
  }
  function bindEngineButtons() {
    Array.prototype.forEach.call(els.engines.querySelectorAll('button'), function (b) {
      b.addEventListener('click', function () { setEngine(b.getAttribute('data-engine')); });
    });
  }
  function renderStaticIcons() {
    els.themeBtn.innerHTML = '<span class="icon">' + svg(state.theme === 'light' ? 'moon' : 'sun') + '</span>';
    els.settingsBtn.innerHTML = '<span class="icon">' + svg('equalizer') + '</span>';
    els.searchIcon.innerHTML = svg('search');
    els.searchGo.innerHTML = svg('arrowLeft');
    els.cryptoRefresh.innerHTML = svg('refresh');
    els.tipBgIc.innerHTML = svg('shieldCheck');
    els.tipNextIc.innerHTML = '<span class="icon">' + svg('arrowLeft') + '</span>';
    els.settingsClose.innerHTML = '<span class="icon">' + svg('close') + '</span>';
  }

  /* ----------------------------- Search ----------------------------- */
  function matches() {
    const q = (state.query || '').trim().toLowerCase();
    if (!q) return [];
    const pool = TOOLS.map(function (t) { return { label: t.label, sub: t.sub, url: t.url, tag: 'ابزار', icon: t.icon }; })
      .concat(QUICK.map(function (l) { return { label: l.label, sub: '', url: l.url, tag: 'لینک', icon: 'link' }; }));
    return pool.filter(function (p) {
      return p.label.toLowerCase().indexOf(q) >= 0 || (p.sub && p.sub.toLowerCase().indexOf(q) >= 0);
    }).slice(0, 5);
  }
  function renderSuggest() {
    const m = matches();
    if (!m.length) { els.suggest.hidden = true; els.suggest.innerHTML = ''; return; }
    els.suggest.hidden = false;
    els.suggest.innerHTML = m.map(function (s, i) {
      const active = i === state.sugIdx ? ' active' : '';
      const sub = s.sub ? '<span class="s-sub"> · ' + s.sub + '</span>' : '';
      return '<li class="' + active.trim() + '" data-url="' + s.url + '">' +
        '<span class="s-ic">' + svg(s.icon) + '</span>' +
        '<span class="s-label">' + s.label + sub + '</span>' +
        '<span class="s-tag">' + s.tag + '</span></li>';
    }).join('');
    Array.prototype.forEach.call(els.suggest.querySelectorAll('li'), function (li) {
      li.addEventListener('mousedown', function (e) { e.preventDefault(); window.location.href = li.getAttribute('data-url'); });
    });
  }
  function setEngine(k) {
    state.activeEngine = k; state.sugIdx = -1;
    els.scopeLabel.textContent = ENGINES[k].label;
    renderEngines();
    renderSuggest();
  }
  function submitSearch() {
    const q = (state.query || '').trim(); if (!q) return;
    window.location.href = ENGINES[state.activeEngine].url(q);
  }
  function onKey(e) {
    const m = matches();
    if (e.key === 'Enter') {
      if (state.sugIdx >= 0 && m[state.sugIdx]) window.location.href = m[state.sugIdx].url;
      else submitSearch();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault(); state.sugIdx = Math.min(state.sugIdx + 1, m.length - 1); renderSuggest();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault(); state.sugIdx = Math.max(state.sugIdx - 1, -1); renderSuggest();
    } else if (e.key === 'Tab') {
      e.preventDefault(); const o = ['google', 'ib', 'tv']; setEngine(o[(o.indexOf(state.activeEngine) + 1) % 3]);
    } else if (e.key === 'Escape') {
      state.query = ''; els.searchInput.value = ''; state.sugIdx = -1; renderSuggest();
    }
  }

  /* ----------------------------- Crypto ----------------------------- */
  function renderCrypto() {
    const list = (state.crypto || SEED);
    els.cryptoList.innerHTML = list.map(function (c, i) {
      const meta = COIN_META[c.id] || { sym: c.id.toUpperCase(), name: c.id };
      const up = (c.chg || 0) >= 0;
      const chgColor = up ? 'var(--green)' : 'var(--red)';
      const chgBg = up ? 'var(--greenSoft)' : 'var(--redSoft)';
      const chgStr = (up ? '▲ ' : '▼ ') + Math.abs(c.chg || 0).toFixed(2) + '٪';
      return '<div class="c-row">' +
        '<span class="c-rank">' + (i + 1) + '</span>' +
        '<div class="c-id"><span class="c-sym">' + meta.sym + '</span><span class="c-name">' + meta.name + '</span></div>' +
        '<svg class="c-spark" viewBox="0 0 64 22" width="56" height="20" preserveAspectRatio="none">' +
          '<polyline points="' + sparkPts(c) + '" fill="none" stroke="' + (up ? 'var(--green)' : 'var(--red)') + '" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></polyline></svg>' +
        '<div class="c-price-col">' +
          '<span class="c-price">' + fmtPrice(c.price) + '</span>' +
          '<span class="c-chg" style="color:' + chgColor + ';background:' + chgBg + '">' + chgStr + '</span>' +
        '</div></div>';
    }).join('');
    let foot = '';
    if (state.cryptoErr) foot = '<span class="err">دریافت زنده ممکن نشد — نمایش آخرین داده</span>';
    else if (state.cryptoTime) foot = '<span>به‌روزرسانی ' + state.cryptoTime + ' · داده از CoinGecko</span>';
    els.cryptoFoot.innerHTML = foot;
  }
  function loadCrypto() {
    const ids = state.coins.split(',').map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 6);
    if (!ids.length) return;
    state.refreshing = true; els.cryptoRefresh.classList.add('spinning');
    const url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=' + ids.join(',') + '&order=market_cap_desc&sparkline=true&price_change_percentage=24h';
    fetch(url).then(function (res) {
      if (!res.ok) throw new Error('http');
      return res.json();
    }).then(function (data) {
      if (!Array.isArray(data) || !data.length) throw new Error('empty');
      const byId = {};
      data.forEach(function (c) { byId[c.id] = c; });
      const rows = ids.map(function (id) { return byId[id]; }).filter(Boolean).map(function (c) {
        return {
          id: c.id, price: c.current_price, chg: c.price_change_percentage_24h == null ? 0 : c.price_change_percentage_24h,
          spark: (c.sparkline_in_7d && c.sparkline_in_7d.price) ? c.sparkline_in_7d.price : null
        };
      });
      state.crypto = rows; state.cryptoErr = false; state.cryptoLive = true; state.refreshing = false;
      state.cryptoTime = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
      els.cryptoRefresh.classList.remove('spinning');
      renderCrypto();
    }).catch(function () {
      // keep last data; flag the fallback only while we've never loaded live prices
      state.cryptoErr = !state.cryptoLive;
      state.refreshing = false; els.cryptoRefresh.classList.remove('spinning');
      renderCrypto();
    });
  }

  /* ----------------------------- Tip ----------------------------- */
  function renderTip() {
    const t = TIPS[state.tipIndex % TIPS.length];
    els.tipTag.textContent = t.tag;
    els.tipText.textContent = t.text;
  }

  /* ----------------------------- Time-dependent render ----------------------------- */
  function renderTime() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    els.clock.textContent = hh + ':' + mm;

    let dateStr;
    try { dateStr = new Intl.DateTimeFormat('fa-IR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now); }
    catch (e) { dateStr = now.toLocaleDateString('fa-IR'); }
    els.heroDate.textContent = dateStr;

    const h = now.getHours();
    const g = h >= 5 && h < 12 ? 'صبح‌تان بخیر' : h >= 12 && h < 17 ? 'ظهر بخیر' : h >= 17 && h < 21 ? 'عصرتان بخیر' : 'شب‌تان بخیر';
    els.heroGreeting.textContent = g + (state.name ? '، ' + state.name : ' معامله‌گر');

    // sessions
    const uh = now.getUTCHours();
    const open = SESSIONS.map(function (s) { return isOpen(s, uh); });
    const openSessions = SESSIONS.filter(function (s, i) { return open[i]; });
    const openCount = openSessions.length;
    const activeSession = openSessions.length ? openSessions.map(function (s) { return s.name; }).join('، ') : 'بازارها بسته';

    els.marketCount.textContent = openCount + ' بازار فعال';
    els.ringCount.textContent = openCount;
    els.heroActive.textContent = activeSession;
    els.heroUtc.textContent = String(uh).padStart(2, '0') + ':' + String(now.getUTCMinutes()).padStart(2, '0');

    // ring arcs
    els.ringArcs.innerHTML = SESSIONS.map(function (s, i) {
      const rr = 74 - i * 9;
      return '<path d="' + arc(100, 100, rr, s.open, s.close) + '" fill="none" stroke="' + s.c + '" stroke-width="7" stroke-linecap="round" opacity="' + (open[i] ? 1 : 0.28) + '"></path>';
    }).join('');

    // hand
    const utcF = uh + now.getUTCMinutes() / 60;
    const hand = polar(100, 100, 80, (utcF / 24) * 360);
    els.ringHand.setAttribute('x2', hand[0].toFixed(2));
    els.ringHand.setAttribute('y2', hand[1].toFixed(2));
    els.ringTip.setAttribute('cx', hand[0].toFixed(2));
    els.ringTip.setAttribute('cy', hand[1].toFixed(2));

    // session list
    els.sessionList.innerHTML = SESSIONS.map(function (s, i) {
      const op = open[i];
      return '<div class="s-row">' +
        '<span class="s-dot" style="background:' + s.c + ';opacity:' + (op ? 1 : 0.28) + '"></span>' +
        '<span class="s-name">' + s.name + '</span>' +
        '<span class="s-time">' + String(s.open).padStart(2, '0') + '–' + String(s.close).padStart(2, '0') + ' UTC</span>' +
        '<span class="s-status" style="color:' + (op ? 'var(--green)' : 'var(--soft)') + '">' + (op ? 'باز' : 'بسته') + '</span>' +
        '</div>';
    }).join('');
  }

  /* ----------------------------- Theme / layout / grid ----------------------------- */
  function applyTheme() {
    document.body.setAttribute('data-theme', state.theme);
    if (els.themeBtn) els.themeBtn.innerHTML = '<span class="icon">' + svg(state.theme === 'light' ? 'moon' : 'sun') + '</span>';
    applyAccent();
  }
  function applyLayout() { document.body.setAttribute('data-layout', state.layout === 'fit' ? 'fit' : 'scroll'); }
  function applyGrid() { els.bgGrid.hidden = !state.showGrid; }
  function applyShowCrypto() { els.cryptoCard.style.display = state.showCrypto ? '' : 'none'; }

  function toggleTheme() { state.theme = state.theme === 'light' ? 'dark' : 'light'; applyTheme(); persist(); }

  /* ----------------------------- Settings modal ----------------------------- */
  function openSettings() {
    els.setName.value = state.name;
    els.setEngine.value = state.engine;
    els.setCoins.value = state.coins;
    els.setCrypto.checked = state.showCrypto;
    els.setGrid.checked = state.showGrid;
    syncSeg(els.setLayout, 'layout', state.layout);
    syncSwatches();
    els.settingsModal.hidden = false;
  }
  function closeSettings() { els.settingsModal.hidden = true; persist(); }
  function syncSeg(container, attr, val) {
    Array.prototype.forEach.call(container.querySelectorAll('button'), function (b) {
      b.classList.toggle('active', b.getAttribute('data-' + attr) === val);
    });
  }
  function syncSwatches() {
    Array.prototype.forEach.call(els.setAccent.querySelectorAll('button'), function (b) {
      b.classList.toggle('active', b.getAttribute('data-accent').toLowerCase() === state.accent.toLowerCase());
    });
  }

  /* ----------------------------- Shader background ----------------------------- */
  function initShaderBg() {
    var canvas = document.getElementById('shader-bg-canvas');
    if (!canvas) return;
    var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) { canvas.style.display = 'none'; return; }

    var vertSrc = 'attribute vec2 a_pos;void main(){gl_Position=vec4(a_pos,0.,1.);}';
    var fragSrc = [
      'precision highp float;',
      'uniform vec2 resolution;',
      'uniform float time;',
      'void main(void){',
      '  vec2 uv=(gl_FragCoord.xy*2.-resolution.xy)/min(resolution.x,resolution.y);',
      '  float t=time*0.05;',
      '  float lw=0.002;',
      '  vec3 color=vec3(0.);',
      '  for(int j=0;j<3;j++){',
      '    for(int i=0;i<5;i++){',
      '      color[j]+=lw*float(i*i)/abs(fract(t-0.01*float(j)+float(i)*0.01)*5.-length(uv)+mod(uv.x+uv.y,0.2));',
      '    }',
      '  }',
      '  gl_FragColor=vec4(color[0],color[1],color[2],1.);',
      '}'
    ].join('');

    function mkShader(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }
    var prog = gl.createProgram();
    gl.attachShader(prog, mkShader(gl.VERTEX_SHADER, vertSrc));
    gl.attachShader(prog, mkShader(gl.FRAGMENT_SHADER, fragSrc));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,-1, 1,1, -1,1]), gl.STATIC_DRAW);
    var posLoc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    var timeLoc = gl.getUniformLocation(prog, 'time');
    var resLoc = gl.getUniformLocation(prog, 'resolution');
    var t = 0, rafId;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    function draw() {
      t += 0.05;
      gl.uniform1f(timeLoc, t);
      gl.uniform2f(resLoc, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      rafId = requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) cancelAnimationFrame(rafId);
      else { rafId = requestAnimationFrame(draw); }
    });
  }

  /* ----------------------------- Sparkles ----------------------------- */
  function initSparkles() {
    const canvas = document.getElementById('sp-canvas');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, particles = [], rafId;

    function resize() {
      W = canvas.parentElement.offsetWidth;
      H = canvas.parentElement.offsetHeight;
      canvas.width = W;
      canvas.height = H;
      particles = [];
      const count = Math.min(Math.floor(W / 3.5), 300);
      for (let i = 0; i < count; i++) particles.push(newParticle(true));
    }

    function newParticle(randomY) {
      return {
        x: Math.random() * W,
        y: randomY ? Math.random() * H : H + 2,
        r: Math.random() * 1.0 + 0.4,
        phase: Math.random() * Math.PI * 2,
        freq: 0.012 + Math.random() * 0.022,
        maxOp: 0.25 + Math.random() * 0.75,
        vx: (Math.random() - 0.5) * 0.28,
        vy: -(0.05 + Math.random() * 0.18)
      };
    }

    function tick() {
      ctx.clearRect(0, 0, W, H);
      var isLight = document.body.getAttribute('data-theme') === 'light';
      var rc = isLight ? 24 : 255, gc = isLight ? 90 : 255, bc = isLight ? 219 : 255;
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.phase += p.freq;
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -4 || p.x < -6 || p.x > W + 6) { particles[i] = newParticle(false); continue; }
        var op = p.maxOp * ((Math.sin(p.phase) + 1) / 2);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + rc + ',' + gc + ',' + bc + ',' + op.toFixed(2) + ')';
        ctx.fill();
      }
      rafId = requestAnimationFrame(tick);
    }

    resize();
    tick();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { cancelAnimationFrame(rafId); }
      else { rafId = requestAnimationFrame(tick); }
    });
  }

  /* ----------------------------- Wire up ----------------------------- */
  function cacheEls() {
    [
      'bg-grid', 'theme-btn', 'settings-btn', 'market-count',
      'hero-date', 'clock', 'hero-greeting', 'hero-active', 'hero-utc',
      'search-box', 'search-icon', 'search-input', 'scope-label', 'search-go', 'suggest', 'engines',
      'tools-grid', 'crypto-card', 'crypto-list', 'crypto-foot', 'crypto-refresh',
      'ring-svg', 'ring-arcs', 'ring-hand', 'ring-tip', 'ring-count', 'session-list',
      'tip-bg-ic', 'tip-tag', 'tip-text', 'tip-next', 'tip-next-ic',
      'quick-links', 'settings-modal', 'settings-panel', 'settings-close', 'settings-save',
      'set-name', 'set-engine', 'set-layout', 'set-accent', 'set-grid', 'set-crypto', 'set-coins'
    ].forEach(function (id) {
      const camel = id.replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); });
      els[camel] = $(id);
    });
  }

  function init() {
    cacheEls();
    load();

    applyTheme();
    applyLayout();
    applyGrid();

    renderStaticIcons();
    renderTools();
    renderQuick();
    renderEngines();
    els.scopeLabel.textContent = ENGINES[state.activeEngine].label;
    renderTip();
    renderCrypto();
    applyShowCrypto();
    renderTime();

    // top bar
    els.themeBtn.addEventListener('click', toggleTheme);
    els.settingsBtn.addEventListener('click', openSettings);

    // search
    els.searchInput.addEventListener('input', function (e) { state.query = e.target.value; state.sugIdx = -1; renderSuggest(); });
    els.searchInput.addEventListener('keydown', onKey);
    els.searchInput.addEventListener('blur', function () { setTimeout(function () { els.suggest.hidden = true; }, 120); });
    els.searchGo.addEventListener('click', submitSearch);

    // crypto
    els.cryptoRefresh.addEventListener('click', function () { loadCrypto(); });

    // tip
    els.tipNext.addEventListener('click', function () { state.tipIndex = (state.tipIndex + 1) % TIPS.length; renderTip(); persist(); });

    // settings modal
    els.settingsClose.addEventListener('click', closeSettings);
    els.settingsSave.addEventListener('click', closeSettings);
    els.settingsModal.addEventListener('click', closeSettings);
    els.settingsPanel.addEventListener('click', function (e) { e.stopPropagation(); });
    els.setName.addEventListener('input', function (e) { state.name = e.target.value; renderTime(); persist(); });
    els.setEngine.addEventListener('change', function (e) { state.engine = e.target.value; setEngine(e.target.value); persist(); });
    els.setCoins.addEventListener('input', function (e) { state.coins = e.target.value; persist(); });
    els.setGrid.addEventListener('change', function (e) { state.showGrid = e.target.checked; applyGrid(); persist(); });
    els.setCrypto.addEventListener('change', function (e) {
      state.showCrypto = e.target.checked; applyShowCrypto(); persist();
      if (state.showCrypto) loadCrypto();
    });
    Array.prototype.forEach.call(els.setLayout.querySelectorAll('button'), function (b) {
      b.addEventListener('click', function () { state.layout = b.getAttribute('data-layout'); applyLayout(); syncSeg(els.setLayout, 'layout', state.layout); persist(); });
    });
    Array.prototype.forEach.call(els.setAccent.querySelectorAll('button'), function (b) {
      b.addEventListener('click', function () { state.accent = b.getAttribute('data-accent'); applyAccent(); syncSwatches(); persist(); });
    });

    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !els.settingsModal.hidden) closeSettings(); });

    // timers
    setInterval(renderTime, 1000 * 20);
    if (state.showCrypto) setTimeout(loadCrypto, 400);
    setInterval(function () { if (state.showCrypto) loadCrypto(); }, 90000);

    // focus search for quick typing
    els.searchInput.focus();

    initSparkles();
    initShaderBg();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
