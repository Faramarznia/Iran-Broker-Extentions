# توجیه مجوزها — Developer Dashboard

این سند برای هر permission موجود در `manifest.json` (بررسی‌شده در نسخهٔ فعلی کد، ۲۰۲۶-۰۸-۱۵) یک متن آماده برای فیلد **Justification** در Chrome Web Store Developer Dashboard + نسخهٔ فارسی برای مرور داخلی تیم ارائه می‌دهد.

---

## `storage` — ✅ حذف شد (۲۰۲۶-۰۸-۱۵)

این permission در `manifest.json` هیچ مصرف‌کنندهٔ واقعی نداشت — جست‌وجوی کامل `chrome.storage.*` در تمام ۸ فایل اسکریپت زنده صفر نتیجه داد؛ تمام ذخیره‌سازی محلی پروژه از `localStorage` استاندارد استفاده می‌کند که اصلاً به این permission نیاز ندارد. بعد از تأیید مجدد (هنوز صفر مصرف‌کننده)، از `permissions` در `manifest.json` حذف شد. دیگر نیازی به فیلد Justification برای آن در Developer Dashboard نیست.

---

## `notifications`

**متن پیشنهادی برای Justification (انگلیسی):**
> Used solely to show a native desktop notification ("Focus session ended") when a user-started Focus Mode / Pomodoro timer completes. The browser's native notification permission is requested only when the user explicitly clicks "Start" on a focus session — never on install or page load — and the extension checks `Notification.permission === 'granted'` before showing anything, so users who deny the prompt simply see no notifications.

**نسخه فارسی (برای مرور داخلی تیم):**

تنها مصرف‌کنندهٔ واقعی این permission، تابع `sendNotification()` در `js/focus.js` است — دقیقاً یک رویداد: پایان یک جلسهٔ فوکوس‌مود/پومودورو («⏱ تمرکز تموم شد!»). این permission با Web Notification API استاندارد (`new Notification(...)`) کار می‌کند، نه با `chrome.notifications`.

نکات برای مستندسازی:
- درخواست مجوز مرورگری (`Notification.requestPermission()`) فقط وقتی کاربر دکمهٔ «شروع» جلسهٔ فوکوس را می‌زند اجرا می‌شود — نه در لود صفحه یا نصب اکستنشن.
- اگر کاربر اجازه ندهد، کد به‌سادگی هیچ نوتیفیکیشنی نشان نمی‌دهد (`if (Notification.permission !== 'granted') return;`).
- **گپ شناسایی‌شده:** هیچ سوییچ اختصاصی داخل تنظیمات اکستنشن برای خاموش‌کردن این نوتیفیکیشن (جدا از اجازهٔ سطح مرورگر) وجود ندارد. اگر می‌خواهید تجربهٔ کاربری کامل‌تری داشته باشید، افزودن چنین سوییچی به مودال تنظیمات پیشنهاد می‌شود؛ فعلاً تنها راه کاربر برای خاموش‌کردن، رد کردن یا لغو اجازهٔ نوتیفیکیشن از تنظیمات مرورگر است.
- نسخهٔ قدیمی‌تر README این permission را به «هشدار قیمت» هم نسبت می‌داد — آن ویژگی (`js/alerts.js`) در ممیزی ۲۰۲۶-۰۸-۱۵ به‌عنوان کد مرده حذف شد، پس دیگر مصرف‌کنندهٔ این permission نیست.

---

## `chrome_url_overrides` → `newtab`

**متن پیشنهادی برای Justification (انگلیسی):**
> Replacing the New Tab Page is the core value proposition of this extension, not a side effect — users install it specifically to get a Persian-language trading dashboard (live crypto/forex/Iran-market prices, an economic calendar, a trading journal, and an AI assistant) every time they open a new tab. There is no hidden redirect, ad injection, or unrelated content: the override renders `newtab.html`, a page bundled entirely with the extension. The override can be reversed at any time by disabling or uninstalling the extension from `chrome://extensions`, which immediately restores Chrome's default New Tab Page.

**نسخه فارسی (برای مرور داخلی تیم):**

این override دقیقاً همان چیزی است که محصول قرار است انجام دهد — کاربر این اکستنشن را مشخصاً برای همین جایگزینی نصب می‌کند، نه یک اکستنشن دیگر که به‌طور جانبی تب‌جدید را هم تصاحب کرده باشد. نکات کلیدی برای Justification:

- هیچ ریدایرکت پنهانی به سایت دیگر انجام نمی‌شود؛ `newtab.html` مستقیماً از داخل بستهٔ اکستنشن رندر می‌شود.
- هیچ تبلیغ یا محتوای غیرمرتبط تزریق نمی‌شود.
- غیرفعال/حذف کردن اکستنشن بلافاصله تب‌جدید پیش‌فرض کروم را برمی‌گرداند — یعنی تغییر کاملاً قابل‌برگشت و در کنترل کاربر است.

---

## `host_permissions`

هر دامنه دقیقاً یک سرویس بیرونی متمایز است؛ چون این‌ها دامنه‌های جدا و غیرمرتبط‌اند (نه زیردامنه‌های یک سرویس واحد)، امکان محدودتر کردن یا ادغام‌شان با یک الگوی wildcard واحد وجود ندارد — هرکدام باید جدا در `host_permissions` فهرست شود.

**متن پیشنهادی برای Justification (انگلیسی، یک بلوک برای کل گروه چون Chrome معمولاً یک فیلد برای کل host_permissions می‌خواهد):**
> Each host permission maps to exactly one live feature that fetches public, read-only market/content data or (for the AI chat) sends user-typed chat text — see the per-domain breakdown below. No permission is broader than `https://<exact-host>/*`; none use wildcard subdomains or `<all_urls>`. Every domain is called from the extension's own bundled pages only — there are no content scripts and no access to the user's other open tabs or browsing.

**نسخه فارسی — توجیه هر دامنه:**

| دامنه | چرا لازم است | چرا نمی‌شود محدودترش کرد |
|---|---|---|
| `api.coingecko.com` | قیمت لحظه‌ای و جست‌وجوی ارز دیجیتال (تب کریپتو) | سرویس مستقل بدون جایگزین داخل دامنه‌های دیگر لیست |
| `query1.finance.yahoo.com` | قیمت فارکس/طلا/نفت/DXY (تب فارکس) | تنها endpoint عمومی و بدون کلید که این داده را می‌دهد |
| `call2.tgju.org` + `call3.tgju.org` | نرخ بازار آزاد ایران و بورس — دو میزبان آینه برای failover | هر دو لازم‌اند چون اگر یکی در دسترس نباشد (محدودیت جغرافیایی/CORS رایج است)، دیگری جایگزین می‌شود |
| `cdn.tsetmc.com` | دادهٔ تکمیلی شاخص هم‌وزن/فرابورس تهران (تب بورس) | سرویس رسمی TSETMC، بدون جایگزین |
| `nfs.faireconomy.media` | فید تقویم اقتصادی هفتگی (Forex Factory) در حالت Hub | تنها فید عمومی و رایگان تقویم اقتصادی که در کد استفاده شده |
| `iranbroker.net` | فید محتوا/مقالات (REST وردپرس + RSS) — سایت خودمان | دامنهٔ خودی؛ ادغام با `forum.` ممکن نیست چون ساب‌دامنهٔ جدا با API جدا است |
| `forum.iranbroker.net` | سایدبار «مباحث داغ جامعه» (API عمومی Discourse) | ساب‌دامنهٔ جدا از `iranbroker.net` با نرم‌افزار فوروم متفاوت (Discourse) |
| `api.open-meteo.com` + `geocoding-api.open-meteo.com` | پیش‌بینی آب‌وهوا + جست‌وجوی نام شهر (حالت Hub) | دو endpoint جدا از یک سرویس؛ هیچ‌کدام موقعیت مکانی دقیق دستگاه را نمی‌خواهند، فقط نام شهر تایپ‌شده |
| `api.gapgpt.app` | بک‌اند فعال دستیار «آیرا» — پردازش پیام‌های چت | سرویس فعلی انتخاب‌شده برای این ویژگی |
| `api.anthropic.com` | مسیر جایگزین **غیرفعال** برای آیرا (`ACTIVE = 'gapgpt'` هاردکد در `js/airo.js`، هرگز در runtime عوض نمی‌شود) | نگه‌داشته شده تا سوییچ بین دو سرویس بدون درخواست permission جدید و ریلیز اضطراری ممکن باشد؛ در صورت تصمیم به حذف این قابلیت جایگزین، این خط هم قابل حذف است |

> دامنه‌های `query2.finance.yahoo.com`، `open.er-api.com`، `api.accesstoexchange.com` و `api.frankfurter.app` قبلاً در `host_permissions` بودند ولی هیچ فراخوانی واقعی نداشتند — در ممیزی ۲۰۲۶-۰۸-۱۵ حذف شدند. لیست بالا دقیقاً همان چیزی است که الان در `manifest.json` باقی مانده.
