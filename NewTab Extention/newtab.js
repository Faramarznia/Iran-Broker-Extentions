/* ===================================================================
   ایران بروکر — تب جدید (ریدیزاین)
   Vanilla port of the Claude Design component "IranBroker NewTab".
   Features: glowing clock + Jalali date + hourly greeting, forex
   world-markets ring, live CoinGecko crypto with sparklines, tools
   grid, daily tip, quick links, dark/light theme, accent / grid /
   layout tweaks, and a settings modal — all persisted locally.
   =================================================================== */
(function () {
  'use strict';

  /* ----------------------------- Icons (inline SVG) ----------------------------- */
  const ICONS = {
    search: '<path fill="currentColor" d="M18.031 16.617l4.283 4.282-1.415 1.415-4.282-4.283A8.96 8.96 0 0 1 11 20c-4.968 0-9-4.032-9-9s4.032-9 9-9 9 4.032 9 9a8.96 8.96 0 0 1-1.969 5.617zm-2.006-.742A6.977 6.977 0 0 0 18 11c0-3.868-3.133-7-7-7-3.868 0-7 3.132-7 7 0 3.867 3.132 7 7 7a6.977 6.977 0 0 0 4.875-1.975l.15-.15z"/>',
    arrowLeft: '<path fill="currentColor" d="M10.828 12l4.95 4.95-1.414 1.414L8 12l6.364-6.364 1.414 1.414z"/>',
    equalizer: '<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></g><g fill="currentColor"><circle cx="9" cy="7" r="2.4"/><circle cx="15" cy="12" r="2.4"/><circle cx="10" cy="17" r="2.4"/></g>',
    sun: '<circle cx="12" cy="12" r="4" fill="currentColor"/><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="2" x2="12" y2="4.5"/><line x1="12" y1="19.5" x2="12" y2="22"/><line x1="2" y1="12" x2="4.5" y2="12"/><line x1="19.5" y1="12" x2="22" y2="12"/><line x1="4.9" y1="4.9" x2="6.7" y2="6.7"/><line x1="17.3" y1="17.3" x2="19.1" y2="19.1"/><line x1="19.1" y1="4.9" x2="17.3" y2="6.7"/><line x1="6.7" y1="17.3" x2="4.9" y2="19.1"/></g>',
    moon: '<path fill="currentColor" d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.39 5.39 0 0 1-7.54-7.54C12.92 3.04 12.46 3 12 3z"/>',
    google: '<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>',
    lineChart: '<path fill="currentColor" d="M3 3h2v16h16v2H3V3zm15.293 3.293l1.414 1.414L14 13.414l-3-3-4.293 4.293-1.414-1.414L11 7.586l3 3z"/>',
    refresh: '<path fill="currentColor" d="M5.463 4.433A9.961 9.961 0 0 1 12 2c5.523 0 10 4.477 10 10 0 2.136-.67 4.116-1.81 5.74L17 12h3A8 8 0 0 0 6.46 6.228l-.997-1.795zm13.074 15.134A9.961 9.961 0 0 1 12 22C6.477 22 2 17.523 2 12c0-2.136.67-4.116 1.81-5.74L7 12H4a8 8 0 0 0 13.54 5.772l.997 1.795z"/>',
    shieldCheck: '<path fill="currentColor" d="M12 1l8.217 1.826a1 1 0 0 1 .783.976v9.987a6 6 0 0 1-2.672 4.992L12 23l-6.328-4.219A6 6 0 0 1 3 13.79V3.802a1 1 0 0 1 .783-.976L12 1zm0 2.049L5 4.604v9.185a4 4 0 0 0 1.781 3.328L12 20.597l5.219-3.48A4 4 0 0 0 19 13.79V4.604L12 3.05zm4.452 5.173l1.415 1.414L11.503 16 7.26 11.757l1.414-1.414 2.828 2.828 4.95-4.95z"/>',
    close: '<path fill="currentColor" d="M12 10.586l4.95-4.95 1.414 1.414L13.414 12l4.95 4.95-1.414 1.414L12 13.414l-4.95 4.95-1.414-1.414L10.586 12 5.636 7.05 7.05 5.636z"/>',
    bank: '<path fill="currentColor" d="M2 20h20v2H2v-2zm2-8h2v7H4v-7zm5 0h2v7H9v-7zm4 0h2v7h-2v-7zm5 0h2v7h-2v-7zM2 7l10-5 10 5v4H2V7zm2 1.236V9h16v-.764l-8-4-8 4z"/>',
    barChart: '<path fill="currentColor" d="M3 3h2v16h16v2H3V3zm5 8h2v6H8v-6zm4-4h2v10h-2V7zm4 6h2v4h-2v-4z"/>',
    calendar: '<path fill="currentColor" d="M17 3h4a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4V1h2v2h6V1h2v2zm3 8H4v8h16v-8zM9 5H7v1H4v3h16V6h-3V5h-2v1H9V5zm-2 8h5v4H7v-4z"/>',
    coin: '<path fill="currentColor" d="M12 1c6.075 0 11 4.925 11 11s-4.925 11-11 11S1 18.075 1 12 5.925 1 12 1zm0 2a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm1 3v1.5h2v2h-4.5a.5.5 0 0 0-.09.992L13 11a2.5 2.5 0 0 1 .5 4.95V18h-2v-1.5H9v-2h4.5a.5.5 0 0 0 .09-.992L11 11a2.5 2.5 0 0 1-.5-4.95V6h2.5z"/>',
    swap: '<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10h8m-2-2 2 2-2 2"/><path d="M16 14H8m2 2-2-2 2-2"/></g>',
    trophy: '<path fill="currentColor" d="M13 16.938V19h5v2H6v-2h5v-2.062A8.001 8.001 0 0 1 4 9V3h16v6a8.001 8.001 0 0 1-7 7.938zM6 5v4a6 6 0 1 0 12 0V5H6zM1 5h2v4H1V5zm20 0h2v4h-2V5z"/>',
    newspaper: '<path fill="currentColor" d="M20 3v16a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3V5h2v13a1 1 0 0 0 2 0V3h14zM7 7v6h8V7H7zm2 2h4v2H9V9zm-2 6h8v2H7v-2z"/>',
    graduation: '<path fill="currentColor" d="M12 2l11 6-11 6L3.545 9.385 3 9.09V14H1V8l11-6zm6.16 9.674L19 12v3.5c0 1.933-3.134 3.5-7 3.5s-7-1.567-7-3.5V12l.84-.326L12 14.276l6.16-2.602z"/>',
    link: '<path fill="currentColor" d="M18.364 15.536L16.95 14.12l1.414-1.414a5 5 0 1 0-7.071-7.071L9.879 7.05 8.464 5.636 9.88 4.222a7 7 0 0 1 9.9 9.9l-1.415 1.414zm-2.828 2.828l-1.415 1.414a7 7 0 0 1-9.9-9.9l1.415-1.414L7.05 9.88l-1.414 1.414a5 5 0 1 0 7.071 7.071l1.414-1.414 1.415 1.414zm-.708-10.607l1.415 1.415-7.072 7.07-1.414-1.414 7.071-7.07z"/>',
    autoTheme: '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path fill="currentColor" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10V2z"/>',
    glassTheme: '<path fill="currentColor" d="M12 2l2 8 8 2-8 2-2 8-2-8-8-2 8-2z"/>',
    upload: '<path fill="currentColor" d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1m-4-8-4-4m0 0-4 4m4-4v12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
    focus: '<circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.8" fill="none"/><line x1="12" y1="2" x2="12" y2="5.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><line x1="12" y1="18.5" x2="12" y2="22" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><line x1="2" y1="12" x2="5.5" y2="12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><line x1="18.5" y1="12" x2="22" y2="12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="12" r="2.5" fill="currentColor"/>'
  };
  function svg(name) {
    return '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' + (ICONS[name] || '') + '</svg>';
  }

  /* ----------------------------- Data ----------------------------- */
  const TOOLS = [
    { label: 'لیست بروکرها', sub: 'فارکس', url: 'https://iranbroker.net/forex-brokers/', icon: 'bank', c: '#6f9bf3' },
    { label: 'مقایسه اسپرد', sub: 'لحظه‌ای', url: 'https://iranbroker.net/spread-comparison/', icon: 'barChart', c: '#1fc16b' },
    { label: 'تقویم اقتصادی', sub: 'رویدادها', url: 'https://iranbroker.net/economic-calendar/', icon: 'calendar', c: '#f6a723' },
    { label: 'قیمت ارز دیجیتال', sub: 'زنده', url: 'https://iranbroker.net/cryptocurrency-prices/', icon: 'coin', c: '#a78bfa' },
    { label: 'صرافی‌ها', sub: 'کریپتو', url: 'https://iranbroker.net/crypto-exchanges/', icon: 'swap', c: '#35d0c0' },
    { label: 'پراپ فرم‌ها', sub: 'سرمایه', url: 'https://iranbroker.net/prop-firms/', icon: 'trophy', c: '#f6679f' },
    { label: 'تحلیل بازار', sub: 'روزانه', url: 'https://iranbroker.net/market-analysis/', icon: 'lineChart', c: '#6f9bf3' },
    { label: 'اخبار', sub: 'بازار', url: 'https://iranbroker.net/news/', icon: 'newspaper', c: '#fb3748' },
    { label: 'هشدار کلاهبرداری', sub: 'آگاهی', url: 'https://iranbroker.net/fraud-alert/', icon: 'shieldCheck', c: '#f6a723' },
    { label: 'آموزش فارکس', sub: 'رایگان', url: 'https://iranbroker.net/forex-education/', icon: 'graduation', c: '#a78bfa' }
  ];
  const QUICK = [
    { label: 'صفحه اصلی', url: 'https://iranbroker.net/' },
    { label: 'ورود اعضا', url: 'https://iranbroker.net/login/' },
    { label: 'صندوق‌های طلا', url: 'https://iranbroker.net/gold-funds/' },
    { label: 'بروکرهای بورس', url: 'https://iranbroker.net/stock-brokers/' },
    { label: 'تماس با ما', url: 'https://iranbroker.net/contact-us/' }
  ];
  const TIPS = [
    { tag: 'آگاهی از کلاهبرداری', text: 'هیچ نهاد مالی معتبری «سود تضمینی» بالای ۷۰٪ نمی‌دهد. چنین وعده‌هایی توجیه اقتصادی ندارند و معمولاً چیزی پشتشان پنهان است.' },
    { tag: 'انتخاب بروکر', text: 'قبل از افتتاح حساب، رگوله بروکر را بررسی کنید. رگوله‌های معتبر مثل FCA، ASIC و CySEC سطح حفاظت بالاتری دارند.' },
    { tag: 'مدیریت ریسک', text: 'هیچ‌گاه بیش از ۱ تا ۲ درصد سرمایه‌تان را روی یک معامله ریسک نکنید. حفظ سرمایه مقدم بر کسب سود است.' },
    { tag: 'اسپرد', text: 'اسپرد پایین همیشه یعنی هزینهٔ کمتر نیست؛ حساب‌های ECN اسپرد نزدیک صفر دارند اما کمیسیون جداگانه می‌گیرند.' },
    { tag: 'پراپ فرم', text: 'پراپ‌فرم معتبر هرگز برای «برداشت سود» هزینهٔ اضافه نمی‌خواهد. مراقب درخواست‌های پرداخت مشکوک باشید.' },
    { tag: 'آموزش', text: 'سودآوری مداوم در فارکس یک‌شبه به‌دست نمی‌آید؛ نیاز به سال‌ها تمرین، تجربه و پشتکار دارد.' }
  ];
  /* جلسات با ساعت محلیِ خودِ بازار تعریف می‌شوند و ساعت UTC به‌صورت زنده
     از تایم‌زون محاسبه می‌شود — بنابراین تغییر ساعت تابستانی (DST) خودکار اعمال می‌شود */
  const SESSIONS = [
    { key: 'sydney', name: 'سیدنی', flag: '🇦🇺', tz: 'Australia/Sydney', open: 7, close: 16, c: '#35d0c0' },
    { key: 'tokyo', name: 'توکیو', flag: '🇯🇵', tz: 'Asia/Tokyo', open: 9, close: 18, c: '#a78bfa' },
    { key: 'london', name: 'لندن', flag: '🇬🇧', tz: 'Europe/London', open: 8, close: 17, c: '#6f9bf3' },
    { key: 'newyork', name: 'نیویورک', flag: '🇺🇸', tz: 'America/New_York', open: 8, close: 17, c: '#f6a723' }
  ];
  const GALLERY = [
    { label: 'ارزهای جهانی',    file: 'assets/gallery/bg1.jpg', gradient: 'linear-gradient(135deg,#8B6914,#C4901A,#7B4F12)' },
    { label: 'دلار آمریکا',     file: 'assets/gallery/bg2.jpg', gradient: 'linear-gradient(135deg,#1a4d20,#2d7a38,#1a3d22)' },
    { label: 'بیت‌کوین و اتر', file: 'assets/gallery/bg3.jpg', gradient: 'linear-gradient(135deg,#1a0a00,#4a2800,#1a0d00)' },
    { label: 'کانتینرها',       file: 'assets/gallery/bg4.jpg', gradient: 'linear-gradient(135deg,#0a1a2e,#1a3a5c,#0d2040)' },
    { label: 'صفحه معاملات',   file: 'assets/gallery/bg5.jpg', gradient: 'linear-gradient(135deg,#0a0a1e,#0d0d2e,#050514)' },
    { label: 'هولد بیت‌کوین',  file: 'assets/gallery/bg6.jpg', gradient: 'linear-gradient(135deg,#1a0020,#3a0040,#200028)' },
    { label: 'نمودار صعودی',   file: 'assets/gallery/bg7.jpg', gradient: 'linear-gradient(135deg,#001a0a,#003a14,#00200a)' },
    { label: 'نمودار نزولی',   file: 'assets/gallery/bg8.jpg', gradient: 'linear-gradient(135deg,#1a0000,#3a0010,#200008)' }
  ];
  const THEME_CYCLE = ['dark', 'light', 'auto', 'glass'];
  const THEME_ICONS = { dark: 'moon', light: 'sun', auto: 'autoTheme', glass: 'glassTheme' };
  const COIN_META = {
    bitcoin: { sym: 'BTC', name: 'بیت‌کوین' }, ethereum: { sym: 'ETH', name: 'اتریوم' }, tether: { sym: 'USDT', name: 'تتر' },
    solana: { sym: 'SOL', name: 'سولانا' }, ripple: { sym: 'XRP', name: 'ریپل' }, dogecoin: { sym: 'DOGE', name: 'دوج‌کوین' },
    binancecoin: { sym: 'BNB', name: 'بایننس‌کوین' }, cardano: { sym: 'ADA', name: 'کاردانو' }, tron: { sym: 'TRX', name: 'ترون' }
  };
  const SEED = [
    { id: 'bitcoin', price: 96480, chg: 1.84 }, { id: 'ethereum', price: 3342, chg: 2.41 },
    { id: 'tether', price: 1.0, chg: 0.02 }, { id: 'solana', price: 198.3, chg: -1.12 },
    { id: 'ripple', price: 2.27, chg: 3.06 }, { id: 'dogecoin', price: 0.382, chg: -0.74 }
  ];
  const NEWS_SEED = [
    { title: 'بانک مرکزی اروپا نرخ بهره را ثابت نگه داشت', cat: 'فارکس', catColor: '#6f9bf3', time: '۳ ساعت پیش', url: 'https://iranbroker.net/news/', img: null },
    { title: 'دلار آمریکا در برابر ین ژاپن تضعیف شد', cat: 'فارکس', catColor: '#6f9bf3', time: '۷ ساعت پیش', url: 'https://iranbroker.net/news/', img: null },
    { title: 'بیت‌کوین از مقاومت ۷۰ هزار دلاری عبور کرد', cat: 'کریپتو', catColor: '#a78bfa', time: '۵ ساعت پیش', url: 'https://iranbroker.net/news/', img: null },
    { title: 'اتریوم پس از به‌روزرسانی شبکه جهش کرد', cat: 'کریپتو', catColor: '#a78bfa', time: '۹ ساعت پیش', url: 'https://iranbroker.net/news/', img: null },
    { title: 'تحلیل طلا: روند صعودی در بازارهای جهانی ادامه دارد', cat: 'طلا', catColor: '#f6a723', time: '۲ ساعت پیش', url: 'https://iranbroker.net/news/', img: null },
    { title: 'قیمت نفت برنت زیر فشار کاهش تقاضای چین', cat: 'نفت', catColor: '#fb3748', time: '۶ ساعت پیش', url: 'https://iranbroker.net/news/', img: null },
    { title: 'شاخص بورس تهران با رشد همراه شد', cat: 'بورس', catColor: '#1fc16b', time: '۱۱ ساعت پیش', url: 'https://iranbroker.net/news/', img: null },
    { title: 'بررسی وضعیت بروکرهای فعال برای ایرانیان', cat: 'بروکر', catColor: '#35d0c0', time: '۱ روز پیش', url: 'https://iranbroker.net/news/', img: null }
  ];
  const COMM_CATS = {
    2:  { name: 'تازه‌ها',           color: '#808281', url: 'https://forum.iranbroker.net/c/2' },
    4:  { name: 'گفتگوی آزاد',       color: '#25AAE2', url: 'https://forum.iranbroker.net/c/lobby/4' },
    5:  { name: 'بروکرهای فارکس',   color: '#3AB54A', url: 'https://forum.iranbroker.net/c/brokers/5' },
    6:  { name: 'صرافی‌های ایرانی', color: '#92278F', url: 'https://forum.iranbroker.net/c/iran-exchanges/6' },
    7:  { name: 'پراپ فرم‌ها',       color: '#F1592A', url: 'https://forum.iranbroker.net/c/props/7' },
    8:  { name: 'پلتفرم‌های طلا',    color: '#C9A000', url: 'https://forum.iranbroker.net/c/gold-platforms/8' },
    9:  { name: 'تحلیل و سیگنال',   color: '#0088CC', url: 'https://forum.iranbroker.net/c/analysis/9' },
    12: { name: 'صرافی‌های خارجی',  color: '#1fc16b', url: 'https://forum.iranbroker.net/c/global-exchanges/12' },
    13: { name: 'بورس ایران',        color: '#6f9bf3', url: 'https://forum.iranbroker.net/c/bourse/13' },
    14: { name: 'دوره‌ها و اساتید',  color: '#B3B5B4', url: 'https://forum.iranbroker.net/c/14' },
    16: { name: 'استراتژی‌ها',       color: '#F7941D', url: 'https://forum.iranbroker.net/c/trading-systems/16' },
    17: { name: 'ابزارها',           color: '#12A89D', url: 'https://forum.iranbroker.net/c/tools/17' },
    18: { name: 'روان‌شناسی',        color: '#BF1E2E', url: 'https://forum.iranbroker.net/c/psychology/18' }
  };
  const COMMUNITY = {
    hot: [
      { title: 'فقط معاملات و تحلیل انس جهانی طلا – xauusd', cat: 'تحلیل و سیگنال', catColor: '#0088CC', time: '...', replies: '11.1ه', views: '21.2ه', url: 'https://forum.iranbroker.net/t/xauusd/4063' },
      { title: 'تحلیل شاخص کل و انواع صندوق‌های بورس ایران', cat: 'تحلیل و سیگنال', catColor: '#0088CC', time: '...', replies: '1.7ه', views: '5.1ه', url: 'https://forum.iranbroker.net/t/topic/10043' },
      { title: 'به کامیونیتی ایران بروکر خوش آمدید!', cat: 'گفتگوی آزاد', catColor: '#25AAE2', time: '...', replies: '74', views: '6.9ه', url: 'https://forum.iranbroker.net/t/topic/5' },
      { title: 'چالش پاس کردن اکانت ۱۰ کا سرمایه‌گذار برتر', cat: 'پراپ فرم‌ها', catColor: '#F1592A', time: '...', replies: '314', views: '4ه', url: 'https://forum.iranbroker.net/t/topic/12777' },
      { title: 'نقاشی واسه کامیونیتی. خسته شدی بیا اینجا ذهنتو آروم کن', cat: 'گفتگوی آزاد', catColor: '#25AAE2', time: '...', replies: '315', views: '851', url: 'https://forum.iranbroker.net/t/topic/13424' },
      { title: 'آشنایی با سیستم‌های Algorithmic Order Tracking در معاملات FX', cat: 'استراتژی‌ها', catColor: '#F7941D', time: '...', replies: '155', views: '1.9ه', url: 'https://forum.iranbroker.net/t/algorithmic-order-tracking-fx/2907' }
    ],
    latest: [
      { title: 'معرفی آیرا؛ هوش مصنوعی کامیونیتی ایران بروکر', cat: 'تازه‌ها', catColor: '#808281', time: '...', replies: '4', views: '136', url: 'https://forum.iranbroker.net/t/topic/14739' },
      { title: 'تمیز کردن تتر و گم کردن رد پول در کریپتو', cat: 'صرافی‌های خارجی', catColor: '#1fc16b', time: '...', replies: '0', views: '17', url: 'https://forum.iranbroker.net/t/topic/14839' },
      { title: 'ماجرای کلاهبرداری علیرضا امامی نژاد', cat: 'گفتگوی آزاد', catColor: '#25AAE2', time: '...', replies: '35', views: '226', url: 'https://forum.iranbroker.net/t/topic/14753' },
      { title: 'آشنایی با Algorithmic Order Tracking در معاملات FX', cat: 'استراتژی‌ها', catColor: '#F7941D', time: '...', replies: '155', views: '1.9ه', url: 'https://forum.iranbroker.net/t/algorithmic-order-tracking-fx/2907' },
      { title: 'نقاشی واسه کامیونیتی. خسته شدی بیا اینجا ذهنتو آروم کن', cat: 'گفتگوی آزاد', catColor: '#25AAE2', time: '...', replies: '315', views: '851', url: 'https://forum.iranbroker.net/t/topic/13424' },
      { title: 'بررسی پراپ فرصت‌های رابین سود از همه جهات', cat: 'پراپ فرم‌ها', catColor: '#F1592A', time: '...', replies: '73', views: '176', url: 'https://forum.iranbroker.net/t/topic/14333' }
    ]
  };
  let commTabState = 'hot';
  function commFmtNum(n) {
    n = parseInt(n) || 0;
    if (n >= 10000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'ه';
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'ه';
    return String(n);
  }
  function commRelTime(iso) {
    const s = Math.floor((Date.now() - new Date(iso)) / 1000);
    if (s < 120) return 'همین الان';
    if (s < 3600) return Math.floor(s / 60) + ' دقیقه پیش';
    if (s < 86400) return Math.floor(s / 3600) + ' ساعت پیش';
    if (s < 86400 * 30) return Math.floor(s / 86400) + ' روز پیش';
    if (s < 86400 * 365) return Math.floor(s / 86400 / 30) + ' ماه پیش';
    return Math.floor(s / 86400 / 365) + ' سال پیش';
  }
  const CAT_COLORS = {
    'فارکس': '#6f9bf3', 'طلا': '#f6a723', 'کریپتو': '#a78bfa',
    'نفت': '#fb3748', 'بورس': '#1fc16b', 'بروکر': '#35d0c0',
    'اقتصاد': '#f6679f', 'بانک': '#a78bfa'
  };

  const ENGINES = {
    google: { label: 'گوگل', icon: 'google', url: function (q) { return 'https://www.google.com/search?q=' + encodeURIComponent(q); } },
    ib: { label: 'ایران بروکر', icon: 'search', logo: '<svg viewBox="124.5 -1 33 30" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M137.502 0.350075C140.334 -0.328325 143.349 0.000596404 145.997 1.15182C145.59 2.0358 145.162 2.94033 144.734 3.8243C142.351 2.79643 139.621 2.67308 137.156 3.45427C134.793 4.2149 132.776 5.88006 131.391 7.93582C129.7 10.485 129.273 13.7742 130.006 16.7345C130.678 19.4686 132.532 21.8122 134.854 23.3129C137.34 24.8958 140.456 25.2658 143.288 24.5874C147.83 23.4362 151.294 19.078 151.497 14.3703C152.455 14.4731 153.412 14.5142 154.37 14.617C154.227 16.7139 153.697 18.7902 152.638 20.6198C150.744 24.1763 147.138 26.7049 143.247 27.5477C139.132 28.4728 134.671 27.1571 131.493 24.423C131.249 24.1763 130.984 24.1763 130.658 24.5669C129.619 25.7181 128.539 26.8282 127.521 28C126.808 27.3422 126.095 26.6638 125.382 25.9854C126.543 24.7313 127.704 23.4568 128.886 22.2028C129.171 21.8533 129.089 21.5655 128.906 21.3188C127.541 19.1191 126.808 16.5289 126.747 13.9386C126.808 10.9372 127.786 7.95637 129.558 5.55114C131.452 2.91977 134.386 1.13126 137.502 0.350075Z" fill="var(--logo-mark)"/><path d="M149.705 3.84486C151.375 3.45427 152.964 3.12535 154.716 2.8581C155.612 2.75531 156.02 3.22813 155.999 3.84486C155.938 5.79783 155.816 7.19574 155.632 8.90202C155.551 9.80656 154.675 10.2588 154.044 9.76544C153.473 9.49819 152.862 8.49087 152.455 8.75812C152.088 8.9637 151.864 9.33373 151.579 9.64209C149.419 12.1912 147.219 14.6993 145.04 17.2278C144.51 17.8446 143.553 17.9062 142.962 17.3512C141.638 16.0972 140.395 14.7404 139.071 13.4658C138.888 13.2602 138.623 13.3836 138.48 13.548C137.319 14.7198 136.158 15.8916 134.997 17.0634C134.325 16.3644 133.652 15.6449 132.939 14.9871C134.447 13.4247 135.995 11.9034 137.502 10.3616C137.849 9.99157 138.338 9.64209 138.806 9.64209C139.295 9.60098 139.703 9.9299 140.028 10.2588C141.169 11.41 142.31 12.5818 143.451 13.7125C143.593 13.9181 143.879 14.1236 144.082 13.8564C146.16 11.5539 148.177 9.14871 150.214 6.76404C150.54 6.37344 149.236 5.61281 149.012 5.28389C148.625 4.76995 149.053 3.94765 149.705 3.84486Z" fill="var(--logo-mark)"/></svg>', url: function (q) { return 'https://iranbroker.net/?s=' + encodeURIComponent(q); } },
    tv: { label: 'تریدینگ‌ویو', icon: 'lineChart', logo: '<svg viewBox="24 55 140 74" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M115.055 72.5C115.055 79.8638 109.086 85.8333 101.722 85.8333C94.3583 85.8333 88.3888 79.8638 88.3888 72.5C88.3888 65.1362 94.3583 59.1667 101.722 59.1667C109.086 59.1667 115.055 65.1362 115.055 72.5ZM81.9999 59.7778H28.6667L28.6665 86.4444H55.3332V125.556H81.9999V59.7778ZM128.755 59.7778H159.333L131.778 125.556H101.111L128.755 59.7778Z" fill="currentColor"/></svg>', url: function (q) { return 'https://www.tradingview.com/symbols/' + encodeURIComponent(q.toUpperCase()) + '/'; } },
    airo: { label: 'آیرو', icon: 'search', logo: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M11 2.5l1.85 5.4a1.4 1.4 0 0 0 .87.87l5.4 1.85-5.4 1.85a1.4 1.4 0 0 0-.87.87L11 18.75l-1.85-5.41a1.4 1.4 0 0 0-.87-.87L2.87 10.6l5.41-1.84a1.4 1.4 0 0 0 .87-.87L11 2.5z"/><path fill="currentColor" opacity=".55" d="M18.6 14.6l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9.9-2.6z"/></svg>', url: null }
  };
  const ENGINE_ORDER = ['google', 'ib', 'tv', 'airo'];

  /* ----------------------------- State ----------------------------- */
  const PERSIST_KEY = 'ib_newtab_v2';
  const state = {
    theme: 'dark', layout: 'simple', accent: '#185adb', showGrid: true,
    name: '', engine: 'google', activeEngine: 'google',
    coins: 'bitcoin,ethereum,tether,solana,ripple,dogecoin',
    showCrypto: true, query: '', sugIdx: -1, tipIndex: 0,
    pxTab: 'crypto', pxExpanded: null,
    pxData: {
      crypto: {
        rows: SEED.map(function (c) {
          const m = COIN_META[c.id] || {};
          return { id: c.id, sym: m.sym || c.id.toUpperCase(), name: m.name || c.id, price: c.price, chg: c.chg };
        }),
        ts: 0, time: '', err: false
      },
      forex: { rows: [], ts: 0, time: '', err: false },
      iran: { rows: [], ts: 0, time: '', err: false }
    },
    mktAxis: 'utc', newsCat: 'همه', news: null,
    bgMode: 'default', bgIndex: 0, bgImage: null
  };
  const BG_IMAGE_KEY = 'ib_bg_image';

  function load() {
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(PERSIST_KEY) || '{}'); } catch (e) {}
    ['theme', 'layout', 'accent', 'showGrid', 'name', 'engine', 'coins', 'showCrypto', 'tipIndex', 'bgMode', 'bgIndex', 'pxTab', 'mktAxis'].forEach(function (k) {
      if (saved[k] !== undefined) state[k] = saved[k];
    });
    state.activeEngine = state.engine;
    if (!state.pxData[state.pxTab]) state.pxTab = 'crypto';
    if (state.mktAxis !== 'local') state.mktAxis = 'utc';
    if (state.bgMode === 'custom') {
      try { state.bgImage = localStorage.getItem(BG_IMAGE_KEY) || null; } catch (e) {}
      if (!state.bgImage) state.bgMode = 'default';
    }
  }
  function persist() {
    const o = {
      theme: state.theme, layout: state.layout, accent: state.accent, showGrid: state.showGrid,
      name: state.name, engine: state.engine, coins: state.coins,
      showCrypto: state.showCrypto, tipIndex: state.tipIndex,
      bgMode: state.bgMode, bgIndex: state.bgIndex,
      pxTab: state.pxTab, mktAxis: state.mktAxis
    };
    try { localStorage.setItem(PERSIST_KEY, JSON.stringify(o)); } catch (e) {}
  }

  /* ----------------------------- Color helpers ----------------------------- */
  function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }
  function lighten(hex, amt) {
    const n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const m = function (v) { return Math.round(v + (255 - v) * amt); };
    return 'rgb(' + m(r) + ',' + m(g) + ',' + m(b) + ')';
  }
  function getEffectiveTheme() {
    if (state.theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return state.theme;
  }
  function applyAccent() {
    const a = state.accent; if (!a || a[0] !== '#') return;
    const eff = getEffectiveTheme();
    document.body.style.setProperty('--primaryStrong', a);
    document.body.style.setProperty('--primary', eff === 'light' ? a : lighten(a, 0.32));
    document.body.style.setProperty('--primarySoft', hexA(a, 0.14));
  }

  /* ----------------------------- Forex ring geometry ----------------------------- */
  function polar(cx, cy, r, deg) { const a = (deg - 90) * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }
  function arc(cx, cy, r, sH, eH) {
    let s = sH, e = eH; if (e <= s) e += 24;
    const a0 = (s / 24) * 360, a1 = (e / 24) * 360;
    const p0 = polar(cx, cy, r, a0), p1 = polar(cx, cy, r, a1);
    const large = (a1 - a0) > 180 ? 1 : 0;
    return 'M ' + p0[0].toFixed(2) + ' ' + p0[1].toFixed(2) + ' A ' + r + ' ' + r + ' 0 ' + large + ' 1 ' + p1[0].toFixed(2) + ' ' + p1[1].toFixed(2);
  }
  /* --- زمان محلی هر بازار (با کش فرمترها؛ Intl ساختنش گران است) --- */
  const tzFmtCache = {};
  function tzParts(now, tz) {
    let fmt = tzFmtCache[tz];
    if (!fmt) {
      try {
        fmt = tzFmtCache[tz] = new Intl.DateTimeFormat('en-US', {
          timeZone: tz, hour12: false, weekday: 'short', hour: '2-digit', minute: '2-digit'
        });
      } catch (e) { return { day: now.getUTCDay(), h: now.getUTCHours(), m: now.getUTCMinutes() }; }
    }
    const parts = {};
    fmt.formatToParts(now).forEach(function (p) { parts[p.type] = p.value; });
    const days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return {
      day: days[parts.weekday] != null ? days[parts.weekday] : now.getUTCDay(),
      h: (parseInt(parts.hour, 10) || 0) % 24,
      m: parseInt(parts.minute, 10) || 0
    };
  }
  /* وضعیت کامل یک جلسه: باز/بسته (با احتساب آخر هفته)، دقایق مانده تا
     رویداد بعدی، و پنجرهٔ باز بودن بر حسب دقیقهٔ UTC */
  function sessionState(s, now) {
    const lp = tzParts(now, s.tz);
    const lm = lp.h * 60 + lp.m;
    const openM = s.open * 60, closeM = s.close * 60;
    const weekday = lp.day >= 1 && lp.day <= 5;
    const open = weekday && lm >= openM && lm < closeM;
    let minsLeft;
    if (open) minsLeft = closeM - lm;
    else {
      minsLeft = 0;
      for (let add = 0; add <= 7; add++) {
        const day = (lp.day + add) % 7;
        if (day < 1 || day > 5) continue;
        const t = add * 1440 + openM - lm;
        if (t > 0) { minsLeft = t; break; }
      }
    }
    const utcTotal = now.getUTCDay() * 1440 + now.getUTCHours() * 60 + now.getUTCMinutes();
    let off = (lp.day * 1440 + lm) - utcTotal;
    if (off > 5040) off -= 10080; else if (off < -5040) off += 10080;
    off = Math.round(off / 15) * 15;
    return {
      open: open, minsLeft: minsLeft, lp: lp,
      openUtc: ((openM - off) % 1440 + 1440) % 1440,
      closeUtc: ((closeM - off) % 1440 + 1440) % 1440
    };
  }
  function fmtDur(mins) {
    mins = Math.max(0, Math.round(mins));
    const h = Math.floor(mins / 60), m = mins % 60;
    if (h >= 24) { const d = Math.floor(h / 24); return d + ' روز' + (h % 24 ? ' و ' + (h % 24) + 'س' : ''); }
    if (h > 0) return h + 'س' + (m ? ' ' + m + 'د' : '');
    return m + 'د';
  }

  /* ----------------------------- Price helpers ----------------------------- */
  function fmtPrice(p) {
    if (p >= 1000) return '$' + p.toLocaleString('en-US', { maximumFractionDigits: 0 });
    if (p >= 1) return '$' + p.toLocaleString('en-US', { maximumFractionDigits: 2 });
    return '$' + p.toLocaleString('en-US', { maximumFractionDigits: 4 });
  }
  function fmtAbbr(v) {
    if (v >= 1e12) return '$' + (v / 1e12).toFixed(2) + 'T';
    if (v >= 1e9) return '$' + (v / 1e9).toFixed(1) + 'B';
    if (v >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M';
    return '$' + Math.round(v).toLocaleString('en-US');
  }
  function pctStr(v) { return (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(2) + '٪'; }

  /* اسپارک‌لاین: منحنی نرم (Catmull-Rom → بزیه) + سطح گرادیانی + خط مبنا.
     محور زمان راست→چپ است تا آخرین نقطه کنار قیمت فعلی (سمت چپ ردیف) بیفتد. */
  const SPARK = { w: 78, h: 30, pad: 3.5 };
  function sparkChart(arr) {
    /* نمونه‌برداری یکنواخت تا حداکثر ۴۰ نقطه — طول ثابت، بدون از دست دادن نقطهٔ آخر */
    const MAX = 40;
    if (arr.length > MAX) {
      const out = [];
      for (let i = 0; i < MAX; i++) out.push(arr[Math.round(i * (arr.length - 1) / (MAX - 1))]);
      arr = out;
    }
    const n = arr.length;
    const min = Math.min.apply(null, arr), max = Math.max.apply(null, arr);
    const rng = (max - min) || Math.abs(max) || 1;
    const W = SPARK.w, H = SPARK.h, P = SPARK.pad;
    const X = function (i) { return W - (i / (n - 1)) * W; };
    const Y = function (v) { return P + (H - 2 * P) * (1 - (v - min) / rng); };

    const pts = arr.map(function (v, i) { return [X(i), Y(v)]; });

    /* Catmull-Rom با کشش ۰.۵ — نرم ولی بدون overshoot محسوس */
    let d = 'M' + pts[0][0].toFixed(2) + ' ' + pts[0][1].toFixed(2);
    for (let i = 0; i < n - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += 'C' + c1x.toFixed(2) + ' ' + c1y.toFixed(2) + ',' + c2x.toFixed(2) + ' ' + c2y.toFixed(2) +
        ',' + p2[0].toFixed(2) + ' ' + p2[1].toFixed(2);
    }
    return {
      line: d,
      area: d + 'L' + pts[n - 1][0].toFixed(2) + ' ' + H + 'L' + pts[0][0].toFixed(2) + ' ' + H + 'Z',
      baseY: Y(arr[0]).toFixed(2),   /* قیمت ابتدای بازه — مبنای سود/زیان */
      endX: pts[n - 1][0].toFixed(2),
      endY: pts[n - 1][1].toFixed(2)
    };
  }

  /* ----------------------------- DOM refs ----------------------------- */
  const $ = function (id) { return document.getElementById(id); };
  const els = {};

  /* ----------------------------- Static renders ----------------------------- */
  function renderTools() {
    els.toolsGrid.innerHTML = TOOLS.map(function (t) {
      return '<a href="' + t.url + '" title="' + t.label + ' — ' + t.sub + '" style="--tc:' + t.c + ';--tcSoft:' + hexA(t.c, 0.13) + '">' +
        '<span class="t-ic">' + svg(t.icon) + '</span>' +
        '<span class="t-label">' + t.label + '</span>' +
        '</a>';
    }).join('');
  }
  function renderQuick() {
    if (!els.quickLinks) return;
    els.quickLinks.innerHTML = QUICK.map(function (q) {
      return '<a href="' + q.url + '"><span class="ql-dot"></span>' + q.label + '</a>';
    }).join('');
  }
  function renderCommunity(items) {
    const el = document.getElementById('sb-comm-list');
    if (!el) return;
    if (commTabState === 'cats') {
      const cats = Object.values(COMM_CATS);
      el.innerHTML = '<div class="comm-cats-grid">' + cats.map(function (c) {
        return '<a class="comm-cat-chip" href="' + c.url + '" target="_blank" rel="noopener" style="background:' + hexA(c.color, 0.14) + ';color:' + c.color + '">' + c.name + '</a>';
      }).join('') + '</div>';
      return;
    }
    const list = items || COMMUNITY[commTabState] || [];
    el.innerHTML = list.map(function (t) {
      return '<a class="ct-row" href="' + t.url + '" target="_blank" rel="noopener">' +
        '<div class="ct-title">' + t.title + '</div>' +
        '<div class="ct-foot">' +
          '<span class="ct-badge" style="background:' + hexA(t.catColor, 0.14) + ';color:' + t.catColor + '">' + t.cat + '</span>' +
          '<span class="ct-stats">' +
            '<span>💬 ' + t.replies + '</span>' +
            '<span class="ct-sep">·</span>' +
            '<span>' + t.time + '</span>' +
          '</span>' +
        '</div>' +
      '</a>';
    }).join('');
  }

  function loadCommunityTab(tab) {
    commTabState = tab;
    const tabBar = document.getElementById('comm-tabs');
    if (tabBar) {
      Array.prototype.forEach.call(tabBar.querySelectorAll('.comm-tab'), function (t) {
        t.classList.toggle('active', t.getAttribute('data-tab') === tab);
      });
    }
    if (tab === 'cats') { renderCommunity(); return; }
    const el = document.getElementById('sb-comm-list');
    if (el) el.innerHTML = '<div class="ct-loading">در حال بارگذاری…</div>';
    const endpoint = 'https://forum.iranbroker.net/' + (tab === 'latest' ? 'latest' : 'hot') + '.json';
    fetch(endpoint)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        const topics = ((data.topic_list || {}).topics || []).slice(0, 8).map(function (t) {
          const cat = COMM_CATS[t.category_id] || { name: 'سایر', color: '#888888' };
          return {
            title: t.title,
            cat: cat.name,
            catColor: cat.color,
            time: commRelTime(t.last_posted_at),
            replies: commFmtNum(Math.max(0, (t.posts_count || 1) - 1)),
            views: commFmtNum(t.views || 0),
            url: 'https://forum.iranbroker.net/t/' + t.slug + '/' + t.id
          };
        });
        renderCommunity(topics);
      })
      .catch(function () { renderCommunity(); });
  }

  /* ----------------------------- News (اخبار بازار) ----------------------------- */
  const NEWS_READ_KEY = 'ib_news_read';
  let newsRead = {};
  try {
    (JSON.parse(localStorage.getItem(NEWS_READ_KEY) || '[]')).forEach(function (u) { newsRead[u] = 1; });
  } catch (e) {}
  function markNewsRead(url) {
    if (!url || newsRead[url]) return;
    newsRead[url] = 1;
    try {
      let arr = Object.keys(newsRead);
      if (arr.length > 300) {
        arr = arr.slice(-200);
        newsRead = {};
        arr.forEach(function (u) { newsRead[u] = 1; });
      }
      localStorage.setItem(NEWS_READ_KEY, JSON.stringify(arr));
    } catch (e) {}
  }
  function newsIsFresh(n) { return !!(n.ts && Date.now() - n.ts < 2 * 3600 * 1000); }

  function renderNews() {
    const el = els.bentoNewsList || document.getElementById('bento-news-list');
    if (!el) return;
    const items = state.news || NEWS_SEED;

    /* چیپ‌های فیلتر دسته‌بندی */
    const cats = [];
    items.forEach(function (n) { if (n.cat && cats.indexOf(n.cat) < 0) cats.push(n.cat); });
    if (state.newsCat !== 'همه' && cats.indexOf(state.newsCat) < 0) state.newsCat = 'همه';
    if (els.bnChips) {
      els.bnChips.hidden = cats.length < 2;
      els.bnChips.innerHTML = ['همه'].concat(cats).map(function (c) {
        const col = c === 'همه' ? 'var(--primary)' : (CAT_COLORS[c] || '#6f9bf3');
        return '<button class="bn-chip' + (state.newsCat === c ? ' active' : '') + '" data-cat="' + c + '" style="--chip:' + col + '">' + c + '</button>';
      }).join('');
    }

    const list = state.newsCat === 'همه' ? items : items.filter(function (n) { return n.cat === state.newsCat; });

    /* در نمای «همه» نقطهٔ رنگی دسته را نشان می‌دهیم؛ وقتی روی یک دسته فیلتر شده، حذفش می‌کنیم */
    function metaHTML(n) {
      const col = n.catColor || CAT_COLORS[n.cat] || '#6f9bf3';
      const dot = state.newsCat === 'همه'
        ? '<span class="bn-dot" style="background:' + col + '" title="' + n.cat + '"></span>'
        : '';
      return '<div class="bn-meta">' + dot +
        '<span class="bn-time">' + (n.time || '') + '</span>' +
        (newsIsFresh(n) ? '<span class="bn-new">تازه</span>' : '') +
      '</div>';
    }

    /* خبر شاخص: اولین خبرِ دارای تصویر، بزرگ نمایش داده می‌شود */
    let heroIdx = -1;
    for (let i = 0; i < list.length; i++) { if (list[i].img) { heroIdx = i; break; } }

    let html = '';
    if (heroIdx >= 0) {
      const n = list[heroIdx];
      html += '<a class="bn-hero' + (newsRead[n.url] ? ' read' : '') + '" href="' + n.url + '" target="_blank" rel="noopener" data-url="' + n.url + '">' +
        '<img src="' + n.img + '" alt="" loading="lazy"/>' +
        '<div class="bn-hero-txt">' + metaHTML(n) +
          '<div class="bn-hero-title">' + n.title + '</div>' +
        '</div></a>';
    }
    list.forEach(function (n, i) {
      if (i === heroIdx) return;
      const col = n.catColor || CAT_COLORS[n.cat] || '#6f9bf3';
      const url = n.url || 'https://iranbroker.net/news/';
      html += '<a class="bn-item' + (newsRead[url] ? ' read' : '') + '" href="' + url + '" target="_blank" rel="noopener" data-url="' + url + '">' +
        '<div class="bn-thumb">' +
          '<div class="bn-thumb-placeholder" style="background:' + hexA(col, 0.13) + ';color:' + col + '">' + (n.cat || 'خبر').slice(0, 2) + '</div>' +
          (n.img ? '<img class="bn-thumb-img" src="' + n.img + '" alt="" loading="lazy"/>' : '') +
        '</div>' +
        '<div class="bn-body">' + metaHTML(n) +
          '<div class="bn-title">' + n.title + '</div>' +
        '</div></a>';
    });
    el.innerHTML = html || '<div class="px-empty">خبری در این دسته نیست</div>';
  }

  function relTimeFa(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d)) return '';
    const diff = Math.floor((Date.now() - d) / 1000);
    if (diff < 60) return 'چند لحظه پیش';
    if (diff < 3600) return Math.floor(diff / 60) + ' دقیقه پیش';
    if (diff < 86400) return Math.floor(diff / 3600) + ' ساعت پیش';
    return Math.floor(diff / 86400) + ' روز پیش';
  }

  function loadNews() {
    fetch('https://iranbroker.net/feed/')
      .then(function (res) { return res.text(); })
      .then(function (text) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/xml');
        const items = Array.prototype.slice.call(doc.querySelectorAll('item'));
        if (!items.length) return;
        const parsed = items.slice(0, 20).map(function (item) {
          const title = (item.querySelector('title') ? item.querySelector('title').textContent : '').replace(/<!\[CDATA\[|\]\]>/g, '').trim();
          const guidEl = item.querySelector('guid');
          const url = guidEl ? guidEl.textContent.trim() : 'https://iranbroker.net/news/';
          const pubDate = item.querySelector('pubDate') ? item.querySelector('pubDate').textContent : '';
          const catEl = item.querySelector('category');
          const cat = catEl ? catEl.textContent.replace(/<!\[CDATA\[|\]\]>/g, '').trim() : 'اخبار';
          const color = CAT_COLORS[cat] || '#6f9bf3';
          // Try to extract featured image from feed
          var img = null;
          var mediaTh = item.querySelector('media\\:thumbnail') || item.querySelector('thumbnail');
          var mediaC = item.querySelector('media\\:content') || item.querySelector('content');
          var enclosure = item.querySelector('enclosure');
          if (mediaTh && mediaTh.getAttribute('url')) {
            img = mediaTh.getAttribute('url');
          } else if (mediaC && mediaC.getAttribute('url') && /image/i.test(mediaC.getAttribute('medium') || mediaC.getAttribute('type') || 'image')) {
            img = mediaC.getAttribute('url');
          } else if (enclosure && /^image\//i.test(enclosure.getAttribute('type') || '')) {
            img = enclosure.getAttribute('url');
          } else {
            var descEl = item.querySelector('description');
            if (descEl) {
              var m = descEl.textContent.match(/<img[^>]+src=["']([^"']+)["']/i);
              if (m) img = m[1];
            }
          }
          const ts = pubDate ? Date.parse(pubDate) : NaN;
          return { title: title, url: url, cat: cat, catColor: color, time: relTimeFa(pubDate), img: img, ts: isFinite(ts) ? ts : null };
        }).filter(function (n) { return n.title; });
        if (parsed.length) { state.news = parsed; renderNews(); }
      })
      .catch(function () {});
  }

  function initSidebars() {
    var sb = document.getElementById('sb-community');
    if (!sb) return;
    var collapseBtn = document.getElementById('sb-comm-toggle');
    var expandTab = document.getElementById('sb-comm-tab');
    try { if (localStorage.getItem('ib_sb_comm') === '1') sb.classList.add('collapsed'); } catch (e) {}
    function toggle() {
      sb.classList.toggle('collapsed');
      try { localStorage.setItem('ib_sb_comm', sb.classList.contains('collapsed') ? '1' : '0'); } catch (e) {}
    }
    if (collapseBtn) collapseBtn.addEventListener('click', toggle);
    if (expandTab) expandTab.addEventListener('click', toggle);
    const tabBar = document.getElementById('comm-tabs');
    if (tabBar) {
      tabBar.addEventListener('click', function (e) {
        const btn = e.target.closest('[data-tab]');
        if (!btn) return;
        loadCommunityTab(btn.getAttribute('data-tab'));
      });
    }
  }

  function renderEngines() {
    els.engines.innerHTML = ENGINE_ORDER.map(function (k) {
      const cls = ((k === 'airo' ? 'engine-airo ' : '') + (state.activeEngine === k ? 'active' : '')).trim();
      const icon = ENGINES[k].logo || svg(ENGINES[k].icon);
      return '<button data-engine="' + k + '" class="' + cls + '">' + icon + ENGINES[k].label + '</button>';
    }).join('');
    bindEngineButtons();
  }
  function bindEngineButtons() {
    Array.prototype.forEach.call(els.engines.querySelectorAll('button'), function (b) {
      b.addEventListener('click', function () { setEngine(b.getAttribute('data-engine')); });
    });
  }
  function renderStaticIcons() {
    els.themeBtn.innerHTML = '<span class="icon">' + svg(THEME_ICONS[state.theme] || 'moon') + '</span>';
    els.settingsBtn.innerHTML = '<span class="icon">' + svg('equalizer') + '</span>';
    els.focusBtn.innerHTML = '<span class="icon">' + svg('focus') + '</span>';
    els.searchIcon.innerHTML = svg('search');
    els.searchGo.innerHTML = svg('arrowLeft');
    els.cryptoRefresh.innerHTML = svg('refresh');
    els.settingsClose.innerHTML = '<span class="icon">' + svg('close') + '</span>';
  }

  /* ----------------------------- Search ----------------------------- */
  function matches() {
    const q = (state.query || '').trim().toLowerCase();
    if (!q) return [];
    const pool = TOOLS.map(function (t) { return { label: t.label, sub: t.sub, url: t.url, tag: 'ابزار', icon: t.icon }; })
      .concat(QUICK.map(function (l) { return { label: l.label, sub: '', url: l.url, tag: 'لینک', icon: 'link' }; }));
    return pool.filter(function (p) {
      return p.label.toLowerCase().indexOf(q) >= 0 || (p.sub && p.sub.toLowerCase().indexOf(q) >= 0);
    }).slice(0, 5);
  }
  function renderSuggest() {
    const m = matches();
    if (!m.length) { els.suggest.hidden = true; els.suggest.innerHTML = ''; return; }
    els.suggest.hidden = false;
    els.suggest.innerHTML = m.map(function (s, i) {
      const active = i === state.sugIdx ? ' active' : '';
      const sub = s.sub ? '<span class="s-sub"> · ' + s.sub + '</span>' : '';
      return '<li class="' + active.trim() + '" data-url="' + s.url + '">' +
        '<span class="s-ic">' + svg(s.icon) + '</span>' +
        '<span class="s-label">' + s.label + sub + '</span>' +
        '<span class="s-tag">' + s.tag + '</span></li>';
    }).join('');
    Array.prototype.forEach.call(els.suggest.querySelectorAll('li'), function (li) {
      li.addEventListener('mousedown', function (e) { e.preventDefault(); window.location.href = li.getAttribute('data-url'); });
    });
  }
  function setEngine(k) {
    state.activeEngine = k; state.sugIdx = -1;
    els.scopeLabel.textContent = ENGINES[k].label;
    const isAiro = k === 'airo';
    els.searchBox.classList.toggle('airo-mode', isAiro);
    els.searchInput.placeholder = isAiro
      ? 'هرچی می‌خوای از آیرو بپرس… ✨'
      : 'جستجو در گوگل یا ابزارهای ایران بروکر…';
    renderEngines();
    renderSuggest();
  }
  function submitSearch() {
    const q = (state.query || '').trim();
    if (state.activeEngine === 'airo') {
      if (!window.AiroChat) return;
      if (q) window.AiroChat.ask(q); else window.AiroChat.open();
      state.query = ''; els.searchInput.value = ''; state.sugIdx = -1; renderSuggest();
      return;
    }
    if (!q) return;
    window.location.href = ENGINES[state.activeEngine].url(q);
  }
  function onKey(e) {
    const m = matches();
    if (e.key === 'Enter') {
      if (state.sugIdx >= 0 && m[state.sugIdx]) window.location.href = m[state.sugIdx].url;
      else submitSearch();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault(); state.sugIdx = Math.min(state.sugIdx + 1, m.length - 1); renderSuggest();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault(); state.sugIdx = Math.max(state.sugIdx - 1, -1); renderSuggest();
    } else if (e.key === 'Tab') {
      e.preventDefault(); setEngine(ENGINE_ORDER[(ENGINE_ORDER.indexOf(state.activeEngine) + 1) % ENGINE_ORDER.length]);
    } else if (e.key === 'Escape') {
      state.query = ''; els.searchInput.value = ''; state.sugIdx = -1; renderSuggest();
    }
  }

  /* ----------------------------- Live Prices (کریپتو / فارکس / بازار ایران) ----------------------------- */
  const FX_PAIRS = [
    { id: 'eurusd', sym: 'EUR/USD', name: 'یورو / دلار', cur: 'EUR', inv: true, flag: '🇪🇺', dec: 4 },
    { id: 'gbpusd', sym: 'GBP/USD', name: 'پوند / دلار', cur: 'GBP', inv: true, flag: '🇬🇧', dec: 4 },
    { id: 'usdjpy', sym: 'USD/JPY', name: 'دلار / ین', cur: 'JPY', inv: false, flag: '🇯🇵', dec: 2 },
    { id: 'usdchf', sym: 'USD/CHF', name: 'دلار / فرانک', cur: 'CHF', inv: false, flag: '🇨🇭', dec: 4 },
    { id: 'usdcad', sym: 'USD/CAD', name: 'دلار / کانادا', cur: 'CAD', inv: false, flag: '🇨🇦', dec: 4 },
    { id: 'audusd', sym: 'AUD/USD', name: 'استرالیا / دلار', cur: 'AUD', inv: true, flag: '🇦🇺', dec: 4 }
  ];
  const IRAN_ITEMS = [
    { id: 'usd', sym: 'USD', name: 'دلار آزاد', keys: ['price_dollar_rl', 'price_dollar_soleymani', 'dollar_rl'], flag: '💵', div: 10, unit: 'تومان' },
    { id: 'eur', sym: 'EUR', name: 'یورو', keys: ['price_eur'], flag: '💶', div: 10, unit: 'تومان' },
    { id: 'gold18', sym: 'GOLD', name: 'طلای ۱۸ عیار', keys: ['geram18', 'price_gold_18'], flag: '🥇', div: 10, unit: 'تومان' },
    { id: 'sekke', sym: 'IMAMI', name: 'سکه امامی', keys: ['sekee', 'price_sekee', 'sekeb'], flag: '🪙', div: 10, unit: 'تومان' },
    { id: 'mesghal', sym: 'MSQ', name: 'مثقال طلا', keys: ['mesghal'], flag: '⚖️', div: 10, unit: 'تومان' },
    { id: 'ons', sym: 'XAU', name: 'انس جهانی طلا', keys: ['ons', 'price_ons'], flag: '🌕', div: 1, unit: 'دلار' }
  ];
  const PX_TTL = { crypto: 90000, forex: 600000, iran: 300000 };
  const PX_SRC = { crypto: 'CoinGecko', forex: 'ECB / Frankfurter', iran: 'TGJU' };
  const pxPrev = {};

  function fmtRowPrice(tab, r) {
    if (tab === 'forex') return r.price.toFixed(r.dec == null ? 4 : r.dec);
    if (tab === 'iran') return Math.round(r.price).toLocaleString('en-US');
    return fmtPrice(r.price);
  }

  function renderPrices() {
    const tab = state.pxTab;
    const d = state.pxData[tab];
    const rows = d.rows || [];

    function rangeBar(cls, low, high, cur, color) {
      const pct = Math.max(0, Math.min(100, (cur - low) / (high - low) * 100));
      return '<div class="' + cls + '" dir="ltr"><i style="left:' + pct.toFixed(1) + '%' + (color ? ';background:' + color : '') + '"></i></div>';
    }

    els.cryptoList.innerHTML = rows.length ? rows.map(function (r, i) {
      const up = (r.chg || 0) >= 0;
      const col = up ? 'var(--green)' : 'var(--red)';
      const key = tab + ':' + r.id;
      let flash = '';
      if (pxPrev[key] != null && r.price !== pxPrev[key]) flash = r.price > pxPrev[key] ? ' flash-up' : ' flash-down';
      pxPrev[key] = r.price;

      let ava;
      if (r.img) ava = '<span class="px-ava"><span class="px-ava-fb">' + (r.sym || '?').slice(0, 1) + '</span><img src="' + r.img + '" alt="" loading="lazy"/></span>';
      else if (r.flag) ava = '<span class="px-ava px-ava-emoji">' + r.flag + '</span>';
      else ava = '<span class="px-ava"><span class="px-ava-fb">' + (r.sym || '?').slice(0, 1) + '</span></span>';

      let mid;
      if (r.spark && r.spark.length > 3) {
        const ch = sparkChart(r.spark);
        const gid = 'pxg-' + tab + '-' + i;
        const solid = up ? '#1fc16b' : '#fb3748';
        mid = '<svg class="c-spark" viewBox="0 0 ' + SPARK.w + ' ' + SPARK.h + '" preserveAspectRatio="none" aria-hidden="true">' +
          '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0" stop-color="' + solid + '" stop-opacity=".30"/>' +
            '<stop offset="1" stop-color="' + solid + '" stop-opacity="0"/>' +
          '</linearGradient></defs>' +
          '<path class="cs-area" d="' + ch.area + '" fill="url(#' + gid + ')"/>' +
          '<line class="cs-base" x1="0" y1="' + ch.baseY + '" x2="' + SPARK.w + '" y2="' + ch.baseY + '"/>' +
          '<path class="cs-line" d="' + ch.line + '" fill="none" stroke="' + col + '"/>' +
          '<circle class="cs-end" cx="' + ch.endX + '" cy="' + ch.endY + '" r="2" fill="' + col + '"/>' +
        '</svg>';
      } else if (r.extra && isFinite(r.extra.low) && isFinite(r.extra.high) && r.extra.high > r.extra.low) {
        mid = rangeBar('px-range-mini', r.extra.low, r.extra.high, r.price, col);
      } else {
        mid = '<div class="px-range-mini px-range-empty"></div>';
      }

      let detail = '';
      if (state.pxExpanded === r.id && r.extra) {
        const ex = r.extra;
        let rangeHtml = '';
        if (isFinite(ex.low) && isFinite(ex.high) && ex.high > ex.low) {
          rangeHtml = '<div class="px-range-row"><span class="px-range-lbl">' + (ex.rangeLbl || 'بازه') + '</span>' +
            rangeBar('px-range', ex.low, ex.high, r.price, null) +
            '<span class="px-range-minmax" dir="ltr">' + fmtRowPrice(tab, { price: ex.low, dec: r.dec }) + ' – ' + fmtRowPrice(tab, { price: ex.high, dec: r.dec }) + '</span></div>';
        }
        const statsHtml = (ex.stats || []).map(function (s) {
          return '<div class="px-stat"><span>' + s.label + '</span><b dir="ltr">' + s.val + '</b></div>';
        }).join('');
        detail = '<div class="px-detail">' + rangeHtml + (statsHtml ? '<div class="px-stats">' + statsHtml + '</div>' : '') + '</div>';
      }

      return '<div class="c-row' + (r.extra ? ' has-detail' : '') + (detail ? ' expanded' : '') + '" data-pxid="' + r.id + '"' + (r.extra ? ' title="جزئیات بیشتر"' : '') + '>' +
        '<div class="c-main">' +
          ava +
          '<div class="c-id"><span class="c-sym">' + r.sym + '</span><span class="c-name">' + r.name + '</span></div>' +
          mid +
          '<div class="c-price-col">' +
            '<span class="c-price' + flash + '">' + fmtRowPrice(tab, r) + (r.unit ? ' <i class="c-unit">' + r.unit + '</i>' : '') + '</span>' +
            '<span class="c-chg" style="color:' + col + '">' + pctStr(r.chg || 0) + '</span>' +
          '</div>' +
        '</div>' + detail + '</div>';
    }).join('') : '<div class="px-empty">' + (d.err ? 'دریافت داده ممکن نشد' : 'در حال دریافت…') + '</div>';

    let foot = '';
    if (rows.length) {
      if (d.err) foot = '<span class="err">آفلاین — آخرین داده</span>';
      else if (d.time) foot = '<span>' + d.time + '<span class="foot-sep">·</span>' + PX_SRC[tab] + '</span>';
    }
    els.cryptoFoot.innerHTML = foot;
  }

  function pxSpin(on) { els.cryptoRefresh.classList.toggle('spinning', !!on); }
  function pxDone(tab, rows) {
    const d = state.pxData[tab];
    if (rows) {
      d.rows = rows; d.err = false; d.ts = Date.now();
      d.time = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    } else {
      d.err = true;
      d.ts = Date.now(); /* تا شکست‌ها هم TTL داشته باشند و اسپم درخواست نشود */
    }
    pxSpin(false);
    if (state.pxTab === tab) renderPrices();
  }
  function loadPrices(force) {
    const tab = state.pxTab;
    const d = state.pxData[tab];
    if (!force && d.ts && Date.now() - d.ts < PX_TTL[tab]) { return; }
    pxSpin(true);
    if (tab === 'crypto') loadCrypto();
    else if (tab === 'forex') loadForex();
    else loadIran();
  }

  function loadCrypto() {
    const ids = state.coins.split(',').map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 6);
    if (!ids.length) { pxDone('crypto', []); return; }
    const url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=' + ids.join(',') + '&order=market_cap_desc&sparkline=true&price_change_percentage=24h';
    fetch(url).then(function (res) {
      if (!res.ok) throw new Error('http');
      return res.json();
    }).then(function (data) {
      if (!Array.isArray(data) || !data.length) throw new Error('empty');
      const byId = {};
      data.forEach(function (c) { byId[c.id] = c; });
      const rows = ids.map(function (id) { return byId[id]; }).filter(Boolean).map(function (c) {
        const spark = (c.sparkline_in_7d && c.sparkline_in_7d.price && c.sparkline_in_7d.price.length > 3) ? c.sparkline_in_7d.price : null;
        let wk = null;
        if (spark) wk = (spark[spark.length - 1] - spark[0]) / spark[0] * 100;
        return {
          id: c.id,
          sym: (c.symbol || c.id).toUpperCase(),
          name: (COIN_META[c.id] || {}).name || c.name || c.id,
          price: c.current_price,
          chg: c.price_change_percentage_24h == null ? 0 : c.price_change_percentage_24h,
          spark: spark, img: c.image || null,
          extra: {
            low: c.low_24h, high: c.high_24h, rangeLbl: 'بازه ۲۴ ساعته',
            stats: [
              { label: 'رتبه بازار', val: '#' + (c.market_cap_rank || '—') },
              { label: 'ارزش بازار', val: fmtAbbr(c.market_cap || 0) },
              { label: 'حجم ۲۴س', val: fmtAbbr(c.total_volume || 0) },
              { label: 'تغییر ۷ روزه', val: wk == null ? '—' : pctStr(wk) }
            ]
          }
        };
      });
      pxDone('crypto', rows);
    }).catch(function () { pxDone('crypto', null); });
  }

  function loadForex() {
    function iso(t) { return new Date(t).toISOString().slice(0, 10); }
    const url = 'https://api.frankfurter.app/' + iso(Date.now() - 9 * 86400000) + '..' + iso(Date.now()) +
      '?from=USD&to=' + FX_PAIRS.map(function (p) { return p.cur; }).join(',');
    fetch(url).then(function (r) {
      if (!r.ok) throw new Error('http');
      return r.json();
    }).then(function (data) {
      const dates = Object.keys(data.rates || {}).sort();
      if (dates.length < 2) throw new Error('empty');
      const rows = FX_PAIRS.map(function (p) {
        const series = dates
          .map(function (dt) { return (data.rates[dt] || {})[p.cur]; })
          .filter(function (v) { return v > 0; })
          .map(function (v) { return p.inv ? 1 / v : v; });
        if (series.length < 2) return null;
        const last = series[series.length - 1], prev = series[series.length - 2];
        const lo = Math.min.apply(null, series), hi = Math.max.apply(null, series);
        return {
          id: p.id, sym: p.sym, name: p.name, flag: p.flag, dec: p.dec,
          price: last, chg: (last - prev) / prev * 100, spark: series,
          extra: {
            low: lo, high: hi, rangeLbl: 'بازه هفتگی',
            stats: [
              { label: 'تغییر هفتگی', val: pctStr((last - series[0]) / series[0] * 100) },
              { label: 'کف هفته', val: lo.toFixed(p.dec) },
              { label: 'سقف هفته', val: hi.toFixed(p.dec) }
            ]
          }
        };
      }).filter(Boolean);
      if (!rows.length) throw new Error('empty');
      pxDone('forex', rows);
    }).catch(function () { pxDone('forex', null); });
  }

  function tgjuNum(v) {
    if (v == null) return NaN;
    return parseFloat(String(v).replace(/,/g, ''));
  }
  function loadIran() {
    const ctl = new AbortController();
    setTimeout(function () { ctl.abort(); }, 9000);
    fetch('https://call4.tgju.org/c/currency/price-all', { signal: ctl.signal })
      .then(function (r) { if (!r.ok) throw new Error('http'); return r.json(); })
      .then(function (data) {
        const cur = data.current || data || {};
        const rows = [];
        IRAN_ITEMS.forEach(function (it) {
          let raw = null;
          for (let k = 0; k < it.keys.length; k++) {
            if (cur[it.keys[k]] != null) { raw = cur[it.keys[k]]; break; }
          }
          if (raw == null) return;
          let p, h, l, chg = 0;
          if (typeof raw === 'object') {
            p = tgjuNum(raw.p); h = tgjuNum(raw.h); l = tgjuNum(raw.l);
            const dp = tgjuNum(raw.dp);
            if (isFinite(dp)) chg = (String(raw.dt).toLowerCase() === 'low' ? -1 : 1) * dp;
            /* برخی نسخه‌ها تغییر را با کلید جدا می‌دهند */
          } else {
            p = tgjuNum(raw); h = NaN; l = NaN;
            const c2 = tgjuNum(cur['change_' + it.id] || cur[it.keys[0].replace('price_', 'change_')]);
            if (isFinite(c2)) chg = c2;
          }
          if (!isFinite(p) || p <= 0) return;
          rows.push({
            id: it.id, sym: it.sym, name: it.name, flag: it.flag, unit: it.unit,
            price: p / it.div, chg: chg,
            extra: (isFinite(h) && isFinite(l) && h > l)
              ? { low: l / it.div, high: h / it.div, rangeLbl: 'بازه امروز', stats: [] }
              : null
          });
        });
        if (!rows.length) throw new Error('empty');
        pxDone('iran', rows);
      })
      .catch(function () { pxDone('iran', null); });
  }

  /* ----------------------------- Tip ----------------------------- */
  function renderTip() {
    const t = TIPS[state.tipIndex % TIPS.length];
    els.tipTag.textContent = t.tag;
    els.tipText.textContent = t.text;
  }

  /* ----------------------------- Market Sessions Timeline ----------------------------- */
  function renderMarkets(now) {
    if (!els.marketsWrap) return;
    now = now || new Date();
    const axisLocal = state.mktAxis === 'local';
    /* دقایق شیفت برای نمایش تایم‌لاین در مبنای انتخابی (UTC یا محلی) */
    const shiftMin = axisLocal ? -now.getTimezoneOffset() : 0;
    const utcMin = now.getUTCHours() * 60 + now.getUTCMinutes();
    const dispNowMin = ((utcMin + shiftMin) % 1440 + 1440) % 1440;
    const nowPct = (dispNowMin / 1440 * 100).toFixed(2);

    const states = SESSIONS.map(function (s) { return sessionState(s, now); });

    /* بج بالای کارت: ساعت جاری در مبنای انتخابی */
    if (els.marketsUtcBadge) {
      els.marketsUtcBadge.textContent = axisLocal
        ? String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ' محلی'
        : String(now.getUTCHours()).padStart(2, '0') + ':' + String(now.getUTCMinutes()).padStart(2, '0') + ' UTC';
    }

    function segHtml(aMin, bMin, style) {
      const a = ((aMin + shiftMin) % 1440 + 1440) % 1440;
      const len = ((bMin - aMin) % 1440 + 1440) % 1440;
      const parts = (a + len <= 1440) ? [[a, len]] : [[a, 1440 - a], [0, a + len - 1440]];
      return parts.map(function (t) {
        return '<div class="mkt-seg" style="left:' + (t[0] / 1440 * 100).toFixed(2) + '%;width:' + (t[1] / 1440 * 100).toFixed(2) + '%;' + style + '"></div>';
      }).join('');
    }

    const ticksHtml = [0, 6, 12, 18].map(function (h) {
      return '<span class="mkt-tick" style="left:' + (h / 24 * 100) + '%;transform:translateX(' + (h === 0 ? '0' : '-50%') + ')">' +
        String(h).padStart(2, '0') + ':00</span>';
    }).join('');

    /* بنر آخر هفته وقتی همهٔ بازارها بسته‌اند و بازگشایی دور است */
    let banner = '';
    const allClosed = states.every(function (st) { return !st.open; });
    if (allClosed) {
      const nextOpen = Math.min.apply(null, states.map(function (st) { return st.minsLeft; }));
      if (nextOpen > 180) {
        banner = '<div class="mkt-weekend">بازار فارکس تعطیل است — بازگشایی ' + fmtDur(nextOpen) + ' دیگر</div>';
      }
    }

    const rowsHtml = SESSIONS.map(function (s, i) {
      const st = states[i];
      const cnt = fmtDur(st.minsLeft);
      const tip = s.name + ' — ' + (st.open ? 'بسته می‌شود تا ' + cnt + ' دیگر' : 'باز می‌شود تا ' + cnt + ' دیگر');
      return '<div class="mkt-row' + (st.open ? ' is-open' : '') + '" title="' + tip + '">' +
        '<div class="mkt-info">' +
          '<span class="mkt-name">' + s.name + '</span>' +
          '<span class="mkt-status" style="color:' + (st.open ? 'var(--green)' : 'var(--soft)') + '">' + cnt + '</span>' +
        '</div>' +
        '<div class="mkt-track" dir="ltr">' +
          segHtml(st.openUtc, st.closeUtc, 'background:' + s.c + ';opacity:' + (st.open ? '1' : '.22')) +
          '<div class="mkt-now-line" style="left:' + nowPct + '%"></div>' +
        '</div>' +
      '</div>';
    }).join('');

    /* ردیف همپوشانی: بازه‌هایی که ۲+ جلسه هم‌زمان باز است (بیشترین نقدینگی) */
    const diff = new Array(1441).fill(0);
    states.forEach(function (st) {
      const a = st.openUtc, b = st.closeUtc;
      if (b <= a) { diff[a]++; diff[1440]--; diff[0]++; diff[b]--; }
      else { diff[a]++; diff[b]--; }
    });
    let run = 0, startIdx = -1;
    const spans = [];
    for (let mIdx = 0; mIdx <= 1440; mIdx++) {
      run += diff[mIdx];
      const on = mIdx < 1440 && run >= 2;
      if (on && startIdx < 0) startIdx = mIdx;
      if (!on && startIdx >= 0) { spans.push([startIdx, mIdx]); startIdx = -1; }
    }
    const inOverlap = !allClosed && spans.some(function (sp) { return utcMin >= sp[0] && utcMin < sp[1]; });
    const ovSegs = spans.map(function (sp) { return segHtml(sp[0], sp[1], 'background:var(--orange)'); }).join('');
    const ovHtml = '<div class="mkt-row mkt-overlap-row' + (inOverlap ? ' is-open' : '') + '" title="بازه‌های همپوشانی جلسات — بیشترین نقدینگی و نوسان بازار">' +
      '<div class="mkt-info">' +
        '<span class="mkt-name">همپوشانی</span>' +
        '<span class="mkt-status" style="color:' + (inOverlap ? 'var(--orange)' : 'var(--soft)') + '">' + (inOverlap ? 'فعال' : '—') + '</span>' +
      '</div>' +
      '<div class="mkt-track mkt-track-ov" dir="ltr">' + ovSegs +
        '<div class="mkt-now-line" style="left:' + nowPct + '%"></div>' +
      '</div>' +
    '</div>';

    els.marketsWrap.innerHTML =
      banner +
      '<div class="mkt-row mkt-axis">' +
        '<div class="mkt-info" aria-hidden="true"></div>' +
        '<div class="mkt-ticks" dir="ltr">' + ticksHtml + '</div>' +
      '</div>' +
      rowsHtml + ovHtml;
  }

  /* ----------------------------- Time-dependent render ----------------------------- */
  function renderTime() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    els.clock.textContent = hh + ':' + mm;

    let dateStr;
    try { dateStr = new Intl.DateTimeFormat('fa-IR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now); }
    catch (e) { dateStr = now.toLocaleDateString('fa-IR'); }
    els.heroDate.textContent = dateStr;

    const h = now.getHours();
    const g = h >= 5 && h < 12 ? 'صبحت بخیر' : h >= 12 && h < 17 ? 'ظهرت بخیر' : h >= 17 && h < 21 ? 'عصرت بخیر' : 'شب‌ت بخیر';
    els.heroGreeting.textContent = g + (state.name ? '، ' + state.name : ' رفیق');

    // sessions
    const uh = now.getUTCHours();
    const openSessions = SESSIONS.filter(function (s) { return sessionState(s, now).open; });
    const openCount = openSessions.length;
    const activeSession = openSessions.length ? openSessions.map(function (s) { return s.name; }).join('، ') : 'بازارها بسته';

    if (els.marketCount) els.marketCount.textContent = openCount + ' بازار فعال';
    els.heroActive.textContent = activeSession;
    els.heroUtc.textContent = String(uh).padStart(2, '0') + ':' + String(now.getUTCMinutes()).padStart(2, '0');
    renderMarkets(now);
  }

  /* ----------------------------- Theme / layout / grid ----------------------------- */
  function applyTheme() {
    var eff = getEffectiveTheme();
    document.body.setAttribute('data-theme', eff);
    var icon = THEME_ICONS[state.theme] || 'moon';
    if (els.themeBtn) els.themeBtn.innerHTML = '<span class="icon">' + svg(icon) + '</span>';
    applyAccent();
  }
  function applyLayout() { document.body.setAttribute('data-layout', state.layout || 'simple'); }
  function applyGrid() { els.bgGrid.hidden = !state.showGrid; }
  function applyShowCrypto() { els.cryptoCard.style.display = state.showCrypto ? '' : 'none'; }

  function toggleTheme() {
    var idx = THEME_CYCLE.indexOf(state.theme);
    state.theme = THEME_CYCLE[(idx + 1) % THEME_CYCLE.length];
    applyTheme();
    persist();
  }

  /* ----------------------------- Background ----------------------------- */
  function applyBackground() {
    var canvas = document.getElementById('shader-bg-canvas');
    var stageRoot = document.querySelector('.stage-root');
    var overlay = document.getElementById('bg-overlay');
    if (state.bgMode === 'default') {
      document.body.classList.remove('has-bg-image');
      if (canvas) canvas.style.display = '';
      if (stageRoot) stageRoot.style.backgroundImage = '';
    } else {
      document.body.classList.add('has-bg-image');
      if (canvas) canvas.style.display = 'none';
      var url = state.bgMode === 'gallery' ? GALLERY[state.bgIndex].file : state.bgImage;
      if (url && stageRoot) stageRoot.style.backgroundImage = 'url("' + url + '")';
    }
  }

  function updateBgPicker() {
    var defBtn = document.getElementById('bg-opt-default');
    if (defBtn) defBtn.classList.toggle('active', state.bgMode === 'default');
    var thumbs = document.querySelectorAll('.bg-thumb');
    thumbs.forEach(function(t) {
      var i = parseInt(t.getAttribute('data-idx'));
      t.classList.toggle('active', state.bgMode === 'gallery' && state.bgIndex === i);
    });
  }

  function renderBgGallery() {
    var el = document.getElementById('bg-gallery');
    if (!el) return;
    el.innerHTML = GALLERY.map(function(item, i) {
      var active = (state.bgMode === 'gallery' && state.bgIndex === i) ? ' active' : '';
      return '<button class="bg-thumb' + active + '" data-idx="' + i + '" title="' + item.label + '" style="background:' + item.gradient + '">' +
        '<img src="' + item.file + '" alt="' + item.label + '" loading="lazy" ' +
          'onerror="this.style.display=\'none\'" />' +
        '<span class="bg-thumb-label">' + item.label + '</span>' +
      '</button>';
    }).join('');
    el.querySelectorAll('.bg-thumb').forEach(function(btn) {
      btn.addEventListener('click', function() {
        state.bgMode = 'gallery';
        state.bgIndex = parseInt(btn.getAttribute('data-idx'));
        applyBackground();
        updateBgPicker();
        persist();
      });
    });
  }

  function initAutoTheme() {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) {
      mq.addEventListener('change', function() { if (state.theme === 'auto') applyTheme(); });
    } else if (mq.addListener) {
      mq.addListener(function() { if (state.theme === 'auto') applyTheme(); });
    }
  }

  /* ----------------------------- Settings modal ----------------------------- */
  function switchTab(name) {
    document.querySelectorAll('.m-tab').forEach(function(t) {
      t.classList.toggle('active', t.getAttribute('data-tab') === name);
    });
    document.querySelectorAll('.tab-panel').forEach(function(p) {
      p.classList.toggle('active', p.id === 'tab-' + name);
    });
  }
  function openSettings() {
    els.setName.value = state.name;
    els.setEngine.value = state.engine;
    els.setCoins.value = state.coins;
    els.setCrypto.checked = state.showCrypto;
    els.setGrid.checked = state.showGrid;
    syncSeg(els.setLayout, 'layout', state.layout);
    syncSwatches();
    syncSeg(els.setThemeMode, 'theme', state.theme);
    renderBgGallery();
    updateBgPicker();
    var defBtn = document.getElementById('bg-opt-default');
    if (defBtn) defBtn.classList.toggle('active', state.bgMode === 'default');
    switchTab('appearance');
    els.settingsModal.hidden = false;
  }
  function closeSettings() { els.settingsModal.hidden = true; persist(); }
  function syncSeg(container, attr, val) {
    Array.prototype.forEach.call(container.querySelectorAll('button'), function (b) {
      b.classList.toggle('active', b.getAttribute('data-' + attr) === val);
    });
  }
  function syncSwatches() {
    Array.prototype.forEach.call(els.setAccent.querySelectorAll('button'), function (b) {
      b.classList.toggle('active', b.getAttribute('data-accent').toLowerCase() === state.accent.toLowerCase());
    });
  }

  /* ----------------------------- Shader background ----------------------------- */
  function initShaderBg() {
    var canvas = document.getElementById('shader-bg-canvas');
    if (!canvas) return;
    var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) { canvas.style.display = 'none'; return; }

    var vertSrc = 'attribute vec2 a_pos;void main(){gl_Position=vec4(a_pos,0.,1.);}';
    var fragSrc = [
      'precision highp float;',
      'uniform vec2 resolution;',
      'uniform float time;',
      'uniform vec2 clickPos;',
      'uniform float clickAge;',
      'void main(void){',
      '  float minRes=min(resolution.x,resolution.y);',
      '  vec2 uv=(gl_FragCoord.xy*2.-resolution.xy)/minRes;',
      '  float t=time*0.05;',
      '  float lw=0.002;',
      '  vec3 color=vec3(0.);',
      '  for(int j=0;j<3;j++){',
      '    for(int i=0;i<5;i++){',
      '      color[j]+=lw*float(i*i)/abs(fract(t-0.01*float(j)+float(i)*0.01)*5.-length(uv)+mod(uv.x+uv.y,0.2));',
      '    }',
      '  }',
      '  vec2 clickUv=(clickPos*2.-1.)*resolution/minRes;',
      '  float cd=length(uv-clickUv);',
      '  float fade=max(0.,1.-clickAge*0.72);',
      '  float edge=0.0025/(abs(cd-clickAge*1.3)+0.004)*fade;',
      '  float ripple=sin(cd*22.-clickAge*11.)*exp(-cd*3.2)*fade*0.1;',
      '  color+=vec3(0.3,0.55,0.9)*(edge+max(0.,ripple));',
      '  color=color/(color+vec3(0.9));',
      '  gl_FragColor=vec4(color[0],color[1],color[2],1.);',
      '}'
    ].join('');

    function mkShader(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }
    var prog = gl.createProgram();
    gl.attachShader(prog, mkShader(gl.VERTEX_SHADER, vertSrc));
    gl.attachShader(prog, mkShader(gl.FRAGMENT_SHADER, fragSrc));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,-1, 1,1, -1,1]), gl.STATIC_DRAW);
    var posLoc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    var timeLoc     = gl.getUniformLocation(prog, 'time');
    var resLoc      = gl.getUniformLocation(prog, 'resolution');
    var clickPosLoc = gl.getUniformLocation(prog, 'clickPos');
    var clickAgeLoc = gl.getUniformLocation(prog, 'clickAge');

    var click = { x: -5, y: -5, age: 99 };
    var t = 0, rafId;

    window.addEventListener('click', function (e) {
      if (e.target.closest('button,a,input,select,textarea,.card,.sidebar,.modal-overlay,.airo-overlay,.topbar,.engines,.sparkle-canvas,.crypto-card,.markets-card,.quick-links,.sb-tab,.sec-hero,.hero-search-wrap')) return;
      click.x = e.clientX / window.innerWidth;
      click.y = 1.0 - e.clientY / window.innerHeight;
      click.age = 0;
    });

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    function draw() {
      t += 0.05;
      if (click.age < 1.4) click.age += 0.022;
      gl.uniform1f(timeLoc, t);
      gl.uniform2f(resLoc, canvas.width, canvas.height);
      gl.uniform2f(clickPosLoc, click.x, click.y);
      gl.uniform1f(clickAgeLoc, click.age);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      rafId = requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) cancelAnimationFrame(rafId);
      else { rafId = requestAnimationFrame(draw); }
    });
  }

  /* ----------------------------- Spotlight border ----------------------------- */
  function initSpotlight() {
    var SEL = '.card, .tip-card, .tools-grid a, .icon-btn, .market-pill, .engines button, .quick-links a, .refresh-btn, .tip-next, .btn-primary';
    function bind(el) {
      if (el._sp) return;
      el._sp = 1;
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mouse-x', (e.clientX - r.left) + 'px');
        el.style.setProperty('--mouse-y', (e.clientY - r.top) + 'px');
      });
    }
    function scan() { document.querySelectorAll(SEL).forEach(bind); }
    scan();
    new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
  }

  /* ----------------------------- Sparkles ----------------------------- */
  function initSparkles() {
    const canvas = document.getElementById('sp-canvas');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, particles = [], rafId;
    var mx = -999, my = -999;

    window.addEventListener('mousemove', function (e) {
      var rect = canvas.getBoundingClientRect();
      mx = e.clientX - rect.left;
      my = e.clientY - rect.top;
    });

    function resize() {
      W = canvas.parentElement.offsetWidth;
      H = canvas.parentElement.offsetHeight;
      canvas.width = W;
      canvas.height = H;
      particles = [];
      const count = Math.min(Math.floor(W / 3.5), 300);
      for (let i = 0; i < count; i++) particles.push(newParticle(true));
    }

    function newParticle(randomY) {
      return {
        x: Math.random() * W,
        y: randomY ? Math.random() * H : H + 2,
        r: Math.random() * 1.0 + 0.4,
        phase: Math.random() * Math.PI * 2,
        freq: 0.012 + Math.random() * 0.022,
        maxOp: 0.25 + Math.random() * 0.75,
        vx: (Math.random() - 0.5) * 0.28,
        vy: -(0.05 + Math.random() * 0.18)
      };
    }

    function tick() {
      ctx.clearRect(0, 0, W, H);
      var isLight = document.body.getAttribute('data-theme') === 'light';
      var rc = isLight ? 24 : 255, gc = isLight ? 90 : 255, bc = isLight ? 219 : 255;
      var R = 80;
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.phase += p.freq;

        var dx = p.x - mx, dy = p.y - my;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < R && d > 0.1) {
          var f = (1 - d / R) * 2.8;
          p.x += (dx / d) * f;
          p.y += (dy / d) * f;
        }

        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -4 || p.x < -6 || p.x > W + 6) { particles[i] = newParticle(false); continue; }
        var op = p.maxOp * ((Math.sin(p.phase) + 1) / 2);
        if (d < R) op = Math.min(1, op + (1 - d / R) * 0.6);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + rc + ',' + gc + ',' + bc + ',' + op.toFixed(2) + ')';
        ctx.fill();
      }
      rafId = requestAnimationFrame(tick);
    }

    resize();
    tick();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { cancelAnimationFrame(rafId); }
      else { rafId = requestAnimationFrame(tick); }
    });
  }

  /* ----------------------------- Wire up ----------------------------- */
  function cacheEls() {
    [
      'bg-grid', 'theme-btn', 'settings-btn', 'focus-btn',
      'hero-date', 'clock', 'hero-greeting', 'hero-active', 'hero-utc',
      'search-box', 'search-icon', 'search-input', 'scope-label', 'search-go', 'suggest', 'engines',
      'tools-grid', 'crypto-card', 'crypto-list', 'crypto-foot', 'crypto-refresh',
      'px-tabs',
      'markets-wrap', 'markets-utc-badge',
      'bn-chips', 'bento-news-list',
      'quick-links', 'settings-modal', 'settings-panel', 'settings-close', 'settings-save',
      'set-name', 'set-engine', 'set-layout', 'set-accent', 'set-grid', 'set-crypto', 'set-coins',
      'set-theme-mode', 'bg-picker', 'bg-opt-default', 'bg-gallery', 'bg-upload'
    ].forEach(function (id) {
      const camel = id.replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); });
      els[camel] = $(id);
    });
  }

  function syncPxTabs() {
    if (!els.pxTabs) return;
    Array.prototype.forEach.call(els.pxTabs.querySelectorAll('button'), function (t) {
      t.classList.toggle('active', t.getAttribute('data-ptab') === state.pxTab);
    });
  }

  function init() {
    cacheEls();
    load();

    applyTheme();
    applyLayout();
    applyGrid();
    applyBackground();
    initAutoTheme();

    renderStaticIcons();
    renderTools();
    renderQuick();
    setEngine(state.activeEngine);
    syncPxTabs();
    renderPrices();
    applyShowCrypto();
    renderTime();
    renderNews();
    loadNews();
    initSidebars();
    loadCommunityTab('hot');

    // top bar
    els.themeBtn.addEventListener('click', toggleTheme);
    els.settingsBtn.addEventListener('click', openSettings);

    // search
    els.searchInput.addEventListener('input', function (e) { state.query = e.target.value; state.sugIdx = -1; renderSuggest(); });
    els.searchInput.addEventListener('keydown', onKey);
    els.searchInput.addEventListener('blur', function () { setTimeout(function () { els.suggest.hidden = true; }, 120); });
    els.searchGo.addEventListener('click', submitSearch);

    // live prices — refresh / tabs / sort / expandable rows
    els.cryptoRefresh.addEventListener('click', function () { loadPrices(true); });
    if (els.pxTabs) {
      els.pxTabs.addEventListener('click', function (e) {
        const b = e.target.closest('[data-ptab]');
        if (!b) return;
        state.pxTab = b.getAttribute('data-ptab');
        state.pxExpanded = null;
        syncPxTabs();
        persist();
        renderPrices();
        loadPrices(false);
      });
    }
    els.cryptoList.addEventListener('click', function (e) {
      if (e.target.closest('a')) return;
      const row = e.target.closest('[data-pxid]');
      if (!row || !row.classList.contains('has-detail')) return;
      const id = row.getAttribute('data-pxid');
      state.pxExpanded = state.pxExpanded === id ? null : id;
      renderPrices();
    });
    /* اگر لوگوی کوین لود نشد، مونوگرام پشت آن دیده شود (error باب‌بل نمی‌شود → capture) */
    els.cryptoList.addEventListener('error', function (e) {
      if (e.target && e.target.tagName === 'IMG') e.target.style.display = 'none';
    }, true);

    // markets — سوییچ مبنای زمان
    if (els.marketsUtcBadge) {
      els.marketsUtcBadge.addEventListener('click', function () {
        state.mktAxis = state.mktAxis === 'utc' ? 'local' : 'utc';
        persist();
        renderMarkets();
      });
    }

    // news — فیلتر دسته / علامت خوانده‌شده
    if (els.bnChips) {
      els.bnChips.addEventListener('click', function (e) {
        const b = e.target.closest('[data-cat]');
        if (!b) return;
        state.newsCat = b.getAttribute('data-cat');
        renderNews();
      });
    }
    if (els.bentoNewsList) {
      els.bentoNewsList.addEventListener('click', function (e) {
        const a = e.target.closest('[data-url]');
        if (!a) return;
        markNewsRead(a.getAttribute('data-url'));
        a.classList.add('read');
      });
      els.bentoNewsList.addEventListener('error', function (e) {
        if (e.target && e.target.tagName === 'IMG') e.target.style.display = 'none';
      }, true);
    }

    // tab switching
    document.querySelectorAll('.m-tab').forEach(function(t) {
      t.addEventListener('click', function() { switchTab(t.getAttribute('data-tab')); });
    });

    // settings modal
    els.settingsClose.addEventListener('click', closeSettings);
    els.settingsSave.addEventListener('click', closeSettings);
    els.settingsModal.addEventListener('click', closeSettings);
    els.settingsPanel.addEventListener('click', function (e) { e.stopPropagation(); });
    els.setName.addEventListener('input', function (e) { state.name = e.target.value; renderTime(); persist(); });
    els.setEngine.addEventListener('change', function (e) { state.engine = e.target.value; setEngine(e.target.value); persist(); });
    els.setCoins.addEventListener('input', function (e) {
      state.coins = e.target.value;
      state.pxData.crypto.ts = 0; /* کش کریپتو باطل شود تا لیست جدید فوراً لود شود */
      persist();
    });
    els.setGrid.addEventListener('change', function (e) { state.showGrid = e.target.checked; applyGrid(); persist(); });
    els.setCrypto.addEventListener('change', function (e) {
      state.showCrypto = e.target.checked; applyShowCrypto(); persist();
      if (state.showCrypto) loadPrices(false);
    });
    Array.prototype.forEach.call(els.setLayout.querySelectorAll('button'), function (b) {
      b.addEventListener('click', function () { state.layout = b.getAttribute('data-layout'); applyLayout(); syncSeg(els.setLayout, 'layout', state.layout); persist(); });
    });
    Array.prototype.forEach.call(els.setAccent.querySelectorAll('button'), function (b) {
      b.addEventListener('click', function () { state.accent = b.getAttribute('data-accent'); applyAccent(); syncSwatches(); persist(); });
    });

    // theme mode (4 options)
    if (els.setThemeMode) {
      Array.prototype.forEach.call(els.setThemeMode.querySelectorAll('button'), function (b) {
        b.addEventListener('click', function () {
          state.theme = b.getAttribute('data-theme');
          applyTheme();
          syncSeg(els.setThemeMode, 'theme', state.theme);
          persist();
        });
      });
    }

    // background picker — default
    var defBtn = document.getElementById('bg-opt-default');
    if (defBtn) {
      defBtn.addEventListener('click', function() {
        state.bgMode = 'default';
        applyBackground();
        updateBgPicker();
        persist();
      });
    }

    // background picker — upload
    if (els.bgUpload) {
      els.bgUpload.addEventListener('change', function(e) {
        var file = e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(ev) {
          state.bgMode = 'custom';
          state.bgImage = ev.target.result;
          try { localStorage.setItem(BG_IMAGE_KEY, state.bgImage); } catch (ex) {}
          applyBackground();
          updateBgPicker();
          persist();
        };
        reader.readAsDataURL(file);
        e.target.value = '';
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !els.settingsModal.hidden) closeSettings();
    });

    // timers
    setInterval(renderTime, 1000 * 20);
    if (state.showCrypto) setTimeout(function () { loadPrices(false); }, 400);
    /* هر ۱۵ ثانیه چک می‌شود؛ TTL هر تب تعیین می‌کند که واقعاً درخواست برود یا نه */
    setInterval(function () { if (state.showCrypto) loadPrices(false); }, 15000);
    /* اخبار هر ۱۰ دقیقه بی‌صدا تازه می‌شود */
    setInterval(loadNews, 600000);

    // focus search for quick typing
    els.searchInput.focus();

    initSpotlight();
    initSparkles();
    initShaderBg();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();


})();
