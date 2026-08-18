# Iran Broker New Tab

A Chrome extension (Manifest V3) that turns the browser's New Tab page into a trading dashboard for
Persian-speaking forex/crypto/stock traders: live market prices, an economic calendar, a content feed,
a trading journal, a focus mode, and an AI assistant ("Aira" — آیرا).

> ⚠️ This README was rewritten from a direct audit of today's code, not from prior documentation. If
> you find a discrepancy between this document and the current code, **the code is the source of
> truth** — please open an Issue.

The extension's source lives in [`NewTab Extention/`](NewTab%20Extention/), not the repo root (see
[Repository Layout](#repository-layout) below). Detailed, extension-specific documentation in Persian
is also maintained there: [`NewTab Extention/README.md`](NewTab%20Extention/README.md) and
[`NewTab Extention/DATA-SOURCES.md`](NewTab%20Extention/DATA-SOURCES.md).

## Features

- Live prices across 4 markets: crypto, forex/gold/oil/DXY, Iran's free-market rates (USD/gold/coins), Tehran Stock Exchange
- Economic calendar and a daily hub (weather, occasions, customizable quick-access grid)
- Trading journal: manual entry, import from MT4 history (CSV), CSV export compatible with Persian Excel, R:R stats, and a daily heatmap
- Focus mode: Pomodoro / trading-session timer with ambient sound
- "Aira" AI assistant for market questions and broker recommendations — responses are streamed
- Articles sidebar and a "community hot topics" sidebar

## Installation

This extension is not yet published on the Chrome Web Store (see [SECURITY.md](SECURITY.md) for the
current blocker). Until then, install it manually as an unpacked extension in any Chromium-based
browser (Chrome, Edge, Brave, etc.):

1. Download or clone this repository.
2. Open `chrome://extensions`.
3. Enable **Developer mode** (toggle, top-right corner).
4. Click **Load unpacked** and select the [`NewTab Extention/`](NewTab%20Extention/) folder —
   **not** the repo root.
5. Open a new tab — the dashboard replaces Chrome's default New Tab page.

To pick up new changes later (e.g. after `git pull`), click the Reload (↻) button on the extension's
card in `chrome://extensions`.

## Repository Layout

```
Iran-Broker-Extentions/
├── README.md                  ← this file (English, project-wide entry point)
├── CONTRIBUTING.md            ← contribution guide
├── SECURITY.md                ← security policy
├── DATA-SOURCES.md            ← external APIs / domains reference
└── NewTab Extention/          ← the actual extension source (yes, "Extention" — kept as-is, it's
                                  the real directory name in this repo)
    ├── manifest.json          ← Manifest V3, permissions, CSP
    ├── newtab.html            ← markup (no inline scripts/handlers)
    ├── newtab.css
    ├── newtab.js               ← core: clock/date, search, per-tab live prices, feed, settings
    ├── js/
    │   ├── init-state.js       ← pre-paint theme/layout sync (prevents flash on load)
    │   ├── airo.js              ← "Aira" AI assistant
    │   ├── focus.js              ← Focus Mode / Pomodoro
    │   ├── journal.js             ← trading journal
    │   ├── hub.js                  ← daily hub (calendar, weather, quick access)
    │   ├── articles.js              ← articles sidebar
    │   ├── sidebars.js               ← shared open/close control for sidebars
    │   └── tour.js                    ← first-run onboarding tour
    ├── README.md               ← detailed Persian docs (extension-specific)
    └── DATA-SOURCES.md         ← detailed Persian data-sources reference
```

Everything that actually loads is 9 independent scripts (IIFEs) tagged with `<script src="...">` in
`newtab.html` — there is no build step, no bundler, and no ES modules. Full breakdown with line
numbers in [`NewTab Extention/README.md`](NewTab%20Extention/README.md).

## Architecture at a Glance

**No build, no npm, no bundler.** The product is plain HTML/CSS/JS. Every code change takes effect
only after clicking Reload on the extension in `chrome://extensions` (a page refresh is not enough).

Each widget owns an independent `localStorage` key (e.g. `ib_newtab_v2`, `ib_focus_v3`,
`ib_journal_v1`). There are **zero `chrome.storage.*` calls** anywhere in the code — the `storage`
permission was already removed from `manifest.json` for that reason (the current permission list is
just `notifications`). There is no cross-device sync. No user data is sent to any server except chat
messages sent to the Aira AI service — see [SECURITY.md](SECURITY.md) for details.

## Contributing

```bash
git clone https://github.com/Faramarznia/Iran-Broker-Extentions.git
cd "Iran-Broker-Extentions/NewTab Extention"
```

Follow the [Installation](#installation) steps above to load the extension, then edit the files in
`NewTab Extention/` and click Reload in `chrome://extensions` after each change to see it take
effect — there is no build step. See [CONTRIBUTING.md](CONTRIBUTING.md) for the full architecture
rules and the pull request checklist before opening a PR.

## Data Sources & Permissions

Full list of allowed domains, consumed APIs, and which file uses which data source: see
[DATA-SOURCES.md](DATA-SOURCES.md).

## Security

Known security issues (including the current status of the Aira API key) and how to report a
vulnerability: see [SECURITY.md](SECURITY.md).

## License

Proprietary — Iran Broker. Copying or redistribution without permission is prohibited. See
[LICENSE](LICENSE).

---

<div dir="rtl">

## معرفی فارسی

«تب جدید ایران بروکر» یک اکستنشن کروم است که صفحهٔ تب‌جدید مرورگر را به یک داشبورد کامل برای
معامله‌گران فارسی‌زبان بازارهای فارکس، کریپتو و بورس تبدیل می‌کند. هر بار که تب جدیدی باز می‌کنید،
به‌جای صفحهٔ خالی پیش‌فرض کروم، قیمت لحظه‌ای بازارها، تقویم اقتصادی، فید خبری، ژورنال معاملات، حالت
تمرکز (فوکوس‌مود) و دستیار هوش‌مصنوعی «آیرا» را می‌بینید — همه در یک صفحه، بدون نیاز به باز کردن چند
تب یا اپلیکیشن جداگانه.

از نظر فنی، این پروژه کاملاً خام و بدون build است: فقط HTML، CSS و جاوااسکریپت خالص، بدون npm، بدون
bundler و بدون ماژول ES. کد اصلی اکستنشن داخل پوشهٔ [`NewTab Extention/`](NewTab%20Extention/) قرار
دارد، نه در ریشهٔ همین ریپو.

### نصب

چون این اکستنشن هنوز در فروشگاه کروم منتشر نشده (دلیلش در [SECURITY.md](SECURITY.md) توضیح داده
شده)، فعلاً باید آن را به‌صورت دستی نصب کنید:

۱. ریپو را دانلود یا کلون کنید.
۲. آدرس `chrome://extensions` را در مرورگر باز کنید.
۳. گزینهٔ **Developer mode** را از گوشهٔ بالا-راست فعال کنید.
۴. روی **Load unpacked** بزنید و پوشهٔ [`NewTab Extention/`](NewTab%20Extention/) را انتخاب کنید —
   نه ریشهٔ ریپو.
۵. یک تب جدید باز کنید تا داشبورد را ببینید.

بعد از هر بروزرسانی کد (مثلاً بعد از `git pull`)، کافیست دکمهٔ Reload (↻) اکستنشن را در همان صفحهٔ
`chrome://extensions` بزنید.

### مستندات کامل‌تر

این بخش فقط یک معرفی خلاصه است. مستندات تفصیلی‌تر و فنی‌تر — با جزئیات کامل فایل‌به‌فایل، دامنه‌های
مجاز، و توضیح هر ویژگی — به زبان فارسی داخل خود پوشهٔ اکستنشن نگه‌داری می‌شود:
[`NewTab Extention/README.md`](NewTab%20Extention/README.md) و
[`NewTab Extention/DATA-SOURCES.md`](NewTab%20Extention/DATA-SOURCES.md). راهنمای مشارکت در توسعه
در [CONTRIBUTING.md](CONTRIBUTING.md) و مسائل امنیتی شناخته‌شده در [SECURITY.md](SECURITY.md) به
زبان انگلیسی مستند شده‌اند.

اگر بین این توضیح فارسی و مستندات انگلیسی بالا یا کد واقعی مغایرتی دیدید، مستندات انگلیسی و کد منبع
حقیقت‌اند — این بخش صرفاً برای آشنایی سریع‌تر فارسی‌زبان‌ها نوشته شده، نه یک منبع مستقل.

مالکیت این پروژه خصوصی و متعلق به ایران بروکر است؛ کپی یا توزیع آن بدون اجازه ممنوع است.

</div>
