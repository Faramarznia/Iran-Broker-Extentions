/* Startup loader: visible long enough to cover initial layout hydration, then exits once DOM is ready. */
(function () {
  'use strict';

  var loader = document.getElementById('app-loader');
  if (!loader) return;

  var startedAt = performance.now();
  var dismissed = false;
  var minimumVisibleMs = 900;

  function dismiss() {
    if (dismissed) return;
    dismissed = true;

    var wait = Math.max(0, minimumVisibleMs - (performance.now() - startedAt));
    window.setTimeout(function () {
      loader.classList.add('is-leaving');
      document.body.classList.remove('is-loading');
      window.setTimeout(function () { loader.remove(); }, 520);
    }, wait);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', dismiss, { once: true });
  } else {
    dismiss();
  }

  /* Fail-safe: never let a decorative loader trap the page. */
  window.setTimeout(dismiss, 3500);
})();
