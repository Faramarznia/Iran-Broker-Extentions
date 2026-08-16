# وضعیت منابع داده — 2026-08-15

اجرا در 2026-08-15T12:53:42.620Z · ✅ 11 سالم · ⚠️ 0 کند/نامطمئن · ❌ 2 قطع

| منبع | وضعیت | HTTP | تأخیر | یادداشت |
|---|---|---|---|---|
| CoinGecko (تب کریپتو) | 🟢 UP | 200 | 1814ms | — |
| Yahoo Finance (تب فارکس) | 🟢 UP | 200 | 2577ms | — |
| https://call2.tgju.org/ajax.json | 🟢 UP | 200 | 2051ms | — |
| https://call3.tgju.org/ajax.json | 🟢 UP | 200 | 1832ms | — |
| TSETMC (تب بورس) | 🔴 DOWN | — | 10004ms | timeout (>10s) |
| Forex Factory Calendar (nfs.faireconomy.media) | 🔴 DOWN | 429 | 1512ms | JSON نامعتبر |
| iranbroker.net (WP REST — فید/مقالات) | 🟢 UP | 200 | 2745ms | — |
| forum.iranbroker.net (سایدبار جامعه) | 🟢 UP | 200 | 2957ms | — |
| Open-Meteo (آب‌وهوا) | 🟢 UP | 200 | 1792ms | — |
| Open-Meteo Geocoding (جست‌وجوی شهر) | 🟢 UP | 200 | 2159ms | — |
| GapGPT (آیرا، فعال) | 🟢 UP | 401 | 1787ms | auth-wall check (no real request sent, no tokens spent) |
| Anthropic (آیرا، جایگزین غیرفعال) | 🟢 UP | 401 | 1488ms | auth-wall check (no real request sent, no tokens spent) |

## ⭐ Failover TGJU زیر ترافیک واقعی

این بخش دقیقاً همان منطق `fetchTgju()` در `newtab.js` را با ترافیک واقعی (نه شبیه‌سازی) اجرا می‌کند: هر دو میزبان هم‌زمان زیر یک بودجهٔ ۹۰۰۰ میلی‌ثانیه‌ای مشترک.

| میزبان برنده | زمان تا پاسخ | وضعیت |
|---|---|---|
| https://call2.tgju.org/ajax.json | 229ms | 🟢 UP — call2.tgju.org برنده شد |

## 🔴 نیاز به توجه فوری

- **TSETMC (تب بورس)**: timeout (>10s)
- **Forex Factory Calendar (nfs.faireconomy.media)**: JSON نامعتبر
