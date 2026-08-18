# منابع داده و APIهای اکستنشن تب جدید ایران بروکر

این سند خلاصه‌ای از تمام سرویس‌های بیرونی است که اکستنشن برای نمایش داده‌های زنده به آن‌ها متصل می‌شود، و اینکه هر بخش از داشبورد داده‌اش را از کجا می‌گیرد. فهرست کامل دامنه‌های مجاز در `host_permissions` و `content_security_policy` فایل [manifest.json](manifest.json) تعریف شده — یعنی اکستنشن فقط اجازه دارد به همین آدرس‌ها متصل شود، نه هیچ جای دیگری.

> اکستنشن فقط ۹ اسکریپت واقعی دارد: هستهٔ اصلی [newtab.js](newtab.js) + ۸ فایل مستقل در `js/` (`init-state.js`, `airo.js`, `focus.js`, `journal.js`, `hub.js`, `articles.js`, `sidebars.js`, `tour.js`) — همان‌هایی که با `<script>` در [newtab.html](newtab.html) بارگذاری می‌شوند (`init-state.js` زودتر از همه، خط ۲۲؛ بقیه در انتهای `<body>`، خط‌های ۱۱۴۶ تا ۱۱۵۳). این سند دقیقاً همین ۹ فایل را پوشش می‌دهد؛ `init-state.js` هیچ فراخوانی شبکه‌ای ندارد (فقط `localStorage`) پس ردیف مستقلی در جدول زیر ندارد.

## جدول خلاصه

| بخش داشبورد | فایل | منبع داده | نوع دسترسی | کش/فرکانس |
|---|---|---|---|---|
| قیمت لحظه‌ای ارز دیجیتال (تب کریپتو) | [newtab.js](newtab.js) | `api.coingecko.com` | API عمومی (بدون کلید) | هر ۹۰ ثانیه |
| فارکس / طلا / نفت برنت / DXY (تب فارکس) | [newtab.js](newtab.js) | `query1.finance.yahoo.com` (Endpoint غیررسمی) | API عمومی (بدون کلید) | هر ۹۰ ثانیه |
| بازار آزاد ایران (دلار، طلا، سکه…) و بورس تهران | [newtab.js](newtab.js) | `call2.tgju.org` با mirror به `call3.tgju.org` + `cdn.tsetmc.com` برای شاخص هم‌وزن/فرابورس | API عمومی (بدون کلید) | هر ۹۰ ثانیه |
| فید محتوای اصلی (کارت‌های خبری وسط صفحه) | [newtab.js](newtab.js) | `iranbroker.net/wp-json/wp/v2/posts` (WordPress REST) با fallback به `iranbroker.net/feed/` (RSS) | REST/RSS عمومی سایت خودمان | هر ۳۰ دقیقه (کش) |
| سایدبار «مباحث داغ جامعه» (راست) | [newtab.js](newtab.js) | `forum.iranbroker.net/latest.json` و `/hot.json` — لینک‌های دسته‌بندی هم به `forum.iranbroker.net/c/...` می‌روند | API عمومی Discourse | هنگام باز شدن سایدبار |
| سایدبار مقالات (چپ) | [articles.js](js/articles.js) | `iranbroker.net/wp-json/wp/v2/posts` (WordPress REST) با fallback به `iranbroker.net/feed/` | REST API عمومی وردپرس + RSS | هر ۳۰ دقیقه (کش در `localStorage`) |
| تقویم اقتصادی (داخل حالت Hub) | [hub.js](js/hub.js) | `nfs.faireconomy.media/ff_calendar_thisweek.json` (فید هفتگی Forex Factory) | API عمومی JSON | هنگام باز شدن هاب |
| آب‌وهوا | [hub.js](js/hub.js) | `api.open-meteo.com` | API عمومی (بدون کلید) | هنگام باز شدن هاب |
| جستجوی شهر برای آب‌وهوا | [hub.js](js/hub.js) | `geocoding-api.open-meteo.com` | API عمومی (بدون کلید) | هنگام تایپ کاربر |
| آیکون سایت در گرید دسترسی سریع Hub | [hub.js](js/hub.js) | `www.google.com/s2/favicons` | بارگذاری تصویر ساده (`<img src>`) — نه `fetch`، پس نیازی به `host_permissions`/`connect-src` ندارد | هنگام افزودن لینک توسط کاربر |
| چت‌بات هوش مصنوعی «آیرا» | [airo.js](js/airo.js) | `api.gapgpt.app` (پیش‌فرض فعال) یا `api.anthropic.com` (جایگزین، به‌صورت عمدی غیرفعال — پایین را ببینید) | API با کلید — درخواست‌های چت کاربر مستقیماً به این سرویس ارسال می‌شود | هنگام هر پیام کاربر |
| ژورنال معاملاتی، Focus Mode، سایدبار scrim، تور خوش‌آمد | [journal.js](js/journal.js)، [focus.js](js/focus.js)، [sidebars.js](js/sidebars.js)، [tour.js](js/tour.js) | ندارد — کاملاً محلی، فقط `localStorage` | — | — |

## چیزهایی که «اسکرپ» واقعی نیستند

- **رادار بروکر و «مباحث داغ جامعه» به‌شکل قدیمی خودشان دیگر وجود ندارند** — این‌ها ویژگی‌های یک بازنویسی ماژولار (`js/radar.js`, `js/community.js`) بودند که هرگز در `newtab.html` بارگذاری نمی‌شدند؛ در ممیزی ۲۰۲۶-۰۸-۱۵ به‌عنوان کد مرده حذف شدند (به بخش پایین مراجعه کنید). سایدبار جامعهٔ فعلی در `newtab.js` واقعاً به API عمومی Discourse فوروم متصل می‌شود (ردیف بالا).
- بخش‌های مقالات/فید محتوای HTML صفحات را اسکرپ نمی‌کنند — از **API رسمی وردپرس** (`wp-json`) یا **فید RSS استاندارد** سایت `iranbroker.net` خودمان استفاده می‌کنند، نه اسکرپینگ سایت‌های دیگر.

## دامنه‌های مجاز در manifest ولی فعلاً استفاده‌نشده در کد

هیچ‌کدام باقی نمانده — تا ۲۰۲۶-۰۸-۱۵، `host_permissions` دقیقاً همان دامنه‌هایی را دارد که کد زنده (جدول بالا) واقعاً صدا می‌زند. تاریخچهٔ ممیزی:

- `query2.finance.yahoo.com`، `open.er-api.com`، `api.accesstoexchange.com` — هیچ‌جای کد (حتی کد مرده) ارجاع نداشتند؛ حذف شدند.
- `api.frankfurter.app` — فقط در `js/watchlist.js` استفاده می‌شد که بخشی از یک درخت import مرده (زیر `js/main.js`، هرگز در `newtab.html` بارگذاری نمی‌شد) بود. با حذف کامل آن درخت ماژول (پایین را ببینید)، این دامنه هم از `host_permissions`/`connect-src` حذف شد.
- `api.anthropic.com` — همچنان نگه داشته شده. در [airo.js](js/airo.js) (که واقعاً بارگذاری می‌شود) به‌عنوان مسیر جایگزین برای چت‌بات آیرا تعریف شده، اما `var ACTIVE = 'gapgpt'` هاردکد است و هیچ‌جا در runtime تغییر نمی‌کند — یعنی این مسیر کد به‌صورت عمدی غیرفعال است (نیاز به ویرایش دستی کد برای فعال‌سازی). مجوز عمداً نگه داشته شده تا سوییچ بین دو سرویس بدون ریلیز جدید و درخواست مجوز اضافه ممکن باشد.

## معماری ماژولار مرده — حذف‌شده در ۲۰۲۶-۰۸-۱۵

نسخه‌ای قدیمی‌تر از README.md یک بازنویسی ماژولار ES (`js/main.js` + ۱۸ فایل import‌شده از آن + `utils.js`) را به‌عنوان معماری واقعی توصیف می‌کرد. این ۲۰ فایل هرگز با `<script>` در `newtab.html` بارگذاری نمی‌شدند — یعنی صرفاً کد مرده بودند که فقط حجم مخزن و سردرگمی توسعه‌دهنده را بالا می‌بردند، بدون هیچ اثری روی محصول واقعی. در ممیزی ۲۰۲۶-۰۸-۱۵ کل این درخت (`main.js`, `store.js`, `clock.js`, `search.js`, `tools.js`, `sessions.js`, `tips.js`, `bg.js`, `settings.js`, `watchlist.js`, `alerts.js`, `iran-market.js`, `calendar.js`, `feed.js`, `community.js`, `calculator.js`, `radar.js`, `notes.js`, `timer.js`, `crypto.js`, `utils.js`) حذف شد. اگر ویژگی‌ای شبیه این‌ها (واچ‌لیست شخصی، هشدار قیمت، ماشین‌حساب معاملاتی، یادداشت سریع و…) واقعاً لازم است، باید از نو و متصل به `newtab.html` پیاده‌سازی شود — کد قدیمی در تاریخچهٔ git قابل بازیابی است.

## نکته امنیتی

سرویس چت آیرا ([airo.js](js/airo.js)) یک کلید API به‌صورت hardcoded در کد کلاینت دارد. چون این کد روی مرورگر کاربر اجرا می‌شود، این کلید عملاً برای هرکسی که کد اکستنشن را باز کند قابل مشاهده است. توصیه می‌شود این فراخوانی از طریق یک بک‌اند واسط (proxy) انجام شود تا کلید در سمت کاربر افشا نشود.
