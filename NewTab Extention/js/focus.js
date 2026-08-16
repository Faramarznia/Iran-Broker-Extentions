/* ===================================================================
   ایران بروکر — Focus Mode (js/focus.js)  v3.0 – redesigned
   =================================================================== */
(function () {
  'use strict';

  var STORE_KEY  = 'ib_focus_v3';
  var RING_R     = 140;
  var SVG_CX     = 160, SVG_CY = 160;
  var CIRC       = 2 * Math.PI * RING_R; // ≈ 879.65
  var BREAK_R    = 104;
  var BREAK_CIRC = 2 * Math.PI * BREAK_R; // ≈ 653.45

  var IS_MAC = /Mac|iPhone|iPad|iPod/i.test((navigator.platform || '') + ' ' + (navigator.userAgent || ''));
  var FS_KEY = IS_MAC ? '⌃⌘F' : 'F11';

  var QUOTES = [
    { text: 'تمرکز یعنی نه گفتن به صد ایده‌ی خوب.', author: 'استیو جابز' },
    { text: 'بهترین معامله‌گران می‌توانند ساعت‌ها هیچ کاری نکنند.', author: 'جسی لیورمور' },
    { text: 'صبر، مهم‌ترین مهارت یک تریدر موفق است.', author: 'وارن بافت' },
    { text: 'در آرامش قدرتی نهفته است که در شتاب نیست.', author: 'مولانا' },
    { text: 'در بازار، انضباط از هوش مهم‌تر است.', author: 'ری دالیو' },
    { text: 'اول سرمایه را حفظ کن، بعد به سود فکر کن.', author: 'جورج سوروس' },
    { text: 'قلب آرام، تصمیم‌های روشن‌تری می‌گیرد.', author: 'دالایی لاما' },
    { text: 'بازار به کسی که عجله دارد پول نمی‌دهد.', author: 'جسی لیورمور' },
    { text: 'پلن داشتن، یعنی نصف راه را رفتن.', author: 'ایران بروکر' },
    { text: 'کیفیت حضور، مهم‌تر از مقدار زمان است.', author: 'ایران بروکر' },
    { text: 'هر چیزی که احساساتی‌ات می‌کند، احتمالاً اشتباهی است.', author: 'Paul Tudor Jones' }
  ];

  var BREAK_TIPS = [
    'از صفحه دور شو و چند لحظه چشم‌هایت را ببند.',
    'یک لیوان آب بنوش. هیدراتاسیون روی تصمیم‌گیری تأثیر مستقیم دارد.',
    'در استراحت معامله‌ای باز نگذار. ذهنت باید واقعاً استراحت کند.',
    'پنج نفس عمیق بکش. اکسیژن ذهن را روشن می‌کند.',
    'کمی کشش و حرکت بده. نشستن طولانی خستگی می‌آورد.'
  ];

  // [label, duration(ms), orb-scale-target]
  var BREATH_SEQ = [
    ['دم بگیر', 4000, 1.0],
    ['نگه دار', 1800, 1.0],
    ['بازدم',  4200, 0.6]
  ];

  /* ─── State ─── */
  var s = {
    screen: null,
    mode: 'pomodoro',
    running: false,
    remaining: 25 * 60,
    total:     25 * 60,
    pomRound:       1,
    pomTotalRounds: 4,
    pomPhase: 'work',
    pomWorkMins:  25,
    pomShortMins:  5,
    pomLongMins:  15,
    customMins:   45,
    sessStart: '10:30',
    sessEnd:   '12:30',
    sessPreset: 'london',
    intention:  '',
    soundType: 'none',
    volume: 60,
    pauseCount:  0,
    focusedSec:  0,
    streak:      0,
    todayMins:   0,
    lastFocusDate: null
  };

  var tickInterval        = null;
  var quoteTimeout        = null;
  var breathTimeout       = null;
  var breathIdx           = 0;
  var resetConfirmTimeout = null;
  var weWentFs            = false;
  var audioCtx            = null;
  var audioSource         = null;
  var audioGain           = null;
  var audioLfo            = null;

  /* ─── Audio ─── */
  function ensureAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }

  function noiseBuffer() {
    var rate = audioCtx.sampleRate, len = rate * 3;
    var buf  = audioCtx.createBuffer(1, len, rate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  function stopSound() {
    try {
      if (audioSource) { audioSource.stop(); audioSource = null; }
      if (audioLfo)    { audioLfo.stop();    audioLfo    = null; }
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
      src.buffer = noiseBuffer();
      src.loop = true;
      audioSource = src;

      if (type === 'rain') {
        var f = audioCtx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=720; f.Q.value=0.8;
        src.connect(f); f.connect(gain);
      } else if (type === 'ocean') {
        var f2 = audioCtx.createBiquadFilter(); f2.type='lowpass'; f2.frequency.value=500; f2.Q.value=1.2;
        src.connect(f2); f2.connect(gain);
        var lfo = audioCtx.createOscillator(); lfo.frequency.value=0.12;
        var lg  = audioCtx.createGain();       lg.gain.value=0.18;
        lfo.connect(lg); lg.connect(gain.gain); lfo.start(); audioLfo = lfo;
      } else if (type === 'forest') {
        var f3 = audioCtx.createBiquadFilter(); f3.type='bandpass'; f3.frequency.value=1200; f3.Q.value=0.5;
        src.connect(f3); f3.connect(gain);
      }
      src.start();
    } catch(e) {}
  }

  /* ─── Persistence ─── */
  function savePrefs() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        mode: s.mode,
        pomWorkMins: s.pomWorkMins, pomShortMins: s.pomShortMins,
        pomLongMins: s.pomLongMins, pomTotalRounds: s.pomTotalRounds,
        customMins: s.customMins,
        sessStart: s.sessStart, sessEnd: s.sessEnd, sessPreset: s.sessPreset,
        intention: s.intention, soundType: s.soundType, volume: s.volume,
        streak: s.streak, todayMins: s.todayMins, lastFocusDate: s.lastFocusDate
      }));
    } catch(e) {}
  }

  function loadPrefs() {
    try {
      var d = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
      ['mode','pomWorkMins','pomShortMins','pomLongMins','pomTotalRounds',
       'customMins','sessStart','sessEnd','sessPreset',
       'intention','soundType','volume','streak','todayMins','lastFocusDate'
      ].forEach(function(k) { if (d[k] != null) s[k] = d[k]; });
    } catch(e) {}
  }

  /* ─── Utils ─── */
  function toFa(n) {
    return String(Math.max(0, n)).replace(/\d/g, function(d) { return '۰۱۲۳۴۵۶۷۸۹'[d]; });
  }
  function fmt(sec) {
    sec = Math.max(0, sec);
    var m = Math.floor(sec / 60), ss = sec % 60;
    return String(m).padStart(2,'0') + ':' + String(ss).padStart(2,'0');
  }
  function $(id) { return document.getElementById(id); }
  function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function sessDurMin() {
    var a = s.sessStart.split(':'), b = s.sessEnd.split(':');
    var mins = (parseInt(b[0])*60 + parseInt(b[1])) - (parseInt(a[0])*60 + parseInt(a[1]));
    if (mins <= 0) mins += 1440;
    return mins;
  }

  /* ─── Container show/hide ─── */
  function showContainer() {
    var c = $('focus-container'); if (!c) return;
    c.hidden = false;
    requestAnimationFrame(function() { c.classList.add('fc-visible'); });
    var lw = document.querySelector('.layout-wrap');
    if (lw) lw.classList.add('focus-bg-dim');
  }

  function hideContainer() {
    var c = $('focus-container'); if (!c) return;
    c.classList.remove('fc-visible');
    setTimeout(function() { c.hidden = true; }, 350);
    var lw = document.querySelector('.layout-wrap');
    if (lw) lw.classList.remove('focus-bg-dim');
  }

  function showScreen(name) {
    ['focus-setup','focus-quote-screen','focus-timer-screen',
     'focus-break-screen','focus-end-screen'].forEach(function(id) {
      var el = $(id); if (el) el.hidden = (id !== name);
    });
    s.screen = name;
    updatePreviewActive(name);
  }

  /* ─── Preview / state switcher bar ─── */
  function updatePreviewActive(name) {
    var pills = document.querySelectorAll('.fc-preview-pill');
    pills.forEach(function(p) { p.classList.toggle('active', p.getAttribute('data-screen') === name); });
  }

  function preview(name) {
    clearInterval(tickInterval); clearTimeout(quoteTimeout); stopBreath(); stopSound();
    s.running = false;

    if (name === 'focus-setup') {
      showScreen('focus-setup'); syncSetupUI();

    } else if (name === 'focus-quote-screen') {
      var q = randomItem(QUOTES);
      var qt = $('fq-text');   if (qt) qt.textContent = q.text;
      var qa = $('fq-author'); if (qa) qa.textContent = '‏- ' + q.author;
      showScreen('focus-quote-screen');   // static preview — no auto-advance

    } else if (name === 'focus-timer-screen') {
      s.mode = 'pomodoro'; s.pomPhase = 'work'; s.pomRound = 2;
      s.remaining = 18 * 60; s.total = 25 * 60; s.pauseCount = 1; s.running = false;
      showScreen('focus-timer-screen'); renderTimerUI();

    } else if (name === 'focus-break-screen') {
      s.pomPhase = 'short'; s.pomRound = 2;
      s.remaining = 4 * 60; s.total = 5 * 60; s.running = true;
      showScreen('focus-break-screen');
      var st  = $('focus-break-status'); if (st)  st.textContent  = 'استراحت کوتاه';
      var sub = $('focus-break-sub');    if (sub) sub.textContent = breakSubText(false);
      setBreakTip(false);
      snapBreakRing(); renderBreak(); startBreath();
      clearInterval(tickInterval); tickInterval = setInterval(breakTick, 1000);

    } else if (name === 'focus-end-screen') {
      showScreen('focus-end-screen');
      var de = $('es-duration'); if (de) de.textContent = toFa(75);
      var re = $('es-rounds');   if (re) re.textContent = toFa(4);
      var pe = $('es-pauses');   if (pe) pe.textContent = toFa(1);
      var pl = $('es-pauses-label'); if (pl) pl.textContent = 'توقف';
      var se = $('es-streak');   if (se) se.textContent = toFa(4);
    }
    updateFocusBtn();
  }

  /* ─── Theme ─── (delegates to the project's global theme toggle) */
  function toggleGlobalTheme() {
    var globalBtn = document.getElementById('theme-btn');
    if (globalBtn) globalBtn.click();
  }

  /* ─── Fullscreen ─── */
  function isFs() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  }

  function toggleFullscreen() {
    try {
      if (isFs()) {
        (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        weWentFs = false;
      } else {
        var el = document.documentElement;
        (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
        weWentFs = true;
      }
    } catch (e) {}
  }

  function updateFsUI() {
    var on = isFs();
    var enter = document.querySelector('#fc-fs-btn .fc-fs-ico-enter');
    var exit  = document.querySelector('#fc-fs-btn .fc-fs-ico-exit');
    if (enter) enter.hidden = on;
    if (exit)  exit.hidden  = !on;
    var btn = $('fc-fs-btn');
    if (btn) {
      btn.title = on ? 'خروج از تمام‌صفحه (F)' : 'تمام‌صفحه (F)';
      btn.setAttribute('aria-label', btn.title);
    }
    var suggest = $('fc-fs-suggest');
    if (suggest) suggest.hidden = on;               // once fullscreen, the pitch is moot
    var kbd = $('fc-fs-kbd');
    if (kbd) kbd.textContent = FS_KEY;              // native browser shortcut per-OS
  }

  /* ─── Focus button badge ─── */
  function updateFocusBtn() {
    var btn = $('focus-btn'); if (!btn) return;
    if (s.screen && s.screen !== 'focus-setup') {
      btn.classList.add('focus-btn-active');
      var badge = btn.querySelector('.fb-badge');
      if (!badge) { badge = document.createElement('span'); badge.className = 'fb-badge'; btn.appendChild(badge); }
      badge.textContent = fmt(s.remaining) + ' باقی';
    } else {
      btn.classList.remove('focus-btn-active');
      var b2 = btn.querySelector('.fb-badge'); if (b2) b2.remove();
    }
  }

  /* ─── Ring ─── */
  function updateRing() {
    var progress = s.total > 0 ? s.remaining / s.total : 0;
    var offset   = CIRC * (1 - progress);
    var color;
    if (progress <= 1/12) color = 'var(--red)';
    else if (progress <= 0.2)  color = 'var(--orange)';
    else                       color = 'var(--primary)';

    var ring = $('focus-ring-progress');
    if (ring) { ring.style.strokeDashoffset = offset.toFixed(2); ring.style.stroke = color; }

    var ang = (1 - progress) * 2 * Math.PI;
    var cx  = (SVG_CX + RING_R * Math.sin(ang)).toFixed(2);
    var cy  = (SVG_CY - RING_R * Math.cos(ang)).toFixed(2);

    var dot = $('focus-ring-dot');
    if (dot) { dot.setAttribute('cx', cx); dot.setAttribute('cy', cy); dot.style.stroke = color; }
    var halo = $('focus-ring-dot-halo');
    if (halo) { halo.setAttribute('cx', cx); halo.setAttribute('cy', cy); halo.style.fill = color; }
  }

  /* Kill the rewind animation for one frame when the timer jumps to a new
     phase (0 → full), so the ring/bead snap into place instead of spinning back. */
  function snapRing() {
    var svg = $('focus-ring-svg'); if (!svg) return;
    svg.classList.add('fc-instant');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { svg.classList.remove('fc-instant'); });
    });
  }

  /* ─── Setup UI sync ─── */
  function syncSetupUI() {
    // Mode cards
    ['pomodoro','custom','session'].forEach(function(m) {
      var card = $('mode-' + m); if (card) card.classList.toggle('selected', s.mode === m);
    });
    // Sub-config panels
    var pc = $('pom-config'), cc = $('custom-config'), sc2 = $('session-config');
    if (pc)  pc.hidden  = s.mode !== 'pomodoro';
    if (cc)  cc.hidden  = s.mode !== 'custom';
    if (sc2) sc2.hidden = s.mode !== 'session';

    // Stepper values
    var pw = $('pom-work-val');   if (pw)  pw.textContent  = toFa(s.pomWorkMins);
    var ps = $('pom-short-val');  if (ps)  ps.textContent  = toFa(s.pomShortMins);
    var pl = $('pom-long-val');   if (pl)  pl.textContent  = toFa(s.pomLongMins);
    var pr = $('pom-rounds-val'); if (pr)  pr.textContent  = toFa(s.pomTotalRounds);
    var cm = $('custom-mins-val');if (cm)  cm.textContent  = toFa(s.customMins);

    // Custom preset chips
    document.querySelectorAll('.preset-chip').forEach(function(c) {
      c.classList.toggle('active', parseInt(c.getAttribute('data-mins')) === s.customMins);
    });

    // Session chips & time
    document.querySelectorAll('.sess-chip').forEach(function(c) {
      c.classList.toggle('active', c.getAttribute('data-key') === s.sessPreset);
    });
    var ss = $('sess-start-input'); if (ss) ss.value = s.sessStart;
    var se = $('sess-end-input');   if (se) se.value = s.sessEnd;
    updateSessDur();

    // Intention
    var intent = $('fc-intention'); if (intent) intent.value = s.intention;

    // Sound
    syncSoundChips('setup');
    var sv = $('setup-volume'); if (sv) sv.value = s.volume;

    // Streak
    var stk = $('fc-streak-count'); if (stk) stk.textContent = toFa(s.streak);
    var tdm = $('fc-today-mins');   if (tdm) tdm.textContent = toFa(s.todayMins);
  }

  function updateSessDur() {
    var el = $('sess-dur-label'); if (el) el.textContent = toFa(sessDurMin()) + ' دقیقه';
  }

  function syncSoundChips(ctx) {
    document.querySelectorAll('.sc-' + ctx).forEach(function(c) {
      c.classList.toggle('active', c.getAttribute('data-sound') === s.soundType);
    });
  }

  /* ─── Open setup ─── */
  function openSetup() {
    showContainer();
    showScreen('focus-setup');
    syncSetupUI();
    updateFsUI();
  }

  /* ─── Quote / Intro screen ─── */
  function showQuote() {
    showScreen('focus-quote-screen');
    var q  = randomItem(QUOTES);
    var qt = $('fq-text');   if (qt) qt.textContent = q.text;
    var qa = $('fq-author'); if (qa) qa.textContent = '‏- ' + q.author;
    clearTimeout(quoteTimeout);
    quoteTimeout = setTimeout(goTimer, 4600);
  }

  /* ─── Timer screen ─── */
  function goTimer() {
    s.running = true;
    showScreen('focus-timer-screen');
    snapRing();
    renderTimerUI();
    startTicking();
  }

  function startSession() {
    s.running    = false;
    s.pauseCount = 0;
    s.focusedSec = 0;

    if (s.mode === 'pomodoro') {
      s.pomRound  = 1; s.pomPhase = 'work';
      s.remaining = s.pomWorkMins * 60; s.total = s.remaining;
    } else if (s.mode === 'custom') {
      s.remaining = s.customMins * 60; s.total = s.remaining;
    } else {
      var now = new Date(), parts = s.sessEnd.split(':');
      var end = new Date(now);
      end.setHours(parseInt(parts[0]), parseInt(parts[1]), 0, 0);
      if (end <= now) end.setDate(end.getDate() + 1);
      s.remaining = Math.max(60, Math.floor((end - now) / 1000));
      s.total = s.remaining;
    }

    ensureAudio(); playSound(s.soundType);
    showQuote();
  }

  function renderTimerUI() {
    // Countdown
    var cd = $('focus-countdown'); if (cd) cd.textContent = fmt(s.remaining);

    // Mode label
    var labels = {
      pomodoro_work: 'تمرکز', pomodoro_short: 'استراحت کوتاه',
      pomodoro_long: 'استراحت بلند', custom: 'تمرکز', session: 'سشن معاملاتی'
    };
    var key = s.mode === 'pomodoro' ? 'pomodoro_' + s.pomPhase : s.mode;
    var lbl = $('focus-mode-label'); if (lbl) lbl.textContent = labels[key] || '';

    // Round dots
    var ri = $('focus-round-indicator');
    if (ri) {
      if (s.mode === 'pomodoro') {
        var dots = '';
        for (var i = 0; i < s.pomTotalRounds; i++) {
          var cls = 'pom-dot' + (i < s.pomRound-1 ? ' done' : (i === s.pomRound-1 ? ' active' : ''));
          dots += '<span class="' + cls + '"></span>';
        }
        ri.innerHTML = dots; ri.hidden = false;
      } else { ri.hidden = true; }
    }

    // Play/Pause icon
    var tgl = $('focus-toggle');
    if (tgl) {
      tgl.innerHTML = s.running
        ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><rect x="6" y="4" width="4" height="16" rx="1.4"/><rect x="14" y="4" width="4" height="16" rx="1.4"/></svg>'
        : '<svg width="26" height="26" viewBox="0 0 24 24" fill="#fff"><path d="M8 5.5v13l11-6.5z"/></svg>';
    }

    // Skip button
    var skipBtn = $('focus-skip-btn'); if (skipBtn) skipBtn.hidden = s.mode !== 'pomodoro';

    // Paused label
    var pl = $('fc-paused-lbl'); if (pl) pl.hidden = s.running;

    // Timer screen classes
    var ts = $('focus-timer-screen');
    if (ts) {
      ts.classList.toggle('fc-paused', !s.running);
      var pct = s.total > 0 ? s.remaining / s.total : 1;
      ts.classList.toggle('fc-warning',  pct <= 0.2  && pct > 1/12);
      ts.classList.toggle('fc-critical', pct <= 1/12);
    }

    // Intention badge
    var badge = $('fc-intention-badge');
    if (badge) {
      var txt = s.intention.trim();
      badge.textContent = txt;
      badge.hidden = !txt;
    }

    syncSoundChips('timer');
    updateRing();
    updateFocusBtn();
  }

  /* ─── Tick ─── */
  function startTicking() {
    clearInterval(tickInterval);
    if (s.running) tickInterval = setInterval(tick, 1000);
  }

  function tick() {
    s.remaining = Math.max(0, s.remaining - 1);
    if (s.pomPhase === 'work') s.focusedSec++;
    renderTimerUI();
    if (s.remaining <= 0) { clearInterval(tickInterval); onPhaseEnd(); }
  }

  function onPhaseEnd() {
    sendNotification();
    if (s.mode === 'pomodoro') {
      if (s.pomPhase === 'work') {
        s.pomPhase = (s.pomRound % s.pomTotalRounds === 0) ? 'long' : 'short';
        showBreakScreen();
      } else {
        if (s.pomPhase === 'long') { showEndScreen(); return; }
        s.pomRound = Math.min(s.pomRound + 1, s.pomTotalRounds);
        s.pomPhase  = 'work';
        s.remaining = s.pomWorkMins * 60; s.total = s.remaining;
        s.running   = true;
        showScreen('focus-timer-screen'); snapRing(); renderTimerUI(); startTicking();
      }
    } else {
      showEndScreen();
    }
  }

  /* ─── Controls ─── */
  function togglePause() {
    s.running = !s.running;
    if (!s.running) s.pauseCount++;
    if (s.running) startTicking(); else clearInterval(tickInterval);
    renderTimerUI();
  }

  function resetTimer() {
    var btn = $('focus-reset-btn'); if (!btn) return;
    if (btn.dataset.confirm === '1') {
      clearTimeout(resetConfirmTimeout);
      btn.dataset.confirm = '0'; btn.classList.remove('fc-confirm');
      clearInterval(tickInterval);
      s.running = false; s.pauseCount = 0; s.focusedSec = 0;
      if (s.mode === 'pomodoro') {
        s.pomRound = 1; s.pomPhase = 'work';
        s.remaining = s.pomWorkMins * 60; s.total = s.remaining;
      } else { s.remaining = s.total; }
      snapRing();
      renderTimerUI();
    } else {
      btn.dataset.confirm = '1'; btn.classList.add('fc-confirm');
      resetConfirmTimeout = setTimeout(function() {
        btn.dataset.confirm = '0'; btn.classList.remove('fc-confirm');
      }, 1500);
    }
  }

  function skipPhase() {
    if (s.mode !== 'pomodoro') return;
    clearInterval(tickInterval); s.remaining = 0; onPhaseEnd();
  }

  function extendTime(mins) {
    s.remaining += mins * 60; s.total += mins * 60; renderTimerUI();
  }

  /* ─── Break screen ─── */
  var breathReduce = false;

  function startBreath() {
    clearTimeout(breathTimeout); breathIdx = 0;
    breathReduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    var orb = $('fc-breathe-orb');
    if (orb) { orb.style.transition = 'none'; orb.style.transform = 'scale(0.6)'; orb.getBoundingClientRect(); }
    function step() {
      var ph = BREATH_SEQ[breathIdx];
      var el = $('fc-breath-label'); if (el) el.textContent = ph[0];
      if (orb && !breathReduce) {
        orb.style.transition = 'transform ' + ph[1] + 'ms ease-in-out';
        orb.style.transform  = 'scale(' + ph[2] + ')';
      }
      orb && orb.classList.toggle('is-hold', breathIdx === 1);
      breathTimeout = setTimeout(function() {
        breathIdx = (breathIdx + 1) % BREATH_SEQ.length; step();
      }, ph[1]);
    }
    step();
  }

  function stopBreath() {
    clearTimeout(breathTimeout);
    var orb = $('fc-breathe-orb'); if (orb) orb.classList.remove('is-hold');
  }

  function setBreakTip(fade) {
    var box = $('focus-break-tip-box'), el = $('focus-break-tip');
    if (!el) return;
    if (fade && box && !breathReduce) {
      box.classList.add('fc-tip-fade');
      setTimeout(function() { el.textContent = randomItem(BREAK_TIPS); box.classList.remove('fc-tip-fade'); }, 340);
    } else {
      el.textContent = randomItem(BREAK_TIPS);
    }
  }

  function breakSubText(isLong) {
    if (isLong) return 'خستگی رو کامل در کن، نزدیک پایان جلسه‌ای';
    var next = Math.min(s.pomRound + 1, s.pomTotalRounds);
    return 'بعد از این، دور ' + toFa(next) + ' از ' + toFa(s.pomTotalRounds) + ' شروع می‌شود';
  }

  function snapBreakRing() {
    var ring = $('focus-break-ring'); if (!ring) return;
    ring.style.transition = 'none';
    ring.style.strokeDashoffset = '0';
    ring.getBoundingClientRect();
    requestAnimationFrame(function() { ring.style.transition = ''; });
  }

  function showBreakScreen() {
    var isLong  = (s.pomPhase === 'long');
    var breakSec = (isLong ? s.pomLongMins : s.pomShortMins) * 60;
    s.remaining = breakSec; s.total = breakSec; s.running = true;
    showScreen('focus-break-screen');

    var st  = $('focus-break-status'); if (st)  st.textContent  = isLong ? 'استراحت بلند' : 'استراحت کوتاه';
    var sub = $('focus-break-sub');    if (sub) sub.textContent = breakSubText(isLong);
    setBreakTip(false);

    snapBreakRing();
    renderBreak();
    startBreath();
    clearInterval(tickInterval);
    tickInterval = setInterval(breakTick, 1000);
  }

  function renderBreak() {
    var bt = $('focus-break-time'); if (bt) bt.textContent = fmt(s.remaining);
    var ring = $('focus-break-ring');
    if (ring) {
      var progress = s.total > 0 ? s.remaining / s.total : 0;
      ring.style.strokeDashoffset = (BREAK_CIRC * (1 - progress)).toFixed(2);
    }
    updateFocusBtn();
  }

  function breakTick() {
    s.remaining = Math.max(0, s.remaining - 1);
    renderBreak();
    if (s.remaining > 0 && s.remaining % 20 === 0) setBreakTip(true);
    if (s.remaining <= 0) {
      clearInterval(tickInterval); stopBreath();
      if (s.pomPhase === 'long') { showEndScreen(); return; }
      s.pomRound  = Math.min(s.pomRound + 1, s.pomTotalRounds);
      s.pomPhase  = 'work';
      s.remaining = s.pomWorkMins * 60; s.total = s.remaining;
      s.running   = true;
      showScreen('focus-timer-screen'); snapRing(); renderTimerUI(); startTicking();
    }
  }

  /* ─── End screen ─── */
  function showEndScreen() {
    clearInterval(tickInterval); stopSound(); stopBreath(); s.running = false;

    var today = new Date().toDateString();
    if (s.lastFocusDate !== today) { s.streak = (s.streak || 0) + 1; s.lastFocusDate = today; }
    var dur = Math.round(s.focusedSec / 60) || Math.round(s.total / 60);
    s.todayMins = (s.todayMins || 0) + dur;
    var endRounds = s.mode === 'pomodoro' ? s.pomTotalRounds : 1;

    showScreen('focus-end-screen');
    var de = $('es-duration'); if (de) de.textContent = toFa(dur);
    var re = $('es-rounds');   if (re) re.textContent = toFa(endRounds);
    var pe = $('es-pauses');   if (pe) pe.textContent = toFa(s.pauseCount);
    var pl = $('es-pauses-label');
    if (pl) pl.textContent = s.pauseCount === 0 ? 'بدون وقفه' : 'توقف';
    var se2 = $('es-streak'); if (se2) se2.textContent = toFa(s.streak);

    savePrefs();
    updateFocusBtn();
  }

  /* ─── Notifications ─── */
  function sendNotification() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try { new Notification('⏱ تمرکز تموم شد!', { body: 'وقت استراحته. آفرین!', icon: '../icons/icon48.png' }); } catch(e) {}
  }

  /* ─── Close ─── */
  function closeAll() {
    clearInterval(tickInterval); clearTimeout(quoteTimeout);
    stopSound(); stopBreath();
    s.running = false; s.screen = null;
    if (weWentFs && isFs()) {
      try { (document.exitFullscreen || document.webkitExitFullscreen).call(document); } catch(e) {}
    }
    weWentFs = false;
    hideContainer(); updateFocusBtn();
  }

  /* ─── Stepper helper ─── */
  function bindStepper(decId, incId, key, step, min, max, valId) {
    function update(dir) {
      s[key] = Math.max(min, Math.min(max, s[key] + dir * step));
      var el = $(valId); if (el) el.textContent = toFa(s[key]);
      savePrefs();
    }
    var dec = $(decId), inc = $(incId);
    if (dec) dec.addEventListener('click', function() { update(-1); });
    if (inc) inc.addEventListener('click', function() { update(1); });
  }

  /* ─── Bind all events ─── */
  function bindEvents() {
    // Focus open button
    var focusBtn = $('focus-btn');
    if (focusBtn) focusBtn.addEventListener('click', openSetup);

    // Theme toggle — reuses the project's global theme system
    var themeBtn = $('fc-theme-btn');
    if (themeBtn) themeBtn.addEventListener('click', toggleGlobalTheme);

    // Fullscreen toggle + suggestion
    var fsBtn = $('fc-fs-btn');
    if (fsBtn) fsBtn.addEventListener('click', toggleFullscreen);
    var fsSuggest = $('fc-fs-suggest');
    if (fsSuggest) fsSuggest.addEventListener('click', toggleFullscreen);
    document.addEventListener('fullscreenchange', updateFsUI);
    document.addEventListener('webkitfullscreenchange', updateFsUI);
    updateFsUI();

    // Preview / state switcher pills
    document.querySelectorAll('.fc-preview-pill').forEach(function(p) {
      p.addEventListener('click', function() { preview(p.getAttribute('data-screen')); });
    });

    // Close (always-visible top-left button)
    var closeBtn = $('fc-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', closeAll);

    // Mode cards
    ['pomodoro','custom','session'].forEach(function(m) {
      var card = $('mode-' + m); if (!card) return;
      card.addEventListener('click', function() { s.mode = m; syncSetupUI(); savePrefs(); });
    });

    // Pomodoro steppers
    bindStepper('dec-work',   'inc-work',   'pomWorkMins',    5, 5,  90, 'pom-work-val');
    bindStepper('dec-short',  'inc-short',  'pomShortMins',   1, 1,  30, 'pom-short-val');
    bindStepper('dec-long',   'inc-long',   'pomLongMins',    5, 5,  45, 'pom-long-val');
    bindStepper('dec-rounds', 'inc-rounds', 'pomTotalRounds', 1, 2,   8, 'pom-rounds-val');
    bindStepper('dec-custom', 'inc-custom', 'customMins',     5, 5, 180, 'custom-mins-val');

    // Custom preset chips
    document.querySelectorAll('.preset-chip').forEach(function(c) {
      c.addEventListener('click', function() {
        s.customMins = parseInt(c.getAttribute('data-mins'));
        s.mode = 'custom';
        syncSetupUI(); savePrefs();
      });
    });

    // Session preset chips
    document.querySelectorAll('.sess-chip').forEach(function(c) {
      c.addEventListener('click', function() {
        s.sessPreset = c.getAttribute('data-key');
        s.sessStart  = c.getAttribute('data-start');
        s.sessEnd    = c.getAttribute('data-end');
        syncSetupUI(); savePrefs();
      });
    });

    // Session time inputs
    var ssInput = $('sess-start-input');
    if (ssInput) ssInput.addEventListener('change', function() {
      s.sessStart = this.value; s.sessPreset = '';
      updateSessDur(); savePrefs();
    });
    var seInput = $('sess-end-input');
    if (seInput) seInput.addEventListener('change', function() {
      s.sessEnd = this.value; s.sessPreset = '';
      updateSessDur(); savePrefs();
    });

    // Intention input
    var intentInput = $('fc-intention');
    if (intentInput) intentInput.addEventListener('input', function() { s.intention = this.value; });

    // Sound chips — setup
    document.querySelectorAll('.sc-setup').forEach(function(c) {
      c.addEventListener('click', function() {
        s.soundType = c.getAttribute('data-sound');
        syncSoundChips('setup'); syncSoundChips('timer'); savePrefs();
      });
    });
    var sv = $('setup-volume');
    if (sv) sv.addEventListener('input', function() {
      s.volume = parseInt(this.value);
      if (audioGain) audioGain.gain.value = s.volume / 100 * 0.3;
      savePrefs();
    });

    // Sound chips — timer
    document.querySelectorAll('.sc-timer').forEach(function(c) {
      c.addEventListener('click', function() {
        s.soundType = c.getAttribute('data-sound');
        syncSoundChips('timer'); syncSoundChips('setup');
        ensureAudio(); playSound(s.soundType); savePrefs();
      });
    });

    // Start button
    var startBtn = $('start-focus-btn');
    if (startBtn) startBtn.addEventListener('click', function() {
      if (window.Notification && Notification.permission === 'default') Notification.requestPermission();
      savePrefs(); startSession();
    });

    // Quote screen — click to skip
    var qs = $('focus-quote-screen');
    if (qs) qs.addEventListener('click', function() { clearTimeout(quoteTimeout); goTimer(); });

    // Timer controls
    var toggleBtn = $('focus-toggle');
    if (toggleBtn) toggleBtn.addEventListener('click', togglePause);

    var resetBtn = $('focus-reset-btn');
    if (resetBtn) { resetBtn.dataset.confirm = '0'; resetBtn.addEventListener('click', resetTimer); }

    var skipBtn = $('focus-skip-btn');
    if (skipBtn) skipBtn.addEventListener('click', skipPhase);

    // Extend chips
    document.querySelectorAll('.extend-chip').forEach(function(c) {
      c.addEventListener('click', function() { extendTime(parseInt(c.getAttribute('data-add'))); });
    });

    // Break: skip
    var skipBreak = $('focus-skip-break');
    if (skipBreak) skipBreak.addEventListener('click', function() {
      clearInterval(tickInterval); stopBreath();
      s.pomRound  = Math.min(s.pomRound + 1, s.pomTotalRounds);
      s.pomPhase  = 'work';
      s.remaining = s.pomWorkMins * 60; s.total = s.remaining;
      s.running   = true;
      showScreen('focus-timer-screen'); snapRing(); renderTimerUI(); startTicking();
    });

    // End screen
    var restartBtn = $('focus-restart-btn');
    if (restartBtn) restartBtn.addEventListener('click', openSetup);
    var doneBtn = $('focus-done-btn');
    if (doneBtn) doneBtn.addEventListener('click', closeAll);

    // Keyboard
    document.addEventListener('keydown', function(e) {
      var c = $('focus-container'); if (!c || c.hidden) return;
      var typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target && e.target.tagName) || '');
      if (!typing && (e.key === 'f' || e.key === 'F')) { e.preventDefault(); toggleFullscreen(); return; }
      if (s.screen === 'focus-timer-screen') {
        if (e.key === ' ') { e.preventDefault(); togglePause(); }
        if (e.key === 'Escape') closeAll();
      } else if (e.key === 'Escape') { closeAll(); }
    });
  }

  /* ─── Init ─── */
  function init() {
    loadPrefs();
    bindEvents();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
