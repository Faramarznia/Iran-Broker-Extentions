/* Shared utilities — ICONS, svg(), formatting helpers */

export const ICONS = {
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
  bell: '<path fill="currentColor" d="M20 17h2v2H2v-2h2v-7a8 8 0 1 1 16 0v7zm-2 0v-7a6 6 0 1 0-12 0v7h12zm-9 4h6v2H9v-2z"/>',
  timer: '<path fill="currentColor" d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"/><path fill="currentColor" d="M13 7h-2v5.414l3.293 3.293 1.414-1.414L13 11.586z"/>',
  note: '<path fill="currentColor" d="M20 2H4c-1.103 0-2 .897-2 2v18l4-4h14c1.103 0 2-.897 2-2V4c0-1.103-.897-2-2-2zm0 14H5.172L4 17.172V4h16v12z"/><path fill="currentColor" d="M6 7h12v2H6zm0 4h12v2H6zm0 4h8v2H6z"/>',
};

export function svg(name) {
  return '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' + (ICONS[name] || '') + '</svg>';
}

export function fmtPrice(p) {
  if (p == null) return '—';
  if (p >= 1000) return '$' + p.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (p >= 1) return '$' + p.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return '$' + p.toLocaleString('en-US', { maximumFractionDigits: 4 });
}

export function fmtNum(n, decimals = 2) {
  if (n == null) return '—';
  return n.toLocaleString('en-US', { maximumFractionDigits: decimals });
}

export function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
}

export function lighten(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const m = v => Math.round(v + (255 - v) * amt);
  return 'rgb(' + m(r) + ',' + m(g) + ',' + m(b) + ')';
}

export function relativeTime(date) {
  const now = Date.now();
  const diff = Math.floor((now - new Date(date).getTime()) / 1000);
  if (diff < 60) return 'همین الان';
  if (diff < 3600) return Math.floor(diff / 60) + ' دقیقه پیش';
  if (diff < 86400) return Math.floor(diff / 3600) + ' ساعت پیش';
  return Math.floor(diff / 86400) + ' روز پیش';
}

export function showToast(msg, type = 'info', duration = 8000) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .4s'; setTimeout(() => el.remove(), 400); }, duration);
}

export function debounce(fn, delay) {
  let t;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), delay);
  };
}

export function sparkPts(coin) {
  let arr = coin.spark;
  if (!arr || arr.length < 4) {
    let seed = 0;
    for (const ch of (coin.id || '')) seed += ch.charCodeAt(0);
    arr = [];
    const n = 24;
    const trend = (coin.chg || 0) / 100;
    for (let i = 0; i < n; i++) arr.push(1 + trend * (i / n) + Math.sin(i * 0.7 + seed) * 0.012 + Math.sin(i * 1.9 + seed) * 0.006);
  } else {
    arr = arr.slice(-24);
  }
  const min = Math.min(...arr), max = Math.max(...arr), rng = (max - min) || 1;
  const W = 64, H = 22;
  return arr.map((v, i) =>
    (W - (i / (arr.length - 1)) * W).toFixed(1) + ',' + (H - ((v - min) / rng) * H).toFixed(1)
  ).join(' ');
}

export function polar(cx, cy, r, deg) {
  const a = (deg - 90) * Math.PI / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

export function arc(cx, cy, r, sH, eH) {
  let s = sH, e = eH;
  if (e <= s) e += 24;
  const a0 = (s / 24) * 360, a1 = (e / 24) * 360;
  const p0 = polar(cx, cy, r, a0), p1 = polar(cx, cy, r, a1);
  const large = (a1 - a0) > 180 ? 1 : 0;
  return 'M ' + p0[0].toFixed(2) + ' ' + p0[1].toFixed(2) + ' A ' + r + ' ' + r + ' 0 ' + large + ' 1 ' + p1[0].toFixed(2) + ' ' + p1[1].toFixed(2);
}
