/* Feature 7: Inline Trading Calculator — Lot Size, Pip Value, Margin */

const PAIRS = ['EURUSD', 'GBPUSD', 'XAUUSD', 'USDJPY', 'USDCAD', 'USDCHF', 'AUDUSD'];
const LEVERAGE_OPTIONS = [10, 50, 100, 200, 500, 1000];

let history = []; // max 5, session only
let currentTab = 'lotsize';

const TABS = {
  lotsize: renderLotSize,
  pipvalue: renderPipValue,
  margin: renderMargin
};

function addHistory(label) {
  history.unshift(label);
  if (history.length > 5) history.pop();
  renderHistory();
}

function renderHistory() {
  const el = document.getElementById('calc-history');
  if (!el) return;
  if (!history.length) { el.innerHTML = ''; return; }
  el.innerHTML = '<div class="calc-history-title">تاریخچه محاسبات</div>' +
    history.map(h => '<div class="calc-hist-item">' + h + '</div>').join('');
}

function pairOpts() {
  return PAIRS.map(p => '<option value="' + p + '">' + p + '</option>').join('');
}

function leverageOpts() {
  return LEVERAGE_OPTIONS.map(l => '<option value="' + l + '">۱:' + l + '</option>').join('');
}

function renderLotSize() {
  const body = document.getElementById('calc-body');
  if (!body) return;
  body.innerHTML =
    '<div class="calc-field"><label>موجودی حساب (دلار)</label><input type="number" id="c-balance" placeholder="10000" min="1" step="1"></div>' +
    '<div class="calc-field"><label>ریسک (%)</label><input type="number" id="c-risk" placeholder="1" min="0.1" max="100" step="0.1" value="1"></div>' +
    '<div class="calc-field"><label>حد ضرر (پیپ)</label><input type="number" id="c-sl" placeholder="50" min="1" step="1"></div>' +
    '<div class="calc-field"><label>جفت‌ارز</label><select id="c-pair">' + pairOpts() + '</select></div>' +
    '<div class="calc-result" id="c-result">' +
      '<div class="calc-res-row"><span class="calc-res-label">حجم معامله</span><span class="calc-res-val" id="c-lot">—</span></div>' +
      '<div class="calc-res-row"><span class="calc-res-label">مقدار ریسک</span><span class="calc-res-val" id="c-risk-usd">—</span></div>' +
    '</div>' +
    '<button class="calc-reset" id="c-reset">پاک کردن</button>';

  function calc() {
    const balance = parseFloat(document.getElementById('c-balance')?.value) || 0;
    const risk = parseFloat(document.getElementById('c-risk')?.value) || 1;
    const sl = parseFloat(document.getElementById('c-sl')?.value) || 0;
    const pair = document.getElementById('c-pair')?.value || 'EURUSD';
    if (!balance || !sl) return;
    const riskAmt = balance * (risk / 100);
    const pipVal = pair === 'USDJPY' ? 1 : 10;
    const lot = riskAmt / (sl * pipVal);
    const lotEl = document.getElementById('c-lot');
    const rUsdEl = document.getElementById('c-risk-usd');
    if (lotEl) lotEl.textContent = lot.toFixed(2) + ' لات';
    if (rUsdEl) rUsdEl.textContent = '$' + riskAmt.toFixed(2);
    addHistory('لات‌سایز: ' + lot.toFixed(2) + ' | ریسک: $' + riskAmt.toFixed(2));
  }

  body.querySelectorAll('input, select').forEach(el => el.addEventListener('input', calc));
  const resetBtn = document.getElementById('c-reset');
  if (resetBtn) resetBtn.addEventListener('click', () => {
    body.querySelectorAll('input').forEach(i => { i.value = ''; });
    const lotEl = document.getElementById('c-lot');
    const rUsdEl = document.getElementById('c-risk-usd');
    if (lotEl) lotEl.textContent = '—';
    if (rUsdEl) rUsdEl.textContent = '—';
  });
}

function renderPipValue() {
  const body = document.getElementById('calc-body');
  if (!body) return;
  body.innerHTML =
    '<div class="calc-field"><label>جفت‌ارز</label><select id="c-pair2">' + pairOpts() + '</select></div>' +
    '<div class="calc-field"><label>حجم (لات)</label><input type="number" id="c-lot2" placeholder="1" min="0.01" step="0.01" value="1"></div>' +
    '<div class="calc-field"><label>نرخ جاری (اختیاری)</label><input type="number" id="c-rate" placeholder="مثلاً 1.0800" step="any" dir="ltr"></div>' +
    '<div class="calc-result" id="c-result">' +
      '<div class="calc-res-row"><span class="calc-res-label">ارزش ۱ پیپ</span><span class="calc-res-val" id="pv-1">—</span></div>' +
      '<div class="calc-res-row"><span class="calc-res-label">ارزش ۱۰ پیپ</span><span class="calc-res-val" id="pv-10">—</span></div>' +
      '<div class="calc-res-row"><span class="calc-res-label">ارزش ۵۰ پیپ</span><span class="calc-res-val" id="pv-50">—</span></div>' +
      '<div class="calc-res-row"><span class="calc-res-label">ارزش ۱۰۰ پیپ</span><span class="calc-res-val" id="pv-100">—</span></div>' +
    '</div>' +
    '<button class="calc-reset" id="c-reset">پاک کردن</button>';

  function calc() {
    const pair = document.getElementById('c-pair2')?.value || 'EURUSD';
    const lot = parseFloat(document.getElementById('c-lot2')?.value) || 1;
    const rate = parseFloat(document.getElementById('c-rate')?.value) || null;
    let pip1;
    if (pair === 'USDJPY') pip1 = lot * 1000 / (rate || 150);
    else if (pair === 'XAUUSD') pip1 = lot * 10;
    else pip1 = lot * 10;
    const fmt = v => '$' + v.toFixed(2);
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = fmt(val); };
    set('pv-1', pip1); set('pv-10', pip1 * 10); set('pv-50', pip1 * 50); set('pv-100', pip1 * 100);
    addHistory('پیپ‌ولیو: $' + pip1.toFixed(2) + '/pip × ' + lot + ' لات');
  }

  body.querySelectorAll('input, select').forEach(el => el.addEventListener('input', calc));
  calc();
  const resetBtn = document.getElementById('c-reset');
  if (resetBtn) resetBtn.addEventListener('click', () => {
    const lot2 = document.getElementById('c-lot2'); if (lot2) lot2.value = '1';
    const rate = document.getElementById('c-rate'); if (rate) rate.value = '';
    calc();
  });
}

function renderMargin() {
  const body = document.getElementById('calc-body');
  if (!body) return;
  body.innerHTML =
    '<div class="calc-field"><label>حجم (لات)</label><input type="number" id="c-lot3" placeholder="1" min="0.01" step="0.01"></div>' +
    '<div class="calc-field"><label>لوریج</label><select id="c-lev">' + leverageOpts() + '</select></div>' +
    '<div class="calc-field"><label>جفت‌ارز</label><select id="c-pair3">' + pairOpts() + '</select></div>' +
    '<div class="calc-field"><label>موجودی حساب (اختیاری)</label><input type="number" id="c-bal3" placeholder="10000" step="1"></div>' +
    '<div class="calc-result" id="c-result">' +
      '<div class="calc-res-row"><span class="calc-res-label">مارجین مورد نیاز</span><span class="calc-res-val" id="m-required">—</span></div>' +
      '<div class="calc-res-row"><span class="calc-res-label">مارجین آزاد</span><span class="calc-res-val" id="m-free">—</span></div>' +
    '</div>' +
    '<button class="calc-reset" id="c-reset">پاک کردن</button>';

  function calc() {
    const lot = parseFloat(document.getElementById('c-lot3')?.value) || 0;
    const lev = parseInt(document.getElementById('c-lev')?.value) || 100;
    const bal = parseFloat(document.getElementById('c-bal3')?.value) || null;
    const pair = document.getElementById('c-pair3')?.value || 'EURUSD';
    if (!lot) return;
    const contractSize = 100000;
    const price = pair === 'XAUUSD' ? 2300 : pair === 'USDJPY' ? 1 : 1.08;
    const margin = (lot * contractSize * price) / lev;
    const reqEl = document.getElementById('m-required');
    const freeEl = document.getElementById('m-free');
    if (reqEl) reqEl.textContent = '$' + margin.toFixed(2);
    if (freeEl) freeEl.textContent = bal ? '$' + Math.max(0, bal - margin).toFixed(2) : '—';
    addHistory('مارجین: $' + margin.toFixed(2) + ' | لوریج ۱:' + lev);
  }

  body.querySelectorAll('input, select').forEach(el => el.addEventListener('input', calc));
  const resetBtn = document.getElementById('c-reset');
  if (resetBtn) resetBtn.addEventListener('click', () => {
    body.querySelectorAll('input').forEach(i => { i.value = ''; });
    const reqEl = document.getElementById('m-required'); if (reqEl) reqEl.textContent = '—';
    const freeEl = document.getElementById('m-free'); if (freeEl) freeEl.textContent = '—';
  });
}

export function initCalculator() {
  const fab = document.getElementById('calc-fab');
  const panel = document.getElementById('calc-panel');
  const closeBtn = document.getElementById('calc-close');

  if (fab) fab.addEventListener('click', () => {
    if (!panel) return;
    panel.hidden = !panel.hidden;
    if (!panel.hidden) {
      currentTab = 'lotsize';
      syncTabs();
      renderLotSize();
      renderHistory();
    }
  });

  if (closeBtn) closeBtn.addEventListener('click', () => { if (panel) panel.hidden = true; });

  // Make panel draggable
  const calcHead = document.querySelector('.calc-head');
  if (calcHead && panel) {
    let dragging = false, ox = 0, oy = 0;
    calcHead.style.cursor = 'move';
    calcHead.addEventListener('mousedown', e => {
      dragging = true;
      const rect = panel.getBoundingClientRect();
      ox = e.clientX - rect.left;
      oy = e.clientY - rect.top;
      e.preventDefault();
    });
    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
      panel.style.left = (e.clientX - ox) + 'px';
      panel.style.top = (e.clientY - oy) + 'px';
    });
    document.addEventListener('mouseup', () => { dragging = false; });
  }

  const tabsEl = document.getElementById('calc-tabs');
  if (tabsEl) {
    tabsEl.querySelectorAll('.calc-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        currentTab = btn.dataset.tab;
        syncTabs();
        if (TABS[currentTab]) TABS[currentTab]();
      });
    });
  }

  function syncTabs() {
    document.querySelectorAll('.calc-tab').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === currentTab);
    });
  }
}
