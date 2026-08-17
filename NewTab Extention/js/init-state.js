/* ===================================================================
   ایران بروکر — Pre-paint state sync (js/init-state.js)
   باید سینک و بلوکه (بدون defer/async) و اولین چیزِ داخلِ body باشد.
   بدون این فایل، مرورگر اول مقادیر پیش‌فرضِ هاردکد در HTML را رسم
   می‌کند (data-theme="dark" و data-layout="simple")، بعد newtab.js
   با تأخیر آن‌ها را به مقدار واقعیِ ذخیره‌شده اصلاح می‌کند — که در هر
   ریلود یک پرش/فلش دیدنی است (به‌خصوص برای layout=data/hub، چون کل
   بلوکِ hero+search جابه‌جا می‌شود).
   نمی‌تواند inline باشد: CSP این افزونه script-src 'self' است.
   =================================================================== */
(function () {
  'use strict';
  try {
    var saved = JSON.parse(localStorage.getItem('ib_newtab_v2') || '{}');

    if (saved.layout) document.body.setAttribute('data-layout', saved.layout);

    var theme = saved.theme;
    if (theme === 'auto') {
      theme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    }
    if (theme) document.body.setAttribute('data-theme', theme);
  } catch (e) {}
})();
