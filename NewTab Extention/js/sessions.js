/* Forex session ring clock */

import { polar, arc, svg } from './utils.js';

const SESSIONS = [
  { name: 'سیدنی', open: 21, close: 6, c: '#35d0c0' },
  { name: 'توکیو', open: 0, close: 9, c: '#a78bfa' },
  { name: 'لندن', open: 7, close: 16, c: '#6f9bf3' },
  { name: 'نیویورک', open: 12, close: 21, c: '#f6a723' }
];

function isOpen(s, h) {
  return s.open < s.close ? (h >= s.open && h < s.close) : (h >= s.open || h < s.close);
}

function renderSessions() {
  const now = new Date();
  const uh = now.getUTCHours();
  const utcF = uh + now.getUTCMinutes() / 60;

  const open = SESSIONS.map(s => isOpen(s, uh));
  const openCount = open.filter(Boolean).length;

  const ringCount = document.getElementById('ring-count');
  if (ringCount) ringCount.textContent = openCount;

  const ringArcs = document.getElementById('ring-arcs');
  if (ringArcs) {
    ringArcs.innerHTML = SESSIONS.map((s, i) => {
      const rr = 74 - i * 9;
      return '<path d="' + arc(100, 100, rr, s.open, s.close) + '" fill="none" stroke="' + s.c + '" stroke-width="7" stroke-linecap="round" opacity="' + (open[i] ? 1 : 0.28) + '"></path>';
    }).join('');
  }

  const hand = polar(100, 100, 80, (utcF / 24) * 360);
  const ringHand = document.getElementById('ring-hand');
  const ringTip = document.getElementById('ring-tip');
  if (ringHand) { ringHand.setAttribute('x2', hand[0].toFixed(2)); ringHand.setAttribute('y2', hand[1].toFixed(2)); }
  if (ringTip) { ringTip.setAttribute('cx', hand[0].toFixed(2)); ringTip.setAttribute('cy', hand[1].toFixed(2)); }

  const sessionList = document.getElementById('session-list');
  if (sessionList) {
    sessionList.innerHTML = SESSIONS.map((s, i) => {
      const op = open[i];
      return '<div class="s-row">' +
        '<span class="s-dot" style="background:' + s.c + ';opacity:' + (op ? 1 : 0.28) + '"></span>' +
        '<span class="s-name">' + s.name + '</span>' +
        '<span class="s-time">' + String(s.open).padStart(2, '0') + '–' + String(s.close).padStart(2, '0') + ' UTC</span>' +
        '<span class="s-status" style="color:' + (op ? 'var(--green)' : 'var(--soft)') + '">' + (op ? 'باز' : 'بسته') + '</span>' +
      '</div>';
    }).join('');
  }
}

export function initSessions() {
  renderSessions();
  setInterval(renderSessions, 60000);
}
