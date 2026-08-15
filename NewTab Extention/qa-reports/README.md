# qa-reports/ — تست و QA پیش از merge نسخهٔ ۲.۱

بررسی‌شده در ۲۰۲۶-۰۸-۱۵ روی کد واقعی (نه مستندات). فهرست فایل‌های زنده که واقعاً این تست‌ها را پوشش می‌دهند، از `newtab.html` استخراج شد:

```
newtab.js + js/{airo,focus,journal,hub,articles,sidebars,tour}.js   ← ۸ اسکریپت زنده
```
(نه ۹ فایلی که در بریف اولیهٔ این تسک فرض شده بود — `js/news-timeline.js` در یک commit جداگانه قبل از این نشست حذف شده بود.)

## گزارش‌ها

| # | فایل | وضعیت |
|---|---|---|
| ۱ | [01-visual-regression-3-breakpoints.md](01-visual-regression-3-breakpoints.md) | ✅ PASS |
| ۲ | [02-rtl-review.md](02-rtl-review.md) | 🔴 FAIL — ۲ باگ اثبات‌شده |
| ۳ | [03-api-fallback-simulation.md](03-api-fallback-simulation.md) | ⚠️ PASS جزئی |
| ۴ | [04-timeout-abortcontroller-audit.md](04-timeout-abortcontroller-audit.md) | 🔴 FAIL |
| ۵ | [05-localstorage-quota-integrity.md](05-localstorage-quota-integrity.md) | ✅ PASS |
| ۶ | [06-clean-install-test.md](06-clean-install-test.md) | ✅ PASS |
| ۷ | [07-first-paint-timing.md](07-first-paint-timing.md) | ✅ PASS |

خلاصهٔ نهایی + ۳ مورد بحرانی‌ترین: [SUMMARY.md](SUMMARY.md)

## ابزارها (`tools/`)

همهٔ اسکریپت‌ها با Node.js + `puppeteer-core` (سیستم Chrome واقعی، بدون دانلود مرورگر جدا) نوشته شده‌اند و **قابل اجرای مجدد**اند، نه یک‌بارمصرف:

```bash
cd "NewTab Extention/qa-reports/tools"
npm install          # فقط بار اول — puppeteer-core را نصب می‌کند
node 01-visual-regression.js
node 02-rtl-capture.js
node 03-api-fallback.js
node 04-timeout-audit.js
node 05-localstorage-integrity.js   # ~۳ دقیقه طول می‌کشد (۴۵ لانچ مرورگر)
node 06-clean-install.js
node 07-first-paint-timing.js
```

هرکدام مستقیم به `../<اسم گزارش>` یا `../screenshots/` می‌نویسند و در اجرای بعدی overwrite می‌شوند — امن برای اجرای مکرر پیش از هر merge (طبق نیت REQ-8 در PRD).

`launch-page.js` هستهٔ مشترک همهٔ اسکریپت‌هاست (`launchPage()` + `gotoNewtab()`).

## ⚠️ محدودیت زیرساخت مهم: چرا اکستنشن واقعی لود نمی‌شود

طبق بریف اولیه قرار بود اسکریپت‌ها اکستنشن را با `--load-extension` در یک پروفایل Chromium واقعی لود کنند. **این کار نکرد** — با شواهد کامل زیر:

- `--load-extension=<path> --disable-extensions-except=<path>` روی Chrome 151.0.7922.76 / macOS 26.1 این محیط، **صفر اکستنشن** لود می‌کند — نه در `headless:'new'`، نه در حالت headed.
- تست شد و رد شد به‌عنوان علت: Puppeteer به‌طور پیش‌فرض `--disable-extensions` را به args تزریق می‌کند (رفع شد با `ignoreDefaultArgs: ['--disable-extensions']` — ولی مشکل حل نشد).
- تست شد و رد شد: نیاز به `--enable-unsafe-extension-debugging`.
- تست شد و رد شد: نیاز به پیش‌تنظیم `extensions.ui.developer_mode: true` در `Default/Preferences` پروفایل قبل از لانچ.
- تست شد و رد شد: مخصوص همین پروژه بودن — یک اکستنشن آزمایشی کاملاً مینیمال (manifest سه‌خطی، بدون هیچ permission) هم لود نشد.
- تأیید شد با CDP خام (بدون هیچ Puppeteer، فقط `curl http://127.0.0.1:PORT/json/list`) که مشکل در لایهٔ Chrome است، نه در کتابخانهٔ اتوماسیون.
- چک شد و رد شد: enterprise policy (`chrome://policy` خالی بود).

**راه‌حل استفاده‌شده در همهٔ ۷ تست**: `newtab.html` مستقیم با `file://` باز می‌شود (`launch-page.js`)، نه از طریق `chrome-extension://`. این یک جایگزین منصفانه است چون:
- صفحه هیچ `chrome.storage.*`ای مصرف نمی‌کند (صفر نتیجه در `grep -rn "chrome.storage" js/*.js newtab.js` — همهٔ ذخیره‌سازی با `localStorage` معمولی است که بدون هیچ permission در دسترس است).
- `chrome.notifications` هم مصرف نمی‌شود — فقط Web Notification API استاندارد که در هر origin ای در دسترس است.
- تنها گپ واقعی: فراخوان‌هایی که به معافیت CORS مخصوص `host_permissions` متکی‌اند (مثلاً `forum.iranbroker.net`) ممکن است زیر origin تهی `file://` با خطای CORS مواجه شوند اگر خود سرور هدر مجاز نفرستد — هرجا این اتفاق افتاد، در گزارش مربوطه صریح یادداشت شده، نه پنهان.

اگر در آینده این ترکیب Chrome/macOS رفتار `--load-extension` را اصلاح کرد (یا این تست‌ها روی نسخهٔ قدیمی‌تر Chrome اجرا شوند)، `tools/launch-extension.js` از قبل آماده و دست‌نخورده نگه داشته شده — دوباره تست کنید، شاید کار کند.

## یادداشت دربارهٔ صحت داده در اسکرین‌شات‌ها

بعضی fetchها (به‌خصوص CoinGecko) گاهی زیر CORS محدودیت origin تهی موفق می‌شوند و گاهی نه — همین باعث شد بعضی تست‌ها دادهٔ زندهٔ واقعی نشان دهند و بعضی fallback استاتیک. این رفتار مخصوص محیط تست `file://` است؛ روی یک اکستنشن واقعیِ نصب‌شده (با `host_permissions`) این نوسان وجود ندارد چون CORS اصلاً دخیل نیست.
