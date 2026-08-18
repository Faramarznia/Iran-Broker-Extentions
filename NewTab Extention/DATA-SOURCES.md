# منابع داده و APIهای اکستنشن تب جدید ایران بروکر

> این سند بر پایهٔ حسابرسی مستقیم کد امروز بازنویسی شده (نه فرض معماری مدونی). فهرست زیر فقط
> فایل‌هایی را پوشش می‌دهد که واقعاً در `newtab.html` بارگذاری می‌شوند (فهرست کامل در README.md).
> **پیش از commit نهایی این فایل، هر ردیف با `grep` روی کد فعلی تأیید شد** — به‌ویژه دامنهٔ
> بازار ایران/بورس که در نسخه‌های خیلی قدیمی‌تر این سند به‌اشتباه `call4.tgju.org` ذکر شده بود
> (تأیید شده با `git log -p`: عبارت `call4` واقعاً در تاریخچهٔ این فایل وجود داشته)؛ کد فعلی و این
> نسخه هر دو `call2.tgju.org` + `call3.tgju.org` را دارند.

## جدول خلاصه (فایل‌های زنده)

| بخش داشبورد | فایل زنده | منبع داده | نوع دسترسی | کش/فرکانس |
|---|---|---|---|---|
| قیمت لحظه‌ای ارز دیجیتال | [newtab.js](newtab.js) | `api.coingecko.com` | API عمومی (بدون کلید) | هر ۹۰ ثانیه |
| فارکس/طلا/نفت/DXY | [newtab.js](newtab.js) | `query1.finance.yahoo.com` (Endpoint غیررسمی) | API عمومی (بدون کلید) | هر ۹۰ ثانیه |
| بازار آزاد ایران (دلار، طلا، سکه…) و بورس | [newtab.js](newtab.js) | `call2.tgju.org` + `call3.tgju.org` (دو میزبان آینه، failover) + `cdn.tsetmc.com` برای شاخص هم‌وزن/فرابورس | API عمومی (ممکن است CORS محدود کند) | هر ۹۰ ثانیه |
| تقویم اقتصادی (داخل هاب) | [hub.js](js/hub.js) | `nfs.faireconomy.media` (فید هفتگی Forex Factory) | API عمومی JSON | هنگام باز شدن هاب |
| آب‌وهوا | [hub.js](js/hub.js) | `api.open-meteo.com` | API عمومی (بدون کلید) | هنگام باز شدن هاب |
| جست‌وجوی شهر برای آب‌وهوا | [hub.js](js/hub.js) | `geocoding-api.open-meteo.com` | API عمومی (بدون کلید) | هنگام تایپ کاربر |
| فید محتوای اصلی + سایدبار مقالات | [newtab.js](newtab.js)، [articles.js](js/articles.js) | `iranbroker.net` (REST وردپرس `wp-json`) با fallback به فید RSS (`iranbroker.net/feed/`) | REST/RSS عمومی سایت خودمان | هر ۳۰ دقیقه (کش در `localStorage`) |
| سایدبار «مباحث داغ جامعه» | [newtab.js](newtab.js) | `forum.iranbroker.net` (`/latest.json`, `/hot.json`) | API عمومی Discourse | هنگام باز شدن سایدبار |
| چت‌بات هوش‌مصنوعی «آیرا» | [airo.js](js/airo.js) | `api.gapgpt.app` (پیش‌فرض فعال) یا `api.anthropic.com` (جایگزین، عمداً غیرفعال) | API با کلید — کلید فعلاً در کلاینت افشا است، ⚠️ [SECURITY.md](../SECURITY.md) | هنگام هر پیام کاربر |
| — | [init-state.js](js/init-state.js) | ندارد | فقط `localStorage`، بدون فراخوانی شبکه | — |
| — | [journal.js](js/journal.js)، [focus.js](js/focus.js)، [sidebars.js](js/sidebars.js)، [tour.js](js/tour.js) | ندارد | کاملاً محلی، فقط `localStorage` | — |

## دامنه‌های مجاز در manifest

`host_permissions`/CSP `connect-src` در `manifest.json` دقیقاً همان ۱۲ دامنهٔ جدول بالا را دارد —
نه کم، نه زیاد. دامنه‌های زیر **قبلاً در manifest بودند و کاملاً حذف شدند** (نه اینکه هنوز باشند و
بی‌مصرف باشند) چون هیچ فایل زنده‌ای صدایشان نمی‌زد:

- `query2.finance.yahoo.com`
- `open.er-api.com`
- `api.accesstoexchange.com`
- `api.frankfurter.app` (تنها مصرف‌کننده‌اش `js/watchlist.js` بود — بخشی از درخت ماژول مرده)

اگر سندی هنوز این چهار دامنه را به‌عنوان «مجاز ولی بی‌مصرف» فهرست می‌کند، آن سند عقب‌افتاده است.

## فایل‌ها/دامنه‌های مربوط به کد بارگذاری‌نشده (Legacy)

- درخت ماژول ES مرده (`js/main.js` و ۲۰ فایل import‌شده از آن — `store.js`, `settings.js`,
  `calendar.js`, `crypto.js`, `watchlist.js`, `feed.js`, `community.js`, `alerts.js`,
  `iran-market.js` و چند فایل دیگر) هرگز با `<script>` در `newtab.html` بارگذاری نشد و از مخزن
  حذف شده. اگر دامنه‌ای فقط از این فایل‌ها صدا زده می‌شد (مثل `api.frankfurter.app`)، دیگر بخشی
  از محصول واقعی نیست.
- `js/news-timeline.js` (نوار اخبار فارکس، مصرف‌کنندهٔ قبلی `nfs.faireconomy.media`) در یک دورهٔ
  کوتاه اضافه شد ولی در commit `75ed28a` برگردانده شد — دیگر در مخزن وجود ندارد. تنها مصرف‌کنندهٔ
  فعلی `nfs.faireconomy.media`، `js/hub.js` است (ردیف جدول بالا).

## چیزهایی که «اسکرپ» واقعی نیستند

- سایدبار «مباحث داغ جامعه» به API عمومی Discourse فوروم متصل می‌شود، نه اسکرپ HTML.
- فید محتوا و سایدبار مقالات از API رسمی وردپرس (`wp-json`) یا فید RSS استاندارد سایت خودمان
  (`iranbroker.net`) استفاده می‌کنند، نه اسکرپینگ سایت دیگر.

## نکتهٔ امنیتی

جزئیات مربوط به افشای کلید API آیرا در [SECURITY.md](../SECURITY.md) مستند شده است.

---

تاریخ آخرین تأیید با کد زنده: ۲۰۲۶-۰۸-۱۸ (هر ردیف بالا با `grep`/بررسی مستقیم `newtab.html` و
`manifest.json` در همین تاریخ تأیید شد).
