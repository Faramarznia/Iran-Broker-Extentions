/* ===================================================================
   ایران بروکر — تور خوش‌آمد (js/tour.js)  v1.0
   راهنمای تعاملیِ اولین‌بازدید: معرفی امکانات + انتخاب زندهٔ حالت نمایش.
   Vanilla JS · localStorage فقط · بدون کتابخانه · MV3 · RTL
   فقط بار اول اجرا می‌شود؛ از تنظیمات هم قابل اجرای دوباره است.
   =================================================================== */
(function () {
  'use strict';

  var DONE_KEY = 'ib_tour_v1_done';
  var MAIN_KEY = 'ib_newtab_v2';   // مالکیت با newtab.js — فقط layout را به‌روز می‌کنیم

  /* ───────────────── کمک‌تابع‌ها ───────────────── */
  function faNum(n) {
    return String(n).replace(/[0-9]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'[d]; });
  }
  function q(sel) { return document.querySelector(sel); }
  function reduceMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  function isVisible(el) {
    if (!el) return false;
    if (el.offsetParent === null && getComputedStyle(el).position !== 'fixed') return false;
    var r = el.getBoundingClientRect();
    return r.width > 4 && r.height > 4;
  }
  function setLayout(v) {
    // دکمهٔ واقعی تنظیمات را کلیک کن تا state داخلی newtab.js هم‌گام بماند
    // (مستقیم نوشتن localStorage باعث می‌شد persist بعدی، layout را برگرداند)
    var realBtn = document.querySelector('#set-layout button[data-layout="' + v + '"]');
    if (realBtn) { realBtn.click(); return; }
    // فال‌بک
    document.body.setAttribute('data-layout', v);
    try {
      var o = JSON.parse(localStorage.getItem(MAIN_KEY) || '{}');
      o.layout = v;
      localStorage.setItem(MAIN_KEY, JSON.stringify(o));
    } catch (e) {}
  }

  /* آیکن‌های کوچک درون متن تور */
  var IC = {
    search: '<svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="M21 21l-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="2"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="2"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="2"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="2"/></svg>',
    focus: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="2.6" fill="currentColor"/></svg>',
    journal: '<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="9" width="3.4" height="8" rx=".7" fill="currentColor" opacity=".7"/><rect x="10.3" y="5" width="3.4" height="12" rx=".7" fill="currentColor"/><rect x="16.6" y="11" width="3.4" height="6" rx=".7" fill="currentColor" opacity=".7"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 5h16v11H9l-4 4V5z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    palette: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.8-1 1.3-2-.5-1 .1-2 1.2-2H17a4 4 0 0 0 4-4c0-5-4-8-9-8z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="7.5" cy="11" r="1.2" fill="currentColor"/><circle cx="12" cy="8" r="1.2" fill="currentColor"/><circle cx="16" cy="11" r="1.2" fill="currentColor"/></svg>',
    layout: '<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="2"/><path d="M3 9h18M9 9v11" stroke="currentColor" stroke-width="2"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" fill="currentColor"/></svg>'
  };

  /* ───────────────── محتوای تور ───────────────── */
  // anchor: سلکتور عنصر مرجع، یا null برای کارت وسط صفحه
  var STEPS = [
    {
      id: 'welcome', anchor: null, hero: true,
      eyebrow: 'به ایران بروکر خوش اومدی',
      title: 'تب جدیدت، حالا یه میز کار معامله‌گریه 👋',
      body: 'این صفحه فقط یه نقطهٔ شروع نیست؛ سرچ، ابزارهای بازار، تایمر تمرکز، ژورنال معامله و گفتگوهای جامعه — همه یک‌جا. ' +
            'یه دور یک‌دقیقه‌ای بزنیم تا همه‌چیز رو نشونت بدم؟',
      primary: 'بزن بریم', secondary: 'بعداً'
    },
    {
      id: 'search', anchor: '#search-box', place: 'bottom', icon: IC.search, pad: 10,
      title: 'از همین‌جا همه‌چی رو پیدا کن',
      body: 'یه کادر، سه مقصد: <b>گوگل</b> برای وب، <b>ایران بروکر</b> برای مقاله و ابزارها، و <b>تریدینگ‌ویو</b> برای نماد. ' +
            'با کلید <span class="ibt-kbd">Tab</span> بین موتورها سوییچ کن — اسم ابزارها رو هم همین‌جا تایپ کنی، مستقیم پیشنهاد می‌شن.'
    },
    {
      id: 'tools', anchor: '.sec-tools', place: 'top', icon: IC.grid, pad: 12,
      title: 'ابزارهای ایران بروکر، یک‌کلیک دور',
      body: 'لیست بروکرها، مقایسهٔ اسپرد لحظه‌ای، تقویم اقتصادی، پراپ‌فرم‌ها، هشدار کلاهبرداری و آموزش رایگان — ' +
            'میان‌برهای پرکاربردِ بازار، بدون این‌که دنبالشون بگردی.'
    },
    {
      id: 'focus', anchor: '#focus-btn', place: 'bottom', icon: IC.focus, pad: 8,
      title: 'وقتشه تمرکز کنی',
      body: 'حالت تمرکز رو روشن کن: <b>پومودورو</b>، <b>زمان دلخواه</b> یا یه <b>سشن معاملاتی</b> هم‌سو با بازار. ' +
            'صدای محیط (باران، دریا، جنگل)، تنفس هدایت‌شده در استراحت و رکورد روزهای پیاپی هم داری.'
    },
    {
      id: 'journal', anchor: '#jr-fab', place: 'top', icon: IC.journal, pad: 10,
      title: 'ژورنال معاملاتی همیشه دمِ دست',
      body: 'این دکمه گوشهٔ پایین، دفتر معامله‌هاته: ثبت ترید با حس‌وحال و تایم‌فریم، ساخت <b>پلی‌بوک</b> ستاپ‌ها، ' +
            'و تحلیل کارنامه با نمودار و خروجی CSV/JSON. همه‌چیز روی همین مرورگر می‌مونه.'
    },
    {
      id: 'community', anchor: '#sb-community', place: 'auto', icon: IC.chat, pad: 8,
      title: 'تنها معامله نکن',
      body: 'پنل جامعه، داغ‌ترین و آخرین تاپیک‌های فروم ایران بروکر رو زنده می‌آره. ' +
            'هر وقت خواستی جمعش کن تا حواست پرت نشه — با همون دستگیره برمی‌گرده.'
    },
    {
      id: 'theme', anchor: '#theme-btn', place: 'bottom', icon: IC.palette, pad: 8,
      title: 'فضا رو مالِ خودت کن',
      body: 'بین تم <b>تاریک</b>، <b>روشن</b>، <b>خودکار</b> و <b>شیشه‌ای</b> بچرخ. ' +
            'توی تنظیمات هم رنگ تأکید، گرید پس‌زمینه و حتی پس‌زمینهٔ دلخواه (گالری یا عکس خودت) رو عوض کن.'
    },
    {
      id: 'layout', anchor: null, hero: true, layoutPicker: true, icon: IC.layout,
      eyebrow: 'و مهم‌ترین قسمت',
      title: 'سه حالت نمایش — همین حالا امتحان کن',
      body: 'این صفحه با سبکِ کارِ تو شکل عوض می‌کنه. یکی رو بزن تا <b>زنده</b> روی صفحه ببینی؛ هر زمان از تنظیمات قابل تغییره.',
      primary: 'عالیه، ادامه'
    },
    {
      id: 'done', anchor: null, hero: true, icon: IC.spark,
      eyebrow: 'آماده‌ای',
      title: 'تمومه — حالا نوبت توئه 🚀',
      body: 'هر وقت خواستی این راهنما رو دوباره ببینی، از <b>تنظیمات ← نمایش ← نمایش دوبارهٔ راهنما</b> اجراش کن. ' +
            'موفق باشی توی بازار.',
      primary: 'شروع کن'
    }
  ];

  /* حالت‌های نمایش برای استپ تعاملی */
  var LAYOUTS = [
    { v: 'simple', name: 'ساده', tag: 'تمیز و بی‌حاشیه',
      desc: 'ساعت، خوش‌آمد، سرچ و ابزارها. تمرکز روی شروعِ سریع.',
      mini: '<i style="width:62%"></i><i style="width:42%"></i><i class="ibt-mini-row"></i>' },
    { v: 'data', name: 'دیتا محور', tag: 'بازار، یک‌نگاه',
      desc: 'همهٔ حالت ساده، به‌علاوهٔ قیمت لحظه‌ای کریپتو، ساعات بازار جهانی و اخبار.',
      mini: '<i style="width:70%"></i><span class="ibt-mini-grid"><u></u><u></u><u></u></span>' },
    { v: 'hub', name: 'هاب', tag: 'مرکز فرماندهیِ روز',
      desc: 'تقویم شمسی/میلادی با رویدادهای اقتصادی، آب‌وهوا، تسک‌های روزانه و میان‌برهای دلخواه.',
      mini: '<span class="ibt-mini-cols"><b></b><b></b><b></b></span>' }
  ];

  /* ───────────────── موتور تور ───────────────── */
  var root, backdrop, spot, pop, idx = 0, active = false, keyHandler, reHandler;

  function buildShell() {
    root = document.createElement('div');
    root.className = 'ibt-root';
    root.setAttribute('dir', 'rtl');
    root.innerHTML =
      '<div class="ibt-backdrop"></div>' +
      '<div class="ibt-spot" hidden></div>' +
      '<div class="ibt-pop" role="dialog" aria-modal="true" aria-label="راهنمای ایران بروکر"></div>';
    document.body.appendChild(root);
    backdrop = root.querySelector('.ibt-backdrop');
    spot = root.querySelector('.ibt-spot');
    pop = root.querySelector('.ibt-pop');
    if (reduceMotion()) root.classList.add('ibt-no-motion');
    // کلیک روی پس‌زمینه: استپ‌های وسط را رد نکن، فقط بی‌اثر
    backdrop.addEventListener('click', function () {});
  }

  function teardown() {
    active = false;
    document.removeEventListener('keydown', keyHandler, true);
    window.removeEventListener('resize', reHandler);
    window.removeEventListener('scroll', reHandler, true);
    if (root && root.parentNode) root.parentNode.removeChild(root);
    root = null;
  }

  function finish(markDone) {
    if (markDone) { try { localStorage.setItem(DONE_KEY, '1'); } catch (e) {} }
    if (!root) return;
    root.classList.add('ibt-closing');
    var done = function () { teardown(); };
    if (reduceMotion()) done();
    else setTimeout(done, 240);
  }

  function go(n) {
    if (n < 0) n = 0;
    if (n >= STEPS.length) { finish(true); return; }
    idx = n;
    render();
  }

  function render() {
    var step = STEPS[idx];
    var anchorEl = step.anchor ? q(step.anchor) : null;
    // اگر عنصر مرجع در چیدمان فعلی مخفی باشد (مثلاً ابزارها/جامعه در حالت «ساده»)،
    // به‌جای اسپات‌لایت، کارت را وسط صفحه نشان می‌دهیم تا توضیح از دست نرود.
    if (anchorEl && !isVisible(anchorEl)) anchorEl = null;
    var isHero = step.hero || !anchorEl;

    root.classList.toggle('ibt-hero-mode', isHero);

    /* اسپات‌لایت */
    if (isHero) {
      spot.hidden = true;
    } else {
      // اگر عنصر مرجع ثابت نیست، بیارش توی دید
      if (anchorEl.scrollIntoView && getComputedStyle(anchorEl).position !== 'fixed') {
        anchorEl.scrollIntoView({ block: 'center', inline: 'nearest', behavior: reduceMotion() ? 'auto' : 'smooth' });
      }
      spot.hidden = false;
      placeSpot(anchorEl, step.pad || 8);
    }

    /* محتوای کارت */
    var counter = '';
    if (!step.hero) {
      // شماره فقط روی استپ‌های لنگردار
      var contentSteps = STEPS.filter(function (s) { return !s.hero; }).length;
      var pos = STEPS.slice(0, idx + 1).filter(function (s) { return !s.hero; }).length;
      counter = '<span class="ibt-count">' + faNum(pos) + ' از ' + faNum(contentSteps) + '</span>';
    }

    var icon = step.icon ? '<span class="ibt-pop-ic">' + step.icon + '</span>' : '';
    var eyebrow = step.eyebrow ? '<div class="ibt-eyebrow">' + step.eyebrow + '</div>' : '';
    var picker = step.layoutPicker ? layoutPickerHTML() : '';

    var primaryLbl = step.primary || 'بعدی';
    var isLast = idx === STEPS.length - 1;

    var nav =
      '<div class="ibt-nav">' +
        '<div class="ibt-nav-side">' +
          (idx > 0 && !isLast ? '<button class="ibt-btn-ghost" data-act="prev">قبلی</button>' : '') +
        '</div>' +
        '<div class="ibt-dots">' + dotsHTML() + '</div>' +
        '<div class="ibt-nav-side ibt-nav-main">' +
          '<button class="ibt-btn-primary" data-act="next">' + primaryLbl + '</button>' +
        '</div>' +
      '</div>';

    var skip = (!isLast)
      ? '<button class="ibt-skip" data-act="skip" aria-label="رد کردن راهنما">رد کردن</button>'
      : '';

    pop.className = 'ibt-pop' + (isHero ? ' ibt-pop-hero' : '');
    pop.innerHTML =
      skip +
      '<div class="ibt-pop-head">' + icon +
        '<div class="ibt-pop-heads">' + eyebrow +
          '<h2 class="ibt-title">' + step.title + '</h2>' +
        '</div>' +
        counter +
      '</div>' +
      '<p class="ibt-body">' + step.body + '</p>' +
      picker +
      nav;

    if (step.layoutPicker) wireLayoutPicker();

    Array.prototype.forEach.call(pop.querySelectorAll('[data-act]'), function (b) {
      b.addEventListener('click', function () {
        var act = b.getAttribute('data-act');
        if (act === 'next') go(idx + 1);
        else if (act === 'prev') go(idx - 1);
        else if (act === 'skip') finish(true);
      });
    });

    placePop(anchorEl, step);

    // فوکوس روی دکمهٔ اصلی برای دسترس‌پذیری
    var pf = pop.querySelector('.ibt-btn-primary');
    if (pf) try { pf.focus({ preventScroll: true }); } catch (e) { pf.focus(); }
  }

  function dotsHTML() {
    return STEPS.map(function (s, i) {
      return '<span class="ibt-dot' + (i === idx ? ' on' : '') + (i < idx ? ' past' : '') + '"></span>';
    }).join('');
  }

  function layoutPickerHTML() {
    var cur = document.body.getAttribute('data-layout') || 'simple';
    return '<div class="ibt-layouts">' + LAYOUTS.map(function (l) {
      return '<button class="ibt-lay' + (l.v === cur ? ' on' : '') + '" data-layout="' + l.v + '">' +
        '<span class="ibt-lay-mini">' + l.mini + '</span>' +
        '<span class="ibt-lay-head">' +
          '<span class="ibt-lay-name">' + l.name + '</span>' +
          '<span class="ibt-lay-tag">' + l.tag + '</span>' +
        '</span>' +
        '<span class="ibt-lay-desc">' + l.desc + '</span>' +
      '</button>';
    }).join('') + '</div>';
  }

  function wireLayoutPicker() {
    Array.prototype.forEach.call(pop.querySelectorAll('.ibt-lay'), function (b) {
      b.addEventListener('click', function () {
        var v = b.getAttribute('data-layout');
        setLayout(v);
        Array.prototype.forEach.call(pop.querySelectorAll('.ibt-lay'), function (x) {
          x.classList.toggle('on', x === b);
        });
      });
    });
  }

  /* جای‌گذاری اسپات‌لایت دور عنصر */
  function placeSpot(el, pad) {
    var r = el.getBoundingClientRect();
    var x = Math.max(4, r.left - pad);
    var y = Math.max(4, r.top - pad);
    var w = Math.min(window.innerWidth - 8, r.width + pad * 2);
    var h = Math.min(window.innerHeight - 8, r.height + pad * 2);
    spot.style.left = x + 'px';
    spot.style.top = y + 'px';
    spot.style.width = w + 'px';
    spot.style.height = h + 'px';
  }

  /* جای‌گذاری کارت نسبت به عنصر، با کلمپ به ویوپورت */
  function placePop(el, step) {
    if (!el || step.hero) {
      // وسطِ صفحه
      pop.style.left = '50%';
      pop.style.top = '50%';
      pop.style.transform = 'translate(-50%, -50%)';
      return;
    }
    pop.style.transform = 'none';
    var GAP = 14, M = 12;
    var pr = pop.getBoundingClientRect();
    var pw = pr.width, ph = pr.height;
    var r = el.getBoundingClientRect();
    var vw = window.innerWidth, vh = window.innerHeight;

    var place = step.place || 'auto';
    var order;
    if (place === 'auto') {
      var space = { bottom: vh - r.bottom, top: r.top, left: r.left, right: vw - r.right };
      order = ['bottom', 'top', 'right', 'left'].sort(function (a, b) { return space[b] - space[a]; });
    } else {
      order = [place, 'bottom', 'top', 'right', 'left'];
    }

    var fit = function (p) {
      if (p === 'bottom') return (r.bottom + GAP + ph) <= (vh - M);
      if (p === 'top') return (r.top - GAP - ph) >= M;
      if (p === 'right') return (r.right + GAP + pw) <= (vw - M);
      if (p === 'left') return (r.left - GAP - pw) >= M;
      return false;
    };
    var chosen = order.filter(fit)[0] || order[0];

    var left, top;
    if (chosen === 'bottom' || chosen === 'top') {
      left = r.left + r.width / 2 - pw / 2;
      top = chosen === 'bottom' ? r.bottom + GAP : r.top - GAP - ph;
    } else {
      top = r.top + r.height / 2 - ph / 2;
      left = chosen === 'right' ? r.right + GAP : r.left - GAP - pw;
    }
    left = Math.max(M, Math.min(left, vw - pw - M));
    top = Math.max(M, Math.min(top, vh - ph - M));

    pop.style.left = left + 'px';
    pop.style.top = top + 'px';
    pop.setAttribute('data-place', chosen);
  }

  /* ───────────────── شروع / ثبت ───────────────── */
  function start() {
    if (active) return;
    active = true;
    idx = 0;
    buildShell();

    keyHandler = function (e) {
      if (!active) return;
      if (e.key === 'Escape') { e.preventDefault(); finish(true); }
      else if (e.key === 'Enter' || e.key === ' ') {
        if (document.activeElement && document.activeElement.classList &&
            document.activeElement.classList.contains('ibt-lay')) return;
        e.preventDefault(); go(idx + 1);
      }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(idx + 1); } // RTL: چپ = جلو
      else if (e.key === 'ArrowRight') { e.preventDefault(); go(idx - 1); }
    };
    document.addEventListener('keydown', keyHandler, true);

    reHandler = function () {
      if (!active) return;
      var step = STEPS[idx];
      var el = step.anchor ? q(step.anchor) : null;
      if (el && !step.hero && isVisible(el)) { placeSpot(el, step.pad || 8); placePop(el, step); }
    };
    window.addEventListener('resize', reHandler);
    window.addEventListener('scroll', reHandler, true);

    requestAnimationFrame(function () {
      root.classList.add('ibt-in');
      render();
    });
  }

  function injectReplayButton() {
    var panel = document.getElementById('tab-display');
    if (!panel || panel.querySelector('.ibt-replay-sec')) return;
    var sec = document.createElement('div');
    sec.className = 's-section ibt-replay-sec';
    sec.innerHTML =
      '<div class="s-section-label">راهنما</div>' +
      '<button type="button" class="ibt-replay-btn" id="ibt-replay">' +
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M12 8v4l3 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        'نمایش دوبارهٔ راهنما' +
      '</button>' +
      '<div class="s-hint">یک تور سریع از امکانات و حالت‌های نمایش</div>';
    panel.appendChild(sec);
    sec.querySelector('#ibt-replay').addEventListener('click', function () {
      var modal = document.getElementById('settings-modal');
      if (modal) modal.hidden = true;
      setTimeout(start, 180);
    });
  }

  function boot() {
    injectReplayButton();
    var done = false;
    try { done = localStorage.getItem(DONE_KEY) === '1'; } catch (e) {}
    if (done) return;
    // کمی صبر تا ماژول‌های دیگر (FAB ژورنال، پنل جامعه) ساخته شوند
    setTimeout(start, 650);
  }

  // API عمومی برای اجرای دستی
  window.IBTour = { start: start, reset: function () { try { localStorage.removeItem(DONE_KEY); } catch (e) {} } };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
