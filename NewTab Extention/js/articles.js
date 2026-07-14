/* ============================================================
   IranBroker NewTab — Articles Sidebar (left edge)
   ┌ mirrors the community sidebar on the right
   ├ content : latest IranBroker articles (WP REST, RSS fallback)
   ├ hero card for the newest post + compact rows below
   └ category chips filter · 30-min cache · staggered open
   ============================================================ */
(function () {
  'use strict';

  var CACHE_KEY = 'ib_articles_v1';
  var COLLAPSE_KEY = 'ib_sb_art';
  var CACHE_TTL = 30 * 60 * 1000;
  var PALETTE = ['#6f9bf3', '#2eb86e', '#f6a723', '#a78bfa',
                 '#35d0c0', '#f6679f', '#fb8a3c', '#5ad0f0'];

  var posts = [];
  var activeCat = 'همه';

  /* ─────────── utils ─────────── */
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function escA(s) { return String(s).replace(/"/g, '&quot;'); }
  function hexA(hex, a) {
    var h = hex.replace('#', '');
    var n = parseInt(h, 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  function catColor(id) { return PALETTE[Math.abs(id || 0) % PALETTE.length]; }
  function decodeHtml(str) {
    if (!str) return '';
    var ta = document.createElement('textarea');
    ta.innerHTML = str;
    return ta.value;
  }
  function relTimeFa(ts) {
    if (!ts) return '';
    var diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return 'چند لحظه پیش';
    if (diff < 3600) return Math.floor(diff / 60) + ' دقیقه پیش';
    if (diff < 86400) return Math.floor(diff / 3600) + ' ساعت پیش';
    if (diff < 30 * 86400) return Math.floor(diff / 86400) + ' روز پیش';
    return Math.floor(diff / (30 * 86400)) + ' ماه پیش';
  }
  function isFresh(ts) { return !!(ts && Date.now() - ts < 24 * 3600 * 1000); }

  /* ─────────── data ─────────── */
  function loadFromRest() {
    var url = 'https://iranbroker.net/wp-json/wp/v2/posts?per_page=12' +
      '&_embed=wp:featuredmedia,wp:term&_fields=id,title,link,date_gmt,_links,_embedded';
    return fetch(url)
      .then(function (r) { if (!r.ok) throw new Error('http'); return r.json(); })
      .then(function (data) {
        if (!Array.isArray(data) || !data.length) throw new Error('empty');
        var parsed = data.map(function (p) {
          var title = decodeHtml((p.title && p.title.rendered || '').replace(/<[^>]+>/g, '')).trim();
          if (!title) return null;
          var emb = p._embedded || {};
          var term = ((emb['wp:term'] && emb['wp:term'][0]) || [])[0];
          var img = null;
          var media = emb['wp:featuredmedia'] && emb['wp:featuredmedia'][0];
          if (media) {
            var sizes = media.media_details && media.media_details.sizes;
            img = (sizes && sizes.medium && sizes.medium.source_url) || media.source_url || null;
          }
          var ts = p.date_gmt ? Date.parse(p.date_gmt + 'Z') : NaN;
          return {
            title: title,
            url: p.link,
            cat: term ? term.name : 'مقاله',
            catColor: term ? catColor(term.id) : PALETTE[0],
            img: img,
            ts: isFinite(ts) ? ts : null
          };
        }).filter(Boolean);
        if (!parsed.length) throw new Error('empty');
        return parsed;
      });
  }

  function loadFromRss() {
    return fetch('https://iranbroker.net/feed/')
      .then(function (r) { return r.text(); })
      .then(function (text) {
        var doc = new DOMParser().parseFromString(text, 'text/xml');
        var items = Array.prototype.slice.call(doc.querySelectorAll('item'));
        if (!items.length) throw new Error('empty');
        var parsed = items.slice(0, 12).map(function (item) {
          var q = function (sel) { var e = item.querySelector(sel); return e ? e.textContent.trim() : ''; };
          var title = q('title').replace(/<!\[CDATA\[|\]\]>/g, '').trim();
          if (!title) return null;
          var cat = (q('category') || 'مقاله').replace(/<!\[CDATA\[|\]\]>/g, '').trim();
          var seed = 0;
          for (var i = 0; i < cat.length; i++) seed = (seed * 31 + cat.charCodeAt(i)) & 0xffff;
          var img = null;
          var enc = item.querySelector('enclosure');
          if (enc && /^image\//i.test(enc.getAttribute('type') || '')) img = enc.getAttribute('url');
          if (!img) {
            var desc = q('description');
            var m = desc.match(/<img[^>]+src=["']([^"']+)["']/i);
            if (m) img = m[1];
          }
          var ts = q('pubDate') ? Date.parse(q('pubDate')) : NaN;
          return {
            title: title,
            url: q('guid') || q('link') || 'https://iranbroker.net/',
            cat: cat,
            catColor: catColor(seed),
            img: img,
            ts: isFinite(ts) ? ts : null
          };
        }).filter(Boolean);
        if (!parsed.length) throw new Error('empty');
        return parsed;
      });
  }

  function readCache() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var d = JSON.parse(raw);
      if (!d || !Array.isArray(d.posts) || !d.posts.length) return null;
      return d;
    } catch (e) { return null; }
  }
  function writeCache() {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), posts: posts })); } catch (e) {}
  }

  function load(force) {
    var cache = readCache();
    if (cache) { posts = cache.posts; render(); }
    if (!force && cache && Date.now() - cache.t < CACHE_TTL) return;
    if (!cache) renderSkeleton();
    loadFromRest()
      .catch(function () { return loadFromRss(); })
      .then(function (parsed) { posts = parsed; writeCache(); render(); })
      .catch(function () { if (!posts.length) renderError(); });
  }

  /* ─────────── render ─────────── */
  function renderSkeleton() {
    var list = $('sb-art-list'); if (!list) return;
    var html = '<div class="ar-skel ar-skel-hero"></div>';
    for (var i = 0; i < 5; i++) {
      html += '<div class="ar-skel-row"><div class="ar-skel ar-skel-thumb"></div>' +
        '<div class="ar-skel-lines"><div class="ar-skel ar-skel-l1"></div><div class="ar-skel ar-skel-l2"></div></div></div>';
    }
    list.innerHTML = html;
  }

  function renderError() {
    var list = $('sb-art-list'); if (!list) return;
    list.innerHTML =
      '<div class="ar-err">' +
        '<span class="ar-err-ic">📡</span>' +
        '<span>مقالات در دسترس نیست</span>' +
        '<button id="sb-art-retry" class="ar-retry">تلاش دوباره</button>' +
      '</div>';
    var b = $('sb-art-retry');
    if (b) b.addEventListener('click', function () { load(true); });
  }

  function renderChips() {
    var box = $('art-chips'); if (!box) return;
    var cats = [];
    posts.forEach(function (p) {
      if (p.cat && cats.indexOf(p.cat) < 0) cats.push(p.cat);
    });
    if (cats.length < 2) { box.hidden = true; box.innerHTML = ''; return; }
    if (activeCat !== 'همه' && cats.indexOf(activeCat) < 0) activeCat = 'همه';
    box.hidden = false;
    box.innerHTML = ['همه'].concat(cats.slice(0, 5)).map(function (c) {
      var col = c === 'همه' ? 'var(--primary)' : ((posts.filter(function (p) { return p.cat === c; })[0] || {}).catColor || PALETTE[0]);
      return '<button class="ar-chip' + (activeCat === c ? ' active' : '') + '" data-cat="' + escA(c) + '" style="--chip:' + col + '">' + esc(c) + '</button>';
    }).join('');
  }

  function heroHTML(p, i) {
    return '<a class="ar-hero ar-stag" style="--i:' + i + '" href="' + escA(p.url) + '" target="_blank" rel="noopener">' +
      (p.img
        ? '<img class="ar-hero-img" src="' + escA(p.img) + '" alt="" loading="lazy"/>'
        : '<div class="ar-hero-img ar-hero-ph" style="background:linear-gradient(135deg,' + hexA(p.catColor, .55) + ',' + hexA(p.catColor, .15) + ')"></div>') +
      '<div class="ar-hero-grad"></div>' +
      '<div class="ar-hero-body">' +
        '<div class="ar-hero-meta">' +
          '<span class="ar-badge" style="background:' + hexA(p.catColor, .9) + '">' + esc(p.cat) + '</span>' +
          (isFresh(p.ts) ? '<span class="ar-fresh">تازه</span>' : '') +
        '</div>' +
        '<div class="ar-hero-title">' + esc(p.title) + '</div>' +
        '<div class="ar-hero-time">' + relTimeFa(p.ts) + '</div>' +
      '</div>' +
    '</a>';
  }

  function rowHTML(p, i) {
    return '<a class="ar-item ar-stag" style="--i:' + i + '" href="' + escA(p.url) + '" target="_blank" rel="noopener">' +
      '<span class="ar-thumb" style="background:' + hexA(p.catColor, .14) + ';color:' + p.catColor + '">' +
        '<span class="ar-thumb-ph">' + esc((p.cat || 'م').slice(0, 2)) + '</span>' +
        (p.img ? '<img class="ar-thumb-img" src="' + escA(p.img) + '" alt="" loading="lazy"/>' : '') +
      '</span>' +
      '<span class="ar-body">' +
        '<span class="ar-title">' + esc(p.title) + '</span>' +
        '<span class="ar-meta">' +
          '<i class="ar-meta-dot" style="background:' + p.catColor + '"></i>' +
          '<span class="ar-meta-cat">' + esc(p.cat) + '</span>' +
          '<span class="ar-meta-sep">·</span>' +
          '<span>' + relTimeFa(p.ts) + '</span>' +
          (isFresh(p.ts) ? '<span class="ar-fresh">تازه</span>' : '') +
        '</span>' +
      '</span>' +
      '<span class="ar-go" aria-hidden="true">' +
        '<svg viewBox="0 0 16 16" width="12" height="12" fill="none"><path d="M10 4L6 8l4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      '</span>' +
    '</a>';
  }

  function render() {
    var list = $('sb-art-list'); if (!list) return;
    renderChips();
    var shown = activeCat === 'همه' ? posts : posts.filter(function (p) { return p.cat === activeCat; });
    if (!shown.length) {
      list.innerHTML = '<div class="ar-err"><span>مقاله‌ای در این دسته نیست</span></div>';
      return;
    }
    var html = heroHTML(shown[0], 0);
    for (var i = 1; i < shown.length; i++) html += rowHTML(shown[i], i);
    list.innerHTML = html;
  }

  /* replay the staggered entrance every time the panel opens */
  function replayStagger() {
    var list = $('sb-art-list'); if (!list) return;
    Array.prototype.forEach.call(list.querySelectorAll('.ar-stag'), function (n) {
      n.classList.remove('ar-stag');
      void n.offsetWidth;
      n.classList.add('ar-stag');
    });
  }

  /* ─────────── init ─────────── */
  function init() {
    var sb = $('sb-articles'); if (!sb) return;
    /* پنل از HTML به‌صورت بسته رندر می‌شود تا هنگام بارگذاری چشمک نزند. */
    try { if (localStorage.getItem(COLLAPSE_KEY) === '0') sb.classList.remove('collapsed'); }
    catch (e) {}

    function toggle() {
      var closing = !sb.classList.contains('collapsed');
      sb.classList.toggle('collapsed');
      try { localStorage.setItem(COLLAPSE_KEY, closing ? '1' : '0'); } catch (e) {}
      if (!closing) replayStagger();
    }
    var tab = $('sb-art-tab'), tg = $('sb-art-toggle'), rf = $('sb-art-refresh');
    if (tab) tab.addEventListener('click', toggle);
    if (tg) tg.addEventListener('click', toggle);
    if (rf) rf.addEventListener('click', function () {
      rf.classList.add('spin');
      setTimeout(function () { rf.classList.remove('spin'); }, 700);
      load(true);
    });

    var chips = $('art-chips');
    if (chips) chips.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-cat]');
      if (!btn) return;
      activeCat = btn.getAttribute('data-cat');
      render();
    });

    load(false);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
