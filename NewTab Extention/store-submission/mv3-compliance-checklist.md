# چک‌لیست انطباق با Manifest V3

بررسی‌شده روی کد واقعی در تاریخ ۲۰۲۶-۰۸-۱۵. همهٔ دستورها از ریشهٔ `NewTab Extention/` اجرا شده‌اند و خروجی واقعی هرکدام زیرش آمده — نه ادعا.

---

### ✅ ۱. بدون `eval(`، `new Function(`، یا بارگذاری اسکریپت از راه دور

```
grep -rn "eval(\|new Function(" newtab.js js/*.js
```
**نتیجه:** خالی — هیچ‌کدام در هیچ‌یک از ۸ فایل زنده (`newtab.js` + ۷ فایل `js/`) پیدا نشد.

```
grep -n '<script src="http' newtab.html
```
**نتیجه:** خالی — همهٔ `<script>`ها به فایل محلی داخل بستهٔ اکستنشن اشاره می‌کنند، نه CDN یا آدرس بیرونی.

**وضعیت: PASS**

---

### ✅ ۲. `content_security_policy` شامل `script-src` غیر از `'self'` نیست

```
grep -o "script-src[^;]*;" manifest.json
```
**نتیجه:** `script-src 'self';`

**وضعیت: PASS**

---

### ✅ ۳. `connect-src` فقط شامل دامنه‌هایی است که واقعاً در کد استفاده می‌شوند

لیست فعلی `connect-src` در `manifest.json` (بعد از حذف دامنه‌های بلااستفاده در ممیزی ۲۰۲۶-۰۸-۱۵):

```
'self'
https://api.coingecko.com
https://query1.finance.yahoo.com
https://call2.tgju.org
https://call3.tgju.org
https://cdn.tsetmc.com
https://nfs.faireconomy.media
https://iranbroker.net
https://forum.iranbroker.net
https://api.open-meteo.com
https://geocoding-api.open-meteo.com
https://api.anthropic.com
https://api.gapgpt.app
```

هرکدام با یک `fetch()` واقعی در کد تطبیق داده شد (لیست کامل و خط دقیق):

| دامنه | فایل | خط |
|---|---|---|
| `api.coingecko.com` | `newtab.js` | ۹۳۳، ۱۲۴۷ |
| `query1.finance.yahoo.com` | `newtab.js` | ۹۷۵ |
| `call2.tgju.org` / `call3.tgju.org` | `newtab.js` | ۱۰۲۹–۱۰۳۵ |
| `cdn.tsetmc.com` | `newtab.js` | ۱۱۱۱ |
| `nfs.faireconomy.media` | `js/hub.js` | ۳۳۳ |
| `iranbroker.net` | `newtab.js` (۵۸۰، ۶۱۱، ۱۴۳۳) و `js/articles.js` (۵۱، ۸۲) | — |
| `forum.iranbroker.net` | `newtab.js` | ۴۵۸ |
| `api.open-meteo.com` | `js/hub.js` | ۳۹۹ |
| `geocoding-api.open-meteo.com` | `js/hub.js` | ۷۰۳ |
| `api.gapgpt.app` | `js/airo.js` | ۴۳۷ |
| `api.anthropic.com` | `js/airo.js` | ۵۱۸ (مسیر کد **غیرفعال** — `ACTIVE='gapgpt'` هاردکد، هیچ‌وقت اجرا نمی‌شود در runtime فعلی، ولی permission عمداً نگه داشته شده) |

هیچ دامنهٔ اضافه‌ای در لیست نیست؛ سه مورد بلااستفاده (`query2.finance.yahoo.com`، `open.er-api.com`، `api.accesstoexchange.com`) و یک مورد که مصرف‌کننده‌اش حذف شد (`api.frankfurter.app`) قبلاً از manifest پاک شدند.

**وضعیت: PASS**

---

### ✅ ۴. بدون inline event handler (`onclick=""` و مشابه) در HTML

```
grep -noiE '\son[a-z]+="[^"]*"' newtab.html
```
**نتیجه:** خالی.

همچنین چون UI بخش زیادی از این پروژه با `innerHTML` در JS ساخته می‌شود، رشته‌های HTML تولیدشده در جاوااسکریپت هم جدا بررسی شد:

```
grep -noE '\bon(click|load|error|change|input|submit|mouseover|mouseout|mousedown|mouseup|keydown|keyup|keypress|focus|blur|dblclick|contextmenu|drag|drop|scroll|touchstart|touchend|touchmove)=["\x27]' newtab.js js/*.js
```
**نتیجه:** خالی. (یک نمونهٔ `onerror=""` تزریق‌شده در گالری پس‌زمینهٔ `newtab.js` در ممیزی قبلی همین پروژه — ۲۰۲۶-۰۸-۱۵ — پیدا و به `addEventListener` تبدیل شده بود.)

**وضعیت: PASS**

---

### ✅ ۵. بدون `<script>` بدون src محلی یا با محتوای inline

```
grep -n "<script" newtab.html
```
**نتیجه:**
```
<script src="newtab.js"></script>
<script src="js/airo.js"></script>
<script src="js/focus.js"></script>
<script src="js/journal.js"></script>
<script src="js/hub.js"></script>
<script src="js/articles.js"></script>
<script src="js/sidebars.js"></script>
<script src="js/tour.js"></script>
```
همهٔ ۸ تگ `src` محلی دارند (بدون CDN، بدون `type="module"`، بدون محتوای inline بین `<script>` و `</script>`). هیچ nonce/hash هم لازم نیست چون هیچ inline script ای وجود ندارد که نیاز به آن داشته باشد.

**وضعیت: PASS**

---

### ✅ ۶. نسخهٔ manifest واقعاً ۳ است

```
grep -n "manifest_version" manifest.json
```
**نتیجه:** `"manifest_version": 3,`

**وضعیت: PASS**

---

## گزارش نهایی

**همهٔ ۶ مورد PASS شدند — هیچ مورد FAIL ای در این چک‌لیست پیدا نشد.**

نکته: دو یافتهٔ مرتبط ولی خارج از دامنهٔ MV3/CSP در فایل‌های دیگر این پوشه مستند شده‌اند و نباید فراموش شوند:
- permission `storage` در manifest تعریف شده ولی هیچ `chrome.storage.*` در کد صدا زده نمی‌شود (جزئیات در `permission-justifications.md`).
- کلید API سرویس GapGPT به‌صورت hardcoded در `js/airo.js` است — این یک ریسک امنیتی است، نه یک نقض MV3 (جزئیات در `data-disclosure-form.md` و `privacy-policy.html`، بدون افشای خود مقدار کلید).
