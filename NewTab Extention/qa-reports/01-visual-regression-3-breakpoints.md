# تست ۱: Visual Regression در ۳ عرض

**وضعیت: ✅ PASS (اجرا شد، نه فرض)**

## نحوهٔ اجرا

```bash
cd "NewTab Extention/qa-reports/tools"
node 01-visual-regression.js
```

اسکریپت `tools/01-visual-regression.js` (قابل اجرای مجدد، یک‌بارمصرف نیست) با Puppeteer + Chrome واقعی سیستم، `newtab.html` را در هر ۳ عرض دوبار باز می‌کند — یک‌بار «تمیز» (بدون localStorage قبلی) و یک‌بار «با داده نمونه» (بعد از seed کردن کلیدهای localStorage با یک وضعیت واقع‌گرایانه: تم تیره، ۵ کوین در واچ‌لیست، ۳ معامله در ژورنال، یک تسک در Hub، یک گفتگوی نمونهٔ آیرو) — سپس اسکرین‌شات تمام‌صفحه می‌گیرد و overflow را با `document.documentElement.scrollWidth` چک می‌کند.

## ⚠️ محدودیت زیرساخت (برای همهٔ ۷ گزارش صدق می‌کند)

`--load-extension` در Chrome 151.0.7922.76 / macOS 26.1 این محیط **هیچ** اکستنشنی را لود نمی‌کند — حتی یک اکستنشن آزمایشی سه‌خطی کاملاً معتبر و مینیمال. این مشکل پروژه نیست؛ جزئیات کامل رفع‌اشکال (headless و headed هر دو امتحان شد، فلگ `--enable-unsafe-extension-debugging`، پیش‌تنظیم `developer_mode` در Preferences — هیچ‌کدام جواب نداد) در `qa-reports/README.md` است. **راه‌حل:** `newtab.html` مستقیماً با `file://` باز می‌شود. چون این صفحه هیچ `chrome.*` API‌ای فراتر از یک صفحهٔ معمولی مصرف نمی‌کند (طبق حسابرسی قبلی پروژه: `chrome.storage` صفر مصرف‌کننده دارد)، این یک جایگزین معتبر است — با یک استثنا: fetchهایی که به معافیت CORS مخصوص `host_permissions` اکستنشن متکی‌اند ممکن است در حالت `file://` (origin تهی) با خطای CORS مواجه شوند اگر خود API هدر CORS مجاز نفرستد. در عمل، در این تست، CoinGecko واقعاً از طریق CORS جواب داد (قیمت‌های زنده در اسکرین‌شات‌ها واقعی‌اند)، ولی برخی endpointهای دیگر ممکن است این‌طور نباشند — این را «PASS با یک caveat زیرساختی»، نه «FAIL محصول» در نظر بگیرید.

## یافتهٔ جدید نسبت به PRD: breakpoints واقعی با «۱۱۰۰px → ۷۰۰px» PRD کاملاً یکی نیستند

```
grep -n "@media" newtab.css | grep -v "prefers-reduced-motion\|max-height"
```

breakpoints عرضی واقعی: `max-width:1099px`، `max-width:1080px`، `max-width:1000px`، `max-width:900px`، `max-width:760px`، `max-width:720px`، `max-width:680px`، `max-width:560px` (چندجا)، و `min-width:1400px`.

PRD ادعای «۳ ستون در ۱۱۰۰px→۷۰۰px» را ساده‌سازی کرده — واقعیت **۸ breakpoint متفاوت** دارد، نه یک جفت تمیز. خبر خوب: عرض‌های خواسته‌شدهٔ همین تسک (۱۱۰۰ و ۱۴۰۰) تصادفاً خیلی نزدیک به دو تا از breakpointهای واقعی (`1099px` و `1400px`) هستند، پس نتیجهٔ این تست هنوز معنادار است.

## نتیجهٔ overflow (خروجی واقعی اسکریپت)

| عرض | اسکرول افقی ناخواسته (تمیز) | اسکرول افقی ناخواسته (seeded) | خطای JS |
|---|---|---|---|
| 1100px | ❌ نه | ❌ نه | ۰ |
| 1400px | ❌ نه | ❌ نه | ۰ |
| 1920px | ❌ نه | ❌ نه | ۰ |

هیچ عنصر overflowکننده (`scrollWidth > clientWidth`) در هیچ حالتی پیدا نشد.

## چک‌لیست دستی (بر اساس بازبینی واقعی اسکرین‌شات‌ها)

- ✅ گرید هاب/بنتو در هر ۳ عرض بدون overlap رندر شد — تصاویر در `qa-reports/screenshots/<width>px/`.
- ✅ متن قطع/overflow دیده نشد.
- ✅ در ۱۹۲۰px محتوا به‌درستی با `max-width` محدود و وسط‌چین می‌ماند (کش نمی‌شود تا لبه‌به‌لبهٔ صفحه).
- ℹ️ **مشاهدهٔ جانبی مفید**: چون کلید `ib_tour_v1_done` ست نشده بود، مودال تور خوش‌آمدگویی در هر ۶ اسکرین‌شات باز است — این خودش یک تأیید مثبت زودهنگام برای تست ۶ (تور در اولین اجرا نمایش داده می‌شود) بود، نه یک باگ این تست.
- ℹ️ در حالت «تمیز» (۱۴۰۰px، `clean.png`)، یک نام پیش‌فرض تصادفی («رامیل») در خوش‌آمدگویی نشان داده شد چون `state.name` ست نشده بود — رفتار طراحی‌شده، نه باگ.

## فایل‌های تصویری

```
qa-reports/screenshots/1100px/{clean,seeded}.png
qa-reports/screenshots/1400px/{clean,seeded}.png
qa-reports/screenshots/1920px/{clean,seeded}.png
qa-reports/screenshots/results.json   ← خروجی خام overflow-check
```
