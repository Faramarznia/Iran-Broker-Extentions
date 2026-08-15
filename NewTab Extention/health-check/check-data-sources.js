#!/usr/bin/env node
// Daily health check for every external data source "تب جدید ایران بروکر" depends on.
// Hits each real endpoint directly (Node's built-in fetch, no browser needed — this
// represents what the shipped extension actually experiences better than the qa-reports/
// harness did, since host_permissions means the real extension is never subject to CORS,
// unlike the file:// testing used there).
//
// Run: node check-data-sources.js
// Writes: reports/<YYYY-MM-DD>.md (dated history) and STATUS.md (always the latest run).
// Exit code: 0 if everything is UP, 1 if anything is DOWN (so cron/CI can alert on failure).
'use strict';
const fs = require('fs');
const path = require('path');

const REPORT_DIR = path.join(__dirname, 'reports');
const now = new Date();
const isoDate = now.toISOString().slice(0, 10);
const isoStamp = now.toISOString();

function timeoutFetch(url, opts, ms) {
  const ctl = new AbortController();
  const to = setTimeout(() => ctl.abort(), ms || 10000);
  const start = Date.now();
  return fetch(url, { ...opts, signal: ctl.signal })
    .then((r) => ({ res: r, ms: Date.now() - start }))
    .finally(() => clearTimeout(to));
}

async function check(name, url, opts, validate) {
  const start = Date.now();
  try {
    const { res, ms } = await timeoutFetch(url, opts || {}, 10000);
    let bodyOk = true;
    let bodyNote = '';
    if (validate) {
      try {
        const text = await res.text();
        const v = validate(res, text);
        bodyOk = v.ok;
        bodyNote = v.note || '';
      } catch (e) {
        bodyOk = false;
        bodyNote = 'validate() threw: ' + e.message;
      }
    }
    const httpOk = res.status >= 200 && res.status < 400;
    const status = httpOk && bodyOk ? 'UP' : httpOk ? 'DEGRADED' : 'DOWN';
    return { name, url, status, httpStatus: res.status, ms, note: bodyNote };
  } catch (e) {
    return { name, url, status: 'DOWN', httpStatus: null, ms: Date.now() - start, note: e.name === 'AbortError' ? 'timeout (>10s)' : String(e.message || e) };
  }
}

// A GET/POST with no (or intentionally invalid) auth against a paid AI endpoint — a 401/403
// proves the server is up and responding without spending any tokens on a real completion.
async function checkAuthWall(name, url, body) {
  const start = Date.now();
  try {
    const { res, ms } = await timeoutFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
    }, 10000);
    const status = (res.status === 401 || res.status === 403) ? 'UP'
      : (res.status >= 200 && res.status < 500) ? 'DEGRADED'
      : 'DOWN';
    return { name, url, status, httpStatus: res.status, ms, note: 'auth-wall check (no real request sent, no tokens spent)' };
  } catch (e) {
    return { name, url, status: 'DOWN', httpStatus: null, ms: Date.now() - start, note: e.name === 'AbortError' ? 'timeout (>10s)' : String(e.message || e) };
  }
}

async function checkTgju() {
  const HOSTS = ['https://call2.tgju.org/ajax.json', 'https://call3.tgju.org/ajax.json'];

  // 1) each mirror individually, so a single dead mirror is visible even when failover masks it
  const individual = [];
  for (const host of HOSTS) {
    individual.push(await check(host, host, {}, (res, text) => {
      let json;
      try { json = JSON.parse(text); } catch (e) { return { ok: false, note: 'پاسخ JSON معتبر نیست' }; }
      const cur = json.current || json;
      return { ok: !!(cur && typeof cur === 'object'), note: cur ? '' : 'شکل داده غیرمنتظره' };
    }));
  }

  // 2) the actual production race: both hosts concurrently under one shared AbortController/
  //    budget, exactly mirroring fetchTgju() in newtab.js — under real traffic, not simulated.
  const ctl = new AbortController();
  const to = setTimeout(() => ctl.abort(), 9000);
  const raceStart = Date.now();
  let winner = null;
  let raceError = null;
  try {
    const attempts = HOSTS.map((host) =>
      fetch(host, { signal: ctl.signal }).then((r) => {
        if (!r.ok) throw new Error('http ' + r.status);
        return { host, r };
      })
    );
    const result = await Promise.any(attempts);
    winner = result.host;
  } catch (e) {
    raceError = e.errors ? e.errors.map((x) => String(x.message || x)).join('; ') : String(e.message || e);
  } finally {
    clearTimeout(to);
  }
  const raceMs = Date.now() - raceStart;

  return {
    individual,
    race: {
      winner,
      ms: raceMs,
      status: winner ? (raceMs < 3000 ? 'UP' : 'DEGRADED') : 'DOWN',
      note: winner ? `${winner.replace('https://', '').split('/')[0]} برنده شد` : ('هر دو میزبان شکست خوردند: ' + raceError),
    },
  };
}

(async () => {
  const results = [];

  results.push(await check('CoinGecko (تب کریپتو)',
    'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum&order=market_cap_desc&sparkline=false',
    {}, (res, text) => {
      let json; try { json = JSON.parse(text); } catch (e) { return { ok: false, note: 'JSON نامعتبر' }; }
      return { ok: Array.isArray(json) && json.length > 0, note: Array.isArray(json) ? '' : 'شکل غیرمنتظره' };
    }));

  results.push(await check('Yahoo Finance (تب فارکس)',
    'https://query1.finance.yahoo.com/v8/finance/chart/EURUSD=X?range=1d&interval=30m',
    {}, (res, text) => {
      let json; try { json = JSON.parse(text); } catch (e) { return { ok: false, note: 'JSON نامعتبر' }; }
      const ok = !!(json && json.chart && json.chart.result && json.chart.result[0] && json.chart.result[0].meta);
      return { ok, note: ok ? '' : 'شکل غیرمنتظره (Yahoo endpoint غیررسمی است، ممکن است بدون اطلاع تغییر کند)' };
    }));

  const tgju = await checkTgju();
  results.push(...tgju.individual);

  results.push(await check('TSETMC (تب بورس)',
    'https://cdn.tsetmc.com/api/ClosingPrice/GetMarketOverview/1',
    {}, (res, text) => {
      let json; try { json = JSON.parse(text); } catch (e) { return { ok: false, note: 'JSON نامعتبر — از خارج ایران معمولاً محدود است' }; }
      const ok = !!(json && (json.marketOverview || json.MarketOverview));
      return { ok, note: ok ? '' : 'شکل غیرمنتظره یا محدودیت جغرافیایی' };
    }));

  results.push(await check('Forex Factory Calendar (nfs.faireconomy.media)',
    'https://nfs.faireconomy.media/ff_calendar_thisweek.json',
    {}, (res, text) => {
      let json; try { json = JSON.parse(text); } catch (e) { return { ok: false, note: 'JSON نامعتبر' }; }
      return { ok: Array.isArray(json), note: Array.isArray(json) ? '' : 'شکل غیرمنتظره' };
    }));

  results.push(await check('iranbroker.net (WP REST — فید/مقالات)',
    'https://iranbroker.net/wp-json/wp/v2/posts?per_page=1&_fields=id,title',
    {}, (res, text) => {
      let json; try { json = JSON.parse(text); } catch (e) { return { ok: false, note: 'JSON نامعتبر' }; }
      return { ok: Array.isArray(json), note: Array.isArray(json) ? '' : 'شکل غیرمنتظره' };
    }));

  results.push(await check('forum.iranbroker.net (سایدبار جامعه)',
    'https://forum.iranbroker.net/hot.json',
    {}, (res, text) => {
      let json; try { json = JSON.parse(text); } catch (e) { return { ok: false, note: 'JSON نامعتبر' }; }
      return { ok: !!(json && json.topic_list), note: json && json.topic_list ? '' : 'شکل غیرمنتظره' };
    }));

  results.push(await check('Open-Meteo (آب‌وهوا)',
    'https://api.open-meteo.com/v1/forecast?latitude=35.7&longitude=51.4&current=temperature_2m',
    {}, (res, text) => {
      let json; try { json = JSON.parse(text); } catch (e) { return { ok: false, note: 'JSON نامعتبر' }; }
      return { ok: !!(json && json.current), note: json && json.current ? '' : 'شکل غیرمنتظره' };
    }));

  results.push(await check('Open-Meteo Geocoding (جست‌وجوی شهر)',
    'https://geocoding-api.open-meteo.com/v1/search?name=Tehran&count=1',
    {}, (res, text) => {
      let json; try { json = JSON.parse(text); } catch (e) { return { ok: false, note: 'JSON نامعتبر' }; }
      return { ok: true, note: '' }; // empty results[] is a legitimate answer, not a failure
    }));

  results.push(await checkAuthWall('GapGPT (آیرو، فعال)', 'https://api.gapgpt.app/v1/chat/completions', { model: 'gpt-4o', messages: [] }));
  results.push(await checkAuthWall('Anthropic (آیرو، جایگزین غیرفعال)', 'https://api.anthropic.com/v1/messages', {}));

  // ---- render report ----
  const allChecks = [...results, tgju.race];
  const downCount = allChecks.filter((r) => r.status === 'DOWN').length;
  const degradedCount = allChecks.filter((r) => r.status === 'DEGRADED').length;
  const upCount = allChecks.filter((r) => r.status === 'UP').length;

  const icon = (s) => s === 'UP' ? '🟢' : s === 'DEGRADED' ? '🟡' : '🔴';

  let md = `# وضعیت منابع داده — ${isoDate}\n\n`;
  md += `اجرا در ${isoStamp} · ✅ ${upCount} سالم · ⚠️ ${degradedCount} کند/نامطمئن · ❌ ${downCount} قطع\n\n`;
  md += `| منبع | وضعیت | HTTP | تأخیر | یادداشت |\n|---|---|---|---|---|\n`;
  for (const r of results) {
    md += `| ${r.name} | ${icon(r.status)} ${r.status} | ${r.httpStatus ?? '—'} | ${r.ms}ms | ${r.note || '—'} |\n`;
  }

  md += `\n## ⭐ Failover TGJU زیر ترافیک واقعی\n\n`;
  md += `این بخش دقیقاً همان منطق \`fetchTgju()\` در \`newtab.js\` را با ترافیک واقعی (نه شبیه‌سازی) اجرا می‌کند: هر دو میزبان هم‌زمان زیر یک بودجهٔ ۹۰۰۰ میلی‌ثانیه‌ای مشترک.\n\n`;
  md += `| میزبان برنده | زمان تا پاسخ | وضعیت |\n|---|---|---|\n`;
  md += `| ${tgju.race.winner || '—'} | ${tgju.race.ms}ms | ${icon(tgju.race.status)} ${tgju.race.status} — ${tgju.race.note} |\n`;
  if (tgju.individual.some((r) => r.status !== 'UP')) {
    md += `\n⚠️ حداقل یکی از دو میزبان به‌تنهایی مشکل داشت (جدول بالا) — حتی اگر failover موفق بود، این را نادیده نگیرید چون یعنی محصول الان روی **یک** میزبان تکیه دارد، نه دو تا.\n`;
  }

  if (downCount > 0) {
    md += `\n## 🔴 نیاز به توجه فوری\n\n`;
    allChecks.filter((r) => r.status === 'DOWN').forEach((r) => {
      md += `- **${r.name || 'TGJU failover'}**: ${r.note}\n`;
    });
  }

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(path.join(REPORT_DIR, `${isoDate}.md`), md);
  fs.writeFileSync(path.join(__dirname, 'STATUS.md'), md);
  fs.writeFileSync(path.join(REPORT_DIR, `${isoDate}.json`), JSON.stringify({ date: isoStamp, results, tgjuRace: tgju.race }, null, 2));

  console.log(md);
  process.exit(downCount > 0 ? 1 : 0);
})();
