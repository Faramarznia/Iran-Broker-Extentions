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

      // Excerpt from description
      const descRaw = item.querySelector('description')?.textContent?.trim() || '';
      const excerpt = descRaw.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 85);

      // Categories
      const cats = [];
      item.querySelectorAll('category').forEach(c => {
        const ct = c.textContent.trim().toLowerCase();
        if (ct.includes('فارکس') || ct.includes('forex')) cats.push('forex');
        else if (ct.includes('ارز دیجیتال') || ct.includes('کریپتو') || ct.includes('crypto') || ct.includes('bitcoin')) cats.push('crypto');
        else if (ct.includes('بروکر') || ct.includes('broker')) cats.push('broker');
        else if (ct.includes('کلاهبرداری') || ct.includes('fraud')) cats.push('fraud');
        else if (ct.includes('آموزش') || ct.includes('education')) cats.push('education');
        else if (ct.includes('پراپ') || ct.includes('prop')) cats.push('prop');
      });

      if (title && url) result.push({ title, url, date, thumb, excerpt, cats });
    });
    return result.slice(0, 12);
  } catch (e) {
    return [];
  }
}

let _feedItems = [];
let _activeCat = 'all';

function renderFeedCats(store) {
  const el = document.getElementById('feed-cats');
  if (!el) return;
  const selected = store.get().feedCategories || [];
  const tabs = [{ key: 'all', label: 'همه' }].concat(
    selected.filter(k => CAT_LABELS[k]).map(k => ({ key: k, label: CAT_LABELS[k] }))
  );
  el.innerHTML = tabs.map(t =>
    '<button class="feed-cat-btn' + (_activeCat === t.key ? ' active' : '') + '" data-cat="' + t.key + '">' + t.label + '</button>'
  ).join('');
  el.querySelectorAll('.feed-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      _activeCat = btn.dataset.cat;
      renderFeedList();
      el.querySelectorAll('.feed-cat-btn').forEach(b => b.classList.toggle('active', b.dataset.cat === _activeCat));
    });
  });
}

function renderFeedList() {
  const container = document.getElementById('feed-scroll');
  if (!container) return;
  const items = _feedItems;
  if (!items.length) {
    container.innerHTML = '<div class="feed-empty">خطا در دریافت مطالب — <a href="https://iranbroker.net/news/" target="_blank">مستقیم باز کن</a></div>';
    return;
  }
  const filtered = _activeCat === 'all' ? items : items.filter(i => i.cats && i.cats.includes(_activeCat));
  const shown = (filtered.length ? filtered : items).slice(0, 8);
  container.innerHTML = shown.map(item => {
    const timeStr = item.date ? relativeTime(item.date) : '';
    const cat = item.cats && item.cats[0] ? CAT_LABELS[item.cats[0]] : '';
    const thumbHtml = item.thumb
      ? '<img class="feed-art-thumb" src="' + item.thumb + '" alt="" loading="lazy">'
      : '<div class="feed-art-placeholder">📰</div>';
    return '<a class="feed-article" href="' + item.url + '" target="_blank">' +
      thumbHtml +
      '<div class="feed-art-body">' +
        '<div class="feed-art-meta">' +
          (cat ? '<span class="feed-art-cat">' + cat + '</span>' : '') +
          (timeStr ? '<span class="feed-art-time">' + timeStr + '</span>' : '') +
        '</div>' +
        '<div class="feed-art-title">' + item.title + '</div>' +
        (item.excerpt ? '<div class="feed-art-excerpt">' + item.excerpt + '</div>' : '') +
      '</div>' +
    '</a>';
  }).join('');
  container.querySelectorAll('img').forEach(img => {
    img.addEventListener('error', () => { img.style.display = 'none'; });
  });
}

function renderFeed(items, store) {
  _feedItems = items || [];
  if (store) renderFeedCats(store);
  renderFeedList();
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
    renderFeed(items, store);
  } else {
    const cached = store.get().feedCache;
    renderFeed(cached && cached.data ? cached.data : STATIC_FEED, store);
  }
}

export function initFeed(store) {
  fetchFeed(store);
  setInterval(() => fetchFeed(store), CACHE_TTL);
}
