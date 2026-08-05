/* ============================================================
   IranBroker NewTab — Sidebar scrim
   وقتی هر کدام از پنل‌های کناری (کامیونیتی / مقالات) باز است،
   بقیهٔ صفحه تیره می‌شود تا تمرکز روی پنل بیفتد.
   کلیک روی تیرگی یا Esc → بستن پنل باز.
   ============================================================ */
(function () {
  'use strict';

  var IDS = ['sb-community', 'sb-articles'];

  function panels() {
    return IDS.map(function (id) { return document.getElementById(id); })
              .filter(Boolean);
  }
  function openOnes() {
    return panels().filter(function (p) { return !p.classList.contains('collapsed'); });
  }

  /* پنل‌ها در همهٔ چیدمان‌ها به‌صورت اورلی شناور دیده می‌شوند */
  function sync() {
    document.body.classList.toggle('sb-open', openOnes().length > 0);
  }

  /* بستن با کلیک روی scrim یا Esc — همان دکمهٔ toggle را می‌زنیم تا
     وضعیت در localStorage هم درست ذخیره شود */
  function closeAll() {
    openOnes().forEach(function (p) {
      var btn = p.querySelector('.sb-toggle[aria-label="جمع کردن"]') ||
                p.querySelector('.sb-toggle');
      if (btn) btn.click();
      else p.classList.add('collapsed');
    });
    sync();
  }

  function init() {
    var scrim = document.getElementById('sb-scrim');
    if (!scrim) return;

    scrim.addEventListener('click', closeAll);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('sb-open')) closeAll();
    });

    /* هر تغییری در کلاس پنل‌ها (از هر ماژولی که بیاید) scrim را همگام می‌کند.
       body فقط برای data-layout رصد می‌شود — نه class — چون خودِ sync کلاس
       body را عوض می‌کند و رصدِ class یک حلقهٔ بازخوردی می‌ساخت. */
    var mo = new MutationObserver(sync);
    panels().forEach(function (p) { mo.observe(p, { attributes: true, attributeFilter: ['class'] }); });
    mo.observe(document.body, { attributes: true, attributeFilter: ['data-layout'] });

    sync();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
