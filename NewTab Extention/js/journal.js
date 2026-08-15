/* ===================================================================
   ایران بروکر — ژورنال معاملاتی (js/journal.js)  v1.0
   Vanilla JS · localStorage · بدون کتابخانه خارجی · RTL
   همه‌ی DOM از همین فایل ساخته می‌شود؛ تنها وابستگی، CSS در newtab.css
   =================================================================== */
(function () {
  'use strict';

  /* ════════════════════════ ثابت‌ها ════════════════════════ */
  var SK = 'ib_journal_v1';

  var SYMBOLS = [
    'EURUSD','GBPUSD','USDJPY','USDCHF','AUDUSD','USDCAD','NZDUSD',
    'EURGBP','EURJPY','GBPJPY','XAUUSD','XAGUSD','USOIL','UKOIL',
    'US30','US100','GER40','BTCUSD','ETHUSD',
    'BTC','ETH','BNB','SOL','XRP','USDT','ADA','DOGE','TRX',
    'USDT/TMN','طلا ۱۸ عیار','دلار آزاد'
  ];

  var EMOTIONS = [
    { v:'calm',      label:'آرام',       emoji:'😌' },
    { v:'anxious',   label:'نگران',      emoji:'😟' },
    { v:'excited',   label:'هیجان‌زده',  emoji:'🤩' },
    { v:'tired',     label:'خسته',       emoji:'😴' },
    { v:'confident', label:'مطمئن',      emoji:'😎' },
    { v:'fearful',   label:'ترسیده',     emoji:'😨' }
  ];

  var FLAGS = [
    { k:'fomo',      label:'FOMO' },
    { k:'revenge',   label:'انتقام' },
    { k:'impulsive', label:'عجول' },
    { k:'oversize',  label:'حجم اشتباه' },
    { k:'earlyExit', label:'خروج زود' },
    { k:'lateEntry', label:'ورود دیر' }
  ];

  var TIMEFRAMES = ['M1','M5','M15','M30','H1','H4','D1','W1'];
  var MARKETS = [
    { v:'forex', label:'فارکس' }, { v:'crypto', label:'کریپتو' },
    { v:'stock', label:'سهام' }, { v:'gold', label:'طلا' },
    { v:'commodity', label:'کالا' }
  ];
  var SESSIONS = {
    sydney:'سیدنی', tokyo:'توکیو', london:'لندن', newyork:'نیویورک',
    'overlap-london-tokyo':'هم‌پوشانی لندن-توکیو',
    'overlap-london-ny':'هم‌پوشانی لندن-نیویورک', overlap:'هم‌پوشانی'
  };
  var MOODS = [
    { v:'great', label:'عالی', emoji:'🌟' }, { v:'good', label:'خوب', emoji:'😊' },
    { v:'neutral', label:'معمولی', emoji:'😐' }, { v:'bad', label:'بد', emoji:'😔' },
    { v:'terrible', label:'بسیار بد', emoji:'😤' }
  ];
  var WEEKDAYS_FA = ['یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنج‌شنبه','جمعه','شنبه'];
  // JS getDay(): 0=Sun ... 6=Sat

  var DEFAULTS = {
    trades: [], playbook: [], dailyNotes: [],
    accountBalance: 10000,
    settings: {
      defaultLotSize: 0.1,
      currency: 'USD',
      riskPerTrade: 1,
      favSymbols: ['EURUSD','XAUUSD','BTCUSD'],
      showBadge: true,
      dailyReminder: true,
      compactTable: false,
      hiddenCols: [],
      pipsPerLot: { 'EURUSD':10,'GBPUSD':10,'USDJPY':9.09,'XAUUSD':10,'default':10 }
    }
  };

  /* ════════════════════════ DATA LAYER ════════════════════════ */
  var DB = null;

  function deepDefault(saved) {
    var out = JSON.parse(JSON.stringify(DEFAULTS));
    if (!saved || typeof saved !== 'object') return out;
    if (Array.isArray(saved.trades)) out.trades = saved.trades;
    if (Array.isArray(saved.playbook)) out.playbook = saved.playbook;
    if (Array.isArray(saved.dailyNotes)) out.dailyNotes = saved.dailyNotes;
    if (typeof saved.accountBalance === 'number') out.accountBalance = saved.accountBalance;
    if (saved.settings && typeof saved.settings === 'object') {
      for (var k in saved.settings) {
        if (Object.prototype.hasOwnProperty.call(saved.settings, k)) out.settings[k] = saved.settings[k];
      }
    }
    return out;
  }

  function load() {
    var raw = {};
    try { raw = JSON.parse(localStorage.getItem(SK) || '{}'); } catch (e) {}
    DB = deepDefault(raw);
    return DB;
  }

  function save() {
    try {
      localStorage.setItem(SK, JSON.stringify(DB));
      return true;
    } catch (e) {
      // Quota exceeded — try trimming screenshots from oldest trades, keep trade data
      if (trimScreenshots()) {
        try { localStorage.setItem(SK, JSON.stringify(DB));
          toast('فضای ذخیره‌سازی پر شد — تصاویر قدیمی حذف شدند', 'warn');
          return true;
        } catch (e2) {}
      }
      toast('خطا: فضای ذخیره‌سازی پر است. لطفاً backup بگیرید و معاملات قدیمی را پاک کنید.', 'error');
      return false;
    }
  }

  function trimScreenshots() {
    var sorted = DB.trades.slice().sort(function (a, b) { return (a.createdAt||0) - (b.createdAt||0); });
    var trimmed = false;
    for (var i = 0; i < sorted.length; i++) {
      if (sorted[i].screenshotBase64) { sorted[i].screenshotBase64 = null; trimmed = true; }
      if (i >= Math.ceil(sorted.length / 2)) break; // trim oldest half max
    }
    return trimmed;
  }

  function storageUsagePercent() {
    var bytes = 0;
    try { bytes = (localStorage.getItem(SK) || '').length * 2; } catch (e) {}
    return Math.min(100, (bytes / (5 * 1024 * 1024)) * 100);
  }

  function uuid() {
    if (window.crypto && crypto.randomUUID) { try { return crypto.randomUUID(); } catch (e) {} }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0, v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function addTrade(t) { DB.trades.push(t); save(); }
  function updateTrade(id, updates) {
    var t = DB.trades.find(function (x) { return x.id === id; });
    if (t) { for (var k in updates) t[k] = updates[k]; t.updatedAt = Date.now(); save(); }
    return t;
  }
  function deleteTrade(id) {
    DB.trades = DB.trades.filter(function (x) { return x.id !== id; });
    save();
  }
  function getDailyNote(date) {
    return DB.dailyNotes.find(function (n) { return n.date === date; }) || null;
  }
  function saveDailyNote(date, note) {
    var existing = getDailyNote(date);
    if (existing) { for (var k in note) existing[k] = note[k]; }
    else { note.date = date; DB.dailyNotes.push(note); }
    save();
  }

  /* ════════════════════════ HELPERS ════════════════════════ */
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function nowTimeStr() { var d = new Date(); return pad(d.getHours()) + ':' + pad(d.getMinutes()); }

  // تبدیل ارقام فارسی/عربی به انگلیسی (و جداکننده اعشار) تا محاسبات درست کار کنند
  var FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹', AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
  function faToEn(s) {
    if (s == null) return s;
    s = String(s);
    var out = '';
    for (var i = 0; i < s.length; i++) {
      var ch = s[i], fi = FA_DIGITS.indexOf(ch), ai = AR_DIGITS.indexOf(ch);
      if (fi >= 0) out += fi;
      else if (ai >= 0) out += ai;
      else if (ch === '٫' || ch === '،' || ch === '٬') out += (ch === '٫' ? '.' : ''); // اعشار عربی → نقطه، جداکننده هزارگان → حذف
      else out += ch;
    }
    return out;
  }
  function num(v) { var n = parseFloat(faToEn(v)); return isNaN(n) ? 0 : n; }
  function isNum(v) { v = faToEn(v); return v !== '' && v != null && !isNaN(parseFloat(v)); }

  function fmtMoney(v, dp) {
    if (v == null || isNaN(v)) return '—';
    dp = dp == null ? 2 : dp;
    var sign = v < 0 ? '-' : (v > 0 ? '+' : '');
    var s = Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
    return sign + '$' + s;
  }
  function fmtNum(v, dp) {
    if (v == null || isNaN(v)) return '—';
    return Number(v).toLocaleString('en-US', { maximumFractionDigits: dp == null ? 2 : dp });
  }
  function pnlClass(v) { return v > 0 ? 'jr-pos' : (v < 0 ? 'jr-neg' : ''); }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
    });
  }

  function $id(id) { return document.getElementById(id); }
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function el(html) { var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }

  function pipSizeFor(symbol) {
    var s = (symbol || '').toUpperCase();
    if (s.indexOf('JPY') >= 0) return 0.01;
    if (s.indexOf('XAU') >= 0) return 0.1;
    if (s.indexOf('XAG') >= 0) return 0.01;
    return 0.0001;
  }
  function pipValueFor(symbol) {
    var map = DB.settings.pipsPerLot || {};
    return map[(symbol || '').toUpperCase()] || map[symbol] || map.default || 10;
  }

  function detectSession(timeStr) {
    if (!timeStr) return '';
    var h = parseInt(String(timeStr).split(':')[0], 10);
    if (isNaN(h)) return '';
    if (h >= 7 && h < 12) return 'overlap-london-tokyo';
    if (h >= 12 && h < 17) return 'overlap-london-ny';
    if (h >= 12 && h < 21) return 'newyork';
    if (h >= 7 && h < 16) return 'london';
    if (h >= 0 && h < 9) return 'tokyo';
    return 'sydney';
  }

  function tsOf(date, time) {
    if (!date) return null;
    var t = new Date(date + 'T' + (time || '00:00') + ':00');
    return isNaN(t.getTime()) ? null : t.getTime();
  }

  /* ════════════════════════ ANALYTICS ════════════════════════ */
  var Analytics = {
    calcTradeMetrics: function (t) {
      var pipSize = pipSizeFor(t.symbol);
      var pipVal = pipValueFor(t.symbol);
      var lot = num(t.lotSize) || 0;
      var entry = num(t.entryPrice), exit = num(t.exitPrice);
      var sl = num(t.stopLoss), tp = num(t.takeProfit);
      var dir = t.direction === 'short' ? -1 : 1;
      var bal = DB.accountBalance || 0;

      // P&L (only for closed trades). pnlManual keeps the supplied amount (e.g. MT4 import)
      // but pips are still derived from prices when available.
      if (t.status === 'closed' && isNum(t.exitPrice)) {
        if (isNum(t.entryPrice)) t.pnlPips = ((exit - entry) * dir) / pipSize;
        if (!t.pnlManual) t.pnlAmount = (t.pnlPips || 0) * pipVal * lot - num(t.commission);
        t.pnlPercent = bal ? (t.pnlAmount / bal) * 100 : 0;
      } else {
        if (!t.pnlManual) { t.pnlPips = 0; t.pnlAmount = 0; }
        t.pnlPercent = 0;
      }

      // Risk
      if (isNum(t.stopLoss) && isNum(t.entryPrice)) {
        var riskPips = Math.abs(entry - sl) / pipSize;
        t.riskAmount = riskPips * pipVal * lot;
        t.riskPercent = bal ? (t.riskAmount / bal) * 100 : 0;
        // Planned R:R
        if (isNum(t.takeProfit)) {
          var rewardPips = Math.abs(tp - entry) / pipSize;
          t.rrPlanned = riskPips ? rewardPips / riskPips : 0;
        }
        // Actual R multiple
        if (t.status === 'closed' && t.riskAmount) t.rrActual = t.pnlAmount / t.riskAmount;
        else t.rrActual = 0;
      } else { t.riskAmount = 0; t.riskPercent = 0; t.rrPlanned = t.rrPlanned || 0; t.rrActual = 0; }

      // Duration
      var a = tsOf(t.entryDate, t.entryTime), b = tsOf(t.exitDate, t.exitTime);
      if (a && b && b >= a) t.durationMinutes = Math.round((b - a) / 60000);
      return t;
    },

    closed: function (trades) { return trades.filter(function (t) { return t.status === 'closed'; }); },

    portfolioStats: function (trades) {
      var cl = Analytics.closed(trades);
      var wins = cl.filter(function (t) { return t.pnlAmount > 0; });
      var losses = cl.filter(function (t) { return t.pnlAmount < 0; });
      var grossWin = wins.reduce(function (s, t) { return s + t.pnlAmount; }, 0);
      var grossLoss = losses.reduce(function (s, t) { return s + t.pnlAmount; }, 0);
      var total = cl.reduce(function (s, t) { return s + t.pnlAmount; }, 0);
      var winRate = cl.length ? (wins.length / cl.length) * 100 : 0;
      var avgWin = wins.length ? grossWin / wins.length : 0;
      var avgLoss = losses.length ? grossLoss / losses.length : 0;
      var avgRR = cl.length ? cl.reduce(function (s, t) { return s + (t.rrActual || 0); }, 0) / cl.length : 0;
      var pf = grossLoss !== 0 ? grossWin / Math.abs(grossLoss) : (grossWin > 0 ? Infinity : 0);
      var best = cl.length ? Math.max.apply(null, cl.map(function (t) { return t.pnlAmount; })) : 0;
      var worst = cl.length ? Math.min.apply(null, cl.map(function (t) { return t.pnlAmount; })) : 0;
      var expectancy = (winRate / 100) * avgWin + ((1 - winRate / 100) * avgLoss); // avgLoss negative
      return {
        count: cl.length, wins: wins.length, losses: losses.length,
        winRate: winRate, avgWin: avgWin, avgLoss: avgLoss, avgRR: avgRR,
        profitFactor: pf, best: best, worst: worst, total: total,
        maxDD: Analytics.calcMaxDrawdown(cl), streak: Analytics.calcStreak(cl),
        expectancy: expectancy
      };
    },

    calcMaxDrawdown: function (trades) {
      var sorted = trades.slice().sort(function (a, b) {
        return (tsOf(a.exitDate, a.exitTime) || a.createdAt) - (tsOf(b.exitDate, b.exitTime) || b.createdAt);
      });
      var equity = 0, peak = 0, maxDD = 0;
      sorted.forEach(function (t) {
        equity += t.pnlAmount;
        if (equity > peak) peak = equity;
        var dd = peak - equity;
        if (dd > maxDD) maxDD = dd;
      });
      return maxDD;
    },

    calcStreak: function (trades) {
      var sorted = trades.slice().sort(function (a, b) { return b.createdAt - a.createdAt; });
      if (!sorted.length) return { type: null, count: 0 };
      var isWin = sorted[0].pnlAmount >= 0;
      var count = 0;
      for (var i = 0; i < sorted.length; i++) {
        if ((sorted[i].pnlAmount >= 0) === isWin) count++; else break;
      }
      return { type: isWin ? 'win' : 'loss', count: count };
    },

    buildEquityCurve: function (trades, startBalance) {
      var sorted = Analytics.closed(trades).slice().sort(function (a, b) {
        return (tsOf(a.exitDate, a.exitTime) || a.createdAt) - (tsOf(b.exitDate, b.exitTime) || b.createdAt);
      });
      var equity = startBalance;
      return sorted.map(function (t) { equity += t.pnlAmount; return { date: t.exitDate, equity: equity, trade: t }; });
    },

    groupStats: function (cl, keyFn) {
      var map = {};
      cl.forEach(function (t) {
        var k = keyFn(t); if (k == null || k === '') k = '—';
        if (!map[k]) map[k] = [];
        map[k].push(t);
      });
      return Object.keys(map).map(function (k) {
        var arr = map[k];
        var wins = arr.filter(function (t) { return t.pnlAmount > 0; });
        var pnls = arr.map(function (t) { return t.pnlAmount; });
        var total = pnls.reduce(function (s, v) { return s + v; }, 0);
        return {
          key: k, count: arr.length,
          winRate: arr.length ? (wins.length / arr.length) * 100 : 0,
          avgRR: arr.length ? arr.reduce(function (s, t) { return s + (t.rrActual || 0); }, 0) / arr.length : 0,
          pnl: total, avgPnl: arr.length ? total / arr.length : 0,
          best: pnls.length ? Math.max.apply(null, pnls) : 0,
          worst: pnls.length ? Math.min.apply(null, pnls) : 0
        };
      }).sort(function (a, b) { return b.pnl - a.pnl; });
    },

    rrHistogram: function (cl) {
      var buckets = [
        { label:'۰–۰.۵', min:0, max:0.5 }, { label:'۰.۵–۱', min:0.5, max:1 },
        { label:'۱–۱.۵', min:1, max:1.5 }, { label:'۱.۵–۲', min:1.5, max:2 },
        { label:'۲–۳', min:2, max:3 }, { label:'+۳', min:3, max:Infinity }
      ];
      return buckets.map(function (b) {
        var inb = cl.filter(function (t) { var r = Math.abs(t.rrActual || 0); return r >= b.min && r < b.max; });
        return { label: b.label, win: inb.filter(function (t) { return t.pnlAmount > 0; }).length,
          loss: inb.filter(function (t) { return t.pnlAmount <= 0; }).length };
      });
    },

    dayPnl: function (cl) {
      var map = {};
      cl.forEach(function (t) {
        var d = t.exitDate || t.entryDate; if (!d) return;
        map[d] = (map[d] || 0) + t.pnlAmount;
      });
      return map;
    },

    generateInsight: function (trades) {
      var cl = Analytics.closed(trades);
      if (cl.length < 3) return null;
      function wr(a) { return a.length ? (a.filter(function (t) { return t.pnlAmount > 0; }).length / a.length) * 100 : 0; }
      function avg(a) { return a.length ? a.reduce(function (s, t) { return s + t.pnlAmount; }, 0) / a.length : 0; }
      var fomo = cl.filter(function (t) { return t.flags && t.flags.fomo; });
      var plan = cl.filter(function (t) { return t.followedPlan; });
      var msgs = [];
      if (fomo.length >= 3 && wr(fomo) < 40)
        msgs.push({ type:'warn', text:'⚠️ معاملات FOMO تو به‌طور میانگین ' + fmtMoney(avg(fomo)) + ' نتیجه داشتن (نرخ موفقیت ' + Math.round(wr(fomo)) + '٪). دفعه بعد که حس کردی داری از بازار جا می‌مونی، صبر کن.' });
      var revenge = cl.filter(function (t) { return t.flags && t.flags.revenge; });
      if (revenge.length >= 2 && avg(revenge) < 0)
        msgs.push({ type:'warn', text:'🚫 معاملات انتقامی برات گرون تموم شدن (میانگین ' + fmtMoney(avg(revenge)) + '). بعد از یه ضرر، از معامله‌ی فوری پرهیز کن.' });
      if (plan.length >= 3 && (wr(plan) - wr(cl)) > 15)
        msgs.push({ type:'good', text:'✅ وقتی طبق پلن معامله می‌کنی نرخ موفقیتت ' + Math.round(wr(plan) - wr(cl)) + '٪ بالاتره. به پلنت پایبند بمون.' });
      var oversize = cl.filter(function (t) { return t.flags && t.flags.oversize; });
      if (oversize.length >= 2 && avg(oversize) < 0)
        msgs.push({ type:'warn', text:'📉 وقتی حجم بیش از حد می‌گیری، نتیجه‌ت میانگین ' + fmtMoney(avg(oversize)) + ' بوده. مدیریت ریسک رو جدی بگیر.' });
      return msgs.length ? msgs : [{ type:'good', text:'👍 الگوی پرریسک تکرارشونده‌ای پیدا نشد. به ثبت دقیق ادامه بده.' }];
    },

    psychFlagStats: function (trades) {
      var cl = Analytics.closed(trades);
      return FLAGS.map(function (f) {
        var arr = cl.filter(function (t) { return t.flags && t.flags[f.k]; });
        var wins = arr.filter(function (t) { return t.pnlAmount > 0; });
        var total = arr.reduce(function (s, t) { return s + t.pnlAmount; }, 0);
        return { label: f.label, count: arr.length,
          winRate: arr.length ? (wins.length / arr.length) * 100 : 0,
          avgPnl: arr.length ? total / arr.length : 0 };
      }).filter(function (r) { return r.count > 0; });
    },

    emotionStats: function (trades) {
      var cl = Analytics.closed(trades);
      return EMOTIONS.map(function (e) {
        var arr = cl.filter(function (t) { return t.preEmotion === e.v; });
        var wins = arr.filter(function (t) { return t.pnlAmount > 0; });
        var total = arr.reduce(function (s, t) { return s + t.pnlAmount; }, 0);
        return { label: e.label, emoji: e.emoji, count: arr.length,
          winRate: arr.length ? (wins.length / arr.length) * 100 : 0,
          avgPnl: arr.length ? total / arr.length : 0 };
      }).filter(function (r) { return r.count > 0; });
    },

    setupStats: function (setupName, trades) {
      var arr = Analytics.closed(trades).filter(function (t) { return t.setup === setupName; });
      var wins = arr.filter(function (t) { return t.pnlAmount > 0; });
      var total = arr.reduce(function (s, t) { return s + t.pnlAmount; }, 0);
      return {
        count: arr.length,
        winRate: arr.length ? Math.round((wins.length / arr.length) * 100) : 0,
        avgRR: arr.length ? arr.reduce(function (s, t) { return s + (t.rrActual || 0); }, 0) / arr.length : 0,
        pnl: total
      };
    }
  };

  /* ════════════════════════ IMPORT / EXPORT ════════════════════════ */
  function downloadFile(name, content, mime) {
    var blob = new Blob([content], { type: mime });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  var JournalIO = {
    exportCSV: function () {
      var headers = ['تاریخ','نماد','جهت','ورود','خروج','SL','TP','حجم','P&L پیپ','P&L دلار','R:R','ستاپ','یادداشت'];
      var rows = DB.trades.map(function (t) {
        return [t.entryDate || '', t.symbol || '', t.direction || '', t.entryPrice || '', t.exitPrice || '',
          t.stopLoss || '', t.takeProfit || '', t.lotSize || '', fmtNum(t.pnlPips, 1), fmtNum(t.pnlAmount, 2),
          fmtNum(t.rrActual, 2), t.setup || '', String(t.reasonEntry || '').replace(/[\r\n,]/g, ' ')];
      });
      var csv = [headers].concat(rows).map(function (r) {
        return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(',');
      }).join('\n');
      downloadFile('iranbroker-journal.csv', '﻿' + csv, 'text/csv;charset=utf-8');
    },

    exportJSON: function () {
      downloadFile('iranbroker-journal-backup.json', JSON.stringify(DB, null, 2), 'application/json');
    },

    importJSON: function (file, cb) {
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var data = JSON.parse(reader.result);
          var existingIds = {};
          DB.trades.forEach(function (t) { existingIds[t.id] = true; });
          var added = 0;
          (data.trades || []).forEach(function (t) {
            if (!t.id) t.id = uuid();
            if (!existingIds[t.id]) { Analytics.calcTradeMetrics(t); DB.trades.push(t); existingIds[t.id] = true; added++; }
          });
          (data.playbook || []).forEach(function (s) {
            if (!DB.playbook.some(function (x) { return x.id === s.id || x.name === s.name; })) DB.playbook.push(s);
          });
          (data.dailyNotes || []).forEach(function (n) {
            if (!DB.dailyNotes.some(function (x) { return x.date === n.date; })) DB.dailyNotes.push(n);
          });
          if (typeof data.accountBalance === 'number') DB.accountBalance = data.accountBalance;
          save();
          cb(null, added);
        } catch (e) { cb(e); }
      };
      reader.onerror = function () { cb(reader.error); };
      reader.readAsText(file);
    },

    parseMT4CSV: function (text) {
      function parseDate(s) {
        if (!s) return '';
        var m = String(s).trim().match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
        return m ? m[1] + '-' + pad(+m[2]) + '-' + pad(+m[3]) : '';
      }
      var lines = text.split(/\r?\n/).slice(1);
      var out = [];
      lines.forEach(function (line) {
        if (!line.trim()) return;
        var cols = line.split(',');
        if (cols.length < 13) return;
        var typeRaw = (cols[2] || '').toLowerCase();
        if (typeRaw.indexOf('buy') < 0 && typeRaw.indexOf('sell') < 0) return;
        var t = {
          id: uuid(), createdAt: Date.now(), updatedAt: Date.now(),
          symbol: (cols[0] || '').trim().toUpperCase(),
          marketType: 'forex',
          direction: typeRaw.indexOf('buy') >= 0 ? 'long' : 'short',
          status: 'closed',
          lotSize: num(cols[3]),
          entryDate: parseDate(cols[4]), entryTime: '',
          entryPrice: num(cols[5]), stopLoss: num(cols[6]), takeProfit: num(cols[7]),
          exitDate: parseDate(cols[8]), exitTime: '',
          exitPrice: num(cols[9]), commission: num(cols[10]),
          pnlAmount: num(cols[12]), pnlManual: true,
          flags: {}, tags: [], accountType: 'personal'
        };
        Analytics.calcTradeMetrics(t);
        out.push(t);
      });
      return out;
    }
  };

  /* ════════════════════════ UI: shell ════════════════════════ */
  var current = 'log';     // active tab
  var logMode = 'quick';   // quick | full
  var editingId = null;    // when editing in log tab
  var histState = { sortKey: 'entryDate', sortDir: -1, filters: {}, search: '' };
  var anRange = 'all';
  var calCursor = null;    // {y,m} for psychology calendar
  var heatCursor = null;   // for analytics heatmap

  var root = null, btn = null;

  function buildButton() {
    btn = $id('journal-btn');
    if (!btn) return;
    btn.innerHTML =
      '<span class="icon">' +
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
          '<rect x="3" y="9.5" width="3.4" height="7" rx=".7" fill="currentColor" opacity=".75"/>' +
          '<line x1="4.7" y1="6.6" x2="4.7" y2="9.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
          '<line x1="4.7" y1="16.5" x2="4.7" y2="19.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
          '<rect x="10.3" y="4.8" width="3.4" height="9.6" rx=".7" fill="currentColor"/>' +
          '<line x1="12" y1="2.4" x2="12" y2="4.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
          '<line x1="12" y1="14.4" x2="12" y2="17.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
          '<rect x="17.6" y="10.8" width="3.4" height="6" rx=".7" fill="currentColor" opacity=".75"/>' +
          '<line x1="19.3" y1="7.8" x2="19.3" y2="10.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
          '<line x1="19.3" y1="16.8" x2="19.3" y2="19.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
        '</svg>' +
      '</span>' +
      '<span class="jr-fab-dot" id="jr-fab-dot" hidden></span>';
    btn.addEventListener('click', open);
    refreshButton();
  }

  function refreshButton() {
    if (!btn) return;
    var dot = $id('jr-fab-dot');
    var st = DB.settings;
    var today = todayStr();
    var todays = DB.trades.filter(function (t) {
      var d = new Date(t.createdAt);
      return (d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())) === today;
    });

    dot.hidden = !(st.dailyReminder && todays.length === 0);
  }

  function buildShell() {
    root = el('<div class="jr-overlay" id="jr-overlay" hidden>' +
      '<div class="jr-panel" role="dialog" aria-modal="true" aria-label="ژورنال معاملاتی">' +
      '<div class="jr-head">' +
        '<div class="jr-brand"><div class="jr-logo">IB</div>' +
          '<div class="jr-titles"><div class="jr-title">ژورنال معاملاتی</div><div class="jr-sub">ایران بروکر · ثبت و تحلیل معاملات</div></div>' +
        '</div>' +
        '<div class="jr-head-actions">' +
          '<button class="jr-hbtn" id="jr-export-menu-btn" title="خروجی / پشتیبان">' +
            '<svg viewBox="0 0 20 20" fill="none"><path d="M10 3v9m0 0 3.2-3.2M10 12 6.8 8.8M4 14v2.5h12V14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
          '<button class="jr-hbtn" id="jr-settings-btn" title="تنظیمات ژورنال">' +
            '<svg viewBox="0 0 20 20" fill="none"><path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" stroke="currentColor" stroke-width="1.5"/><path d="M16.2 10c0-.3 0-.6-.1-.9l1.7-1.3a.4.4 0 0 0 .1-.5l-1.6-2.7a.4.4 0 0 0-.5-.1l-2 .8a6.7 6.7 0 0 0-1.6-.9L12 3a.4.4 0 0 0-.4-.3H8.4A.4.4 0 0 0 8 3l-.3 2.1a6.7 6.7 0 0 0-1.5.9l-2-.8a.4.4 0 0 0-.5.1L2.1 8a.4.4 0 0 0 .1.5l1.7 1.4c0 .3-.1.6-.1.9s0 .6.1.9L2.2 13a.4.4 0 0 0-.1.5l1.6 2.7c.1.2.3.2.5.1l2-.8c.5.3 1 .6 1.5.9l.3 2.2c0 .2.2.3.4.3h3.2c.2 0 .4-.1.4-.3l.3-2.2a6.7 6.7 0 0 0 1.5-.9l2 .8c.2.1.4 0 .5-.1l1.6-2.7a.4.4 0 0 0-.1-.5l-1.7-1.3c.1-.3.1-.6.1-.9Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
          '<button class="jr-hbtn jr-close" id="jr-close" aria-label="بستن">' +
            '<svg viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>' +
        '</div>' +
      '</div>' +
      '<nav class="jr-tabs" id="jr-tabs">' +
        tabBtn('log','ثبت معامله') + tabBtn('history','تاریخچه') + tabBtn('analytics','آمار') +
        tabBtn('psychology','روان‌شناسی') + tabBtn('playbook','پلی‌بوک') +
      '</nav>' +
      '<div class="jr-body" id="jr-body"></div>' +
      '</div>' +
      '<div class="jr-pop" id="jr-pop" hidden></div>' +
      '<div class="jr-toast-wrap" id="jr-toast-wrap"></div>' +
      '</div>');
    document.body.appendChild(root);

    $id('jr-close').addEventListener('click', close);
    root.addEventListener('mousedown', function (e) { if (e.target === root) close(); });
    $id('jr-tabs').addEventListener('click', function (e) {
      var b = e.target.closest('.jr-tab'); if (!b) return;
      switchTab(b.getAttribute('data-tab'));
    });
    $id('jr-export-menu-btn').addEventListener('click', openExportMenu);
    $id('jr-settings-btn').addEventListener('click', renderSettings);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && root && !root.hidden) {
        if (!$id('jr-pop').hidden) { closePop(); return; }
        close();
      }
    });

    // نرمال‌سازی زنده ارقام فارسی/عربی به انگلیسی روی فیلدهای عددی (.jr-num).
    // فاز capture تا قبل از شنونده‌های محاسبه (recalc) اجرا شود و مقدار درست خوانده شود.
    ['jr-body', 'jr-pop'].forEach(function (cid) {
      $id(cid).addEventListener('input', function (e) {
        var t = e.target;
        if (!t || !t.classList || !t.classList.contains('jr-num')) return;
        var conv = faToEn(t.value);
        if (conv !== t.value) {
          var pos = t.selectionStart;
          t.value = conv;
          try { t.setSelectionRange(pos, pos); } catch (_) {}
        }
      }, true);
    });
  }

  function tabBtn(id, label) {
    return '<button class="jr-tab' + (id === 'log' ? ' active' : '') + '" data-tab="' + id + '">' + label + '</button>';
  }

  function switchTab(name) {
    current = name;
    qsa('.jr-tab').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-tab') === name); });
    renderTab(name);
  }

  function renderTab(name) {
    var body = $id('jr-body');
    body.scrollTop = 0;
    if (name === 'log') renderLog();
    else if (name === 'history') renderHistory();
    else if (name === 'analytics') renderAnalytics();
    else if (name === 'psychology') renderPsychology();
    else if (name === 'playbook') renderPlaybook();
  }

  function open() {
    if (!root) buildShell();
    root.hidden = false;
    requestAnimationFrame(function () { root.classList.add('jr-visible'); });
    document.body.style.overflow = 'hidden';
    switchTab(current);
    var pct = storageUsagePercent();
    if (pct > 80) toast('فضای ذخیره‌سازی ' + Math.round(pct) + '٪ پر شده — توصیه می‌شود backup بگیرید.', 'warn');
  }

  function close() {
    if (!root) return;
    root.classList.remove('jr-visible');
    closePop();
    setTimeout(function () { root.hidden = true; }, 250);
    document.body.style.overflow = '';
    refreshButton();
  }

  /* ── toast & confirm ── */
  function toast(msg, type) {
    var wrap = $id('jr-toast-wrap'); if (!wrap) { console.warn(msg); return; }
    var t = el('<div class="jr-toast jr-toast-' + (type || 'info') + '">' + esc(msg) + '</div>');
    wrap.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('show'); });
    setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 300); }, 3600);
  }

  function confirmDialog(msg, onYes) {
    var pop = $id('jr-pop');
    pop.innerHTML = '';
    pop.appendChild(el('<div class="jr-confirm"><div class="jr-confirm-msg">' + esc(msg) + '</div>' +
      '<div class="jr-confirm-actions"><button class="jr-btn jr-btn-ghost" id="jr-cf-no">انصراف</button>' +
      '<button class="jr-btn jr-btn-danger" id="jr-cf-yes">حذف</button></div></div>'));
    pop.hidden = false;
    pop.classList.add('show');
    $id('jr-cf-no').addEventListener('click', closePop);
    $id('jr-cf-yes').addEventListener('click', function () { closePop(); onYes(); });
    pop.addEventListener('mousedown', function (e) { if (e.target === pop) closePop(); }, { once: true });
  }

  function openPop(node) {
    var pop = $id('jr-pop');
    pop.innerHTML = '';
    pop.appendChild(node);
    pop.hidden = false; pop.classList.add('show');
    pop.addEventListener('mousedown', function (e) { if (e.target === pop) closePop(); });
  }
  function closePop() { var pop = $id('jr-pop'); if (pop) { pop.classList.remove('show'); pop.hidden = true; pop.innerHTML = ''; } }

  /* ════════════════════════ TAB 1 — ثبت معامله ════════════════════════ */
  function renderLog() {
    var t = editingId ? DB.trades.find(function (x) { return x.id === editingId; }) : null;
    var d = t || {};
    var body = $id('jr-body');
    body.innerHTML =
      '<div class="jr-log-top">' +
        '<div class="jr-modeswitch">' +
          '<button class="jr-ms' + (logMode === 'quick' ? ' active' : '') + '" data-mode="quick">سریع</button>' +
          '<button class="jr-ms' + (logMode === 'full' ? ' active' : '') + '" data-mode="full">کامل</button>' +
        '</div>' +
        (editingId ? '<div class="jr-editing">در حال ویرایش معامله — <button class="jr-link" id="jr-cancel-edit">لغو</button></div>' : '') +
      '</div>' +
      '<form class="jr-form" id="jr-form" autocomplete="off"></form>';

    qsa('.jr-ms').forEach(function (b) {
      b.addEventListener('click', function () { logMode = b.getAttribute('data-mode'); renderLog(); });
    });
    if (editingId) $id('jr-cancel-edit').addEventListener('click', function () { editingId = null; renderLog(); });

    buildLogForm(d);
  }

  function field(label, inner, hint) {
    return '<label class="jr-field"><span class="jr-flabel">' + label + '</span>' + inner +
      (hint ? '<span class="jr-fhint" data-hint>' + hint + '</span>' : '') + '</label>';
  }

  function buildLogForm(d) {
    var form = $id('jr-form');
    var s = DB.settings;
    var setupOpts = DB.playbook.map(function (p) { return '<option value="' + esc(p.name) + '"' + (d.setup === p.name ? ' selected' : '') + '>' + esc(p.name) + '</option>'; }).join('');
    var html = '';

    // ── Core fields (both modes) ──
    html += '<div class="jr-grid">';
    html += field('نماد *', '<input class="jr-in" id="f-symbol" list="jr-symbols" value="' + esc(d.symbol || '') + '" placeholder="مثلاً EURUSD یا XAUUSD" title="نماد معامله — با تایپ، فهرست پیشنهادها باز می‌شود" autocomplete="off" />' +
      '<datalist id="jr-symbols">' + SYMBOLS.map(function (x) { return '<option value="' + esc(x) + '">'; }).join('') + '</datalist>' +
      '<span class="jr-price-chip" id="f-price-chip" hidden></span>');
    html += '<div class="jr-field"><span class="jr-flabel">جهت *</span><div class="jr-dir">' +
      '<button type="button" class="jr-dirbtn jr-long' + (d.direction === 'long' || !d.direction ? ' active' : '') + '" data-dir="long" title="معامله خرید — انتظار افزایش قیمت">خرید (Long)</button>' +
      '<button type="button" class="jr-dirbtn jr-short' + (d.direction === 'short' ? ' active' : '') + '" data-dir="short" title="معامله فروش — انتظار کاهش قیمت">فروش (Short)</button>' +
      '<input type="hidden" id="f-direction" value="' + esc(d.direction || 'long') + '"></div></div>';
    html += '</div>';

    html += '<div class="jr-grid jr-grid-3">';
    html += field('قیمت ورود *', numInput('f-entryPrice', d.entryPrice, d.symbol, 'مثلاً 1.08450', 'قیمتی که در آن وارد معامله شدید'));
    html += field('قیمت خروج', numInput('f-exitPrice', d.exitPrice, d.symbol, 'مثلاً 1.09120', 'قیمت بستن معامله (در صورت بسته بودن)'));
    html += field('حجم (لات)', '<input class="jr-in jr-num" id="f-lotSize" type="text" inputmode="decimal" autocomplete="off" value="' + (d.lotSize != null ? d.lotSize : s.defaultLotSize) + '" placeholder="مثلاً 0.1" title="حجم معامله به لات" />');
    html += '</div>';

    html += '<div class="jr-grid jr-grid-3">';
    html += field('حد ضرر (SL)', numInput('f-stopLoss', d.stopLoss, d.symbol, 'قیمت حد ضرر', 'قیمت حد ضرر — برای محاسبه ریسک و R:R'));
    html += field('حد سود (TP)', numInput('f-takeProfit', d.takeProfit, d.symbol, 'قیمت حد سود', 'قیمت حد سود — برای محاسبه R:R پلن‌شده'));
    html += field('کمیسیون ($)', '<input class="jr-in jr-num" id="f-commission" type="text" inputmode="decimal" autocomplete="off" value="' + (d.commission != null ? d.commission : '') + '" placeholder="مثلاً 3.5" title="کمیسیون و کارمزد به دلار" />');
    html += '</div>';

    html += '<div class="jr-rr-box" id="f-rrbox"></div>';

    // ── Full-only fields ──
    if (logMode === 'full' || editingId) {
      html += '<div class="jr-divider">جزئیات معامله</div>';
      html += '<div class="jr-grid jr-grid-2">';
      html += field('وضعیت', sel('f-status', [['open','باز'],['closed','بسته'],['cancelled','لغوشده']], d.status || 'closed', 'وضعیت معامله — باز، بسته یا لغوشده'));
      html += field('بازار', sel('f-marketType', MARKETS.map(function (m) { return [m.v, m.label]; }), d.marketType || 'forex', 'نوع بازار معامله'));
      html += '</div>';

      html += '<div class="jr-grid jr-grid-2">';
      html += field('تاریخ ورود', '<input class="jr-in" id="f-entryDate" type="date" value="' + (d.entryDate || todayStr()) + '" title="تاریخ ورود به معامله" />');
      html += field('ساعت ورود', '<input class="jr-in" id="f-entryTime" type="time" value="' + (d.entryTime || '') + '" title="ساعت ورود — سشن به‌طور خودکار تشخیص داده می‌شود" />');
      html += '</div>';
      html += '<div class="jr-grid jr-grid-2">';
      html += field('تاریخ خروج', '<input class="jr-in" id="f-exitDate" type="date" value="' + (d.exitDate || '') + '" title="تاریخ خروج از معامله" />');
      html += field('ساعت خروج', '<input class="jr-in" id="f-exitTime" type="time" value="' + (d.exitTime || '') + '" title="ساعت خروج — مدت معامله محاسبه می‌شود" />');
      html += '</div>';
      html += '<div class="jr-dur" id="f-dur"></div>';

      html += '<div class="jr-grid jr-grid-3">';
      html += field('ستاپ', '<input class="jr-in" id="f-setup" list="jr-setups" value="' + esc(d.setup || '') + '" placeholder="مثلاً breakout یا retest" title="استراتژی/ستاپ معامله — از پلی‌بوک یا متن آزاد" autocomplete="off" /><datalist id="jr-setups">' + setupOpts + '</datalist>');
      html += field('تایم‌فریم', sel('f-timeframe', [['','— انتخاب کنید —']].concat(TIMEFRAMES.map(function (x) { return [x, x]; })), d.timeframe || '', 'تایم‌فریم نمودار معامله'));
      html += field('سشن (خودکار)', sel('f-session', [['','— خودکار —']].concat(Object.keys(SESSIONS).map(function (k) { return [k, SESSIONS[k]]; })), d.session || '', 'سشن معاملاتی — از روی ساعت ورود تشخیص داده می‌شود'));
      html += '</div>';

      html += '<div class="jr-grid jr-grid-3">';
      html += field('هم‌سویی روند', sel('f-trendAlignment', [['with','هم‌سو'],['counter','خلاف روند'],['neutral','خنثی']], d.trendAlignment || 'with', 'جهت معامله نسبت به روند کلی بازار'));
      html += field('شرایط بازار', sel('f-marketCondition', [['trending','روندی'],['ranging','رنج'],['volatile','پرنوسان'],['news','خبری']], d.marketCondition || 'trending', 'شرایط بازار هنگام معامله'));
      html += field('تگ‌ها', '<input class="jr-in" id="f-tags" value="' + esc((d.tags || []).join(', ')) + '" placeholder="مثلاً scalp, news-play" title="برچسب‌های دلخواه — با کاما جدا کنید" autocomplete="off" />');
      html += '</div>';

      // Psychology
      html += '<div class="jr-divider">روان‌شناسی</div>';
      html += '<div class="jr-grid jr-grid-2">';
      html += '<div class="jr-field"><span class="jr-flabel">احساس قبل از معامله</span>' + emojiRow('preEmotion', d.preEmotion) + '</div>';
      html += '<div class="jr-field"><span class="jr-flabel">احساس بعد از معامله</span>' + emojiRow('postEmotion', d.postEmotion) + '</div>';
      html += '</div>';
      html += '<div class="jr-grid jr-grid-2">';
      html += field('اعتماد در ورود: <b id="f-ce-val">' + (d.confidenceEntry || 5) + '</b>/10', '<input class="jr-range" id="f-confidenceEntry" type="range" min="1" max="10" value="' + (d.confidenceEntry || 5) + '" title="میزان اطمینان هنگام ورود (۱=خیلی کم تا ۱۰=خیلی زیاد)" />');
      html += field('اعتماد در خروج: <b id="f-cx-val">' + (d.confidenceExit || 5) + '</b>/10', '<input class="jr-range" id="f-confidenceExit" type="range" min="1" max="10" value="' + (d.confidenceExit || 5) + '" title="میزان اطمینان هنگام خروج (۱=خیلی کم تا ۱۰=خیلی زیاد)" />');
      html += '</div>';
      var FLAG_TITLES = { fomo:'ترس از جا ماندن — ورود هیجانی بدون پلن', revenge:'معامله انتقامی پس از یک ضرر', impulsive:'ورود عجولانه و بدون تحلیل کافی', oversize:'حجم بیش از حد نسبت به ریسک مجاز', earlyExit:'خروج زودهنگام پیش از رسیدن به هدف', lateEntry:'ورود دیرهنگام پس از حرکت اصلی' };
      html += '<div class="jr-field"><span class="jr-flabel">پرچم‌های رفتاری</span><div class="jr-flags">' +
        FLAGS.map(function (f) { var on = d.flags && d.flags[f.k]; return '<button type="button" class="jr-flag' + (on ? ' active' : '') + '" data-flag="' + f.k + '" title="' + esc(FLAG_TITLES[f.k] || f.label) + '">' + f.label + '</button>'; }).join('') + '</div></div>';
      html += '<label class="jr-checkrow" title="اگر معامله دقیقاً طبق پلن انجام شد، تیک بزنید"><input type="checkbox" id="f-followedPlan"' + (d.followedPlan ? ' checked' : '') + '/> <span>طبق پلن معامله شد</span></label>';

      // Notes
      html += '<div class="jr-divider">یادداشت‌ها</div>';
      html += field('دلیل ورود', '<textarea class="jr-in jr-ta" id="f-reasonEntry" rows="2" placeholder="چرا وارد این معامله شدی؟ سیگنال و تأییدیه‌ها…" title="دلیل و منطق ورود به معامله">' + esc(d.reasonEntry || '') + '</textarea>');
      html += '<div class="jr-grid jr-grid-2">';
      html += field('دلیل خروج', '<textarea class="jr-in jr-ta" id="f-reasonExit" rows="2" placeholder="چرا و کجا از معامله خارج شدی؟" title="دلیل بستن معامله">' + esc(d.reasonExit || '') + '</textarea>');
      html += field('درس‌های آموخته', '<textarea class="jr-in jr-ta" id="f-lessonsLearned" rows="2" placeholder="چه درسی از این معامله گرفتی؟" title="درس‌ها و نکاتی که برای دفعه بعد باید رعایت کنی">' + esc(d.lessonsLearned || '') + '</textarea>');
      html += '</div>';

      // Screenshot
      html += '<div class="jr-field"><span class="jr-flabel">تصویر معامله</span>' +
        '<div class="jr-shot" id="f-shot-wrap">' +
          (d.screenshotBase64 ? '<img class="jr-shot-img" id="f-shot-img" src="' + d.screenshotBase64 + '" />' : '') +
          '<label class="jr-shot-btn" title="تصویر چارت معامله را اضافه کنید (تا ۸۰۰px فشرده می‌شود)"><input type="file" id="f-shot-input" accept="image/*" hidden />افزودن / تغییر تصویر</label>' +
          (d.screenshotBase64 ? '<button type="button" class="jr-link jr-link-danger" id="f-shot-remove">حذف تصویر</button>' : '') +
        '</div></div>';

      // Prop firm
      html += '<div class="jr-divider">حساب</div>';
      html += '<div class="jr-grid jr-grid-3">';
      html += field('نوع حساب', sel('f-accountType', [['personal','شخصی'],['prop','پراپ']], d.accountType || 'personal', 'حساب شخصی یا حساب پراپ‌فرم'));
      html += field('نام پراپ‌فرم', '<input class="jr-in" id="f-propFirmName" value="' + esc(d.propFirmName || '') + '" placeholder="مثلاً FTMO" title="نام شرکت پراپ‌فرم" autocomplete="off" />');
      html += field('نام چلنج', '<input class="jr-in" id="f-propChallengeName" value="' + esc(d.propChallengeName || '') + '" placeholder="مثلاً Phase 1 - 100K" title="نام یا مرحله چلنج پراپ" autocomplete="off" />');
      html += '</div>';
    }

    html += '<div class="jr-form-foot">' +
      '<span class="jr-err" id="f-err"></span>' +
      '<button type="submit" class="jr-btn jr-btn-primary" id="f-submit">' + (editingId ? 'ذخیره تغییرات' : 'ثبت معامله') + '</button></div>';

    form.innerHTML = html;
    wireLogForm(d);
  }

  // ورودی عددی: type=text + inputmode تا ارقام فارسی هم وارد و سپس به انگلیسی نرمال شوند
  function numInput(id, val, symbol, ph, title) {
    return '<input class="jr-in jr-num" id="' + id + '" type="text" inputmode="decimal" autocomplete="off" value="' + (val != null && val !== '' ? val : '') + '"' +
      (ph ? ' placeholder="' + esc(ph) + '"' : '') + (title ? ' title="' + esc(title) + '"' : '') + ' />';
  }
  function sel(id, opts, val, title) {
    return '<div class="jr-selwrap"><select class="jr-sel" id="' + id + '"' + (title ? ' title="' + esc(title) + '"' : '') + '>' +
      opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(val) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') +
      '</select><svg class="jr-sel-arrow" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>';
  }
  function emojiRow(id, val) {
    return '<div class="jr-emoji-row" data-emo="' + id + '">' + EMOTIONS.map(function (e) {
      return '<button type="button" class="jr-emoji' + (val === e.v ? ' active' : '') + '" data-val="' + e.v + '" title="' + e.label + '"><span>' + e.emoji + '</span><small>' + e.label + '</small></button>';
    }).join('') + '<input type="hidden" id="f-' + id + '" value="' + esc(val || '') + '"></div>';
  }

  function wireLogForm(d) {
    var form = $id('jr-form');

    // Direction toggle
    qsa('.jr-dirbtn', form).forEach(function (b) {
      b.addEventListener('click', function () {
        qsa('.jr-dirbtn', form).forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        $id('f-direction').value = b.getAttribute('data-dir');
        recalcLive();
      });
    });
    // Emoji rows
    qsa('.jr-emoji-row').forEach(function (row) {
      row.addEventListener('click', function (e) {
        var b = e.target.closest('.jr-emoji'); if (!b) return;
        var was = b.classList.contains('active');
        qsa('.jr-emoji', row).forEach(function (x) { x.classList.remove('active'); });
        var input = qs('input[type=hidden]', row);
        if (was) { input.value = ''; } else { b.classList.add('active'); input.value = b.getAttribute('data-val'); }
      });
    });
    // Flags
    qsa('.jr-flag', form).forEach(function (b) {
      b.addEventListener('click', function () { b.classList.toggle('active'); });
    });
    // Ranges
    ['confidenceEntry','confidenceExit'].forEach(function (k) {
      var r = $id('f-' + k); if (!r) return;
      var lbl = $id(k === 'confidenceEntry' ? 'f-ce-val' : 'f-cx-val');
      r.addEventListener('input', function () { lbl.textContent = r.value; });
    });
    // Screenshot
    var shotInput = $id('f-shot-input');
    if (shotInput) shotInput.addEventListener('change', function () {
      var f = shotInput.files[0]; if (!f) return;
      compressImage(f).then(function (dataUrl) {
        d.screenshotBase64 = dataUrl;
        var wrap = $id('f-shot-wrap');
        var img = $id('f-shot-img');
        if (!img) { img = el('<img class="jr-shot-img" id="f-shot-img" />'); wrap.insertBefore(img, wrap.firstChild); }
        img.src = dataUrl;
        if (!$id('f-shot-remove')) {
          var rm = el('<button type="button" class="jr-link jr-link-danger" id="f-shot-remove">حذف تصویر</button>');
          wrap.appendChild(rm); rm.addEventListener('click', removeShot);
        }
      });
    });
    var rmBtn = $id('f-shot-remove'); if (rmBtn) rmBtn.addEventListener('click', removeShot);
    function removeShot() { d.screenshotBase64 = null; var i = $id('f-shot-img'); if (i) i.remove(); var b = $id('f-shot-remove'); if (b) b.remove(); }

    // Live recalc on price/symbol changes
    ['f-symbol','f-entryPrice','f-exitPrice','f-stopLoss','f-takeProfit','f-lotSize','f-commission','f-status'].forEach(function (id) {
      var elx = $id(id); if (elx) { elx.addEventListener('input', recalcLive); elx.addEventListener('change', recalcLive); }
    });
    // Symbol → step + price chip + session step update
    var symEl = $id('f-symbol');
    if (symEl) symEl.addEventListener('change', function () {
      var step = pipSizeFor(symEl.value);
      ['f-entryPrice','f-exitPrice','f-stopLoss','f-takeProfit'].forEach(function (id) { var e = $id(id); if (e) e.step = step; });
      showPriceChip(symEl.value);
    });
    if (symEl) showPriceChip(symEl.value);

    // Entry time → session autodetect
    var et = $id('f-entryTime');
    if (et) et.addEventListener('change', function () {
      var sess = detectSession(et.value);
      var sEl = $id('f-session');
      if (sEl && sess && !sEl.value) sEl.value = sess;
      updateDuration();
    });
    ['f-entryDate','f-entryTime','f-exitDate','f-exitTime'].forEach(function (id) {
      var e = $id(id); if (e) e.addEventListener('change', updateDuration);
    });

    form.addEventListener('submit', function (e) { e.preventDefault(); submitTrade(d); });

    recalcLive();
    updateDuration();
  }

  function showPriceChip(symbol) {
    var chip = $id('f-price-chip'); if (!chip) return;
    var price = lookupLivePrice(symbol);
    if (price != null) {
      chip.hidden = false;
      chip.textContent = 'قیمت فعلی: ' + price;
      chip.onclick = function () { var e = $id('f-entryPrice'); if (e && !e.value) { e.value = price; recalcLive(); } };
    } else chip.hidden = true;
  }

  // Best-effort read of watchlist/crypto prices already on the page (no new network calls)
  // Price rows (newtab.js renderPrices) mark each row with data-pxid (e.g. "eurusd", coingecko id,
  // or an Iran-market id) — not data-symbol — and carry the ticker in .c-sym and the Persian
  // label in .c-name, so match against all three normalized forms.
  function lookupLivePrice(symbol) {
    if (!symbol) return null;
    try {
      var key = symbol.trim();
      var keyNorm = key.toUpperCase().replace(/[^A-Z0-9]/g, '');
      var rows = document.querySelectorAll('.c-row[data-pxid]');
      for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var pxidNorm = (row.getAttribute('data-pxid') || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        var symEl = row.querySelector('.c-sym');
        var symNorm = symEl ? symEl.textContent.toUpperCase().replace(/[^A-Z0-9]/g, '') : '';
        var nameEl = row.querySelector('.c-name');
        var nameTrim = nameEl ? nameEl.textContent.trim() : '';
        var matches = (keyNorm && (keyNorm === pxidNorm || keyNorm === symNorm)) || (key && key === nameTrim);
        if (matches) {
          var priceEl = row.querySelector('.c-price');
          if (priceEl && priceEl.textContent.trim()) return priceEl.textContent.trim();
        }
      }
    } catch (e) {}
    return null;
  }

  function readForm(d) {
    function v(id) { var e = $id(id); return e ? e.value : ''; }
    var t = Object.assign({}, d);
    t.symbol = v('f-symbol').trim();
    t.direction = v('f-direction') || 'long';
    t.entryPrice = isNum(v('f-entryPrice')) ? num(v('f-entryPrice')) : '';
    t.exitPrice = isNum(v('f-exitPrice')) ? num(v('f-exitPrice')) : '';
    t.lotSize = num(v('f-lotSize'));
    t.stopLoss = isNum(v('f-stopLoss')) ? num(v('f-stopLoss')) : '';
    t.takeProfit = isNum(v('f-takeProfit')) ? num(v('f-takeProfit')) : '';
    t.commission = num(v('f-commission'));
    if ($id('f-status')) {
      t.status = v('f-status');
      t.marketType = v('f-marketType');
      t.entryDate = v('f-entryDate'); t.entryTime = v('f-entryTime');
      t.exitDate = v('f-exitDate'); t.exitTime = v('f-exitTime');
      t.setup = v('f-setup').trim();
      t.timeframe = v('f-timeframe'); t.session = v('f-session');
      t.trendAlignment = v('f-trendAlignment'); t.marketCondition = v('f-marketCondition');
      t.tags = v('f-tags').split(',').map(function (x) { return x.trim(); }).filter(Boolean);
      t.preEmotion = v('f-preEmotion'); t.postEmotion = v('f-postEmotion');
      t.confidenceEntry = num(v('f-confidenceEntry')); t.confidenceExit = num(v('f-confidenceExit'));
      t.followedPlan = $id('f-followedPlan').checked;
      t.flags = {};
      qsa('.jr-flag').forEach(function (b) { t.flags[b.getAttribute('data-flag')] = b.classList.contains('active'); });
      t.reasonEntry = v('f-reasonEntry'); t.reasonExit = v('f-reasonExit'); t.lessonsLearned = v('f-lessonsLearned');
      t.accountType = v('f-accountType'); t.propFirmName = v('f-propFirmName'); t.propChallengeName = v('f-propChallengeName');
      t.screenshotBase64 = d.screenshotBase64 || null;
    } else {
      // quick mode: defaults for missing
      t.status = t.status || (isNum(t.exitPrice) ? 'closed' : 'open');
      t.entryDate = t.entryDate || todayStr();
      t.entryTime = t.entryTime || nowTimeStr();
      if (t.status === 'closed' && !t.exitDate) { t.exitDate = todayStr(); t.exitTime = nowTimeStr(); }
      t.session = t.session || detectSession(t.entryTime);
      t.marketType = t.marketType || 'forex';
      t.flags = t.flags || {};
      t.tags = t.tags || [];
    }
    return t;
  }

  function recalcLive() {
    var d = editingId ? (DB.trades.find(function (x) { return x.id === editingId; }) || {}) : {};
    var t = readForm(d);
    Analytics.calcTradeMetrics(t);
    var box = $id('f-rrbox'); if (!box) return;
    var parts = [];
    if (t.rrPlanned) parts.push('<span>R:R پلن: <b>1 : ' + fmtNum(t.rrPlanned, 2) + '</b></span>');
    if (t.riskAmount) parts.push('<span>ریسک: <b class="jr-neg">' + fmtMoney(-t.riskAmount) + '</b>' + (t.riskPercent ? ' <small>(' + fmtNum(t.riskPercent, 2) + '٪)</small>' : '') + '</span>');
    if (t.rrPlanned && t.riskAmount) parts.push('<span>هدف: <b class="jr-pos">' + fmtMoney(t.riskAmount * t.rrPlanned) + '</b></span>');
    if (t.status === 'closed' && isNum(t.exitPrice)) {
      parts.push('<span class="jr-rr-pnl">P&L: <b class="' + pnlClass(t.pnlAmount) + '">' + fmtMoney(t.pnlAmount) + '</b> · <b>' + fmtNum(t.pnlPips, 1) + ' پیپ</b>' + (t.rrActual ? ' · <b>' + fmtNum(t.rrActual, 2) + 'R</b>' : '') + '</span>');
    }
    box.innerHTML = parts.length
      ? parts.join('')
      : '<span class="jr-rr-empty">قیمت ورود، حد ضرر و حجم را وارد کنید تا R:R و ریسک محاسبه شود</span>';
    box.hidden = false;
  }

  function updateDuration() {
    var dur = $id('f-dur'); if (!dur) return;
    var a = tsOf($id('f-entryDate') && $id('f-entryDate').value, $id('f-entryTime') && $id('f-entryTime').value);
    var b = tsOf($id('f-exitDate') && $id('f-exitDate').value, $id('f-exitTime') && $id('f-exitTime').value);
    if (a && b && b >= a) {
      var mins = Math.round((b - a) / 60000);
      dur.textContent = 'مدت معامله: ' + humanDuration(mins);
      dur.hidden = false;
    } else dur.hidden = true;
  }
  function humanDuration(mins) {
    if (mins < 60) return mins + ' دقیقه';
    var h = Math.floor(mins / 60), m = mins % 60;
    var d = Math.floor(h / 24); h = h % 24;
    var out = [];
    if (d) out.push(d + ' روز');
    if (h) out.push(h + ' ساعت');
    if (m) out.push(m + ' دقیقه');
    return out.join(' و ');
  }

  function submitTrade(d) {
    var t = readForm(d);
    var err = validateTrade(t);
    var errEl = $id('f-err');
    if (err) { errEl.textContent = err; errEl.classList.add('show'); toast(err, 'error'); return; }
    errEl.textContent = ''; errEl.classList.remove('show');
    Analytics.calcTradeMetrics(t);

    if (editingId) {
      updateTrade(editingId, t);
      toast('معامله به‌روزرسانی شد', 'good');
      editingId = null;
      switchTab('history');
    } else {
      t.id = uuid(); t.createdAt = Date.now(); t.updatedAt = Date.now();
      addTrade(t);
      toast('معامله ثبت شد ✓', 'good');
      renderLog();
    }
    refreshButton();
  }

  function validateTrade(t) {
    if (!t.symbol) return 'نماد الزامی است';
    if (!t.direction) return 'جهت معامله را انتخاب کنید';
    if (!isNum(t.entryPrice) || num(t.entryPrice) <= 0) return 'قیمت ورود باید عددی مثبت باشد';
    if (t.status === 'closed' && !isNum(t.exitPrice)) return 'برای معامله‌ی بسته، قیمت خروج الزامی است';
    if (isNum(t.stopLoss) && isNum(t.entryPrice)) {
      if (t.direction === 'long' && num(t.stopLoss) >= num(t.entryPrice)) return 'در خرید، حد ضرر باید کمتر از قیمت ورود باشد';
      if (t.direction === 'short' && num(t.stopLoss) <= num(t.entryPrice)) return 'در فروش، حد ضرر باید بیشتر از قیمت ورود باشد';
    }
    return null;
  }

  function compressImage(file) {
    return new Promise(function (resolve) {
      var img = new Image();
      var canvas = document.createElement('canvas');
      img.onload = function () {
        var maxW = 800, ratio = Math.min(1, maxW / img.width);
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = function () { resolve(null); };
      img.src = URL.createObjectURL(file);
    });
  }

  /* ════════════════════════ TAB 2 — تاریخچه ════════════════════════ */
  var HIST_COLS = [
    { k:'entryDate', label:'تاریخ' }, { k:'symbol', label:'نماد' }, { k:'direction', label:'جهت' },
    { k:'entryPrice', label:'ورود' }, { k:'exitPrice', label:'خروج' }, { k:'stopLoss', label:'SL' },
    { k:'takeProfit', label:'TP' }, { k:'lotSize', label:'حجم' }, { k:'pnlPips', label:'P&L پیپ' },
    { k:'pnlAmount', label:'P&L $' }, { k:'rrActual', label:'R:R' }, { k:'setup', label:'ستاپ' },
    { k:'status', label:'وضعیت' }
  ];

  function applyFilters() {
    var f = histState.filters, q = histState.search.trim().toLowerCase();
    return DB.trades.filter(function (t) {
      if (f.from && (t.entryDate || '') < f.from) return false;
      if (f.to && (t.entryDate || '') > f.to) return false;
      if (f.symbol && t.symbol !== f.symbol) return false;
      if (f.direction && t.direction !== f.direction) return false;
      if (f.setup && t.setup !== f.setup) return false;
      if (f.status && t.status !== f.status) return false;
      if (f.result === 'win' && !(t.status === 'closed' && t.pnlAmount > 0)) return false;
      if (f.result === 'loss' && !(t.status === 'closed' && t.pnlAmount < 0)) return false;
      if (f.timeframe && t.timeframe !== f.timeframe) return false;
      if (f.flag && !(t.flags && t.flags[f.flag])) return false;
      if (q) {
        var hay = [t.symbol, t.reasonEntry, t.lessonsLearned, (t.tags || []).join(' '), t.setup].join(' ').toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    });
  }

  function sortTrades(arr) {
    var k = histState.sortKey, dir = histState.sortDir;
    return arr.slice().sort(function (a, b) {
      var va = a[k], vb = b[k];
      if (typeof va === 'string' || typeof vb === 'string') { va = va || ''; vb = vb || ''; return va < vb ? -dir : (va > vb ? dir : 0); }
      va = va || 0; vb = vb || 0; return (va - vb) * dir;
    });
  }

  function renderHistory() {
    var body = $id('jr-body');
    var symbols = uniq(DB.trades.map(function (t) { return t.symbol; }).filter(Boolean));
    var setups = uniq(DB.trades.map(function (t) { return t.setup; }).filter(Boolean));
    var f = histState.filters;

    body.innerHTML =
      '<div class="jr-hist-filters">' +
        '<input class="jr-in jr-search" id="h-search" placeholder="جستجو در نماد، دلیل ورود، درس‌ها و تگ‌ها…" title="جستجو در معاملات" autocomplete="off" value="' + esc(histState.search) + '" />' +
        '<div class="jr-filt-row">' +
          dateF('h-from','از', f.from) + dateF('h-to','تا', f.to) +
          filtSel('h-symbol','نماد', [['','همه']].concat(symbols.map(function (s) { return [s, s]; })), f.symbol) +
          filtSel('h-direction','جهت', [['','همه'],['long','خرید'],['short','فروش']], f.direction) +
          filtSel('h-setup','ستاپ', [['','همه']].concat(setups.map(function (s) { return [s, s]; })), f.setup) +
          filtSel('h-status','وضعیت', [['','همه'],['open','باز'],['closed','بسته'],['cancelled','لغو']], f.status) +
          filtSel('h-result','نتیجه', [['','همه'],['win','سودده'],['loss','زیان‌ده']], f.result) +
          filtSel('h-timeframe','تایم‌فریم', [['','همه']].concat(TIMEFRAMES.map(function (x) { return [x, x]; })), f.timeframe) +
          filtSel('h-flag','پرچم', [['','همه']].concat(FLAGS.map(function (x) { return [x.k, x.label]; })), f.flag) +
          '<button class="jr-btn jr-btn-ghost jr-btn-sm" id="h-clear">پاک‌سازی فیلتر</button>' +
        '</div>' +
      '</div>' +
      '<div id="h-summary"></div>' +
      '<div class="jr-table-wrap"><table class="jr-table" id="h-table"></table></div>';

    // wire filters
    $id('h-search').addEventListener('input', debounce(function (e) { histState.search = e.target.value; renderHistTable(); }, 200));
    ['from','to','symbol','direction','setup','status','result','timeframe','flag'].forEach(function (k) {
      var e = $id('h-' + k);
      e.addEventListener('change', function () { histState.filters[k] = e.value; renderHistTable(); });
    });
    $id('h-clear').addEventListener('click', function () { histState.filters = {}; histState.search = ''; renderHistory(); });

    renderHistTable();
  }

  function renderHistTable() {
    var rows = sortTrades(applyFilters());
    var compact = DB.settings.compactTable;
    var hidden = DB.settings.hiddenCols || [];
    var cols = HIST_COLS.filter(function (c) { return hidden.indexOf(c.k) < 0; });

    // summary
    var cl = rows.filter(function (t) { return t.status === 'closed'; });
    var wins = cl.filter(function (t) { return t.pnlAmount > 0; });
    var pnl = cl.reduce(function (s, t) { return s + t.pnlAmount; }, 0);
    $id('h-summary').innerHTML =
      '<div class="jr-summary">' +
      '<span class="jr-chip">' + rows.length + ' معامله</span>' +
      '<span class="jr-chip">' + wins.length + ' برنده / ' + (cl.length - wins.length) + ' بازنده</span>' +
      '<span class="jr-chip">نرخ موفقیت: ' + (cl.length ? Math.round(wins.length / cl.length * 100) : 0) + '٪</span>' +
      '<span class="jr-chip ' + pnlClass(pnl) + '">P&L: ' + fmtMoney(pnl) + '</span>' +
      '</div>';

    var head = '<thead><tr>' + cols.map(function (c) {
      var arrow = histState.sortKey === c.k ? (histState.sortDir > 0 ? ' ▲' : ' ▼') : '';
      return '<th data-sort="' + c.k + '">' + c.label + arrow + '</th>';
    }).join('') + '</tr></thead>';

    var bodyRows = rows.map(function (t) {
      var stClass = t.status === 'open' ? 'jr-row-open' : (t.pnlAmount > 0 ? 'jr-row-win' : (t.pnlAmount < 0 ? 'jr-row-loss' : ''));
      return '<tr class="' + stClass + (compact ? ' jr-compact' : '') + '" data-id="' + t.id + '">' + cols.map(function (c) {
        return '<td>' + histCell(t, c.k) + '</td>';
      }).join('') + '</tr>';
    }).join('');

    var table = $id('h-table');
    table.innerHTML = head + '<tbody>' + (rows.length ? bodyRows : '<tr><td colspan="' + cols.length + '" class="jr-empty">معامله‌ای مطابق فیلتر یافت نشد</td></tr>') + '</tbody>';

    qsa('th[data-sort]', table).forEach(function (th) {
      th.addEventListener('click', function () {
        var k = th.getAttribute('data-sort');
        if (histState.sortKey === k) histState.sortDir *= -1; else { histState.sortKey = k; histState.sortDir = -1; }
        renderHistTable();
      });
    });
    qsa('tbody tr[data-id]', table).forEach(function (tr) {
      tr.addEventListener('click', function () { openTradeDetail(tr.getAttribute('data-id')); });
    });
  }

  function histCell(t, k) {
    if (k === 'direction') return t.direction === 'long' ? '<span class="jr-pos">خرید</span>' : '<span class="jr-neg">فروش</span>';
    if (k === 'status') return { open:'باز', closed:'بسته', cancelled:'لغو' }[t.status] || t.status;
    if (k === 'pnlAmount') return t.status === 'closed' ? '<b class="' + pnlClass(t.pnlAmount) + '">' + fmtMoney(t.pnlAmount) + '</b>' : '—';
    if (k === 'pnlPips') return t.status === 'closed' ? '<span class="' + pnlClass(t.pnlPips) + '">' + fmtNum(t.pnlPips, 1) + '</span>' : '—';
    if (k === 'rrActual') return t.status === 'closed' && t.rrActual ? fmtNum(t.rrActual, 2) : '—';
    if (k === 'setup') return esc(t.setup || '—');
    if (k === 'symbol') return '<b>' + esc(t.symbol) + '</b>';
    if (['entryPrice','exitPrice','stopLoss','takeProfit','lotSize'].indexOf(k) >= 0) return t[k] != null && t[k] !== '' ? esc(t[k]) : '—';
    return esc(t[k] == null ? '—' : t[k]);
  }

  function openTradeDetail(id) {
    var t = DB.trades.find(function (x) { return x.id === id; });
    if (!t) return;
    var rows = [];
    function r(label, val) { if (val == null || val === '' || val === 0 && label.indexOf('P&L') < 0) { /* keep some */ } rows.push('<div class="jr-dt-row"><span>' + label + '</span><b>' + val + '</b></div>'); }
    r('نماد', esc(t.symbol));
    r('جهت', t.direction === 'long' ? 'خرید' : 'فروش');
    r('وضعیت', { open:'باز', closed:'بسته', cancelled:'لغو' }[t.status]);
    r('بازار', (MARKETS.find(function (m) { return m.v === t.marketType; }) || {}).label || '—');
    r('ورود', esc(t.entryPrice) + (t.entryDate ? ' · ' + t.entryDate + ' ' + (t.entryTime || '') : ''));
    if (t.status === 'closed') r('خروج', esc(t.exitPrice) + (t.exitDate ? ' · ' + t.exitDate + ' ' + (t.exitTime || '') : ''));
    if (t.durationMinutes) r('مدت', humanDuration(t.durationMinutes));
    if (isNum(t.stopLoss)) r('حد ضرر', esc(t.stopLoss));
    if (isNum(t.takeProfit)) r('حد سود', esc(t.takeProfit));
    r('حجم', esc(t.lotSize));
    if (t.status === 'closed') {
      r('P&L', '<span class="' + pnlClass(t.pnlAmount) + '">' + fmtMoney(t.pnlAmount) + ' · ' + fmtNum(t.pnlPips, 1) + ' پیپ</span>');
      if (t.rrActual) r('R محقق‌شده', fmtNum(t.rrActual, 2) + 'R');
    }
    if (t.rrPlanned) r('R:R پلن', '1 : ' + fmtNum(t.rrPlanned, 2));
    if (t.riskAmount) r('ریسک', fmtMoney(-t.riskAmount) + (t.riskPercent ? ' (' + fmtNum(t.riskPercent, 2) + '٪)' : ''));
    if (t.setup) r('ستاپ', esc(t.setup));
    if (t.timeframe) r('تایم‌فریم', t.timeframe);
    if (t.session) r('سشن', SESSIONS[t.session] || t.session);
    if (t.preEmotion) r('احساس قبل', (EMOTIONS.find(function (e) { return e.v === t.preEmotion; }) || {}).label);
    var activeFlags = FLAGS.filter(function (fl) { return t.flags && t.flags[fl.k]; }).map(function (fl) { return fl.label; });
    if (activeFlags.length) r('پرچم‌ها', activeFlags.join('، '));
    if ((t.tags || []).length) r('تگ‌ها', esc(t.tags.join('، ')));

    var notes = '';
    if (t.reasonEntry) notes += '<div class="jr-dt-note"><span>دلیل ورود</span><p>' + esc(t.reasonEntry) + '</p></div>';
    if (t.reasonExit) notes += '<div class="jr-dt-note"><span>دلیل خروج</span><p>' + esc(t.reasonExit) + '</p></div>';
    if (t.lessonsLearned) notes += '<div class="jr-dt-note"><span>درس‌ها</span><p>' + esc(t.lessonsLearned) + '</p></div>';

    var card = el('<div class="jr-detail">' +
      '<div class="jr-detail-head"><b>' + esc(t.symbol) + ' · ' + (t.direction === 'long' ? 'خرید' : 'فروش') + '</b>' +
        '<button class="jr-hbtn jr-close" id="jr-dt-close"><svg viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button></div>' +
      '<div class="jr-detail-body">' + rows.join('') + notes +
        (t.screenshotBase64 ? '<img class="jr-dt-shot" src="' + t.screenshotBase64 + '" />' : '') +
      '</div>' +
      '<div class="jr-detail-foot"><button class="jr-btn jr-btn-danger" id="jr-dt-del">حذف</button>' +
        '<button class="jr-btn jr-btn-primary" id="jr-dt-edit">ویرایش</button></div>' +
      '</div>');
    openPop(card);
    $id('jr-dt-close').addEventListener('click', closePop);
    $id('jr-dt-edit').addEventListener('click', function () { closePop(); editingId = id; logMode = 'full'; switchTab('log'); });
    $id('jr-dt-del').addEventListener('click', function () {
      confirmDialog('این معامله حذف شود؟ این عمل قابل بازگشت نیست.', function () {
        deleteTrade(id); toast('معامله حذف شد', 'info'); refreshButton(); renderHistory();
      });
    });
  }

  /* ════════════════════════ TAB 3 — آمار ════════════════════════ */
  var RANGES = [['week','هفته جاری'],['month','ماه جاری'],['prevmonth','ماه گذشته'],['3m','۳ ماه'],['6m','۶ ماه'],['1y','۱ سال'],['all','کل']];

  function rangeTrades() {
    if (anRange === 'all') return DB.trades;
    var now = new Date();
    var from = null, to = null;
    if (anRange === 'week') { from = new Date(now); from.setDate(now.getDate() - now.getDay()); }
    else if (anRange === 'month') { from = new Date(now.getFullYear(), now.getMonth(), 1); }
    else if (anRange === 'prevmonth') { from = new Date(now.getFullYear(), now.getMonth() - 1, 1); to = new Date(now.getFullYear(), now.getMonth(), 0); }
    else if (anRange === '3m') { from = new Date(now); from.setMonth(now.getMonth() - 3); }
    else if (anRange === '6m') { from = new Date(now); from.setMonth(now.getMonth() - 6); }
    else if (anRange === '1y') { from = new Date(now); from.setFullYear(now.getFullYear() - 1); }
    var fStr = from ? from.getFullYear() + '-' + pad(from.getMonth() + 1) + '-' + pad(from.getDate()) : null;
    var tStr = to ? to.getFullYear() + '-' + pad(to.getMonth() + 1) + '-' + pad(to.getDate()) : null;
    return DB.trades.filter(function (t) {
      var d = t.entryDate || '';
      if (fStr && d < fStr) return false;
      if (tStr && d > tStr) return false;
      return true;
    });
  }

  function renderAnalytics() {
    var body = $id('jr-body');
    var trades = rangeTrades();
    var st = Analytics.portfolioStats(trades);

    body.innerHTML =
      '<div class="jr-range-bar" id="an-range">' + RANGES.map(function (r) {
        return '<button class="jr-range-btn' + (anRange === r[0] ? ' active' : '') + '" data-r="' + r[0] + '">' + r[1] + '</button>';
      }).join('') + '</div>' +
      (st.count === 0 ? '<div class="jr-empty-big">هنوز معامله‌ی بسته‌ای در این بازه ثبت نشده.</div>' :
        kpiCards(st) +
        '<div class="jr-chart-card"><div class="jr-chart-title">منحنی رشد سرمایه (Equity Curve)</div><canvas id="an-equity" class="jr-canvas"></canvas></div>' +
        '<div class="jr-chart-card"><div class="jr-chart-title">توزیع R:R</div><canvas id="an-rr" class="jr-canvas jr-canvas-sm"></canvas></div>' +
        '<div class="jr-breakdown" id="an-breakdown"></div>' +
        '<div class="jr-chart-card"><div class="jr-chart-title">تقویم سود و زیان</div><div id="an-heat"></div></div>'
      );

    $id('an-range').addEventListener('click', function (e) {
      var b = e.target.closest('.jr-range-btn'); if (!b) return;
      anRange = b.getAttribute('data-r'); renderAnalytics();
    });
    if (st.count === 0) return;

    drawEquityCurve($id('an-equity'), Analytics.buildEquityCurve(trades, DB.accountBalance), DB.accountBalance);
    drawRRHistogram($id('an-rr'), Analytics.rrHistogram(Analytics.closed(trades)));
    renderBreakdown(trades);
    renderHeatmap(trades);
  }

  function kpiCards(st) {
    function card(label, val, sub, cls) {
      return '<div class="jr-kpi"><div class="jr-kpi-val ' + (cls || '') + '">' + val + '</div><div class="jr-kpi-label">' + label + '</div>' + (sub ? '<div class="jr-kpi-sub">' + sub + '</div>' : '') + '</div>';
    }
    var pf = st.profitFactor === Infinity ? '∞' : fmtNum(st.profitFactor, 2);
    var streakTxt = st.streak.count ? st.streak.count + ' ' + (st.streak.type === 'win' ? 'برد متوالی' : 'باخت متوالی') : '—';
    return '<div class="jr-kpis">' +
      card('نرخ موفقیت', Math.round(st.winRate) + '٪', st.wins + ' برد / ' + st.losses + ' باخت') +
      card('میانگین R:R', fmtNum(st.avgRR, 2) + 'R', null, st.avgRR >= 0 ? 'jr-pos' : 'jr-neg') +
      card('Profit Factor', pf, null, st.profitFactor >= 1 ? 'jr-pos' : 'jr-neg') +
      card('میانگین سود', fmtMoney(st.avgWin), null, 'jr-pos') +
      card('میانگین زیان', fmtMoney(st.avgLoss), null, 'jr-neg') +
      card('بهترین معامله', fmtMoney(st.best), null, 'jr-pos') +
      card('بدترین معامله', fmtMoney(st.worst), null, 'jr-neg') +
      card('Max Drawdown', fmtMoney(-st.maxDD), null, 'jr-neg') +
      card('استریک', streakTxt, null, st.streak.type === 'win' ? 'jr-pos' : (st.streak.type === 'loss' ? 'jr-neg' : '')) +
      card('امید ریاضی', fmtMoney(st.expectancy) + '/معامله', null, st.expectancy >= 0 ? 'jr-pos' : 'jr-neg') +
      card('کل P&L', fmtMoney(st.total), st.count + ' معامله', st.total >= 0 ? 'jr-pos' : 'jr-neg') +
      '</div>';
  }

  function cssVar(name) {
    return getComputedStyle(document.body).getPropertyValue(name).trim() || '#888';
  }

  function setupCanvas(canvas, h) {
    var dpr = window.devicePixelRatio || 1;
    var w = canvas.parentElement.clientWidth - 0;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    canvas.width = w * dpr; canvas.height = h * dpr;
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: w, h: h };
  }

  function drawEquityCurve(canvas, data, startBalance) {
    if (!canvas) return;
    var c = setupCanvas(canvas, 240);
    var ctx = c.ctx, w = c.w, h = c.h;
    var padL = 56, padR = 14, padT = 16, padB = 28;
    var green = cssVar('--green'), red = cssVar('--red'), sub = cssVar('--soft'), border = cssVar('--border');
    var pts = [{ equity: startBalance }].concat(data);
    var eqs = pts.map(function (p) { return p.equity; });
    var min = Math.min.apply(null, eqs), max = Math.max.apply(null, eqs);
    if (min === max) { min -= 1; max += 1; }
    var pad = (max - min) * 0.1; min -= pad; max += pad;
    function X(i) { return padL + (w - padL - padR) * (i / (pts.length - 1)); }
    function Y(v) { return padT + (h - padT - padB) * (1 - (v - min) / (max - min)); }

    // grid + Y labels
    ctx.strokeStyle = border; ctx.fillStyle = sub; ctx.font = '10px Estedad, sans-serif'; ctx.textAlign = 'left';
    for (var g = 0; g <= 4; g++) {
      var val = min + (max - min) * (g / 4); var yy = Y(val);
      ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.moveTo(padL, yy); ctx.lineTo(w - padR, yy); ctx.stroke(); ctx.globalAlpha = 1;
      ctx.fillText('$' + Math.round(val).toLocaleString('en-US'), 4, yy + 3);
    }
    // breakeven line
    if (startBalance >= min && startBalance <= max) {
      ctx.strokeStyle = sub; ctx.setLineDash([4, 4]); ctx.globalAlpha = 0.6;
      ctx.beginPath(); ctx.moveTo(padL, Y(startBalance)); ctx.lineTo(w - padR, Y(startBalance)); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = 1;
    }
    // area gradient
    var last = pts[pts.length - 1].equity;
    var lineColor = last >= startBalance ? green : red;
    var grad = ctx.createLinearGradient(0, padT, 0, h - padB);
    grad.addColorStop(0, hexA(lineColor, 0.28)); grad.addColorStop(1, hexA(lineColor, 0));
    ctx.beginPath(); ctx.moveTo(X(0), Y(pts[0].equity));
    pts.forEach(function (p, i) { ctx.lineTo(X(i), Y(p.equity)); });
    ctx.lineTo(X(pts.length - 1), h - padB); ctx.lineTo(X(0), h - padB); ctx.closePath();
    ctx.fillStyle = grad; ctx.fill();
    // line
    ctx.beginPath(); ctx.lineWidth = 2; ctx.strokeStyle = lineColor; ctx.lineJoin = 'round';
    pts.forEach(function (p, i) { i ? ctx.lineTo(X(i), Y(p.equity)) : ctx.moveTo(X(i), Y(p.equity)); });
    ctx.stroke();
    // points
    pts.forEach(function (p, i) {
      if (i === 0) return;
      ctx.beginPath(); ctx.arc(X(i), Y(p.equity), 2.5, 0, 7); ctx.fillStyle = lineColor; ctx.fill();
    });

    // hover tooltip
    var tip = ensureTip(canvas);
    canvas.onmousemove = function (e) {
      var rect = canvas.getBoundingClientRect();
      var mx = e.clientX - rect.left;
      var idx = Math.round((mx - padL) / (w - padL - padR) * (pts.length - 1));
      idx = Math.max(1, Math.min(pts.length - 1, idx));
      var p = pts[idx];
      if (!p || !p.trade) { tip.style.display = 'none'; return; }
      tip.style.display = 'block';
      tip.innerHTML = '<b>' + esc(p.trade.symbol) + '</b> · ' + (p.date || '') + '<br>P&L: <b class="' + pnlClass(p.trade.pnlAmount) + '">' + fmtMoney(p.trade.pnlAmount) + '</b><br>موجودی: <b>' + fmtMoney(p.equity).replace('+', '') + '</b>';
      tip.style.left = Math.min(X(idx) + 10, w - 130) + 'px';
      tip.style.top = (Y(p.equity) - 10) + 'px';
    };
    canvas.onmouseleave = function () { tip.style.display = 'none'; };
  }

  function ensureTip(canvas) {
    var tip = canvas.parentElement.querySelector('.jr-tip');
    if (!tip) { tip = el('<div class="jr-tip"></div>'); canvas.parentElement.style.position = 'relative'; canvas.parentElement.appendChild(tip); }
    return tip;
  }

  function hexA(hex, a) {
    hex = (hex || '').replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(function (x) { return x + x; }).join('');
    var r = parseInt(hex.substr(0, 2), 16) || 0, g = parseInt(hex.substr(2, 2), 16) || 0, b = parseInt(hex.substr(4, 2), 16) || 0;
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }

  function drawRRHistogram(canvas, buckets) {
    if (!canvas) return;
    var c = setupCanvas(canvas, 180);
    var ctx = c.ctx, w = c.w, h = c.h;
    var padB = 36, padT = 12, padL = 24, padR = 12;
    var green = cssVar('--green'), red = cssVar('--red'), sub = cssVar('--soft');
    var maxV = Math.max(1, Math.max.apply(null, buckets.map(function (b) { return b.win + b.loss; })));
    var bw = (w - padL - padR) / buckets.length;
    ctx.font = '10px Estedad, sans-serif'; ctx.textAlign = 'center';
    buckets.forEach(function (b, i) {
      var x = padL + i * bw + bw * 0.15, bwi = bw * 0.7;
      var total = b.win + b.loss;
      var th = (h - padT - padB) * (total / maxV);
      var y = h - padB - th;
      // win (green) bottom, loss (red) top
      var wh = total ? th * (b.win / total) : 0;
      ctx.fillStyle = red; ctx.fillRect(x, y, bwi, th - wh);
      ctx.fillStyle = green; ctx.fillRect(x, y + (th - wh), bwi, wh);
      ctx.fillStyle = sub;
      ctx.fillText(b.label, x + bwi / 2, h - padB + 14);
      if (total) { ctx.fillStyle = cssVar('--text'); ctx.fillText(total, x + bwi / 2, y - 4); }
    });
  }

  function renderBreakdown(trades) {
    var cont = $id('an-breakdown');
    var cl = Analytics.closed(trades);
    var views = [
      { key:'symbol', label:'بر اساس نماد', fn: function (t) { return t.symbol; } },
      { key:'setup', label:'بر اساس ستاپ', fn: function (t) { return t.setup; } },
      { key:'session', label:'بر اساس سشن', fn: function (t) { return SESSIONS[t.session] || t.session; } },
      { key:'day', label:'بر اساس روز هفته', fn: function (t) { var d = new Date((t.exitDate || t.entryDate) + 'T00:00:00'); return isNaN(d) ? '—' : WEEKDAYS_FA[d.getDay()]; } }
    ];
    cont.innerHTML = '<div class="jr-bd-tabs" id="an-bd-tabs">' + views.map(function (v, i) {
      return '<button class="jr-bd-tab' + (i === 0 ? ' active' : '') + '" data-i="' + i + '">' + v.label + '</button>';
    }).join('') + '</div><div id="an-bd-body"></div>';

    function show(i) {
      qsa('.jr-bd-tab', cont).forEach(function (b) { b.classList.toggle('active', +b.getAttribute('data-i') === i); });
      var stats = Analytics.groupStats(cl, views[i].fn);
      var showRR = views[i].key === 'symbol' || views[i].key === 'setup';
      $id('an-bd-body').innerHTML = '<div class="jr-table-wrap"><table class="jr-table jr-table-sm"><thead><tr>' +
        '<th>' + views[i].label.replace('بر اساس ', '') + '</th><th>تعداد</th><th>Win%</th>' + (showRR ? '<th>Avg R:R</th>' : '') + '<th>P&L</th><th>میانگین</th></tr></thead><tbody>' +
        (stats.length ? stats.map(function (s) {
          return '<tr><td><b>' + esc(s.key) + '</b></td><td>' + s.count + '</td><td>' + Math.round(s.winRate) + '٪</td>' +
            (showRR ? '<td>' + fmtNum(s.avgRR, 2) + '</td>' : '') +
            '<td class="' + pnlClass(s.pnl) + '">' + fmtMoney(s.pnl) + '</td><td class="' + pnlClass(s.avgPnl) + '">' + fmtMoney(s.avgPnl) + '</td></tr>';
        }).join('') : '<tr><td colspan="6" class="jr-empty">داده‌ای نیست</td></tr>') + '</tbody></table></div>';
    }
    $id('an-bd-tabs').addEventListener('click', function (e) {
      var b = e.target.closest('.jr-bd-tab'); if (b) show(+b.getAttribute('data-i'));
    });
    show(0);
  }

  function renderHeatmap(trades) {
    var cont = $id('an-heat');
    var dayMap = Analytics.dayPnl(Analytics.closed(trades));
    if (!heatCursor) { var n = new Date(); heatCursor = { y: n.getFullYear(), m: n.getMonth() }; }
    drawMonthGrid(cont, heatCursor, dayMap, function (delta) {
      var m = heatCursor.m + delta;
      heatCursor = { y: heatCursor.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 };
      renderHeatmap(trades);
    }, function (dateStr) {
      var dayTrades = DB.trades.filter(function (t) { return (t.exitDate || t.entryDate) === dateStr; });
      if (dayTrades.length) showDayTrades(dateStr, dayTrades);
    });
  }

  function drawMonthGrid(cont, cursor, dayMap, onNav, onDay) {
    var monthsFa = ['ژانویه','فوریه','مارس','آوریل','مه','ژوئن','ژوئیه','اوت','سپتامبر','اکتبر','نوامبر','دسامبر'];
    var first = new Date(cursor.y, cursor.m, 1);
    var startDay = first.getDay();
    var daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
    var maxAbs = 1;
    for (var k in dayMap) maxAbs = Math.max(maxAbs, Math.abs(dayMap[k]));
    var cells = '';
    for (var i = 0; i < startDay; i++) cells += '<div class="jr-heat-cell jr-heat-empty"></div>';
    for (var d = 1; d <= daysInMonth; d++) {
      var ds = cursor.y + '-' + pad(cursor.m + 1) + '-' + pad(d);
      var v = dayMap[ds];
      var style = '', cls = 'jr-heat-cell';
      if (v != null && v !== 0) {
        var intensity = Math.min(1, Math.abs(v) / maxAbs) * 0.85 + 0.15;
        var color = v > 0 ? cssVar('--green') : cssVar('--red');
        style = 'background:' + hexA(color, intensity) + ';';
        cls += v > 0 ? ' jr-heat-win' : ' jr-heat-loss';
      } else if (v === 0) { cls += ' jr-heat-flat'; }
      cells += '<div class="' + cls + '" style="' + style + '" data-date="' + ds + '" title="' + ds + (v != null ? ' · ' + fmtMoney(v) : '') + '"><span>' + d + '</span></div>';
    }
    cont.innerHTML =
      '<div class="jr-heat-head"><button class="jr-hbtn jr-heat-nav" data-nav="-1">‹</button>' +
      '<b>' + monthsFa[cursor.m] + ' ' + cursor.y + '</b>' +
      '<button class="jr-hbtn jr-heat-nav" data-nav="1">›</button></div>' +
      '<div class="jr-heat-grid">' + ['ی','د','س','چ','پ','ج','ش'].map(function (w) { return '<div class="jr-heat-wd">' + w + '</div>'; }).join('') + cells + '</div>';
    qsa('.jr-heat-nav', cont).forEach(function (b) { b.addEventListener('click', function () { onNav(+b.getAttribute('data-nav')); }); });
    qsa('.jr-heat-cell[data-date]', cont).forEach(function (c) { c.addEventListener('click', function () { onDay(c.getAttribute('data-date')); }); });
  }

  function showDayTrades(dateStr, dayTrades) {
    var card = el('<div class="jr-detail"><div class="jr-detail-head"><b>معاملات ' + dateStr + '</b>' +
      '<button class="jr-hbtn jr-close" id="jr-day-close"><svg viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button></div>' +
      '<div class="jr-detail-body">' + dayTrades.map(function (t) {
        return '<div class="jr-dt-row jr-day-row" data-id="' + t.id + '"><span><b>' + esc(t.symbol) + '</b> · ' + (t.direction === 'long' ? 'خرید' : 'فروش') + '</span><b class="' + pnlClass(t.pnlAmount) + '">' + (t.status === 'closed' ? fmtMoney(t.pnlAmount) : 'باز') + '</b></div>';
      }).join('') + '</div></div>');
    openPop(card);
    $id('jr-day-close').addEventListener('click', closePop);
    qsa('.jr-day-row', card).forEach(function (r) { r.addEventListener('click', function () { closePop(); openTradeDetail(r.getAttribute('data-id')); }); });
  }

  /* ════════════════════════ TAB 4 — روان‌شناسی ════════════════════════ */
  function renderPsychology() {
    var body = $id('jr-body');
    body.innerHTML =
      '<div class="jr-psy-grid">' +
        '<div class="jr-psy-col">' +
          '<div class="jr-section-title">ژورنال روزانه</div>' +
          '<div id="psy-daily"></div>' +
        '</div>' +
        '<div class="jr-psy-col">' +
          '<div class="jr-section-title">بینش هوشمند</div><div id="psy-insight"></div>' +
          '<div class="jr-section-title">آمار پرچم‌های رفتاری</div><div id="psy-flags"></div>' +
          '<div class="jr-section-title">احساس و عملکرد</div><div id="psy-emotion"></div>' +
        '</div>' +
      '</div>';
    renderDailyNotes();
    renderPsyStats();
  }

  function renderPsyStats() {
    // Insight
    var insights = Analytics.generateInsight(DB.trades);
    $id('psy-insight').innerHTML = insights ? insights.map(function (m) {
      return '<div class="jr-insight jr-insight-' + m.type + '">' + esc(m.text) + '</div>';
    }).join('') : '<div class="jr-muted">برای تولید بینش، حداقل ۳ معامله‌ی بسته ثبت کنید.</div>';

    // Flag stats
    var fs = Analytics.psychFlagStats(DB.trades);
    $id('psy-flags').innerHTML = fs.length ? '<div class="jr-table-wrap"><table class="jr-table jr-table-sm"><thead><tr><th>پرچم</th><th>تعداد</th><th>Win%</th><th>میانگین P&L</th></tr></thead><tbody>' +
      fs.map(function (r) { return '<tr><td>' + r.label + '</td><td>' + r.count + '</td><td>' + Math.round(r.winRate) + '٪</td><td class="' + pnlClass(r.avgPnl) + '">' + fmtMoney(r.avgPnl) + '</td></tr>'; }).join('') +
      '</tbody></table></div>' : '<div class="jr-muted">هنوز معامله‌ای با پرچم رفتاری ثبت نشده.</div>';

    // Emotion correlation
    var es = Analytics.emotionStats(DB.trades);
    $id('psy-emotion').innerHTML = es.length ? '<div class="jr-table-wrap"><table class="jr-table jr-table-sm"><thead><tr><th>احساس قبل</th><th>تعداد</th><th>Win%</th><th>میانگین P&L</th></tr></thead><tbody>' +
      es.map(function (r) { return '<tr><td>' + r.emoji + ' ' + r.label + '</td><td>' + r.count + '</td><td>' + Math.round(r.winRate) + '٪</td><td class="' + pnlClass(r.avgPnl) + '">' + fmtMoney(r.avgPnl) + '</td></tr>'; }).join('') +
      '</tbody></table></div>' : '<div class="jr-muted">احساسات معاملات را در حالت کامل ثبت کنید تا این جدول پر شود.</div>';
  }

  function renderDailyNotes() {
    var cont = $id('psy-daily');
    if (!calCursor) { var n = new Date(); calCursor = { y: n.getFullYear(), m: n.getMonth() }; }
    var noteMap = {};
    DB.dailyNotes.forEach(function (n) { noteMap[n.date] = n; });

    var monthsFa = ['ژانویه','فوریه','مارس','آوریل','مه','ژوئن','ژوئیه','اوت','سپتامبر','اکتبر','نوامبر','دسامبر'];
    var first = new Date(calCursor.y, calCursor.m, 1);
    var startDay = first.getDay();
    var daysInMonth = new Date(calCursor.y, calCursor.m + 1, 0).getDate();
    var cells = '';
    for (var i = 0; i < startDay; i++) cells += '<div class="jr-heat-cell jr-heat-empty"></div>';
    var today = todayStr();
    for (var d = 1; d <= daysInMonth; d++) {
      var ds = calCursor.y + '-' + pad(calCursor.m + 1) + '-' + pad(d);
      var has = noteMap[ds];
      var mood = has && has.mood ? (MOODS.find(function (m) { return m.v === has.mood; }) || {}).emoji : '';
      cells += '<div class="jr-heat-cell jr-note-cell' + (ds === today ? ' jr-today' : '') + (has ? ' jr-has-note' : '') + '" data-date="' + ds + '"><span>' + d + '</span>' + (mood ? '<i class="jr-note-mood">' + mood + '</i>' : (has ? '<i class="jr-note-dot"></i>' : '')) + '</div>';
    }
    cont.innerHTML =
      '<div class="jr-heat-head"><button class="jr-hbtn jr-heat-nav" data-nav="-1">‹</button><b>' + monthsFa[calCursor.m] + ' ' + calCursor.y + '</b><button class="jr-hbtn jr-heat-nav" data-nav="1">›</button></div>' +
      '<div class="jr-heat-grid">' + ['ی','د','س','چ','پ','ج','ش'].map(function (w) { return '<div class="jr-heat-wd">' + w + '</div>'; }).join('') + cells + '</div>';
    qsa('.jr-heat-nav', cont).forEach(function (b) {
      b.addEventListener('click', function () {
        var m = calCursor.m + (+b.getAttribute('data-nav'));
        calCursor = { y: calCursor.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 };
        renderDailyNotes();
      });
    });
    qsa('.jr-note-cell', cont).forEach(function (c) { c.addEventListener('click', function () { editDailyNote(c.getAttribute('data-date')); }); });
  }

  function editDailyNote(date) {
    var n = getDailyNote(date) || {};
    var card = el('<div class="jr-detail jr-detail-wide"><div class="jr-detail-head"><b>یادداشت روز ' + date + '</b>' +
      '<button class="jr-hbtn jr-close" id="jr-dn-close"><svg viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button></div>' +
      '<div class="jr-detail-body">' +
        '<div class="jr-field"><span class="jr-flabel">حال‌وهوای روز</span><div class="jr-mood-row" id="dn-mood">' +
          MOODS.map(function (m) { return '<button type="button" class="jr-mood' + (n.mood === m.v ? ' active' : '') + '" data-v="' + m.v + '" title="حال‌وهوای کلی روز: ' + m.label + '"><span>' + m.emoji + '</span><small>' + m.label + '</small></button>'; }).join('') + '</div></div>' +
        '<div class="jr-grid jr-grid-2">' +
          field('بایاس بازار', sel('dn-bias', [['','— انتخاب کنید —'],['bullish','صعودی'],['bearish','نزولی'],['neutral','خنثی']], n.marketBias || '', 'دیدگاه کلی شما به بازار در این روز')) +
          field('هدف امروز', '<input class="jr-in" id="dn-goal" value="' + esc(n.dailyGoal || '') + '" placeholder="هدف معاملاتی امروز…" title="هدف یا تمرکز اصلی امروز" autocomplete="off" />') +
        '</div>' +
        field('یادداشت صبح (قبل از بازار)', '<textarea class="jr-in jr-ta" id="dn-morning" rows="3" placeholder="بایاس روز، نواحی کلیدی، برنامه و وضعیت ذهنی…" title="یادداشت پیش از شروع بازار">' + esc(n.morningNote || '') + '</textarea>') +
        field('یادداشت شب (مرور روز)', '<textarea class="jr-in jr-ta" id="dn-evening" rows="3" placeholder="مرور عملکرد، درس‌ها و برنامه فردا…" title="یادداشت پس از پایان بازار">' + esc(n.eveningNote || '') + '</textarea>') +
      '</div>' +
      '<div class="jr-detail-foot"><button class="jr-btn jr-btn-primary" id="dn-save">ذخیره</button></div></div>');
    openPop(card);
    var moodVal = n.mood || '';
    qsa('.jr-mood', card).forEach(function (b) {
      b.addEventListener('click', function () {
        var was = b.classList.contains('active');
        qsa('.jr-mood', card).forEach(function (x) { x.classList.remove('active'); });
        if (was) moodVal = ''; else { b.classList.add('active'); moodVal = b.getAttribute('data-v'); }
      });
    });
    $id('jr-dn-close').addEventListener('click', closePop);
    $id('dn-save').addEventListener('click', function () {
      saveDailyNote(date, {
        mood: moodVal, marketBias: $id('dn-bias').value, dailyGoal: $id('dn-goal').value,
        morningNote: $id('dn-morning').value, eveningNote: $id('dn-evening').value
      });
      closePop(); toast('یادداشت روز ذخیره شد', 'good'); renderDailyNotes();
    });
  }

  /* ════════════════════════ TAB 5 — پلی‌بوک ════════════════════════ */
  function renderPlaybook() {
    var body = $id('jr-body');
    body.innerHTML =
      '<div class="jr-pb-top"><div class="jr-section-title">ستاپ‌های معاملاتی</div>' +
      '<button class="jr-btn jr-btn-primary jr-btn-sm" id="pb-add">+ ستاپ جدید</button></div>' +
      '<div class="jr-pb-grid" id="pb-grid"></div>';
    $id('pb-add').addEventListener('click', function () { editSetup(null); });
    renderSetupCards();
  }

  function renderSetupCards() {
    var grid = $id('pb-grid');
    if (!DB.playbook.length) { grid.innerHTML = '<div class="jr-empty-big">هنوز ستاپی تعریف نشده. اولین ستاپ معاملاتی خود را بسازید.</div>'; return; }
    grid.innerHTML = DB.playbook.map(function (p) {
      var st = Analytics.setupStats(p.name, DB.trades);
      return '<div class="jr-pb-card" data-id="' + p.id + '">' +
        '<div class="jr-pb-card-head"><b>' + esc(p.name) + '</b>' +
          '<div class="jr-pb-card-actions"><button class="jr-link jr-pb-check" data-id="' + p.id + '">چک‌لیست</button>' +
          '<button class="jr-link jr-pb-edit" data-id="' + p.id + '">ویرایش</button></div></div>' +
        (p.description ? '<div class="jr-pb-desc">' + esc(p.description) + '</div>' : '') +
        '<div class="jr-pb-stats">' +
          '<span>Win Rate: <b class="' + (st.winRate >= 50 ? 'jr-pos' : 'jr-neg') + '">' + st.winRate + '٪</b></span>' +
          '<span>تعداد: <b>' + st.count + '</b></span>' +
          '<span>Avg R:R: <b>' + fmtNum(st.avgRR, 2) + '</b></span>' +
          '<span>P&L: <b class="' + pnlClass(st.pnl) + '">' + fmtMoney(st.pnl) + '</b></span>' +
        '</div>' +
        (p.rules && p.rules.length ? '<div class="jr-pb-rules">' + p.rules.slice(0, 3).map(function (r) { return '<span>• ' + esc(r) + '</span>'; }).join('') + (p.rules.length > 3 ? '<span class="jr-muted">+' + (p.rules.length - 3) + ' قانون دیگر</span>' : '') + '</div>' : '') +
        '</div>';
    }).join('');
    qsa('.jr-pb-edit', grid).forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); editSetup(b.getAttribute('data-id')); }); });
    qsa('.jr-pb-check', grid).forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); runChecklist(b.getAttribute('data-id')); }); });
  }

  function editSetup(id) {
    var p = id ? DB.playbook.find(function (x) { return x.id === id; }) : { name:'', description:'', rules:[], exitRules:[], idealRR:2, idealTimeframes:[] };
    var card = el('<div class="jr-detail jr-detail-wide"><div class="jr-detail-head"><b>' + (id ? 'ویرایش ستاپ' : 'ستاپ جدید') + '</b>' +
      '<button class="jr-hbtn jr-close" id="sp-close"><svg viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button></div>' +
      '<div class="jr-detail-body">' +
        field('نام ستاپ *', '<input class="jr-in" id="sp-name" value="' + esc(p.name) + '" placeholder="مثلاً شکست خط روند با تأیید حجم" title="نام ستاپ معاملاتی" autocomplete="off" />') +
        field('توضیح کوتاه', '<textarea class="jr-in jr-ta" id="sp-desc" rows="2" placeholder="در یکی دو جمله این ستاپ را توضیح بده…" title="توضیح مختصر درباره ستاپ">' + esc(p.description || '') + '</textarea>') +
        '<div class="jr-grid jr-grid-2">' +
          field('R:R ایده‌آل', '<input class="jr-in jr-num" id="sp-rr" type="text" inputmode="decimal" autocomplete="off" value="' + (p.idealRR || 2) + '" placeholder="مثلاً 3" title="نسبت ریسک به ریوارد ایده‌آل این ستاپ" />') +
          field('تایم‌فریم‌های مناسب', '<input class="jr-in" id="sp-tf" value="' + esc((p.idealTimeframes || []).join(', ')) + '" placeholder="مثلاً H1, H4" title="تایم‌فریم‌های مناسب — با کاما جدا کنید" autocomplete="off" />') +
        '</div>' +
        '<div class="jr-field"><span class="jr-flabel">قوانین ورود (هر خط یک قانون)</span><textarea class="jr-in jr-ta" id="sp-rules" rows="4" placeholder="هر قانون را در یک خط بنویس؛ مثلاً:&#10;کندل breakout با حجم بالا&#10;تأیید در تایم‌فریم بالاتر&#10;حد ضرر زیر کندل" title="قوانین ورود — در حالت چک‌لیست یک‌به‌یک تیک می‌خورند">' + esc((p.rules || []).join('\n')) + '</textarea></div>' +
        '<div class="jr-field"><span class="jr-flabel">قوانین خروج (هر خط یک قانون)</span><textarea class="jr-in jr-ta" id="sp-exit" rows="3" placeholder="هر قانون خروج را در یک خط بنویس…" title="قوانین خروج از معامله">' + esc((p.exitRules || []).join('\n')) + '</textarea></div>' +
      '</div>' +
      '<div class="jr-detail-foot">' + (id ? '<button class="jr-btn jr-btn-danger" id="sp-del">حذف ستاپ</button>' : '<span></span>') + '<button class="jr-btn jr-btn-primary" id="sp-save">ذخیره</button></div></div>');
    openPop(card);
    $id('sp-close').addEventListener('click', closePop);
    $id('sp-save').addEventListener('click', function () {
      var name = $id('sp-name').value.trim();
      if (!name) { toast('نام ستاپ الزامی است', 'error'); return; }
      var data = {
        name: name, description: $id('sp-desc').value.trim(),
        idealRR: num($id('sp-rr').value),
        idealTimeframes: $id('sp-tf').value.split(',').map(function (x) { return x.trim(); }).filter(Boolean),
        rules: $id('sp-rules').value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean),
        exitRules: $id('sp-exit').value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean)
      };
      if (id) { for (var k in data) p[k] = data[k]; }
      else { data.id = uuid(); DB.playbook.push(data); }
      save(); closePop(); toast('ستاپ ذخیره شد', 'good'); renderSetupCards();
    });
    if (id) $id('sp-del').addEventListener('click', function () {
      confirmDialog('این ستاپ حذف شود؟', function () {
        DB.playbook = DB.playbook.filter(function (x) { return x.id !== id; });
        save(); closePop(); toast('ستاپ حذف شد', 'info'); renderSetupCards();
      });
    });
  }

  function runChecklist(id) {
    var p = DB.playbook.find(function (x) { return x.id === id; });
    if (!p || !(p.rules || []).length) { toast('این ستاپ قانون ورودی ندارد', 'warn'); return; }
    var card = el('<div class="jr-detail"><div class="jr-detail-head"><b>چک‌لیست: ' + esc(p.name) + '</b>' +
      '<button class="jr-hbtn jr-close" id="cl-close"><svg viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button></div>' +
      '<div class="jr-detail-body"><div class="jr-checklist">' +
        p.rules.map(function (r, i) { return '<label class="jr-checkrow"><input type="checkbox" class="cl-item" data-i="' + i + '"/> <span>' + esc(r) + '</span></label>'; }).join('') +
      '</div><div class="jr-cl-status" id="cl-status"></div></div>' +
      '<div class="jr-detail-foot"><span class="jr-muted">با تیک همه‌ی موارد، معامله طبق پلن است</span><button class="jr-btn jr-btn-primary" id="cl-log" disabled>ثبت معامله طبق پلن</button></div></div>');
    openPop(card);
    function refresh() {
      var items = qsa('.cl-item', card);
      var done = items.filter(function (c) { return c.checked; }).length;
      var all = done === items.length;
      $id('cl-status').innerHTML = '<b class="' + (all ? 'jr-pos' : '') + '">' + done + ' / ' + items.length + '</b> مورد تکمیل شد' + (all ? ' ✓ معامله طبق پلن است' : '');
      $id('cl-log').disabled = !all;
    }
    qsa('.cl-item', card).forEach(function (c) { c.addEventListener('change', refresh); });
    refresh();
    $id('cl-close').addEventListener('click', closePop);
    $id('cl-log').addEventListener('click', function () {
      closePop();
      editingId = null; logMode = 'full';
      switchTab('log');
      // prefill setup + followedPlan + idealRR timeframe
      setTimeout(function () {
        var sEl = $id('f-setup'); if (sEl) sEl.value = p.name;
        var fp = $id('f-followedPlan'); if (fp) fp.checked = true;
        if (p.idealTimeframes && p.idealTimeframes[0]) { var tf = $id('f-timeframe'); if (tf) tf.value = p.idealTimeframes[0]; }
        var sym = $id('f-symbol'); if (sym) sym.focus();
        toast('چک‌لیست کامل شد — معامله را طبق پلن ثبت کنید', 'good');
      }, 50);
    });
  }

  /* ════════════════════════ Export menu & Settings ════════════════════════ */
  function openExportMenu() {
    var card = el('<div class="jr-detail"><div class="jr-detail-head"><b>خروجی و پشتیبان‌گیری</b>' +
      '<button class="jr-hbtn jr-close" id="ex-close"><svg viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button></div>' +
      '<div class="jr-detail-body jr-io-body">' +
        '<button class="jr-io-btn" id="ex-csv"><b>خروجی CSV</b><small>سازگار با اکسل فارسی (' + DB.trades.length + ' معامله)</small></button>' +
        '<button class="jr-io-btn" id="ex-json"><b>پشتیبان کامل (JSON)</b><small>معاملات، پلی‌بوک و یادداشت‌ها</small></button>' +
        '<label class="jr-io-btn"><b>بازیابی از پشتیبان (JSON)</b><small>ادغام بدون حذف داده‌ی فعلی</small><input type="file" id="ex-import" accept="application/json,.json" hidden /></label>' +
        '<label class="jr-io-btn"><b>درون‌ریزی تاریخچه MT4/MT5 (CSV)</b><small>فرمت استاندارد history اکسپورت‌شده</small><input type="file" id="ex-mt4" accept=".csv,text/csv" hidden /></label>' +
        '<div class="jr-io-storage">فضای ذخیره‌سازی: <b>' + Math.round(storageUsagePercent()) + '٪</b></div>' +
      '</div></div>');
    openPop(card);
    $id('ex-close').addEventListener('click', closePop);
    $id('ex-csv').addEventListener('click', function () { JournalIO.exportCSV(); toast('فایل CSV دانلود شد', 'good'); });
    $id('ex-json').addEventListener('click', function () { JournalIO.exportJSON(); toast('پشتیبان JSON دانلود شد', 'good'); });
    $id('ex-import').addEventListener('change', function () {
      var f = this.files[0]; if (!f) return;
      JournalIO.importJSON(f, function (err, added) {
        if (err) { toast('خطا در خواندن فایل: ' + err.message, 'error'); return; }
        closePop(); toast(added + ' معامله‌ی جدید وارد شد', 'good'); refreshButton(); switchTab('history');
      });
    });
    $id('ex-mt4').addEventListener('change', function () {
      var f = this.files[0]; if (!f) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var parsed = JournalIO.parseMT4CSV(reader.result);
          if (!parsed.length) { toast('معامله‌ای در فایل یافت نشد — فرمت را بررسی کنید', 'warn'); return; }
          parsed.forEach(function (t) { DB.trades.push(t); });
          save(); closePop(); toast(parsed.length + ' معامله از MT4 وارد شد', 'good'); refreshButton(); switchTab('history');
        } catch (e) { toast('خطا در پردازش فایل MT4', 'error'); }
      };
      reader.readAsText(f);
    });
  }

  function renderSettings() {
    var s = DB.settings;
    var card = el('<div class="jr-detail jr-detail-wide"><div class="jr-detail-head"><b>تنظیمات ژورنال</b>' +
      '<button class="jr-hbtn jr-close" id="se-close"><svg viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button></div>' +
      '<div class="jr-detail-body">' +
        '<div class="jr-grid jr-grid-2">' +
          field('موجودی اولیه حساب ($)', '<input class="jr-in jr-num" id="se-balance" type="text" inputmode="decimal" autocomplete="off" value="' + DB.accountBalance + '" placeholder="مثلاً 10000" title="موجودی پایه حساب — مبنای محاسبه درصد سود/زیان و ریسک" />') +
          field('ارز حساب', '<input class="jr-in" id="se-currency" value="' + esc(s.currency) + '" placeholder="USD" title="واحد پول حساب" autocomplete="off" />') +
        '</div>' +
        '<div class="jr-grid jr-grid-2">' +
          field('ریسک پیش‌فرض هر معامله (٪)', '<input class="jr-in jr-num" id="se-risk" type="text" inputmode="decimal" autocomplete="off" value="' + s.riskPerTrade + '" placeholder="مثلاً 1" title="درصد ریسک پیش‌فرض روی هر معامله" />') +
          field('حجم پیش‌فرض (لات)', '<input class="jr-in jr-num" id="se-lot" type="text" inputmode="decimal" autocomplete="off" value="' + s.defaultLotSize + '" placeholder="مثلاً 0.1" title="حجم پیش‌فرض که در فرم ثبت معامله قرار می‌گیرد" />') +
        '</div>' +
        field('نمادهای پرکاربرد', '<input class="jr-in" id="se-fav" value="' + esc((s.favSymbols || []).join(', ')) + '" placeholder="مثلاً EURUSD, XAUUSD, BTCUSD" title="نمادهای پرکاربرد برای دسترسی سریع‌تر — با کاما جدا کنید" autocomplete="off" />') +
        '<div class="jr-field"><span class="jr-flabel">نمایش</span>' +
          '<label class="jr-checkrow"><input type="checkbox" id="se-badge"' + (s.showBadge ? ' checked' : '') + '/> <span>نمایش badge تعداد معاملات امروز روی دکمه</span></label>' +
          '<label class="jr-checkrow"><input type="checkbox" id="se-remind"' + (s.dailyReminder ? ' checked' : '') + '/> <span>یادآوری روزانه (نقطه قرمز اگر امروز معامله‌ای ثبت نشده)</span></label>' +
          '<label class="jr-checkrow"><input type="checkbox" id="se-compact"' + (s.compactTable ? ' checked' : '') + '/> <span>حالت فشرده برای جدول تاریخچه</span></label>' +
        '</div>' +
        '<div class="jr-field"><span class="jr-flabel">ستون‌های جدول تاریخچه</span><div class="jr-colpick" id="se-cols">' +
          HIST_COLS.map(function (c) { var on = (s.hiddenCols || []).indexOf(c.k) < 0; return '<button type="button" class="jr-flag' + (on ? ' active' : '') + '" data-col="' + c.k + '">' + c.label + '</button>'; }).join('') +
        '</div></div>' +
      '</div>' +
      '<div class="jr-detail-foot"><span></span><button class="jr-btn jr-btn-primary" id="se-save">ذخیره تنظیمات</button></div></div>');
    openPop(card);
    $id('se-close').addEventListener('click', closePop);
    qsa('#se-cols .jr-flag', card).forEach(function (b) { b.addEventListener('click', function () { b.classList.toggle('active'); }); });
    $id('se-save').addEventListener('click', function () {
      DB.accountBalance = num($id('se-balance').value) || 0;
      s.currency = $id('se-currency').value.trim() || 'USD';
      s.riskPerTrade = num($id('se-risk').value);
      s.defaultLotSize = num($id('se-lot').value) || 0.1;
      s.favSymbols = $id('se-fav').value.split(',').map(function (x) { return x.trim(); }).filter(Boolean);
      s.showBadge = $id('se-badge').checked;
      s.dailyReminder = $id('se-remind').checked;
      s.compactTable = $id('se-compact').checked;
      s.hiddenCols = qsa('#se-cols .jr-flag', card).filter(function (b) { return !b.classList.contains('active'); }).map(function (b) { return b.getAttribute('data-col'); });
      // recompute metrics with new balance
      DB.trades.forEach(function (t) { Analytics.calcTradeMetrics(t); });
      save(); closePop(); toast('تنظیمات ذخیره شد', 'good'); refreshButton();
      if (current === 'analytics' || current === 'history') switchTab(current);
    });
  }

  /* ════════════════════════ small utils ════════════════════════ */
  function uniq(arr) { var seen = {}, out = []; arr.forEach(function (x) { if (!seen[x]) { seen[x] = 1; out.push(x); } }); return out; }
  function debounce(fn, ms) { var t; return function () { var a = arguments, c = this; clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms); }; }
  function dateF(id, label, val) { return '<label class="jr-filt" title="فیلتر ' + esc(label) + ' بر اساس تاریخ ورود"><span>' + label + '</span><input class="jr-in jr-in-sm" id="' + id + '" type="date" value="' + (val || '') + '" title="فیلتر ' + esc(label) + '" /></label>'; }
  function filtSel(id, label, opts, val) {
    return '<label class="jr-filt" title="فیلتر بر اساس ' + esc(label) + '"><span>' + label + '</span><div class="jr-selwrap"><select class="jr-sel jr-sel-sm" id="' + id + '" title="فیلتر بر اساس ' + esc(label) + '">' +
      opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(val || '') ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') +
      '</select><svg class="jr-sel-arrow" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div></label>';
  }

  /* ════════════════════════ INIT ════════════════════════ */
  function init() {
    load();
    // migrate: ensure metrics exist
    var dirty = false;
    DB.trades.forEach(function (t) {
      if (!t.flags) t.flags = {};
      if (t.pnlAmount == null) { Analytics.calcTradeMetrics(t); dirty = true; }
    });
    if (dirty) save();
    buildButton();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
