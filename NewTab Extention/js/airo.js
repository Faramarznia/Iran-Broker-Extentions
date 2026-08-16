/* ===================================================================
   آیرا — هوش مصنوعی ایران بروکر
   Centered chat modal launched from the search box. Streams answers
   from a configurable backend (GapGPT by default, Claude as a drop-in
   alternative) with a living-orb avatar, quick-prompt chips, saved
   conversation history, and branded Iran Broker CTAs inline in answers.
   Exposed as window.AiroChat = { open, close, ask, isOpen }.
   =================================================================== */
(function () {
  'use strict';

  /* ===================================================================
     پیکربندی بک‌اند — همهٔ کاربران اکستنشن از همین تنظیمات استفاده می‌کنند
     =================================================================== */

  // کدام سرویس موتور آیرا باشد؟ 'gapgpt' یا 'claude'
  var ACTIVE = 'gapgpt';

  var PROVIDERS = {
    // GapGPT — https://gapgpt.app (همون کلید، مدل‌های مختلف پشتش زنده‌ست)
    gapgpt: {
      url: 'https://api.gapgpt.app/v1/chat/completions',
      /* ⬇️ کلید API گپ‌جی‌پی‌تی خودت را اینجا جای‌گذاری کن ⬇️ */
      key: 'sk-uBOgXYsi349w5NOKWrV5oxGWtZCCvEDqawrNnEXAORr3Tvws',
      // نکته: کانال «gapgpt-qwen-3.6» فعلاً روی سرور GapGPT هنگ می‌کند (تست شد —
      // درخواست هرگز پاسخ نمی‌دهد). تا وقتی درست شود از gpt-4o استفاده می‌کنیم؛
      // برای برگشتن به کوئن فقط این رشته را به 'gapgpt-qwen-3.6' تغییر بده.
      model: 'gpt-4o',
      maxTokens: 2048
    },
    // Claude (Anthropic) — جایگزین با کیفیت بالاتر و هزینهٔ بیشتر
    claude: {
      url: 'https://api.anthropic.com/v1/messages',
      /* ⬇️ کلید API Anthropic خودت را اینجا جای‌گذاری کن ⬇️ */
      key: 'sk-ant-REPLACE-ME',
      model: 'claude-opus-4-8',
      maxTokens: 16000
    }
  };
  /* =================================================================== */

  /* ===================================================================
     دکمه‌های دعوت‌به‌اقدام (CTA) — دو سطح:

     ۱) CTA کلی دسته‌بندی — وقتی آیرا کلی دربارهٔ یک دسته حرف می‌زند
        (بدون اسم بردن یک مورد خاص). یک دکمهٔ نرم به صفحهٔ لیست آن دسته.

     ۲) CTA اختصاصی موجودیت — وقتی آیرا اسم یک بروکر/صرافی/پراپ‌فرم/
        کارگزاری/صندوق خاص را می‌برد. دو دکمه نشان داده می‌شود:
        «بررسی» (همیشه به صفحهٔ واقعی آن مورد در ایران بروکر می‌رود) و
        «ثبت‌نام» (اگر لینک ریفرال اختصاصی در REFERRAL_LINKS تنظیم شده
        باشد به همان می‌رود، وگرنه امن به همان صفحهٔ بررسی برمی‌گردد —
        هیچ‌وقت لینک شکسته نشان داده نمی‌شود).

     برای افزودن لینک ریفرال یک بروکر خاص، فقط این‌جا اضافه‌اش کن:
       amarkets: 'https://your-real-referral-link'
     همهٔ اسلاگ‌های زیر مستقیماً از iranbroker.net تأیید شده‌اند.
     =================================================================== */
  var CTA_LINKS = {
    forex: { label: 'بروکرهای فارکس در ایران بروکر', url: 'https://iranbroker.net/forex-brokers/' },
    crypto: { label: 'صرافی ارز دیجیتال در ایران بروکر', url: 'https://iranbroker.net/crypto-exchanges/' },
    prop: { label: 'پراپ‌فرم‌ها در ایران بروکر', url: 'https://iranbroker.net/prop-firms/' },
    stock: { label: 'کارگزاری‌های بورس در ایران بروکر', url: 'https://iranbroker.net/bourse/' },
    gold: { label: 'صندوق‌های طلا در ایران بروکر', url: 'https://iranbroker.net/funds/' },
    spread: { label: 'مقایسهٔ بروکرها در ایران بروکر', url: 'https://iranbroker.net/forex-brokers/' }
  };

  var ENTITY_CATS = {
    broker: { path: 'broker' },
    exchange: { path: 'exchange' },
    prop: { path: 'prop' },
    bourse: { path: 'bourse' },
    fund: { path: 'funds' }
  };

  var ENTITY_SLUGS = {
    broker: ['alpari', 'amarkets', 'capitalxtend', 'deltafx', 'eplanet', 'errante', 'fibo', 'forexchief', 'fxpro', 'hycm', 'ifcmarkets', 'liteforex', 'mondfx', 'moneta-markets', 'opofinance', 'orbex', 'otetmarkets', 'startrader', 'stp-trading', 'trendo', 'vittaverse', 'vtmarkets', 'wingo', 'wmmarkets'],
    exchange: ['abantether', 'bit24', 'bitpin', 'coinex', 'kcex', 'kifpoolme', 'lbank', 'nobitex', 'ok-ex', 'ompfinex', 'ramzinex', 'sarmayex', 'tabdil', 'tetherland', 'toobit', 'wallex'],
    prop: ['blue-guardian', 'capitalchain', 'e8-funding', 'fenefx', 'forfx', 'ftmo', 'funded-next', 'fundingpips', 'nextgen-funding', 'paroxfx', 'proopco', 'propplus', 'robinsood', 'sarmayegozarebartar', 'traderscombat', 'zorafx'],
    bourse: ['agah', 'bank-meli-kargozari', 'bourse-bime-iran', 'charisma', 'ebidar', 'farabi', 'hafez', 'mehr-eqtesad', 'mobin-sarmaye', 'mofid', 'nahayat-negar', 'pasargad', 'pishro', 'saderat', 'samanbourse', 'seavolex', 'tadbir-garan-farda', 'tejaratbankbrk'],
    fund: ['amin-shahr', 'arzesh-maskan', 'avand', 'ayar', 'banko', 'chashni', 'danik', 'etemadbmi', 'ganj', 'gohar', 'homayeagah', 'kahroba', 'kakh', 'kashaneh', 'klid', 'lotus', 'malek-atie', 'mesghal', 'moj', 'noghrsa', 'pishran', 'yaghot']
  };

  // لینک ریفرال اختصاصی هر بروکر/صرافی/... — کلید = اسلاگ (از فهرست بالا)
  // تا وقتی خالی است، دکمهٔ «ثبت‌نام» به صفحهٔ بررسی همان مورد می‌رود.
  var REFERRAL_LINKS = {
    // amarkets: 'https://your-real-referral-link-for-amarkets'
  };

  function prettySlug(slug) {
    return slug.split('-').map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join(' ');
  }

  var SYSTEM = [
    'تو «آیرا» هستی — هوش مصنوعی ایران بروکر (iranbroker.net)، مرجع فارسی‌زبان بازارهای مالی.',
    'تخصص تو: فارکس، ارز دیجیتال، بورس، طلا، بروکرها، پراپ‌فرم‌ها، مدیریت ریسک و آموزش ترید.',
    'لحن: صمیمی، روان و دقیق. کاملاً فارسی جواب بده مگر کاربر زبان دیگری بخواهد.',
    'این یک ویجت چت کوچک است؛ پاسخ‌ها را کوتاه و مفید نگه دار (معمولاً زیر ۱۵۰ کلمه) مگر کاربر توضیح مفصل بخواهد.',
    'هرگز سیگنال قطعی خرید/فروش نده؛ همیشه به ریسک و مسئولیت شخصی اشاره کن.',
    'به قیمت لحظه‌ای بازار دسترسی نداری؛ اگر قیمت زنده پرسیدند صادقانه بگو و ابزارهای ایران بروکر (مقایسه اسپرد، قیمت ارز دیجیتال، تقویم اقتصادی) را پیشنهاد بده.',
    'دربارهٔ وعده‌های سود تضمینی و کلاهبرداری هشدار بده و بخش «هشدار کلاهبرداری» ایران بروکر را معرفی کن.',
    'اگر یک بروکر، صرافی، پراپ‌فرم، کارگزاری بورس یا صندوق طلای خاص را نام بردی و دقیقاً در یکی از فهرست‌های زیر بود، بلافاصله بعد از معرفی‌اش این را در یک خط جداگانه بنویس (بدون هیچ توضیح یا کاراکتر اضافه دور آن): [[entity:CATEGORY:SLUG]] — CATEGORY یکی از broker (بروکر فارکس)، exchange (صرافی ارز دیجیتال)، prop (پراپ‌فرم)، bourse (کارگزاری بورس)، fund (صندوق طلا)؛ SLUG دقیقاً از فهرست خودِ همان دسته. اگر چند مورد را با هم مقایسه کردی، برای هر کدام که در فهرست بود یک [[entity:...]] جدا بنویس.',
    'فهرست broker: alpari, amarkets, capitalxtend, deltafx, eplanet, errante, fibo, forexchief, fxpro, hycm, ifcmarkets, liteforex, mondfx, moneta-markets, opofinance, orbex, otetmarkets, startrader, stp-trading, trendo, vittaverse, vtmarkets, wingo, wmmarkets',
    'فهرست exchange: abantether, bit24, bitpin, coinex, kcex, kifpoolme, lbank, nobitex, ok-ex, ompfinex, ramzinex, sarmayex, tabdil, tetherland, toobit, wallex',
    'فهرست prop: blue-guardian, capitalchain, e8-funding, fenefx, forfx, ftmo, funded-next, fundingpips, nextgen-funding, paroxfx, proopco, propplus, robinsood, sarmayegozarebartar, traderscombat, zorafx',
    'فهرست bourse: agah, bank-meli-kargozari, bourse-bime-iran, charisma, ebidar, farabi, hafez, mehr-eqtesad, mobin-sarmaye, mofid, nahayat-negar, pasargad, pishro, saderat, samanbourse, seavolex, tadbir-garan-farda, tejaratbankbrk',
    'فهرست fund: amin-shahr, arzesh-maskan, avand, ayar, banko, chashni, danik, etemadbmi, ganj, gohar, homayeagah, kahroba, kakh, kashaneh, klid, lotus, malek-atie, mesghal, moj, noghrsa, pishran, yaghot',
    'هرگز اسلاگی خارج از این فهرست‌ها نساز — اگر مورد موردنظر در فهرست نبود، به‌جایش از دستور کلی زیر استفاده کن.',
    'اگر دربارهٔ یک دسته به‌طور کلی صحبت کردی (نه یک مورد خاص از فهرست بالا) یا چند گزینه را عمومی مقایسه کردی، در پایان پاسخ دقیقاً یکی از این‌ها را در خط جداگانه بنویس: [[cta:forex]] برای بروکر فارکس، [[cta:crypto]] برای صرافی ارز دیجیتال، [[cta:prop]] برای پراپ‌فرم، [[cta:stock]] برای کارگزاری بورس، [[cta:gold]] برای صندوق طلا. هرگز کلیدی غیر از این‌ها نساز.',
    'این دستورها را فقط وقتی اضافه کن که واقعاً به موضوع پاسخ مرتبط است، نه در هر پیام.',
    'برای خوانایی از **بولد** و لیست‌های کوتاه با - استفاده کن.'
  ].join('\n');

  var CHIPS = [
    'بهترین بروکر برای ایرانی‌ها کدومه؟',
    'اسپرد و کمیسیون یعنی چی؟',
    'پراپ‌فرم چطور کار می‌کنه؟',
    'چطور کلاهبرداری فارکسی رو تشخیص بدم؟'
  ];

  var HIST_KEY = 'ib_airo_conversations';
  var HIST_MAX = 40;
  var NO_HISTORY_KEY = 'ib_airo_no_history'; // user opt-out: this flag itself is not chat content, safe to persist

  /* ----------------------------- State ----------------------------- */
  var els = {};
  var history = [];        // [{role:'user'|'assistant', content:'string', t:'HH:MM'}, ...]
  var currentConvId = null; // null until the active thread is first saved
  var isOpen = false;
  var busy = false;
  var ctrl = null;         // AbortController
  var session = 0;         // bumped on "new chat" / loading history so stale streams can't touch it
  var noHistory = false;   // true = "private mode": current session still has in-chat context, nothing is written to localStorage

  function keyReady() {
    var cfg = PROVIDERS[ACTIVE];
    return !!(cfg && cfg.key && cfg.key.indexOf('REPLACE-ME') === -1);
  }

  /* ----------------------------- Tiny helpers ----------------------------- */
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function ctaPill(url, label, extraClass) {
    return '<a class="airo-cta' + (extraClass ? ' ' + extraClass : '') + '" href="' + url + '" target="_blank" rel="noopener">' +
      '<span class="airo-cta-txt">' + esc(label) + '</span>' +
      '<span class="airo-cta-arrow">↗</span>' +
    '</a>';
  }

  /* light markdown: **bold**, `code`, "- " bullets, newlines,
     [[cta:key]] (category pill) and [[entity:cat:slug]] (review+signup pair) */
  function md(s) {
    var out = esc(s);
    out = out.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
    out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
    out = out.replace(/\[\[entity:(\w+):([a-z0-9-]+)\]\]/g, function (_, cat, slug) {
      var meta = ENTITY_CATS[cat];
      var slugs = ENTITY_SLUGS[cat];
      if (!meta || !slugs || slugs.indexOf(slug) === -1) return '';
      var name = prettySlug(slug);
      var reviewUrl = 'https://iranbroker.net/' + meta.path + '/' + slug + '/';
      var signupUrl = REFERRAL_LINKS[slug] || reviewUrl;
      return '<span class="airo-cta-group">' +
        ctaPill(reviewUrl, 'بررسی ' + name) +
        ctaPill(signupUrl, 'ثبت‌نام در ' + name, 'airo-cta-signup') +
      '</span>';
    });
    out = out.replace(/\[\[cta:(\w+)\]\]/g, function (_, key) {
      var c = CTA_LINKS[key];
      return c ? ctaPill(c.url, c.label) : '';
    });
    out = out.split('\n').map(function (line) {
      var m = line.match(/^\s*[-•]\s+(.*)$/);
      return m ? '<span class="am-li">' + m[1] + '</span>' : line;
    }).join('<br>');
    out = out.replace(/(<br>)+(<span class="am-li">)/g, '$2');
    out = out.replace(/(<br>\s*)+(<a class="airo-cta")/g, '$2');
    out = out.replace(/(<br>\s*)+(<span class="airo-cta-group">)/g, '$2');
    out = out.replace(/(<\/a>)(\s*<br>)+/g, '$1');
    out = out.replace(/(<\/span>)(\s*<br>)+/g, '$1');
    return out;
  }

  function orbHTML(extra) {
    return '<div class="airo-orb ' + (extra || '') + '">' +
      '<span class="ao-halo"></span>' +
      '<span class="ao-ring"></span>' +
      '<span class="ao-core"></span>' +
      '<span class="ao-eyes"><i></i><i></i></span>' +
      '</div>';
  }

  /* ----------------------------- Panel state classes ----------------------------- */
  function setMood(mood) { // 'idle' | 'thinking' | 'talking'
    if (els.panel) els.panel.setAttribute('data-mood', mood);
  }
  function setStatus(txt, cls) {
    if (!els.status) return;
    els.status.innerHTML = '<span class="airo-status-dot ' + (cls || '') + '"></span>' + esc(txt);
  }

  /* ----------------------------- Time helpers ----------------------------- */
  function fmtTime(d) {
    try { return (d || new Date()).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }); }
    catch (e) { return ''; }
  }

  function relDay(ts) {
    var d = new Date(ts);
    var now = new Date();
    if (d.toDateString() === now.toDateString()) return fmtTime(d);
    var y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    if (d.toDateString() === y.toDateString()) return 'دیروز';
    try { return new Intl.DateTimeFormat('fa-IR', { month: 'short', day: 'numeric' }).format(d); }
    catch (e) { return ''; }
  }

  /* ----------------------------- Conversation persistence ----------------------------- */
  function loadConversations() {
    try { return JSON.parse(localStorage.getItem(HIST_KEY) || '[]'); }
    catch (e) { return []; }
  }
  function saveConversations(list) {
    try { localStorage.setItem(HIST_KEY, JSON.stringify(list.slice(0, HIST_MAX))); }
    catch (e) {}
  }

  function loadNoHistoryPref() {
    try { return localStorage.getItem(NO_HISTORY_KEY) === '1'; } catch (e) { return false; }
  }
  function setNoHistory(on) {
    noHistory = on;
    try {
      if (on) localStorage.setItem(NO_HISTORY_KEY, '1');
      else localStorage.removeItem(NO_HISTORY_KEY);
    } catch (e) {}
    updatePrivacyBtn();
  }
  function updatePrivacyBtn() {
    if (!els.privacyBtn) return;
    els.privacyBtn.classList.toggle('active', noHistory);
    els.privacyBtn.setAttribute('aria-pressed', noHistory ? 'true' : 'false');
    els.privacyBtn.title = noHistory
      ? 'حالت خصوصی فعال است؛ این گفتگو و گفتگوهای بعدی ذخیره نمی‌شوند (کلیک برای فعال‌کردن دوبارهٔ ذخیره)'
      : 'گفتگوهای جدید ذخیره می‌شوند؛ برای غیرفعال‌کردن ذخیره کلیک کنید';
  }

  function persistCurrentConversation() {
    if (noHistory) return; // کاربر عمداً ذخیرهٔ گفتگو را غیرفعال کرده — چیزی در localStorage نوشته نمی‌شود
    if (!history.length) return;
    var list = loadConversations();
    if (currentConvId) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === currentConvId) { list.splice(i, 1); break; }
      }
    }
    var firstUser = null;
    for (var j = 0; j < history.length; j++) {
      if (history[j].role === 'user') { firstUser = history[j]; break; }
    }
    var conv = {
      id: currentConvId || ('c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)),
      title: firstUser ? firstUser.content.slice(0, 60) : 'گفتگو',
      messages: history.slice(),
      updatedAt: Date.now()
    };
    currentConvId = conv.id;
    list.unshift(conv);
    saveConversations(list);
    renderHistoryList();
  }

  function deleteConversation(id) {
    saveConversations(loadConversations().filter(function (c) { return c.id !== id; }));
    if (currentConvId === id) currentConvId = null;
    renderHistoryList();
  }

  /* ----------------------------- History sidebar ----------------------------- */
  function toggleHistory() {
    if (!els.hist) return;
    var opening = els.hist.hidden;
    els.hist.hidden = !opening;
    if (els.histBtn) els.histBtn.classList.toggle('active', opening);
    if (opening) renderHistoryList();
  }

  function renderHistoryList() {
    if (!els.histList) return;
    var list = loadConversations();
    if (!list.length) {
      els.histList.innerHTML = '<div class="airo-hist-empty">هنوز گفتگویی ذخیره نشده</div>';
      return;
    }
    els.histList.innerHTML = list.map(function (c) {
      var active = c.id === currentConvId ? ' active' : '';
      return '<div class="airo-hist-item' + active + '" data-id="' + c.id + '">' +
        '<div class="airo-hist-item-main">' +
          '<div class="airo-hist-item-title">' + esc(c.title || 'گفتگو') + '</div>' +
          '<div class="airo-hist-item-time">' + esc(relDay(c.updatedAt)) + '</div>' +
        '</div>' +
        '<button class="airo-hist-del" data-id="' + c.id + '" title="حذف" aria-label="حذف">' +
          '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
        '</button>' +
      '</div>';
    }).join('');
    Array.prototype.forEach.call(els.histList.querySelectorAll('.airo-hist-item'), function (el) {
      el.addEventListener('click', function (e) {
        if (e.target.closest('.airo-hist-del')) return;
        loadConversation(el.getAttribute('data-id'));
      });
    });
    Array.prototype.forEach.call(els.histList.querySelectorAll('.airo-hist-del'), function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        deleteConversation(btn.getAttribute('data-id'));
      });
    });
  }

  function loadConversation(id) {
    var list = loadConversations();
    var conv = null;
    for (var i = 0; i < list.length; i++) { if (list[i].id === id) { conv = list[i]; break; } }
    if (!conv) return;

    session++; // invalidate any stream still tied to the previous thread
    if (ctrl) { try { ctrl.abort(); } catch (e) {} }
    busy = false;
    setSendMode('send');

    currentConvId = conv.id;
    history = conv.messages.slice();
    renderChips(false);
    els.body.innerHTML = '';
    history.forEach(function (m) {
      if (m.role === 'user') {
        var u = document.createElement('div');
        u.className = 'airo-msg airo-msg-user';
        u.innerHTML =
          '<div class="airo-meta"><span class="airo-meta-user">شما</span><span class="airo-meta-t">' + esc(m.t || '') + '</span></div>' +
          '<div class="airo-bubble">' + md(m.content) + '</div>';
        els.body.appendChild(u);
      } else {
        var a = document.createElement('div');
        a.className = 'airo-msg airo-msg-ai';
        a.innerHTML =
          orbHTML('airo-orb-xs') +
          '<div class="airo-ai-col">' +
            '<div class="airo-meta"><span class="airo-meta-name">آیرا</span><span class="airo-meta-t">' + esc(m.t || '') + '</span></div>' +
            '<div class="airo-ai-text">' + md(m.content) + '</div>' +
          '</div>';
        els.body.appendChild(a);
      }
    });
    scrollDown(true);
    setStatus('آنلاین', 'on');
    renderHistoryList();
  }

  /* ----------------------------- Rendering ----------------------------- */
  function scrollDown(force) {
    var b = els.body;
    if (!b) return;
    var nearBottom = b.scrollHeight - b.scrollTop - b.clientHeight < 140;
    if (force || nearBottom) b.scrollTop = b.scrollHeight;
  }

  function renderWelcome() {
    els.body.innerHTML =
      '<div class="airo-welcome">' +
        /* the orb sits on a faded chart line, like the live-price point */
        '<div class="airo-w-line"><span class="airo-w-ping"></span>' + orbHTML('airo-orb-lg') + '</div>' +
        '<div class="airo-w-title">سلام، من آیرا هستم</div>' +
        '<div class="airo-w-sub">هوش مصنوعی ایران بروکر. دربارهٔ ترید، بروکرها و بازارهای مالی هرچی می‌خوای بپرس.</div>' +
      '</div>';
    renderChips(true);
  }

  function renderChips(show) {
    if (!els.chips) return;
    if (!show) { els.chips.innerHTML = ''; els.chips.hidden = true; return; }
    els.chips.hidden = false;
    els.chips.innerHTML = CHIPS.map(function (c, i) {
      return '<button class="airo-chip" style="animation-delay:' + (120 + i * 70) + 'ms">' + esc(c) + '</button>';
    }).join('');
    Array.prototype.forEach.call(els.chips.querySelectorAll('.airo-chip'), function (b) {
      b.addEventListener('click', function () { ask(b.textContent); });
    });
  }

  function addUserBubble(text, t) {
    var wrap = document.createElement('div');
    wrap.className = 'airo-msg airo-msg-user';
    wrap.innerHTML =
      '<div class="airo-meta"><span class="airo-meta-user">شما</span><span class="airo-meta-t">' + esc(t || '') + '</span></div>' +
      '<div class="airo-bubble">' + md(text) + '</div>';
    els.body.appendChild(wrap);
    scrollDown(true);
  }

  /* Airo answers render like terminal output: no bubble, orb + meta + open text */
  function addAiroBubble(t) {
    var wrap = document.createElement('div');
    wrap.className = 'airo-msg airo-msg-ai';
    wrap.innerHTML =
      orbHTML('airo-orb-xs') +
      '<div class="airo-ai-col">' +
        '<div class="airo-meta"><span class="airo-meta-name">آیرا</span><span class="airo-meta-t">' + esc(t || '') + '</span>' +
          '<button class="airo-copy" title="کپی پاسخ">' +
            '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="airo-ai-text">' +
          '<span class="airo-typing"><i></i><i></i><i></i></span>' +
          '<span class="airo-answer"></span><span class="airo-caret"></span>' +
        '</div>' +
      '</div>';
    els.body.appendChild(wrap);
    scrollDown(true);
    return wrap;
  }

  function addNote(html, cls) {
    var n = document.createElement('div');
    n.className = 'airo-note ' + (cls || '');
    n.innerHTML = html;
    els.body.appendChild(n);
    scrollDown(true);
    return n;
  }

  // if a provider's backend stalls silently (no error, no response — seen with
  // some GapGPT model channels), give up after this long instead of hanging forever
  var STALL_TIMEOUT_MS = 25000;

  /* ----------------------------- GapGPT (OpenAI-compatible streaming SSE) ----------------------------- */
  function streamGapGPT(onText, onDone, onError) {
    var cfg = PROVIDERS.gapgpt;
    ctrl = new AbortController();
    var text = '';
    var done = false;
    var timedOut = false;

    var watchdog = setTimeout(function () {
      timedOut = true;
      try { ctrl.abort(); } catch (e) {}
    }, STALL_TIMEOUT_MS);

    function finishOnce(reason) {
      if (done) return;
      done = true;
      clearTimeout(watchdog);
      onDone(text, reason);
    }

    fetch(cfg.url, {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + cfg.key
      },
      body: JSON.stringify({
        model: cfg.model,
        max_tokens: cfg.maxTokens,
        stream: true,
        messages: [{ role: 'system', content: SYSTEM }].concat(
          history.map(function (m) { return { role: m.role, content: m.content }; })
        )
      })
    }).then(function (res) {
      if (!res.ok) {
        return res.json().catch(function () { return {}; }).then(function (j) {
          var msg = (j && j.error && j.error.message) || '';
          var err = new Error(msg);
          err.status = res.status;
          throw err;
        });
      }
      var reader = res.body.getReader();
      var dec = new TextDecoder();
      var buf = '';

      function pump() {
        return reader.read().then(function (r) {
          if (r.done) { finishOnce(null); return; }
          buf += dec.decode(r.value, { stream: true });
          var lines = buf.split('\n');
          buf = lines.pop();
          for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (line.indexOf('data:') !== 0) continue;
            var payload = line.slice(5).trim();
            if (!payload) continue;
            if (payload === '[DONE]') { finishOnce(null); continue; }
            var ev;
            try { ev = JSON.parse(payload); } catch (e) { continue; }
            var delta = ev.choices && ev.choices[0] && ev.choices[0].delta;
            if (delta && delta.content) { text += delta.content; onText(delta.content); }
          }
          if (done) return;
          return pump();
        });
      }
      return pump();
    }).catch(function (err) {
      if (done) return;
      clearTimeout(watchdog);
      if (err && err.name === 'AbortError') {
        if (timedOut) { onError(stallError()); return; }
        finishOnce('aborted');
        return;
      }
      onError(err);
    });
  }

  function stallError() {
    var err = new Error('stalled');
    err.status = 'stall';
    return err;
  }

  /* ----------------------------- Claude API (Anthropic streaming SSE) ----------------------------- */
  function streamClaude(onText, onDone, onError) {
    var cfg = PROVIDERS.claude;
    ctrl = new AbortController();
    var text = '';
    var stopReason = null;
    var timedOut = false;

    var watchdog = setTimeout(function () {
      timedOut = true;
      try { ctrl.abort(); } catch (e) {}
    }, STALL_TIMEOUT_MS);

    fetch(cfg.url, {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': cfg.key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: cfg.model,
        max_tokens: cfg.maxTokens,
        stream: true,
        thinking: { type: 'adaptive' },
        system: SYSTEM,
        messages: history.map(function (m) { return { role: m.role, content: m.content }; })
      })
    }).then(function (res) {
      if (!res.ok) {
        return res.json().catch(function () { return {}; }).then(function (j) {
          var msg = (j && j.error && j.error.message) || '';
          var err = new Error(msg);
          err.status = res.status;
          throw err;
        });
      }
      var reader = res.body.getReader();
      var dec = new TextDecoder();
      var buf = '';

      function pump() {
        return reader.read().then(function (r) {
          if (r.done) { clearTimeout(watchdog); onDone(text, stopReason); return; }
          buf += dec.decode(r.value, { stream: true });
          var lines = buf.split('\n');
          buf = lines.pop();
          lines.forEach(function (line) {
            if (line.indexOf('data:') !== 0) return;
            var payload = line.slice(5).trim();
            if (!payload) return;
            var ev;
            try { ev = JSON.parse(payload); } catch (e) { return; }
            if (ev.type === 'content_block_delta' && ev.delta && ev.delta.type === 'text_delta') {
              text += ev.delta.text; onText(ev.delta.text);
            } else if (ev.type === 'message_delta') {
              if (ev.delta && ev.delta.stop_reason) stopReason = ev.delta.stop_reason;
            } else if (ev.type === 'error') {
              var err = new Error((ev.error && ev.error.message) || 'stream error');
              err.status = 0;
              throw err;
            }
          });
          return pump();
        });
      }
      return pump();
    }).catch(function (err) {
      clearTimeout(watchdog);
      if (err && err.name === 'AbortError') {
        if (timedOut) { onError(stallError()); return; }
        onDone(text, 'aborted');
        return;
      }
      onError(err);
    });
  }

  /* ----------------------------- Dispatch ----------------------------- */
  function streamChat(onText, onDone, onError) {
    if (ACTIVE === 'claude') streamClaude(onText, onDone, onError);
    else streamGapGPT(onText, onDone, onError);
  }

  function errText(err) {
    var s = err && err.status;
    if (s === 'stall') return 'سرویس هوش مصنوعی به‌موقع جواب نداد. دوباره امتحان کن.';
    if (s === 401 || s === 403) return 'سرویس آیرا موقتاً در دسترس نیست. به‌زودی درست می‌شه.';
    if (s === 429) return 'سقف درخواست‌ها پر شده. چند لحظه صبر کن و دوباره امتحان کن.';
    if (s === 529 || s >= 500) return 'سرور هوش مصنوعی شلوغه. کمی بعد دوباره بپرس.';
    if (s === 400 && /credit|billing|balance|موجودی|اعتبار/i.test(err.message || '')) return 'اعتبار حساب سرویس آیرا تموم شده. لطفاً حساب رو شارژ کن.';
    if (err instanceof TypeError) return 'ارتباط با سرویس هوش مصنوعی برقرار نشد. اینترنت، فیلترشکن یا محدودیت سرویس رو چک کن.';
    return 'یه مشکلی پیش اومد: ' + esc((err && err.message) || 'خطای ناشناخته');
  }

  /* ----------------------------- Ask flow ----------------------------- */
  function ask(question) {
    question = (question || '').trim();
    if (!question) { open(); return; }
    if (!isOpen) open(true);
    if (busy) return;

    if (!keyReady()) {
      setStatus('پیکربندی نشده', 'warn');
      if (!els.body.querySelector('.airo-note')) {
        addNote('<span>آیرا هنوز پیکربندی نشده — کلید API پیش‌فرض در <code>js/airo.js</code> تنظیم نشده است.</span>', 'err');
      }
      return;
    }

    // clear the welcome screen on first message
    var w = els.body.querySelector('.airo-welcome');
    if (w) els.body.innerHTML = '';
    renderChips(false);

    var t = fmtTime();
    history.push({ role: 'user', content: question, t: t });
    addUserBubble(question, t);

    var bubbleWrap = addAiroBubble(t);
    var answerEl = bubbleWrap.querySelector('.airo-answer');
    var typingEl = bubbleWrap.querySelector('.airo-typing');
    var caretEl = bubbleWrap.querySelector('.airo-caret');
    var copyBtn = bubbleWrap.querySelector('.airo-copy');
    var textSoFar = '';
    var mySession = session;

    busy = true;
    setMood('thinking');
    setStatus('دارم فکر می‌کنم…', 'busy');
    setSendMode('stop');

    function finish(ok) {
      busy = false; ctrl = null;
      typingEl.remove();
      caretEl.remove();
      setMood('idle');
      setSendMode('send');
      setStatus('آنلاین', 'on');
      if (textSoFar) {
        copyBtn.classList.add('show');
        copyBtn.addEventListener('click', function () {
          navigator.clipboard && navigator.clipboard.writeText(textSoFar);
          copyBtn.classList.add('done');
          setTimeout(function () { copyBtn.classList.remove('done'); }, 1200);
        });
      } else if (ok) {
        bubbleWrap.remove();
      }
      els.input.focus();
    }

    streamChat(
      function onText(chunk) {
        if (!textSoFar) { typingEl.remove(); setMood('talking'); setStatus('در حال نوشتن…', 'busy'); }
        textSoFar += chunk;
        answerEl.innerHTML = md(textSoFar);
        scrollDown();
      },
      function onDone(finalText, stopReason) {
        if (mySession !== session) return; // chat was reset mid-stream
        if (textSoFar) {
          history.push({ role: 'assistant', content: textSoFar, t: t });
          persistCurrentConversation();
        } else {
          history.pop(); // nothing came back — don't poison history
        }
        if (stopReason === 'refusal' && !textSoFar) {
          answerEl.innerHTML = md('این یکی رو نمی‌تونم جواب بدم. یه سوال دیگه دربارهٔ بازارهای مالی بپرس.');
          textSoFar = ' ';
        }
        if (stopReason === 'aborted' && textSoFar) {
          answerEl.innerHTML = md(textSoFar) + ' <i class="airo-stopped">متوقف شد</i>';
        }
        finish(true);
        scrollDown();
      },
      function onError(err) {
        if (mySession !== session) return; // chat was reset mid-stream
        history.pop(); // remove failed user turn so retry is clean
        bubbleWrap.remove();
        var n = addNote(
          '<span>' + errText(err) + '</span>' +
          '<button class="airo-retry">تلاش دوباره</button>', 'err');
        n.querySelector('.airo-retry').addEventListener('click', function () {
          n.remove();
          ask(question);
        });
        finish(false);
      }
    );
  }

  /* ----------------------------- Send / stop button ----------------------------- */
  function setSendMode(mode) {
    if (!els.send) return;
    els.send.setAttribute('data-mode', mode);
    els.send.title = mode === 'stop' ? 'توقف' : 'ارسال';
    els.send.innerHTML = mode === 'stop'
      ? '<svg viewBox="0 0 24 24" width="16" height="16"><rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor"/></svg>'
      : '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H6"/><path d="M11 7l-5 5 5 5"/></svg>';
  }

  /* ----------------------------- Open / close ----------------------------- */
  function open(silent) {
    if (isOpen) return;
    isOpen = true;
    els.overlay.hidden = false;
    els.overlay.classList.remove('closing');
    els.overlay.classList.add('opening');
    setMood('idle');
    setStatus('آنلاین', 'on');
    if (!els.body.childElementCount) renderWelcome();
    // the dot→line→split reveal runs ~.9s; focus once it settles
    setTimeout(function () {
      els.overlay.classList.remove('opening');
      if (!silent) els.input.focus();
    }, 920);
  }

  function close() {
    if (!isOpen) return;
    if (ctrl) { try { ctrl.abort(); } catch (e) {} }
    isOpen = false;
    els.overlay.classList.add('closing');
    setTimeout(function () {
      els.overlay.classList.remove('closing');
      els.overlay.hidden = true;
    }, 330);
  }

  function newChat() {
    session++;
    if (ctrl) { try { ctrl.abort(); } catch (e) {} }
    history = [];
    currentConvId = null;
    busy = false;
    setSendMode('send');
    renderWelcome();
    setStatus('آنلاین', 'on');
  }

  /* ----------------------------- Init ----------------------------- */
  function init() {
    els.overlay = $('airo-overlay');
    els.panel = $('airo-panel');
    if (!els.overlay || !els.panel) return;
    els.body = $('airo-body');
    els.chips = $('airo-chips');
    els.input = $('airo-input');
    els.send = $('airo-send');
    els.status = $('airo-status');
    els.hist = $('airo-hist');
    els.histList = $('airo-hist-list');
    els.histBtn = $('airo-hist-btn');
    els.privacyBtn = $('airo-privacy-btn');

    // head orb + buttons
    $('airo-head-orb').innerHTML = orbHTML('airo-orb-sm');
    setSendMode('send');

    noHistory = loadNoHistoryPref();
    updatePrivacyBtn();

    $('airo-close').addEventListener('click', close);
    $('airo-new').addEventListener('click', newChat);
    if (els.histBtn) els.histBtn.addEventListener('click', toggleHistory);
    if (els.privacyBtn) els.privacyBtn.addEventListener('click', function () { setNoHistory(!noHistory); });

    els.send.addEventListener('click', function () {
      if (busy) { if (ctrl) ctrl.abort(); return; }
      ask(els.input.value);
      els.input.value = '';
    });
    els.input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        if (busy) return;
        ask(els.input.value);
        els.input.value = '';
      }
    });

    // Esc closes, clicking the backdrop closes
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen) close();
    });
    els.overlay.addEventListener('click', function (e) {
      if (e.target === els.overlay) close();
    });

    window.AiroChat = { open: open, close: close, ask: ask, isOpen: function () { return isOpen; } };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
