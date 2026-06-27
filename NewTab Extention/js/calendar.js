/* Feature 6: Economic Calendar — today's high-impact events in Tehran time */

import { svg } from './utils.js';

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// Fallback static events (rotate by day of week)
const STATIC_EVENTS = {
  0: [ // Sunday
    { time: '17:30', name: 'داده اشتغال آمریکا', country: 'USD', impact: 'High' },
    { time: '19:00', name: 'نرخ بهره فدرال رزرو', country: 'USD', impact: 'High' },
  ],
  1: [ // Monday
    { time: '14:00', name: 'شاخص PMI آلمان', country: 'EUR', impact: 'High' },
    { time: '17:30', name: 'تراز تجاری آمریکا', country: 'USD', impact: 'Medium' },
  ],
  2: [ // Tuesday
    { time: '15:30', name: 'اشتغال بریتانیا', country: 'GBP', impact: 'High' },
    { time: '18:00', name: 'اطمینان مصرف‌کننده آمریکا', country: 'USD', impact: 'Medium' },
  ],
  3: [ // Wednesday
    { time: '17:30', name: 'موجودی نفت خام', country: 'USD', impact: 'High' },
    { time: '19:00', name: 'صورتجلسه فدرال رزرو', country: 'USD', impact: 'High' },
  ],
  4: [ // Thursday
    { time: '15:00', name: 'نرخ بهره بانک مرکزی اروپا', country: 'EUR', impact: 'High' },
    { time: '17:30', name: 'درخواست بیکاری آمریکا', country: 'USD', impact: 'Medium' },
  ],
  5: [ // Friday
    { time: '17:30', name: 'NFP — اشتغال غیر کشاورزی', country: 'USD', impact: 'High' },
    { time: '17:30', name: 'نرخ بیکاری آمریکا', country: 'USD', impact: 'High' },
  ],
  6: [ // Saturday
    { time: '14:30', name: 'بازار بسته / تعطیل', country: '—', impact: 'Low' },
  ]
};

const IMPACT_COLOR = { High: 'high', Medium: 'medium', Low: 'low' };
const IMPACT_LABEL = { High: 'بالا', Medium: 'متوسط', Low: 'کم' };

function tehranTime(dateStr) {
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      timeZone: 'Asia/Tehran',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date(dateStr));
  } catch (e) {
    return dateStr;
  }
}

function isEventPast(event) {
  try {
    const now = new Date();
    const eventDate = new Date(event.date);
    return eventDate < now;
  } catch (e) {
    return false;
  }
}

function renderCalendar(events) {
  const listEl = document.getElementById('calendar-list');
  if (!listEl) return;

  if (!events || !events.length) {
    listEl.innerHTML = '<div class="cal-empty">رویداد مهمی امروز نیست</div>';
    return;
  }

  const filtered = events
    .filter(e => e.impact === 'High' || e.impact === 'Medium')
    .slice(0, 6);

  if (!filtered.length) {
    listEl.innerHTML = '<div class="cal-empty">رویداد پر‌اهمیتی امروز نیست</div>';
    return;
  }

  listEl.innerHTML = filtered.map(event => {
    const past = event.date ? isEventPast(event) : false;
    const impactClass = IMPACT_COLOR[event.impact] || 'low';
    const timeStr = event.date ? tehranTime(event.date) : (event.time || '—');
    return '<div class="cal-item ' + (past ? 'past ' : '') + (event.impact === 'High' ? 'high-impact' : '') + '">' +
      '<div class="cal-impact ' + impactClass + '"></div>' +
      '<div class="cal-time">' + timeStr + '</div>' +
      '<div class="cal-name">' + (event.title || event.name || '—') + '</div>' +
      '<div class="cal-country">' + (event.country || event.currency || '') + '</div>' +
    '</div>';
  }).join('');
}

async function fetchCalendar(store) {
  const state = store.get();
  const cache = state.calendarCache;
  if (cache && cache.timestamp && (Date.now() - cache.timestamp < CACHE_TTL)) {
    renderCalendar(cache.data);
    return;
  }

  const refreshBtn = document.getElementById('calendar-refresh');
  if (refreshBtn) refreshBtn.classList.add('spinning');

  const controller = new AbortController();
  setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json', { signal: controller.signal });
    if (!res.ok) throw new Error('http');
    const data = await res.json();

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tmrStr = tomorrow.toISOString().slice(0, 10);

    const events = Array.isArray(data) ? data.filter(e => {
      if (!e.date) return false;
      const dStr = e.date.slice(0, 10);
      return dStr === todayStr || dStr === tmrStr;
    }) : [];

    store.set({ calendarCache: { data: events, timestamp: Date.now() } });
    renderCalendar(events);
  } catch (e) {
    // Use static fallback
    const day = new Date().getDay();
    const fallback = (STATIC_EVENTS[day] || []).map(ev => ({
      title: ev.name,
      date: null,
      time: ev.time,
      country: ev.country,
      impact: ev.impact
    }));
    renderCalendar(fallback);
    const listEl = document.getElementById('calendar-list');
    if (listEl) {
      const note = document.createElement('div');
      note.className = 'cal-empty';
      note.style.fontSize = '11px';
      note.textContent = '(داده نمونه — اتصال بررسی شود)';
      listEl.appendChild(note);
    }
  } finally {
    if (refreshBtn) refreshBtn.classList.remove('spinning');
  }
}

export function initCalendar(store) {
  const refreshBtn = document.getElementById('calendar-refresh');
  if (refreshBtn) {
    refreshBtn.innerHTML = svg('refresh');
    refreshBtn.addEventListener('click', () => {
      store.set({ calendarCache: null });
      fetchCalendar(store);
    });
  }

  fetchCalendar(store);
  setInterval(() => fetchCalendar(store), CACHE_TTL);
}
