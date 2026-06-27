/* Feature 10: Trading Session Timer with optional Pomodoro */

import { svg } from './utils.js';

let sessionInterval = null;
let pomodoroInterval = null;
let pomodoroStart = null;

function formatCountdown(ms) {
  if (ms < 0) return '0:00';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (h > 0) return h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  return m + ':' + String(s).padStart(2, '0');
}

function parseTime(str) {
  if (!str) return null;
  const [h, m] = str.split(':').map(Number);
  const now = new Date();
  const d = new Date(now);
  d.setHours(h, m, 0, 0);
  return d;
}

function updateSessionUI(store) {
  const cfg = store.get().sessionConfig;
  const bar = document.getElementById('session-bar');
  const countdown = document.getElementById('timer-countdown');

  if (!cfg || !cfg.start || !cfg.end) {
    if (bar) bar.hidden = true;
    if (countdown) countdown.hidden = true;
    return;
  }

  const now = new Date();
  const start = parseTime(cfg.start);
  const end = parseTime(cfg.end);
  if (!start || !end) return;

  // If end is before start, it's next day
  if (end <= start) end.setDate(end.getDate() + 1);

  const inSession = now >= start && now < end;
  const msRemaining = end - now;

  if (bar) {
    bar.hidden = false;
    bar.className = 'session-bar' + (inSession ? '' : ' ended');
  }

  if (countdown && inSession) {
    countdown.hidden = false;
    countdown.textContent = formatCountdown(msRemaining);
  } else if (countdown) {
    countdown.hidden = true;
  }

  if (!inSession && msRemaining < 0) {
    // Session ended
    if (bar) bar.className = 'session-bar ended';
    clearAllIntervals();
    showSessionSummary(cfg);
  }
}

function showSessionSummary(cfg) {
  const start = parseTime(cfg.start);
  const end = parseTime(cfg.end);
  if (!start || !end) return;
  const durationMs = end - start;
  const hours = Math.floor(durationMs / 3600000);
  const mins = Math.floor((durationMs % 3600000) / 60000);
  const msg = 'سشن معاملاتی پایان یافت — مدت: ' + hours + ' ساعت و ' + mins + ' دقیقه';
  import('./utils.js').then(({ showToast }) => showToast(msg, 'info', 10000));
}

function clearAllIntervals() {
  if (sessionInterval) { clearInterval(sessionInterval); sessionInterval = null; }
  if (pomodoroInterval) { clearInterval(pomodoroInterval); pomodoroInterval = null; }
}

function startPomodoro(store) {
  pomodoroStart = Date.now();
  pomodoroInterval = setInterval(() => {
    const cfg = store.get().sessionConfig;
    if (!cfg || !cfg.pomodoro) { clearInterval(pomodoroInterval); return; }
    const elapsed = Date.now() - pomodoroStart;
    if (elapsed >= 25 * 60 * 1000) {
      pomodoroStart = Date.now();
      showPomodoroOverlay();
    }
  }, 30000);
}

function showPomodoroOverlay() {
  const overlay = document.getElementById('pomodoro-overlay');
  if (overlay) overlay.hidden = false;
}

function hidePomodoroOverlay() {
  const overlay = document.getElementById('pomodoro-overlay');
  if (overlay) overlay.hidden = true;
}

export function initTimer(store) {
  const topbarBtn = document.getElementById('timer-topbar-btn');
  const iconEl = document.getElementById('timer-topbar-icon');
  const modal = document.getElementById('timer-modal');
  const closeBtn = document.getElementById('timer-modal-close');
  const closeIconEl = document.getElementById('timer-close-icon');
  const saveBtn = document.getElementById('timer-save');
  const stopBtn = document.getElementById('timer-stop');
  const startInput = document.getElementById('timer-start');
  const endInput = document.getElementById('timer-end');
  const pomodoroChk = document.getElementById('timer-pomodoro');

  if (iconEl) iconEl.innerHTML = svg('timer');
  if (closeIconEl) closeIconEl.innerHTML = svg('close');

  function openModal() {
    if (!modal) return;
    modal.hidden = false;
    const cfg = store.get().sessionConfig;
    if (cfg) {
      if (startInput) startInput.value = cfg.start || '';
      if (endInput) endInput.value = cfg.end || '';
      if (pomodoroChk) pomodoroChk.checked = cfg.pomodoro || false;
    }
    const active = !!(store.get().sessionConfig && store.get().sessionConfig.start);
    if (stopBtn) stopBtn.hidden = !active;
    if (saveBtn) saveBtn.textContent = active ? 'بروزرسانی سشن' : 'فعال کردن سشن';
  }

  function closeModal() {
    if (modal) modal.hidden = true;
  }

  if (topbarBtn) topbarBtn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (modal) modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const start = startInput ? startInput.value : '';
      const end = endInput ? endInput.value : '';
      if (!start || !end) return;
      const pomodoro = pomodoroChk ? pomodoroChk.checked : false;
      store.set({ sessionConfig: { start, end, pomodoro } });
      clearAllIntervals();
      sessionInterval = setInterval(() => updateSessionUI(store), 1000);
      updateSessionUI(store);
      if (pomodoro) startPomodoro(store);
      closeModal();
    });
  }

  if (stopBtn) {
    stopBtn.addEventListener('click', () => {
      store.set({ sessionConfig: null });
      clearAllIntervals();
      const bar = document.getElementById('session-bar');
      if (bar) bar.hidden = true;
      const countdown = document.getElementById('timer-countdown');
      if (countdown) countdown.hidden = true;
      closeModal();
    });
  }

  // Pomodoro overlay buttons
  const pomoYes = document.getElementById('pomo-yes');
  const pomoNo = document.getElementById('pomo-no');
  const pomoClose = document.getElementById('pomo-close');
  if (pomoYes) pomoYes.addEventListener('click', hidePomodoroOverlay);
  if (pomoNo) pomoNo.addEventListener('click', hidePomodoroOverlay);
  if (pomoClose) pomoClose.addEventListener('click', hidePomodoroOverlay);

  // Restore session on load
  const cfg = store.get().sessionConfig;
  if (cfg && cfg.start && cfg.end) {
    const now = new Date();
    const end = parseTime(cfg.end);
    if (end && end > now) {
      sessionInterval = setInterval(() => updateSessionUI(store), 1000);
      updateSessionUI(store);
      if (cfg.pomodoro) startPomodoro(store);
    } else {
      store.set({ sessionConfig: null });
    }
  }
}
