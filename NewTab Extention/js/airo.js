/* ===================================================================
   آیرو — هوش مصنوعی ایران بروکر
   Centered chat modal launched from the search box. Streams answers
   from a configurable backend (GapGPT by default, Claude as a drop-in
   alternative) with a living-orb avatar and quick-prompt chips.
   Exposed as window.AiroChat = { open, close, ask, isOpen }.
   =================================================================== */
(function () {
  'use strict';

  /* ===================================================================
     پیکربندی بک‌اند — همهٔ کاربران اکستنشن از همین تنظیمات استفاده می‌کنند
     =================================================================== */

  // کدام سرویس موتور آیرو باشد؟ 'gapgpt' یا 'claude'
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

  var SYSTEM = [
    'تو «آیرو» هستی — هوش مصنوعی ایران بروکر (iranbroker.net)، مرجع فارسی‌زبان بازارهای مالی.',
    'تخصص تو: فارکس، ارز دیجیتال، بورس، طلا، بروکرها، پراپ‌فرم‌ها، مدیریت ریسک و آموزش ترید.',
    'لحن: صمیمی، روان و دقیق. کاملاً فارسی جواب بده مگر کاربر زبان دیگری بخواهد.',
    'این یک ویجت چت کوچک است؛ پاسخ‌ها را کوتاه و مفید نگه دار (معمولاً زیر ۱۵۰ کلمه) مگر کاربر توضیح مفصل بخواهد.',
    'هرگز سیگنال قطعی خرید/فروش نده؛ همیشه به ریسک و مسئولیت شخصی اشاره کن.',
    'به قیمت لحظه‌ای بازار دسترسی نداری؛ اگر قیمت زنده پرسیدند صادقانه بگو و ابزارهای ایران بروکر (مقایسه اسپرد، قیمت ارز دیجیتال، تقویم اقتصادی) را پیشنهاد بده.',
    'دربارهٔ وعده‌های سود تضمینی و کلاهبرداری هشدار بده و بخش «هشدار کلاهبرداری» ایران بروکر را معرفی کن.',
    'برای خوانایی از **بولد** و لیست‌های کوتاه با - استفاده کن.'
  ].join('\n');

  var CHIPS = [
    'بهترین بروکر برای ایرانی‌ها کدومه؟ 🏦',
    'اسپرد و کمیسیون یعنی چی؟',
    'پراپ‌فرم چطور کار می‌کنه؟ 🏆',
    'چطور کلاهبرداری فارکسی رو تشخیص بدم؟ 🚨'
  ];

  /* ----------------------------- State ----------------------------- */
  var els = {};
  var history = [];        // [{role:'user'|'assistant', content:'string'}, ...]
  var isOpen = false;
  var busy = false;
  var ctrl = null;         // AbortController
  var session = 0;         // bumped on "new chat" so stale streams can't touch history

  function keyReady() {
    var cfg = PROVIDERS[ACTIVE];
    return !!(cfg && cfg.key && cfg.key.indexOf('REPLACE-ME') === -1);
  }

  /* ----------------------------- Tiny helpers ----------------------------- */
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  /* light markdown: **bold**, `code`, "- " bullets, newlines */
  function md(s) {
    var out = esc(s);
    out = out.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
    out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
    out = out.split('\n').map(function (line) {
      var m = line.match(/^\s*[-•]\s+(.*)$/);
      return m ? '<span class="am-li">' + m[1] + '</span>' : line;
    }).join('<br>');
    out = out.replace(/(<br>)+(<span class="am-li">)/g, '$2');
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

  /* ----------------------------- Rendering ----------------------------- */
  function fmtTime() {
    try { return new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }); }
    catch (e) { return ''; }
  }

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
        '<div class="airo-w-title">سلام! من آیروام <span class="airo-wave">👋</span></div>' +
        '<div class="airo-w-sub">هوش مصنوعی ایران بروکر — دربارهٔ ترید، بروکرها و بازارهای مالی هرچی می‌خوای بپرس.</div>' +
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

  function addUserBubble(text) {
    var wrap = document.createElement('div');
    wrap.className = 'airo-msg airo-msg-user';
    wrap.innerHTML =
      '<div class="airo-meta"><span>شما</span><span class="airo-meta-t">' + fmtTime() + '</span></div>' +
      '<div class="airo-bubble">' + md(text) + '</div>';
    els.body.appendChild(wrap);
    scrollDown(true);
  }

  /* Airo answers render like terminal output: no bubble, orb + meta + open text */
  function addAiroBubble() {
    var wrap = document.createElement('div');
    wrap.className = 'airo-msg airo-msg-ai';
    wrap.innerHTML =
      orbHTML('airo-orb-xs') +
      '<div class="airo-ai-col">' +
        '<div class="airo-meta"><span class="airo-meta-name">آیرو</span><span class="airo-meta-t">' + fmtTime() + '</span>' +
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
        messages: [{ role: 'system', content: SYSTEM }].concat(history)
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
        messages: history
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
    if (s === 'stall') return 'سرویس هوش مصنوعی به‌موقع جواب نداد ⏱ — دوباره امتحان کن.';
    if (s === 401 || s === 403) return 'سرویس آیرو موقتاً در دسترس نیست 🔑 — به‌زودی درست می‌شه.';
    if (s === 429) return 'سقف درخواست‌ها پر شده ⏳ — چند لحظه صبر کن و دوباره امتحان کن.';
    if (s === 529 || s >= 500) return 'سرور هوش مصنوعی شلوغه 🌩 — کمی بعد دوباره بپرس.';
    if (s === 400 && /credit|billing|balance|موجودی|اعتبار/i.test(err.message || '')) return 'اعتبار حساب سرویس آیرو تموم شده — لطفاً حساب رو شارژ کن.';
    if (err instanceof TypeError) return 'ارتباط با سرویس هوش مصنوعی برقرار نشد 🌐 — اینترنت، فیلترشکن یا محدودیت سرویس رو چک کن.';
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
        addNote('<span>آیرو هنوز پیکربندی نشده — کلید API پیش‌فرض در <code>js/airo.js</code> تنظیم نشده است.</span>', 'err');
      }
      return;
    }

    // clear the welcome screen on first message
    var w = els.body.querySelector('.airo-welcome');
    if (w) els.body.innerHTML = '';
    renderChips(false);

    history.push({ role: 'user', content: question });
    addUserBubble(question);

    var bubbleWrap = addAiroBubble();
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
      function onText(t) {
        if (!textSoFar) { typingEl.remove(); setMood('talking'); setStatus('در حال نوشتن…', 'busy'); }
        textSoFar += t;
        answerEl.innerHTML = md(textSoFar);
        scrollDown();
      },
      function onDone(finalText, stopReason) {
        if (mySession !== session) return; // chat was reset mid-stream
        if (textSoFar) history.push({ role: 'assistant', content: textSoFar });
        else history.pop(); // nothing came back — don't poison history
        if (stopReason === 'refusal' && !textSoFar) {
          answerEl.innerHTML = md('این یکی رو نمی‌تونم جواب بدم 🙏 — یه سوال دیگه دربارهٔ بازارهای مالی بپرس.');
          textSoFar = ' ';
        }
        if (stopReason === 'aborted' && textSoFar) {
          answerEl.innerHTML = md(textSoFar) + ' <i class="airo-stopped">— متوقف شد</i>';
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

  /* ----------------------------- Header clock ----------------------------- */
  function tickClock() {
    if (els.clock) els.clock.textContent = fmtTime();
  }

  /* ----------------------------- Open / close ----------------------------- */
  function open(silent) {
    if (isOpen) return;
    isOpen = true;
    tickClock();
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
    els.clock = $('airo-clock');

    // head orb + clock + buttons
    $('airo-head-orb').innerHTML = orbHTML('airo-orb-sm');
    setSendMode('send');
    tickClock();
    setInterval(tickClock, 15000);

    $('airo-close').addEventListener('click', close);
    $('airo-new').addEventListener('click', newChat);

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
