# تست ۴: حسابرسی Timeout/AbortController

**وضعیت: 🔴 FAIL — ۱۲ از ۱۶ فراخوان بدون timeout، و مکانیزم failover موجود عملاً بودجهٔ زمانی را دو برابر می‌کند**

## روش

```
grep -n "fetch(" newtab.js js/airo.js js/focus.js js/journal.js js/hub.js js/articles.js js/sidebars.js js/tour.js
grep -n "AbortController\|\.abort(" همان فایل‌ها
```
هر ۱۶ فراخوان `fetch(` در ۸ فایل زنده (طبق `<script>` واقعی در `newtab.html`، نه فایل‌های مرده) دستی چک شد که آیا `signal: ctl.signal` و `setTimeout(...abort...)` کنارش هست یا نه.

## جدول کامل — هر ۱۶ فراخوان fetch در کد زنده

| فایل:خط | دامنه | AbortController؟ | مقدار timeout | مطابق استاندارد ۸ث PRD؟ | severity |
|---|---|---|---|---|---|
| `newtab.js:458` | `forum.iranbroker.net` (کامیونیتی) | ❌ ندارد | — | ❌ | متوسط |
| `newtab.js:580` | `iranbroker.net/wp-json` (فید REST) | ❌ ندارد | — | ❌ | متوسط |
| `newtab.js:611` | `iranbroker.net/feed` (RSS fallback) | ❌ ندارد | — | ❌ | متوسط |
| `newtab.js:933` | `api.coingecko.com` (تب کریپتو) | ❌ ندارد | — | ❌ | **بالا** — ویجت اصلی صفحه |
| `newtab.js:975` | `query1.finance.yahoo.com` (تب فارکس) | ❌ ندارد | — | ❌ | **بالا** — ویجت اصلی صفحه |
| `newtab.js:1035` | `call2/call3.tgju.org` | ✅ دارد | **۹۰۰۰ms** (هر میزبان) | ✅ نزدیک | پایین — ولی پایین را ببینید |
| `newtab.js:1111` | `cdn.tsetmc.com` | ✅ دارد | **۶۰۰۰ms** | ✅ | پایین |
| `newtab.js:1247` | `api.coingecko.com` (جست‌وجوی کوین) | ❌ ندارد | — | ❌ | پایین (تعاملی، نه خودکار) |
| `newtab.js:1433` | `iranbroker.net/wp-json/categories` | ❌ ندارد | — | ❌ | پایین |
| `js/airo.js:437` | `api.gapgpt.app` (چت آیرو، فعال) | ✅ دارد | **۲۵۰۰۰ms** (`STALL_TIMEOUT_MS`) | ⚠️ عمداً بیشتر (پاسخ streaming AI، منطقی است) | پایین |
| `js/airo.js:518` | `api.anthropic.com` (چت آیرو، غیرفعال) | ✅ دارد | **۲۵۰۰۰ms** | ⚠️ همان بالا | — (کد غیرفعال) |
| `js/articles.js:51` | `iranbroker.net/wp-json` | ❌ ندارد | — | ❌ | متوسط |
| `js/articles.js:82` | `iranbroker.net/feed` | ❌ ندارد | — | ❌ | متوسط |
| `js/hub.js:333` | `nfs.faireconomy.media` (تقویم اقتصادی) | ❌ ندارد | — | ❌ | متوسط |
| `js/hub.js:399` | `api.open-meteo.com` (آب‌وهوا) | ❌ ندارد | — | ❌ | متوسط |
| `js/hub.js:703` | `geocoding-api.open-meteo.com` (جست‌وجوی شهر) | ❌ ندارد | — | ❌ | پایین (تعاملی) |

**خلاصه: ۱۲ از ۱۶ فراخوان (۷۵٪) هیچ timeout ندارند.** اگر سرور مقصد نه پاسخ ۲۰۰ بدهد نه خطا برگرداند (فقط hang کند — دقیقاً وضعیتی که پشت خیلی از محدودیت‌های شبکه در ایران واقعی است)، Promise مربوطه تا ابد در حالت pending می‌ماند و ویجت برای همیشه در حالت «در حال دریافت…» گیر می‌کند — بدون خطا، بدون fallback، بدون هیچ بازخوردی به کاربر.

## 🔴 یافتهٔ اصلی (اثبات‌شده با اجرای واقعی، نه فرض): failover دو-میزبانهٔ TGJU بودجهٔ زمانی را از ۹ ثانیه به ۱۸ ثانیه دو برابر می‌کند

### نحوهٔ اجرا

```bash
node qa-reports/tools/04-timeout-audit.js
```

اسکریپت با `page.setRequestInterception`، هر دو میزبان TGJU (و چند دامنهٔ دیگر) را برای همیشه معلق نگه می‌دارد (نه abort، نه پاسخ — دقیقاً شبیه‌سازی یک اتصال قطع‌شده/بی‌پاسخ)، بعد تب «بازار ایران» را باز می‌کند و state واقعی DOM را در بازه‌های زمانی مختلف می‌خواند.

### نتیجهٔ واقعی

```
t=3000ms   → «در حال دریافت…» (لودینگ)
t=7000ms   → «در حال دریافت…»
t=9500ms   → «در حال دریافت…»   ← اینجا انتظار می‌رفت timeout ۹ث بزند و ارور نشان دهد
t=15000ms  → «در حال دریافت…»   ← هنوز!
t=18500ms  → «دریافت داده ممکن نشد» ← بالاخره اینجا
t=20000ms  → «دریافت داده ممکن نشد»
```

### چرا

`newtab.js:1030-1042` (`fetchTgju`):
```js
const TGJU_HOSTS = ['https://call2.tgju.org/ajax.json', 'https://call3.tgju.org/ajax.json'];
let chain = Promise.reject();
TGJU_HOSTS.forEach(function (host) {
  chain = chain.catch(function () {
    const ctl = new AbortController();
    const to = setTimeout(function () { ctl.abort(); }, 9000);
    return fetch(host, { signal: ctl.signal })
      .then(function (r) { clearTimeout(to); if (!r.ok) throw new Error('http'); return r.json(); });
  });
});
```
این یک زنجیرهٔ `.catch()` **متوالی** است: ابتدا `call2` با یک بودجهٔ ۹۰۰۰ms امتحان می‌شود؛ اگر (بعد از یک hang کامل ۹ ثانیه‌ای) شکست بخورد، **تازه از صفر** یک AbortController و یک `setTimeout` ۹۰۰۰ms *جدید* برای `call3` ساخته می‌شود. یعنی بدترین حالت (هر دو میزبان بی‌پاسخ) = ۹۰۰۰ + ۹۰۰۰ = **۱۸۰۰۰ میلی‌ثانیه**، نه ۹۰۰۰ که از خواندن یک تکه از کد به‌تنهایی («۹ث timeout دارد») ممکن است فرض شود. این دقیقاً همان چیزی است که تست واقعی ثابت کرد (گذار بین t=15000 و t=18500).

**تأثیر روی کاربر واقعی**: کسی با اینترنت خیلی کند/ناپایدار (سناریوی رایج در ایران) می‌تواند تا ۱۸ ثانیهٔ تمام به یک اسپینر خیره بماند، نه ۸-۹ ثانیه‌ای که استاندارد پروژه (بند ۶ PRD) نشان می‌دهد.

### پیشنهاد اصلاح
یک `AbortController` واحد با یک `setTimeout` واحد (مثلاً ۹۰۰۰ms کلی، نه هر میزبان جدا) بسازید و همان `signal` را بین هر دو تلاش به اشتراک بگذارید — یا از `Promise.any([fetchWithTimeout(call2, 4000), fetchWithTimeout(call3, 4000)])` استفاده کنید تا هر دو میزبان **همزمان** (نه متوالی) امتحان شوند و بودجهٔ کل هرگز از یک عدد ثابت (مثلاً ۵-۶ ثانیه) بیشتر نشود.

## تأیید مثبت: بدون کرش

در طول کل تست (۲۰ ثانیه تعلیق کامل شبکه)، `pageErrors.length === 0` و `consoleMessages` خالی بود — هیچ exception نشتی وجود نداشت، فقط UX کند/بی‌بازخورد. این با نتیجهٔ تست ۳ هم‌خوان است.

## فایل‌های شاهد
```
qa-reports/tools/04-timeout-audit.js       ← قابل اجرای مجدد
qa-reports/timeout-audit-samples.json      ← خروجی خام کامل (نمونه‌ها + URLهای معلق‌شده)
```
