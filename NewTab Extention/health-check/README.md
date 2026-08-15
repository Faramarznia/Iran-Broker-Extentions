# health-check/ — چک روزانهٔ منابع دادهٔ بیرونی

اسکریپت `check-data-sources.js` هر ۱۲ دامنهٔ خارجی که «تب جدید ایران بروکر» به آن‌ها متصل می‌شود را با یک درخواست HTTP واقعی (نه شبیه‌سازی، نه مرورگر) چک می‌کند — دقیقاً همان URLها/پارامترهایی که خود اپ می‌زند. هیچ dependency‌ای لازم نیست (از `fetch` داخلی Node.js استفاده می‌کند، Node ۱۸+).

## اجرای دستی

```bash
cd "NewTab Extention/health-check"
node check-data-sources.js
```

خروجی: `reports/<YYYY-MM-DD>.md` (+ `.json` خام) و `STATUS.md` (همیشه آخرین اجرا، برای چک سریع «الان همه‌چیز سالمه؟»). کد خروجی `0` یعنی همه سالم، `1` یعنی حداقل یک منبع قطع است — برای هوک‌کردن به آلارم/CI مناسب است.

## بخش ویژه: Failover TGJU

چون این جدیدترین رفع باگ پروژه بود (قبلاً failover متوالی بود و بدترین حالت را به ۱۸ ثانیه می‌رساند)، اسکریپت علاوه بر چک تک‌تک `call2`/`call3`، دقیقاً همان منطق تولید (`Promise.any` با یک `AbortController`/بودجهٔ ۹۰۰۰ms مشترک) را با ترافیک واقعی اجرا می‌کند و گزارش می‌دهد کدام میزبان برنده شد و چقدر طول کشید. اگر یک میزبان تک‌تک مشکل داشت ولی race موفق بود، این را جدا هشدار می‌دهد — چون یعنی محصول موقتاً روی یک میزبان تکیه دارد، نه دو تا (ریسک پنهان).

## زمان‌بندی روزانه — یکی از این دو را انتخاب کنید

### گزینه ۱: cron ساده (macOS/Linux)

```bash
crontab -e
# این خط را اضافه کنید (هر روز ساعت ۸ صبح):
0 8 * * * cd "/Users/faramarz/Documents/GitHub/Iran-Broker-Extentions/NewTab Extention/health-check" && /opt/homebrew/bin/node check-data-sources.js >> cron.log 2>&1
```
(مسیر `node` روی این سیستم `/opt/homebrew/bin/node` است — با `which node` دوباره تأیید کنید اگر عوض شد.)

### گزینه ۲: launchd (پیشنهاد Apple برای macOS، در برابر ری‌استارت هم پایدار می‌ماند)

یک فایل در `~/Library/LaunchAgents/com.iranbroker.healthcheck.plist` بسازید:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.iranbroker.healthcheck</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/node</string>
    <string>check-data-sources.js</string>
  </array>
  <key>WorkingDirectory</key><string>/Users/faramarz/Documents/GitHub/Iran-Broker-Extentions/NewTab Extention/health-check</string>
  <key>StartCalendarInterval</key>
  <dict><key>Hour</key><integer>8</integer><key>Minute</key><integer>0</integer></dict>
  <key>StandardOutPath</key><string>launchd.log</string>
  <key>StandardErrorPath</key><string>launchd.log</string>
</dict>
</plist>
```
سپس: `launchctl load ~/Library/LaunchAgents/com.iranbroker.healthcheck.plist`

### گزینه ۳: یک Claude Code Scheduled Agent (برای خلاصه/تحلیل هوشمند به‌جای فقط لاگ خام)

اگر می‌خواهید هر روز یک خلاصهٔ خوانا (نه فقط جدول خام) دریافت کنید یا در صورت قطعی هشدار هوشمند بگیرید، از مهارت `/schedule` همین محیط Claude Code استفاده کنید تا یک agent روزانه این اسکریپت را اجرا و نتیجه را برایتان جمع‌بندی کند.

**وضعیت فعلی: زمان‌بندی نصب نشده است.** یک نمونهٔ گزینهٔ ۱ به‌اشتباه (بدون تأیید کاربر) روی این سیستم فعال شده بود؛ در ۲۰۲۶-۰۸-۱۵ حذف شد (`crontab -r`). اجرای دستی همچنان کار می‌کند؛ اگر زمان‌بندی خودکار مطلوب است، یکی از سه گزینهٔ بالا را خودتان آگاهانه انتخاب/فعال کنید.

## نمونه گزارش امروز (۲۰۲۶-۰۸-۱۵)

اولین اجرای واقعی، همین حالا: ۱۱ منبع سالم، ۲ قطع (`TSETMC` timeout — طبق مستندات پروژه این معمولاً از خارج ایران محدود است، رفتار شناخته‌شده است نه یک رگرسیون جدید؛ `Forex Factory Calendar` با HTTP 429 rate-limit شد). failover TGJU زیر ترافیک واقعی در ۲۲۹ میلی‌ثانیه با برنده‌شدن `call2` تمام شد. جزئیات کامل: `reports/2026-08-15.md`.
