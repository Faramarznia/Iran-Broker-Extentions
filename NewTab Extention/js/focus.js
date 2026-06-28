/* ===================================================================
   ایران بروکر — Focus Mode (js/focus.js)
   Self-contained focus/pomodoro module.
   =================================================================== */
(function () {
  'use strict';

  /* ─── Constants ─── */
  var STORE_KEY = 'ib_focus_v2';
  var RING_R = 178;
  var SVG_CX = 220, SVG_CY = 220;
  var CIRC = 2 * Math.PI * RING_R;

  /* ─── Quotes ─── */
  var QUOTES = [
    { text: 'قلب آرام، تصمیم‌های روشن‌تری می‌گیرد.', author: 'دالایی لاما' },
    { text: 'بهترین معامله‌گران می‌توانند ساعت‌ها هیچ کاری نکنند.', author: 'جسی لیورمور' },
    { text: 'بازار به کسی که عجله دارد پول نمی‌دهد.', author: 'جسی لیورمور' },
    { text: 'معامله بر اساس ترس یا طمع، نتیجه‌ای جز زیان ندارد.', author: 'ایران بروکر' },
    { text: 'صبر، مهم‌ترین مهارت یک تریدر موفق است.', author: 'وارن بافت' },
    { text: 'صبر کن که صبر داروی دل است.', author: 'سعدی شیرازی' },
    { text: 'عجول باش در آموختن، آرام باش در تصمیم گرفتن.', author: 'امام علی (ع)' },
    { text: 'در آرامش قدرتی نهفته است که در شتاب نیست.', author: 'مولانا' },
    { text: 'تمرکز یعنی نه گفتن به صد ایده خوب.', author: 'استیو جابز' },
    { text: 'ذهنی که آرام است، بیشتر می‌بیند.', author: 'حکمت ژاپنی' },
    { text: 'کیفیت حضور، مهم‌تر از مقدار زمان است.', author: 'ایران بروکر' },
    { text: 'اول سرمایه را حفظ کن، بعد به سود فکر کن.', author: 'جورج سوروس' },
    { text: 'پلن داشتن، یعنی نصف راه را رفتن.', author: 'ایران بروکر' },
    { text: 'هر چیزی که احساساتی‌ات می‌کند، احتمالاً اشتباهی است.', author: 'Paul Tudor Jones' },
    { text: 'در بازار، انضباط از هوش مهم‌تر است.', author: 'ری دالیو' }
  ];

  var BREAK_TIPS = [
    'از صفحه دور شو و چند لحظه چشمانت را ببند.',
    'یک لیوان آب بنوش — هیدراتاسیون روی تصمیم‌گیری تأثیر مستقیم دارد.',
    'معامله‌ای باز نگذار در استراحت — ذهنت باید واقعاً استراحت کند.',
    '۵ نفس عمیق بکش — ریه‌ها ذهن را اکسیژن می‌دهند.',
    'کمی کشش و حرکت بده — تریدر بودن کار نشسته‌ای است.'
  ];

  /* ─── Mode colors ─── */
  var MODE_COLORS = {
    pomodoro_work:  '#ef4444',
    pomodoro_short: '#60a5fa',
    pomodoro_long:  '#818cf8',
    custom:         '#60a5fa',
    session:        '#22c55e'
  };

  /* ─── State ─── */
  var s = {
    screen: null,
    mode: 'pomodoro',
    running: false,
    remaining: 25 * 60,
    total: 25 * 60,
    pomRound: 1,
    pomTotalRounds: 4,
    pomPhase: 'work',
    pomWorkMins: 25,
    pomShortMins: 5,
    pomLongMins: 15,
    customMins: 45,
    sessStart: '15:00',
    sessEnd: '17:00',
    soundType: 'none',
    volume: 60,
    autoBreak: true,
    pauseCount: 0,
    totalPaused: 0,
    pausedAt: null,
    startedAt: null,
    savedAt: null,
    streak: 0,
    lastFocusDate: null
  };

  var tickInterval = null;
  var quoteTimeout = null;

  /* ─── Audio ─── */
  var audioCtx = null;
  var audioSource = null;
  var audioGain = null;
  var audioLfo = null;

  function ensureAudioCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }

  function createNoiseBuffer() {
    var rate = audioCtx.sampleRate;
    var len = rate * 3;
    var buf = audioCtx.createBuffer(1, len, rate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1);
    return buf;
  }

  function stopSound() {
    try {
      if (audioSource) { audioSource.stop(); audioSource = null; }
      if (audioLfo) { audioLfo.stop(); audioLfo = null; }
      audioGain = null;
    } catch(e) {}
  }

  function playSound(type) {
    stopSound();
    if (type === 'none' || !audioCtx) return;
    try {
      var gain = audioCtx.createGain();
      gain.gain.value = s.volume / 100 * 0.3;
      gain.connect(audioCtx.destination);
      audioGain = gain;

      var src = audioCtx.createBufferSource();
      src.buffer = createNoiseBuffer();
      src.loop = true;
      audioSource = src;

      if (type === 'rain') {
        var filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 700;
        filter.Q.value = 0.8;
        src.connect(filter);
        filter.connect(gain);

      } else if (type === 'ocean') {
        var filt2 = audioCtx.createBiquadFilter();
        filt2.type = 'lowpass';
        filt2.frequency.value = 500;
        filt2.Q.value = 1.2;
        src.connect(filt2);
        filt2.connect(gain);
        var lfo = audioCtx.createOscillator();
        lfo.frequency.value = 0.12;
        var lfoGain = audioCtx.createGain();
        lfoGain.gain.value = 0.18;
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);
        lfo.start();
        audioLfo = lfo;

      } else if (type === 'forest') {
        var filt3 = audioCtx.createBiquadFilter();
        filt3.type = 'bandpass';
        filt3.frequency.value = 1200;
        filt3.Q.value = 0.5;
        src.connect(filt3);
        filt3.connect(gain);
      }

      src.start();
    } catch(e) {}
  }

  function setVolume(v) {
    s.volume = v;
    if (audioGain) audioGain.gain.value = v / 100 * 0.3;
  }

  /* ─── Persistence ─── */
  function saveState() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        active: true,
        mode: s.mode,
        remaining: s.remaining,
        total: s.total,
        pomRound: s.pomRound,
        pomTotalRounds: s.pomTotalRounds,
        pomPhase: s.pomPhase,
        pomWorkMins: s.pomWorkMins,
        pomShortMins: s.pomShortMins,
        pomLongMins: s.pomLongMins,
        customMins: s.customMins,
        pauseCount: s.pauseCount,
        totalPaused: s.totalPaused,
        soundType: s.soundType,
        volume: s.volume,
        autoBreak: s.autoBreak,
        screen: s.screen,
        savedAt: Date.now(),
        streak: s.streak,
        lastFocusDate: s.lastFocusDate
      }));
    } catch(e) {}
  }

  function loadPrefs() {
    try {
      var d = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
      if (d.streak != null) s.streak = d.streak;
      if (d.lastFocusDate != null) s.lastFocusDate = d.lastFocusDate;
      if (d.pomWorkMins) s.pomWorkMins = d.pomWorkMins;
      if (d.pomShortMins) s.pomShortMins = d.pomShortMins;
      if (d.pomLongMins) s.pomLongMins = d.pomLongMins;
      if (d.soundType) s.soundType = d.soundType;
      if (d.volume != null) s.volume = d.volume;
      if (d.autoBreak != null) s.autoBreak = d.autoBreak;
      if (d.customMins) s.customMins = d.customMins;
    } catch(e) {}
  }

  function checkExistingSession() {
    try {
      var d = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
      if (!d.active || !d.savedAt) return false;
      var elapsed = Math.floor((Date.now() - d.savedAt) / 1000);
      var remaining = Math.max(0, (d.remaining || 0) - elapsed);
      if (remaining <= 0) { clearSavedState(); return false; }
      Object.assign(s, d, { remaining: remaining, running: false, pausedAt: null });
      return true;
    } catch(e) {}
    return false;
  }

  function clearSavedState() {
    try {
      var d = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
      localStorage.setItem(STORE_KEY, JSON.stringify({
        active: false,
        streak: d.streak || 0,
        lastFocusDate: d.lastFocusDate || null,
        pomWorkMins: d.pomWorkMins || 25,
        pomShortMins: d.pomShortMins || 5,
        pomLongMins: d.pomLongMins || 15,
        soundType: d.soundType || 'none',
        volume: d.volume != null ? d.volume : 60,
        autoBreak: d.autoBreak !== false,
        customMins: d.customMins || 45
      }));
    } catch(e) {}
  }

  /* ─── Utils ─── */
  function toFa(n) {
    return String(Math.max(0, n)).replace(/\d/g, function(d) { return '۰۱۲۳۴۵۶۷۸۹'[d]; });
  }
  function fmt(sec) {
    sec = Math.max(0, sec);
    var m = Math.floor(sec / 60), ss = sec % 60;
    return String(m).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
  }
  function $ (id) { return document.getElementById(id); }
  function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  /* ─── Container ─── */
  function showContainer() {
    var c = $('focus-container');
    if (!c) return;
    c.hidden = false;
    requestAnimationFrame(function() { c.classList.add('fc-visible'); });
    document.querySelector('.layout-wrap') && document.querySelector('.layout-wrap').classList.add('focus-bg-dim');
  }
  function hideContainer() {
    var c = $('focus-container');
    if (!c) return;
    c.classList.remove('fc-visible');
    setTimeout(function() { c.hidden = true; }, 350);
    document.querySelector('.layout-wrap') && document.querySelector('.layout-wrap').classList.remove('focus-bg-dim');
  }
  function showScreen(name) {
    ['focus-setup', 'focus-quote-screen', 'focus-timer-screen', 'focus-break-screen', 'focus-end-screen'].forEach(function(id) {
      var el = $(id);
      if (el) el.hidden = (id !== name);
    });
    s.screen = name;
    saveState();
  }

  /* ─── Focus btn badge ─── */
  function updateFocusBtn() {
    var btn = $('focus-btn');
    if (!btn) return;
    if (s.screen && s.screen !== 'focus-setup') {
      btn.classList.add('focus-btn-active');
      var badge = btn.querySelector('.fb-badge');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'fb-badge';
        btn.appendChild(badge);
      }
      badge.textContent = fmt(s.remaining) + ' باقی';
    } else {
      btn.classList.remove('focus-btn-active');
      var b2 = btn.querySelector('.fb-badge');
      if (b2) b2.remove();
    }
  }

  /* ─── Mode color ─── */
  function getModeColor() {
    var key = s.mode === 'pomodoro' ? 'pomodoro_' + s.pomPhase : s.mode;
    return MODE_COLORS[key] || '#60a5fa';
  }
  function applyModeColor() {
    document.documentElement.style.setProperty('--fc-color', getModeColor());
  }

  /* ─── Ring ─── */
  function updateRing(remaining, total) {
    var progress = total > 0 ? remaining / total : 0;
    var offset = CIRC * (1 - progress);
    var ring = $('focus-ring-progress');
    if (ring) {
      ring.style.strokeDashoffset = offset.toFixed(2);
      var color;
      if (progress <= 1/12) color = '#ef4444';
      else if (progress <= 1/5) color = '#f59e0b';
      else color = 'var(--fc-color)';
      ring.style.stroke = color;
    }
    var dot = $('focus-ring-dot');
    if (dot) {
      var angle = (1 - progress) * 2 * Math.PI - Math.PI / 2;
      dot.setAttribute('cx', (SVG_CX + RING_R * Math.cos(angle)).toFixed(2));
      dot.setAttribute('cy', (SVG_CY + RING_R * Math.sin(angle)).toFixed(2));
      dot.style.fill = color || 'var(--fc-color)';
    }
  }

  /* ─── Setup Screen ─── */
  function openSetup() {
    showContainer();
    showScreen('focus-setup');
    syncSetupUI();
  }

  function syncSetupUI() {
    ['mode-pomodoro', 'mode-custom', 'mode-session'].forEach(function(id) {
      var el = $(id);
      if (el) el.classList.toggle('selected', id === 'mode-' + s.mode);
    });
    var pw = $('pom-work-input'); if (pw) pw.value = s.pomWorkMins;
    var ps = $('pom-short-input'); if (ps) ps.value = s.pomShortMins;
    var pl = $('pom-long-input'); if (pl) pl.value = s.pomLongMins;
    var cm = $('custom-mins-input'); if (cm) cm.value = s.customMins;
    var ss = $('sess-start-input'); if (ss) ss.value = s.sessStart;
    var se = $('sess-end-input'); if (se) se.value = s.sessEnd;
    syncSoundChips('setup');
    var sv = $('setup-volume'); if (sv) sv.value = s.volume;
  }

  function syncSoundChips(ctx) {
    var chips = document.querySelectorAll('.sc-' + ctx);
    chips.forEach(function(c) {
      c.classList.toggle('active', c.getAttribute('data-sound') === s.soundType);
    });
  }

  /* ─── Quote Screen ─── */
  function showQuote() {
    showScreen('focus-quote-screen');
    var q = randomItem(QUOTES);
    var qt = $('fq-text'); if (qt) qt.textContent = q.text;
    var qa = $('fq-author'); if (qa) qa.textContent = '— ' + q.author;
    clearTimeout(quoteTimeout);
    quoteTimeout = setTimeout(showTimerScreen, 3200);
  }

  /* ─── Timer Screen ─── */
  function startSession() {
    applyModeColor();
    s.running = false;
    s.pauseCount = 0;
    s.totalPaused = 0;
    s.startedAt = Date.now();

    if (s.mode === 'pomodoro') {
      s.pomRound = 1;
      s.pomPhase = 'work';
      s.remaining = s.pomWorkMins * 60;
      s.total = s.remaining;
    } else if (s.mode === 'custom') {
      s.remaining = s.customMins * 60;
      s.total = s.remaining;
    } else {
      var now = new Date();
      var parts = s.sessEnd.split(':');
      var end = new Date(now);
      end.setHours(parseInt(parts[0]), parseInt(parts[1]), 0, 0);
      if (end <= now) end.setDate(end.getDate() + 1);
      s.remaining = Math.max(60, Math.floor((end - now) / 1000));
      s.total = s.remaining;
    }

    ensureAudioCtx();
    playSound(s.soundType);
    showTimerScreen();
    setTimeout(function() { togglePause(); }, 100);
  }

  function showTimerScreen() {
    showScreen('focus-timer-screen');
    applyModeColor();
    updateRing(s.remaining, s.total);
    renderTimerUI();
  }

  function renderTimerUI() {
    var cd = $('focus-countdown'); if (cd) cd.textContent = fmt(s.remaining);

    var labels = {
      pomodoro_work: 'تمرکز', pomodoro_short: 'استراحت کوتاه',
      pomodoro_long: 'استراحت بلند', custom: 'تمرکز', session: 'سشن معاملاتی'
    };
    var key = s.mode === 'pomodoro' ? 'pomodoro_' + s.pomPhase : s.mode;
    var lbl = $('focus-mode-label'); if (lbl) lbl.textContent = labels[key] || '';

    var ri = $('focus-round-indicator');
    if (ri) {
      if (s.mode === 'pomodoro') {
        var dots = '';
        for (var i = 0; i < s.pomTotalRounds; i++) {
          var cls = i < s.pomRound - 1 ? 'pom-dot done' : (i === s.pomRound - 1 ? 'pom-dot active' : 'pom-dot');
          dots += '<span class="' + cls + '"></span>';
        }
        ri.innerHTML = '<span class="round-txt">دور ' + toFa(s.pomRound) + ' از ' + toFa(s.pomTotalRounds) + '</span>' + dots;
        ri.hidden = false;
      } else {
        ri.hidden = true;
      }
    }

    var tgl = $('focus-toggle');
    if (tgl) {
      tgl.innerHTML = s.running
        ? '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
    }

    var skipBtn = $('focus-skip-btn');
    if (skipBtn) skipBtn.hidden = s.mode !== 'pomodoro';

    var ts = $('focus-timer-screen');
    if (ts) {
      ts.classList.toggle('fc-paused', !s.running);
      var pct = s.total > 0 ? s.remaining / s.total : 1;
      ts.classList.toggle('fc-warning', pct <= 0.2 && pct > 1/12);
      ts.classList.toggle('fc-critical', pct <= 1/12);
    }

    updateRing(s.remaining, s.total);
    updateFocusBtn();
  }

  /* ─── Tick ─── */
  function startTicking() {
    clearInterval(tickInterval);
    if (s.running) tickInterval = setInterval(tick, 1000);
  }

  function tick() {
    s.remaining = Math.max(0, s.remaining - 1);
    saveState();
    renderTimerUI();
    if (s.remaining <= 0) {
      clearInterval(tickInterval);
      onPhaseEnd();
    }
  }

  function onPhaseEnd() {
    sendNotification();
    if (s.mode === 'pomodoro') {
      if (s.pomPhase === 'work') {
        var isLong = (s.pomRound % s.pomTotalRounds === 0);
        s.pomPhase = isLong ? 'long' : 'short';
        if (s.autoBreak) {
          showBreakScreen();
        } else {
          showBreakScreen();
        }
      } else {
        var nextRound = s.pomRound + (s.pomPhase !== 'long' ? 1 : 0);
        if (nextRound > s.pomTotalRounds && s.pomPhase === 'long') {
          showEndScreen();
        } else {
          s.pomRound = nextRound;
          s.pomPhase = 'work';
          s.remaining = s.pomWorkMins * 60;
          s.total = s.remaining;
          s.running = false;
          applyModeColor();
          showTimerScreen();
          if (s.autoBreak) setTimeout(function() { togglePause(); }, 200);
        }
      }
    } else {
      showEndScreen();
    }
  }

  /* ─── Controls ─── */
  function togglePause() {
    s.running = !s.running;
    if (s.running) {
      if (s.pausedAt) { s.totalPaused += Math.floor((Date.now() - s.pausedAt) / 1000); s.pausedAt = null; }
      startTicking();
    } else {
      s.pauseCount++;
      s.pausedAt = Date.now();
      clearInterval(tickInterval);
    }
    renderTimerUI();
  }

  var resetConfirmTimeout = null;
  function resetTimer() {
    var btn = $('focus-reset-btn');
    if (!btn) return;
    if (btn.dataset.confirm === '1') {
      clearTimeout(resetConfirmTimeout);
      btn.dataset.confirm = '0';
      btn.classList.remove('fc-confirm');
      clearInterval(tickInterval);
      s.running = false;
      s.pauseCount = 0;
      s.totalPaused = 0;
      if (s.mode === 'pomodoro') {
        s.pomRound = 1; s.pomPhase = 'work';
        s.remaining = s.pomWorkMins * 60;
      } else {
        s.remaining = s.total;
      }
      renderTimerUI();
    } else {
      btn.dataset.confirm = '1';
      btn.classList.add('fc-confirm');
      resetConfirmTimeout = setTimeout(function() {
        btn.dataset.confirm = '0'; btn.classList.remove('fc-confirm');
      }, 1500);
    }
  }

  function skipPhase() {
    if (s.mode !== 'pomodoro') return;
    clearInterval(tickInterval);
    s.remaining = 0;
    onPhaseEnd();
  }

  function extendTime(mins) {
    s.remaining += mins * 60;
    s.total += mins * 60;
    renderTimerUI();
    saveState();
  }

  /* ─── Break Screen ─── */
  function showBreakScreen() {
    showScreen('focus-break-screen');
    var isLong = s.pomPhase === 'long';
    var breakSec = (isLong ? s.pomLongMins : s.pomShortMins) * 60;
    s.remaining = breakSec;
    s.total = breakSec;
    s.running = true;
    applyModeColor();

    var title = $('focus-break-title');
    if (title) title.textContent = 'دور ' + toFa(s.pomRound) + ' تموم شد!';
    var sub = $('focus-break-sub');
    if (sub) sub.textContent = (isLong ? toFa(s.pomLongMins) : toFa(s.pomShortMins)) + ' دقیقه استراحت — اجباریه!';
    var tip = $('focus-break-tip');
    if (tip) tip.textContent = randomItem(BREAK_TIPS);

    renderBreak();
    clearInterval(tickInterval);
    tickInterval = setInterval(breakTick, 1000);
  }

  function renderBreak() {
    var bt = $('focus-break-time'); if (bt) bt.textContent = fmt(s.remaining);
    var fill = $('focus-break-fill');
    if (fill) fill.style.width = ((1 - s.remaining / s.total) * 100).toFixed(1) + '%';
  }

  function breakTick() {
    s.remaining = Math.max(0, s.remaining - 1);
    saveState();
    renderBreak();
    updateFocusBtn();
    if (s.remaining <= 0) {
      clearInterval(tickInterval);
      s.pomRound = Math.min(s.pomRound + 1, s.pomTotalRounds);
      s.pomPhase = 'work';
      s.remaining = s.pomWorkMins * 60;
      s.total = s.remaining;
      s.running = false;
      applyModeColor();
      showTimerScreen();
      if (s.autoBreak) setTimeout(function() { togglePause(); }, 200);
    }
  }

  /* ─── End Screen ─── */
  function showEndScreen() {
    clearInterval(tickInterval);
    stopSound();
    s.running = false;
    s.screen = 'focus-end-screen';

    var today = new Date().toDateString();
    if (s.lastFocusDate === today) {
      s.streak = (s.streak || 0) + 1;
    } else if (s.lastFocusDate && new Date(s.lastFocusDate).toDateString() !== new Date(Date.now() - 86400000).toDateString()) {
      s.streak = 1;
    } else {
      s.streak = (s.streak || 0) + 1;
    }
    s.lastFocusDate = today;

    var totalMins = Math.floor((s.total) / 60);
    var dur = $('es-duration');
    if (dur) dur.textContent = toFa(totalMins) + ' دقیقه';
    var pauseEl = $('es-pauses');
    if (pauseEl) pauseEl.textContent = toFa(s.pauseCount) + ' بار';
    var statusEl = $('es-status');
    if (statusEl) statusEl.textContent = s.pauseCount === 0 ? 'بدون وقفه 🏆' : 'با ' + toFa(s.pauseCount) + ' توقف';
    var streakEl = $('es-streak');
    if (streakEl) streakEl.textContent = toFa(s.streak) + ' روز';

    clearSavedState();
    saveState();
    updateFocusBtn();
    showScreen('focus-end-screen');
  }

  /* ─── Notifications ─── */
  function requestNotifPermission(cb) {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') { if (cb) cb(); return; }
    if (Notification.permission === 'denied') return;
    Notification.requestPermission(function(p) { if (p === 'granted' && cb) cb(); });
  }

  function sendNotification() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try {
      new Notification('⏱ تمرکز تموم شد!', {
        body: 'وقت استراحته. آفرین که فوکوست رو حفظ کردی!',
        icon: '../icons/icon48.png'
      });
    } catch(e) {}
  }

  /* ─── Close ─── */
  function closeAll() {
    clearInterval(tickInterval);
    clearTimeout(quoteTimeout);
    stopSound();
    s.running = false;
    clearSavedState();
    s.screen = null;
    hideContainer();
    updateFocusBtn();
  }

  /* ─── Bind events ─── */
  function bindEvents() {
    var focusBtn = $('focus-btn');
    if (focusBtn) focusBtn.addEventListener('click', openSetup);

    /* Setup screen */
    var startBtn = $('start-focus-btn');
    if (startBtn) startBtn.addEventListener('click', function() {
      var pw = $('pom-work-input'); if (pw) s.pomWorkMins = Math.max(1, parseInt(pw.value) || 25);
      var ps = $('pom-short-input'); if (ps) s.pomShortMins = Math.max(1, parseInt(ps.value) || 5);
      var pl = $('pom-long-input'); if (pl) s.pomLongMins = Math.max(1, parseInt(pl.value) || 15);
      var cm = $('custom-mins-input'); if (cm) s.customMins = Math.max(1, parseInt(cm.value) || 45);
      var ss = $('sess-start-input'); if (ss) s.sessStart = ss.value || '15:00';
      var se = $('sess-end-input'); if (se) s.sessEnd = se.value || '17:00';
      requestNotifPermission();
      showQuote();
      setTimeout(startSession, 3400);
    });

    var setupClose = $('setup-close');
    if (setupClose) setupClose.addEventListener('click', function() {
      s.screen = null;
      hideContainer();
      updateFocusBtn();
    });

    /* Mode cards */
    ['pomodoro', 'custom', 'session'].forEach(function(m) {
      var card = $('mode-' + m);
      if (!card) return;
      card.addEventListener('click', function(e) {
        if (e.target.tagName === 'INPUT') return;
        s.mode = m;
        syncSetupUI();
      });
    });

    /* Preset chips */
    document.querySelectorAll('.preset-chip').forEach(function(c) {
      c.addEventListener('click', function() {
        var mins = parseInt(c.getAttribute('data-mins'));
        s.customMins = mins;
        var cm = $('custom-mins-input'); if (cm) { cm.value = mins; }
        s.mode = 'custom';
        syncSetupUI();
      });
    });

    /* Sound chips (setup) */
    document.querySelectorAll('.sc-setup').forEach(function(c) {
      c.addEventListener('click', function() {
        s.soundType = c.getAttribute('data-sound');
        syncSoundChips('setup');
        syncSoundChips('timer');
      });
    });

    var setupVol = $('setup-volume');
    if (setupVol) setupVol.addEventListener('input', function() { setVolume(parseInt(this.value)); });

    /* Timer screen */
    var toggleBtn = $('focus-toggle');
    if (toggleBtn) toggleBtn.addEventListener('click', togglePause);

    var resetBtn = $('focus-reset-btn');
    if (resetBtn) {
      resetBtn.dataset.confirm = '0';
      resetBtn.addEventListener('click', resetTimer);
    }

    var skipBtn = $('focus-skip-btn');
    if (skipBtn) skipBtn.addEventListener('click', skipPhase);

    var closeBtn = $('focus-close');
    if (closeBtn) closeBtn.addEventListener('click', closeAll);

    /* Sound chips (timer) */
    document.querySelectorAll('.sc-timer').forEach(function(c) {
      c.addEventListener('click', function() {
        s.soundType = c.getAttribute('data-sound');
        syncSoundChips('timer');
        syncSoundChips('setup');
        playSound(s.soundType);
      });
    });

    var volSlider = $('focus-volume');
    if (volSlider) volSlider.addEventListener('input', function() { setVolume(parseInt(this.value)); });

    /* Extend chips */
    document.querySelectorAll('.extend-chip').forEach(function(c) {
      c.addEventListener('click', function() { extendTime(parseInt(c.getAttribute('data-add'))); });
    });

    /* Break screen */
    var skipBreak = $('focus-skip-break');
    if (skipBreak) skipBreak.addEventListener('click', function() {
      clearInterval(tickInterval);
      s.pomPhase = 'work';
      s.pomRound = Math.min(s.pomRound + 1, s.pomTotalRounds);
      s.remaining = s.pomWorkMins * 60;
      s.total = s.remaining;
      s.running = false;
      applyModeColor();
      showTimerScreen();
    });

    /* End screen */
    var restartBtn = $('focus-restart-btn');
    if (restartBtn) restartBtn.addEventListener('click', function() { openSetup(); });
    var doneBtn = $('focus-done-btn');
    if (doneBtn) doneBtn.addEventListener('click', closeAll);

    /* Quote click to skip */
    var qs = $('focus-quote-screen');
    if (qs) qs.addEventListener('click', function() {
      clearTimeout(quoteTimeout);
      showTimerScreen();
      setTimeout(function() { togglePause(); }, 100);
    });

    /* Keyboard */
    document.addEventListener('keydown', function(e) {
      var c = $('focus-container');
      if (!c || c.hidden) return;
      if (s.screen === 'focus-timer-screen') {
        if (e.key === ' ') { e.preventDefault(); togglePause(); }
        if (e.key === 'Escape') { closeAll(); }
      } else if (s.screen === 'focus-setup') {
        if (e.key === 'Escape') { s.screen = null; hideContainer(); updateFocusBtn(); }
      } else if (e.key === 'Escape') {
        closeAll();
      }
    });
  }

  /* ─── Init ─── */
  function init() {
    bindEvents();
    loadPrefs();

    var hasSession = checkExistingSession();
    if (hasSession && s.remaining > 0) {
      showContainer();
      applyModeColor();
      if (s.screen === 'focus-break-screen') {
        showBreakScreen();
      } else {
        showTimerScreen();
      }
      updateFocusBtn();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
