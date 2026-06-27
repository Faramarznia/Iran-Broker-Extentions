/* Feature 8: My Broker Radar — connection status check via IB page fetch */

const BROKER_RADAR = [
  { name: 'آلپاری', slug: 'alpari' },
  { name: 'اکسنس', slug: 'exness' },
  { name: 'ای‌مارکتس', slug: 'amarkets' },
  { name: 'فیبو گروپ', slug: 'fibo-group' },
  { name: 'رابوفارکس', slug: 'roboforex' },
  { name: 'آی‌سی مارکتس', slug: 'icmarkets' },
  { name: 'اوآندا', slug: 'oanda' },
  { name: 'پپرستون', slug: 'pepperstone' },
  { name: 'اتورو', slug: 'etoro' },
  { name: 'اکسفورد بروکر', slug: 'oxford' },
  { name: 'فارکس کام', slug: 'forex-com' },
  { name: 'هایم مارکتس', slug: 'hyme' },
  { name: 'ون فایننشال', slug: 'one-financial' },
  { name: 'بروکر تاسکو', slug: 'tasco' },
  { name: 'اف‌اکس‌پرو', slug: 'fxpro' },
  { name: 'هات فارکس', slug: 'hotforex' },
  { name: 'اینستا فارکس', slug: 'instaforex' },
  { name: 'اف‌اکس‌سی‌ام', slug: 'fxcm' },
  { name: 'تایگر مارکتس', slug: 'tiger-markets' },
  { name: 'بلوفایننشال', slug: 'blue-financial' },
];

let lastCheck = null;
let statusDot = 'offline';

function getBrokerBySlug(slug) {
  return BROKER_RADAR.find(b => b.slug === slug);
}

async function checkBrokerStatus(slug) {
  const url = 'https://iranbroker.net/broker/' + slug + '/';
  const controller = new AbortController();
  const start = Date.now();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    await fetch(url, { signal: controller.signal, mode: 'no-cors' });
    clearTimeout(timer);
    const elapsed = Date.now() - start;
    if (elapsed > 3000) return 'unstable';
    return 'online';
  } catch (e) {
    clearTimeout(timer);
    if (e.name === 'AbortError') return 'offline';
    return 'online'; // no-cors opaque response counts as reachable
  }
}

function updateBadge(broker, status) {
  const badge = document.getElementById('radar-badge');
  const dot = document.getElementById('radar-dot');
  const label = document.getElementById('radar-label');

  if (!badge) return;

  if (!broker) {
    if (label) label.textContent = 'بروکر من';
    if (dot) dot.className = 'radar-dot';
    return;
  }

  if (label) label.textContent = broker.name;
  if (dot) {
    dot.className = 'radar-dot ' + status;
    const titles = { online: 'آنلاین', offline: 'احتمالاً قطع', unstable: 'ناپایدار' };
    const now = new Date();
    const timeStr = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');
    badge.title = broker.name + ' — ' + (titles[status] || '') + ' · آخرین بررسی: ' + timeStr;
  }
}

export function initRadar(store) {
  // Populate broker selector in settings
  const sel = document.getElementById('set-broker');
  if (sel) {
    BROKER_RADAR.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b.slug;
      opt.textContent = b.name;
      sel.appendChild(opt);
    });
    const state = store.get();
    if (state.selectedBroker) sel.value = state.selectedBroker;
    sel.addEventListener('change', () => {
      store.set({ selectedBroker: sel.value || null });
      runCheck();
    });
  }

  const badge = document.getElementById('radar-badge');
  if (badge) {
    badge.addEventListener('click', () => {
      const state = store.get();
      if (state.selectedBroker) {
        window.open('https://iranbroker.net/broker/' + state.selectedBroker + '/', '_blank');
      } else {
        // open settings
        const modal = document.getElementById('settings-modal');
        if (modal) modal.hidden = false;
      }
    });
  }

  async function runCheck() {
    const state = store.get();
    const slug = state.selectedBroker;
    if (!slug) { updateBadge(null, null); return; }
    const broker = getBrokerBySlug(slug);
    const status = await checkBrokerStatus(slug);
    statusDot = status;
    lastCheck = new Date();
    updateBadge(broker, status);
  }

  runCheck();
  setInterval(runCheck, 5 * 60 * 1000);

  return { runCheck };
}
