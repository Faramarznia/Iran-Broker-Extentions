/* Feature 2: Personalized Content Feed — IranBroker RSS */

import { relativeTime } from './utils.js';

const FEED_URL = 'https://iranbroker.net/feed/';
const FEED_FALLBACK = 'https://iranbroker.net/rss.xml';
const CACHE_TTL = 30 * 60 * 1000;

const CAT_LABELS = {
  forex: 'فارکس',
  crypto: 'کریپتو',
  broker: 'بروکر',
  fraud: 'کلاهبرداری',
  education: 'آموزش',
  prop: 'پراپ'
};

const STATIC_FEED = [
  { title: 'بهترین بروکرهای فارکس برای ایرانیان ۲۰۲۵', date: new Date(Date.now() - 3600000).toISOString(), url: 'https://iranbroker.net/forex-brokers/', thumb: null },
  { title: 'آموزش مدیریت ریسک در فارکس', date: new Date(Date.now() - 7200000).toISOString(), url: 'https://iranbroker.net/forex-education/', thumb: null },
  { title: 'هشدار: بروکر جدید کلاهبردار شناخته شد', date: new Date(Date.now() - 14400000).toISOString(), url: 'https://iranbroker.net/fraud-alert/', thumb: null },
  { title: 'مقایسه پراپ‌فرم‌های برتر برای معامله‌گران ایرانی', date: new Date(Date.now() - 21600000).toISOString(), url: 'https://iranbroker.net/prop-firms/', thumb: null },
  { title: 'قیمت بیت‌کوین و تحلیل بازار ارز دیجیتال', date: new Date(Date.now() - 28800000).toISOString(), url: 'https://iranbroker.net/cryptocurrency-prices/', thumb: null }
];

function parseRSS(xmlStr) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlStr, 'application/xml');
    const items = doc.querySelectorAll('item');
    const result = [];
    items.forEach(item => {
      const title = item.querySelector('title')?.textContent?.trim() || '';
      const url = item.querySelector('link')?.textContent?.trim() || '';
      const date = item.querySelector('pubDate')?.textContent?.trim() || '';
      const enc = item.querySelector('enclosure');
      const thumb = enc ? enc.getAttribute('url') : null;
      if (title && url) result.push({ title, url, date, thumb });
    });
    return result.slice(0, 10);
  } catch (e) {
    return [];
  }
}

function renderFeed(items) {
  const container = document.getElementById('feed-scroll');
  if (!container) return;

  if (!items || !items.length) {
    container.innerHTML = '<div class="feed-empty">خطا در دریافت مطالب — <a href="https://iranbroker.net/news/" target="_blank">مستقیم باز کن</a></div>';
    return;
  }

  container.innerHTML = items.slice(0, 10).map(item => {
    const timeStr = item.date ? relativeTime(item.date) : '';
    return '<a class="feed-item" href="' + item.url + '" target="_blank">' +
      '<span class="feed-item-title">' + item.title + '</span>' +
      (timeStr ? '<span class="feed-item-meta">' + timeStr + '</span>' : '') +
    '</a>';
  }).join('');
}

async function fetchFeed(store) {
  const state = store.get();
  const cache = state.feedCache;
  if (cache && cache.timestamp && (Date.now() - cache.timestamp < CACHE_TTL)) {
    renderFeed(cache.data);
    return;
  }

  const controller = new AbortController();
  setTimeout(() => controller.abort(), 8000);

  let items = null;
  try {
    let res = await fetch(FEED_URL, { signal: controller.signal });
    if (!res.ok) {
      const c2 = new AbortController();
      setTimeout(() => c2.abort(), 8000);
      res = await fetch(FEED_FALLBACK, { signal: c2.signal });
    }
    if (res.ok) {
      const xml = await res.text();
      items = parseRSS(xml);
    }
  } catch (e) {
    // CORS or network error — use static
  }

  if (items && items.length) {
    store.set({ feedCache: { data: items, timestamp: Date.now() } });
    renderFeed(items);
  } else {
    const cached = store.get().feedCache;
    renderFeed(cached && cached.data ? cached.data : STATIC_FEED);
  }
}

export function initFeed(store) {
  fetchFeed(store);
  setInterval(() => fetchFeed(store), CACHE_TTL);
}
