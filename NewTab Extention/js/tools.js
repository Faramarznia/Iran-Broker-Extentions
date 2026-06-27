/* Tools grid renderer */

import { svg, hexA } from './utils.js';

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

export function initTools() {
  const grid = document.getElementById('tools-grid');
  if (grid) {
    grid.innerHTML = TOOLS.map(t =>
      '<a href="' + t.url + '" target="_blank">' +
        '<div class="t-ic" style="background:' + hexA(t.c, 0.13) + ';color:' + t.c + '">' + svg(t.icon) + '</div>' +
        '<div class="t-txt"><span class="t-label">' + t.label + '</span><span class="t-sub">' + t.sub + '</span></div>' +
      '</a>'
    ).join('');
  }

  const ql = document.getElementById('quick-links');
  if (ql) {
    ql.innerHTML = QUICK.map(q =>
      '<a href="' + q.url + '" target="_blank"><span class="ql-dot"></span>' + q.label + '</a>'
    ).join('');
  }
}
