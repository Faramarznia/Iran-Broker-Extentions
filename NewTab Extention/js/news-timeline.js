/* ===================================================================
   IranBroker NewTab — تایم‌لاین اخبار فارکس (news-timeline)
   نوار باریک بالای صفحه: رویدادهای مهم امروزِ تقویم اقتصادی روی یک
   تایم‌لاین کوچک + شمارش معکوس تا خبر مهم بعدی + حالت بریکینگ نیوز.
   در هر سه چیدمان (simple / data / hub) درست زیر topbar دیده می‌شود.

   No external libraries · localStorage only · MV3 safe · standalone IIFE
   =================================================================== */
(function () {
  'use strict';

  var FEED_URL = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json';
  var PREF_KEY = 'ib_news_timeline_v1';   // { enabled: bool }
  var CACHE_KEY = 'ib_ff_calendar_v1';    // { data, ts }

  var TICK_MS = 1000;
  var FEED_TTL = 30 * 60 * 1000;          // refresh feed every 30 min
  var BREAKING_MS = 15 * 60 * 1000;       // High within 15m → breaking
  var LIVE_MS = 5 * 60 * 1000;            // still "live" up to 5m after release
  var SOON_MS = 60 * 60 * 1000;           // within 1h → highlighted
  var PAD_MS = 30 * 60 * 1000;            // timeline padding before/after events

  var IMPACT_CLASS = { High: 'high', Medium: 'medium', Low: 'low', Holiday: 'low' };

  // ── small helpers ────────────────────────────────────────────────────
  var FA = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  function faDigits(s) { return String(s).replace(/[0-9]/g, function (d) { return FA[+d]; }); }
  function pad2(n) { return n < 10 ? '0' + n : '' + n; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }

  function tehranKey(ms) {
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit'
      }).format(new Date(ms));
    } catch (e) { return new Date(ms).toISOString().slice(0, 10); }
  }
  function tehranHM(ms) {
    try {
      return new Intl.DateTimeFormat('fa-IR', {
        timeZone: 'Asia/Tehran', hour: '2-digit', minute: '2-digit', hour12: false
      }).format(new Date(ms));
    } catch (e) { return '—'; }
  }

  // compact, glanceable countdown
  function fmtCountdown(deltaMs) {
    var s = Math.max(0, Math.floor(deltaMs / 1000));
    if (s >= 3600) {
      var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
      return faDigits(h + ':' + pad2(m)) + ' ساعت';
    }
    if (s >= 60) return faDigits(pad2(Math.floor(s / 60)) + ':' + pad2(s % 60));
    return faDigits(s) + ' ثانیه';
  }

  function readJSON(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { return null; }
  }
  function writeJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }

  // ── preferences ──────────────────────────────────────────────────────
  function isEnabled() {
    var p = readJSON(PREF_KEY);
    return !p || p.enabled !== false; // default ON
  }
  function setEnabled(on) { writeJSON(PREF_KEY, { enabled: !!on }); }

  // ── feed (own 30-min cache; falls back to stale cache on failure) ─────
  var feedInflight = null;
  function loadFeed(force) {
    var cache = readJSON(CACHE_KEY);
    if (!force && cache && cache.ts && (Date.now() - cache.ts < FEED_TTL) && Array.isArray(cache.data)) {
      return Promise.resolve(cache.data);
    }
    if (feedInflight) return feedInflight;

    var controller = new AbortController();
    var to = setTimeout(function () { controller.abort(); }, 8000);
    feedInflight = fetch(FEED_URL, { signal: controller.signal })
      .then(function (r) { if (!r.ok) throw new Error('http'); return r.json(); })
      .then(function (data) {
        var arr = Array.isArray(data) ? data : [];
        writeJSON(CACHE_KEY, { data: arr, ts: Date.now() });
        return arr;
      })
      .catch(function () {
        // network failed → reuse whatever we last had (may be stale)
        return (cache && Array.isArray(cache.data)) ? cache.data : [];
      })
      .then(function (arr) { clearTimeout(to); feedInflight = null; return arr; });

    return feedInflight;
  }

  // ── main ─────────────────────────────────────────────────────────────
  function start() {
    var root = document.getElementById('news-ribbon');
    if (!root) return;

    var flagText = root.querySelector('.nr-flag-text');
    var chip = document.getElementById('nr-next');
    var impactEl = document.getElementById('nr-impact');
    var curEl = document.getElementById('nr-cur');
    var nameEl = document.getElementById('nr-name');
    var countEl = document.getElementById('nr-count');
    var track = document.getElementById('nr-track');
    var nowEl = document.getElementById('nr-now');
    var pop = document.getElementById('nr-pop');
    var toggleEl = document.getElementById('set-news-timeline');

    var events = [];     // today's High/Medium events {ms,title,cur,impact}, sorted
    var win = null;      // { start, end }
    var currentKey = '';
    var timer = null;

    // Today's important events, normalized + sorted by absolute time.
    function computeEvents(raw) {
      var nowKey = tehranKey(Date.now());
      return (raw || []).map(function (e) {
        return {
          ms: Date.parse(e.date),
          title: e.title || e.name || '—',
          cur: e.country || e.currency || '',
          impact: e.impact || 'Low'
        };
      }).filter(function (e) {
        return !isNaN(e.ms) && (e.impact === 'High' || e.impact === 'Medium') && tehranKey(e.ms) === nowKey;
      }).sort(function (a, b) { return a.ms - b.ms; });
    }

    // reference event: live High → nearest upcoming High → nearest upcoming
    function pickReference(now) {
      for (var i = 0; i < events.length; i++) {
        var e = events[i];
        if (e.impact === 'High' && now >= e.ms && now < e.ms + LIVE_MS) return { ev: e, live: true };
      }
      var upcoming = events.filter(function (e) { return e.ms > now; });
      if (!upcoming.length) return null;
      var nextHigh = null;
      for (var j = 0; j < upcoming.length; j++) { if (upcoming[j].impact === 'High') { nextHigh = upcoming[j]; break; } }
      return { ev: nextHigh || upcoming[0], live: false };
    }

    function stateFor(ref, now) {
      if (!ref) return 'done';
      if (ref.live) return 'breaking';
      var delta = ref.ev.ms - now;
      if (ref.ev.impact === 'High' && delta <= BREAKING_MS) return 'breaking';
      if (delta <= SOON_MS) return 'soon';
      return 'calm';
    }

    function pos(ms) {
      if (!win) return 0;
      var p = (ms - win.start) / (win.end - win.start);
      return Math.max(0, Math.min(1, p)) * 100;
    }

    function keyOf(ref) { return ref ? (String(ref.ev.ms) + (ref.live ? 'L' : '')) : 'none'; }

    // Full (infrequent) render: track ticks + chip content.
    function render() {
      var now = Date.now();
      var ref = pickReference(now);
      var state = stateFor(ref, now);
      root.setAttribute('data-state', state);
      currentKey = keyOf(ref);

      if (events.length) {
        var first = events[0].ms, last = events[events.length - 1].ms;
        win = { start: Math.min(first, now) - PAD_MS, end: Math.max(last, now) + PAD_MS };
      } else {
        win = null;
      }

      var ticks = events.map(function (e) {
        var cls = ['nr-tick', IMPACT_CLASS[e.impact] || 'low'];
        if (e.ms < now) cls.push('past');
        if (ref && !ref.live && e.ms === ref.ev.ms) cls.push('next');
        var title = tehranHM(e.ms) + ' — ' + e.cur + ' · ' + e.title;
        return '<span class="' + cls.join(' ') + '" data-ms="' + e.ms +
          '" style="right:' + pos(e.ms).toFixed(2) + '%" title="' + esc(title) + '"></span>';
      }).join('');
      var old = track.querySelectorAll('.nr-tick');
      for (var k = 0; k < old.length; k++) old[k].remove();
      track.insertAdjacentHTML('beforeend', ticks);

      if (ref) {
        var ev = ref.ev;
        if (impactEl) impactEl.className = 'nr-impact ' + (IMPACT_CLASS[ev.impact] || 'low');
        if (curEl) curEl.textContent = ev.cur || '';
        if (nameEl) nameEl.textContent = ev.title;
        chip.classList.remove('is-empty');
      } else {
        if (nameEl) nameEl.textContent = 'امروز خبر پراهمیتی نمانده';
        if (curEl) curEl.textContent = '';
        if (impactEl) impactEl.className = 'nr-impact';
        chip.classList.add('is-empty');
      }

      updateCount(ref, now);
      updateFlag(state);
      positionNow(now);
      if (pop && !pop.hidden) renderPop(now);
    }

    function updateFlag(state) {
      if (flagText) flagText.textContent = state === 'breaking' ? 'بریکینگ نیوز' : 'تقویم فارکس';
    }
    function updateCount(ref, now) {
      if (!countEl) return;
      if (!ref) { countEl.textContent = ''; return; }
      countEl.textContent = ref.live ? 'در حال انتشار' : fmtCountdown(ref.ev.ms - now);
    }
    function positionNow(now) {
      if (!nowEl) return;
      if (!win) { nowEl.style.display = 'none'; return; }
      nowEl.style.display = '';
      nowEl.style.right = pos(now).toFixed(3) + '%';
    }

    // lightweight per-second update
    function tick() {
      var now = Date.now();
      var ref = pickReference(now);
      if (keyOf(ref) !== currentKey) { render(); return; }
      updateCount(ref, now);
      root.setAttribute('data-state', stateFor(ref, now));
      positionNow(now);
      var un = track.querySelectorAll('.nr-tick:not(.past)');
      for (var i = 0; i < un.length; i++) { if (+un[i].dataset.ms < now) un[i].classList.add('past'); }
      if (pop && !pop.hidden) renderPop(now);
    }

    function startTimer() {
      if (timer || document.hidden || !isEnabled()) return;
      timer = setInterval(tick, TICK_MS);
    }
    function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }

    // ── popover: today's schedule ──
    function renderPop(now) {
      if (!pop) return;
      if (!events.length) { pop.innerHTML = '<div class="nr-pop-empty">امروز رویداد پراهمیتی نیست</div>'; return; }
      pop.innerHTML = '<div class="nr-pop-head">رویدادهای مهم امروز</div>' + events.map(function (e) {
        var past = e.ms < now;
        var live = e.impact === 'High' && now >= e.ms && now < e.ms + LIVE_MS;
        var rel = live ? 'در حال انتشار' : (past ? 'گذشته' : fmtCountdown(e.ms - now));
        return '<div class="nr-pop-row ' + (past ? 'past' : '') + (live ? ' live' : '') + '">' +
          '<span class="nr-pop-dot ' + (IMPACT_CLASS[e.impact] || 'low') + '"></span>' +
          '<span class="nr-pop-time">' + esc(tehranHM(e.ms)) + '</span>' +
          '<span class="nr-pop-cur">' + esc(e.cur) + '</span>' +
          '<span class="nr-pop-name">' + esc(e.title) + '</span>' +
          '<span class="nr-pop-rel">' + esc(rel) + '</span>' +
        '</div>';
      }).join('');
    }
    function togglePop(force) {
      if (!pop) return;
      var show = force != null ? force : pop.hidden;
      if (show) renderPop(Date.now());
      pop.hidden = !show;
      chip.setAttribute('aria-expanded', show ? 'true' : 'false');
    }

    // ── visibility: shown whenever the user hasn't turned it off, in all
    // three layouts — independent of whether today happens to have any
    // important events (an empty day still renders a calm "no news" state
    // so the ribbon — and its toggle — stay predictable) ──
    function applyVisibility() {
      document.body.classList.toggle('news-off', !isEnabled());
      if (isEnabled()) {
        root.classList.add('nr-ready');
        root.hidden = false;
        startTimer();
      } else {
        root.classList.remove('nr-ready');
        root.hidden = true;
        togglePop(false);
        stopTimer();
      }
    }

    function refresh(force) {
      return loadFeed(force).then(function (raw) {
        events = computeEvents(raw);
        render();
      }).catch(function () {
        render(); // still show the ribbon (empty state) even if the feed failed
      }).then(function () {
        applyVisibility();
      });
    }

    // ── wiring ──
    if (chip) chip.addEventListener('click', function (e) { e.stopPropagation(); togglePop(); });
    document.addEventListener('click', function (e) {
      if (pop && !pop.hidden && !root.contains(e.target)) togglePop(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && pop && !pop.hidden) togglePop(false);
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stopTimer();
      else { startTimer(); if (root.classList.contains('nr-ready')) tick(); }
    });

    // settings toggle (self-wired — the monolith doesn't know this control)
    if (toggleEl) {
      toggleEl.checked = isEnabled();
      toggleEl.addEventListener('change', function () {
        setEnabled(toggleEl.checked);
        applyVisibility();
      });
    }

    // show the ribbon right away (loading state) instead of waiting on the
    // feed — a slow/failed fetch should never leave it looking "missing"
    applyVisibility();

    refresh(false);
    setInterval(function () { refresh(false); }, FEED_TTL);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
