/* Feature 3: Hot Community Topics — seeded daily shuffle */

const COMMUNITY_HOT = [
  { name: 'آلپاری', slug: 'alpari', type: 'broker', typeLabel: 'بروکر', comment_hint: '+۱۲ نظر جدید', trend: 'up', icon: '🏦' },
  { name: 'اکسنس', slug: 'exness', type: 'broker', typeLabel: 'بروکر', comment_hint: '+۸ نظر جدید', trend: 'up', icon: '🏦' },
  { name: 'بایننس', slug: 'binance', type: 'exchange', typeLabel: 'صرافی', comment_hint: '+۲۳ نظر جدید', trend: 'up', icon: '🪙' },
  { name: 'نووابیت', slug: 'novabit', type: 'prop', typeLabel: 'پراپ', comment_hint: '+۵ نظر جدید', trend: 'neutral', icon: '🏆' },
  { name: 'ای‌مارکتس', slug: 'amarkets', type: 'broker', typeLabel: 'بروکر', comment_hint: '+۳ نظر جدید', trend: 'down', icon: '🏦' },
  { name: 'آی‌سی مارکتس', slug: 'icmarkets', type: 'broker', typeLabel: 'بروکر', comment_hint: '+۹ نظر جدید', trend: 'up', icon: '🏦' },
  { name: 'فیبو گروپ', slug: 'fibo-group', type: 'broker', typeLabel: 'بروکر', comment_hint: '+۴ نظر جدید', trend: 'neutral', icon: '🏦' },
  { name: 'رابوفارکس', slug: 'roboforex', type: 'broker', typeLabel: 'بروکر', comment_hint: '+۶ نظر جدید', trend: 'up', icon: '🏦' },
  { name: 'نووافروپ', slug: 'novagroup', type: 'prop', typeLabel: 'پراپ', comment_hint: '+۱۱ نظر جدید', trend: 'up', icon: '🏆' },
  { name: 'کوین‌بیس', slug: 'coinbase', type: 'exchange', typeLabel: 'صرافی', comment_hint: '+۱۷ نظر جدید', trend: 'up', icon: '🪙' },
  { name: 'اوآندا', slug: 'oanda', type: 'broker', typeLabel: 'بروکر', comment_hint: '+۲ نظر جدید', trend: 'down', icon: '🏦' },
  { name: 'پپرستون', slug: 'pepperstone', type: 'broker', typeLabel: 'بروکر', comment_hint: '+۷ نظر جدید', trend: 'up', icon: '🏦' },
  { name: 'بیتکس', slug: 'bitmex', type: 'exchange', typeLabel: 'صرافی', comment_hint: '+۱۵ نظر جدید', trend: 'neutral', icon: '🪙' },
  { name: 'تایگر مارکتس', slug: 'tiger-markets', type: 'prop', typeLabel: 'پراپ', comment_hint: '+۸ نظر جدید', trend: 'up', icon: '🏆' },
  { name: 'اتورو', slug: 'etoro', type: 'broker', typeLabel: 'بروکر', comment_hint: '+۱۹ نظر جدید', trend: 'up', icon: '🏦' },
];

function seededShuffle(arr, seed) {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getDaySeed() {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

const TREND_ICON = { up: '▲', down: '▼', neutral: '●' };
const TREND_CLASS = { up: 'up', down: 'down', neutral: 'neutral' };

export function initCommunity() {
  const container = document.getElementById('community-list');
  if (!container) return;

  const seed = getDaySeed();
  const shuffled = seededShuffle(COMMUNITY_HOT, seed).slice(0, 5);

  container.innerHTML = shuffled.map((item, i) => {
    const url = 'https://iranbroker.net/' + item.type + '/' + item.slug + '/';
    return '<a class="comm-item" href="' + url + '" target="_blank">' +
      '<span class="comm-rank">' + (i + 1) + '</span>' +
      '<span class="comm-icon">' + item.icon + '</span>' +
      '<span class="comm-info">' +
        '<span class="comm-name">' + item.name + '</span>' +
        '<span class="comm-meta">' + item.typeLabel + ' · ' + item.comment_hint + '</span>' +
      '</span>' +
      '<span class="comm-trend ' + TREND_CLASS[item.trend] + '">' + TREND_ICON[item.trend] + '</span>' +
    '</a>';
  }).join('');
}
