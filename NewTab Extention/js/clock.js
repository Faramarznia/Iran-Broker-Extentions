/* Clock, Jalali date, greeting, active session label */

const SESSIONS = [
  { name: 'سیدنی', open: 21, close: 6, c: '#35d0c0' },
  { name: 'توکیو', open: 0, close: 9, c: '#a78bfa' },
  { name: 'لندن', open: 7, close: 16, c: '#6f9bf3' },
  { name: 'نیویورک', open: 12, close: 21, c: '#f6a723' }
];

function isOpen(s, h) {
  return s.open < s.close ? (h >= s.open && h < s.close) : (h >= s.open || h < s.close);
}

export function renderClock(state) {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');

  const clockEl = document.getElementById('clock');
  if (clockEl) clockEl.textContent = hh + ':' + mm;

  const heroDate = document.getElementById('hero-date');
  if (heroDate) {
    try {
      heroDate.textContent = new Intl.DateTimeFormat('fa-IR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      }).format(now);
    } catch (e) {
      heroDate.textContent = now.toLocaleDateString('fa-IR');
    }
  }

  const h = now.getHours();
  const greeting = h >= 5 && h < 12 ? 'صبح‌تان بخیر'
    : h >= 12 && h < 17 ? 'ظهر بخیر'
    : h >= 17 && h < 21 ? 'عصرتان بخیر'
    : 'شب‌تان بخیر';

  const heroGreeting = document.getElementById('hero-greeting');
  if (heroGreeting) {
    heroGreeting.textContent = greeting + (state.name ? '، ' + state.name : ' معامله‌گر');
  }

  const uh = now.getUTCHours();
  const openSessions = SESSIONS.filter(s => isOpen(s, uh));
  const openCount = openSessions.length;
  const activeLabel = openSessions.length ? openSessions.map(s => s.name).join('، ') : 'بازارها بسته';

  const mcEl = document.getElementById('market-count');
  if (mcEl) mcEl.textContent = openCount + ' بازار فعال';

  const heroActive = document.getElementById('hero-active');
  if (heroActive) heroActive.textContent = activeLabel;

  const heroUtc = document.getElementById('hero-utc');
  if (heroUtc) heroUtc.textContent = String(uh).padStart(2, '0') + ':' + String(now.getUTCMinutes()).padStart(2, '0');

  return { openSessions, openCount, uh, now };
}

export function initClock(state) {
  renderClock(state);
  setInterval(() => renderClock(state), 20000);
}
