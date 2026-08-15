// Primary test harness for qa-reports/tools/*.js.
//
// launch-extension.js (loading the unpacked MV3 extension via --load-extension and driving
// chrome-extension://<id>/newtab.html) is the "correct" way to test this, but it does not
// work in this environment: --load-extension silently loads zero extensions under Chrome
// 151.0.7922.76 on macOS 26.1, even for a from-scratch trivial 3-line MV3 manifest with no
// permissions — confirmed not project-specific. Tried: headless=new and headed, ignoring
// Puppeteer's injected --disable-extensions, --enable-unsafe-extension-debugging, and
// pre-seeding Default/Preferences with extensions.ui.developer_mode=true. None changed the
// result (only Chrome's own built-in component extensions ever appear in chrome://extensions
// or the /json/list CDP endpoint). See qa-reports/README.md for the full record.
//
// Fallback used here instead: open newtab.html directly via a file:// URL. This is a fair
// substitute for everything these 7 QA tasks actually probe (rendering, RTL layout, fetch/
// timeout/fallback logic, localStorage integrity, paint timing) because the page makes zero
// use of chrome.* APIs beyond what any page already has — chrome.storage is provably unused
// (grepped, zero hits; everything persists via plain localStorage) and chrome.notifications
// is unused too (only the standard Web Notification API, gated on the same-origin permission
// prompt regardless of extension context). The one real gap: fetches that rely on the
// extension's host_permissions CORS exemption will fail under file://'s "null" origin if the
// target API doesn't itself send permissive CORS headers — each report calls this out
// per-domain rather than asserting a false PASS.
'use strict';
const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = process.env.CHROME_PATH ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const NEWTAB_PATH = path.resolve(__dirname, '..', '..', 'newtab.html');
const NEWTAB_URL = `file://${NEWTAB_PATH}`;

async function launchPage({ width = 1400, height = 900, headless = 'new', extraArgs = [] } = {}) {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless,
    args: [`--window-size=${width},${height}`, ...extraArgs],
    defaultViewport: { width, height },
  });
  const page = await browser.newPage();
  const consoleMessages = [];
  const pageErrors = [];
  const failedRequests = [];
  page.on('console', (msg) => consoleMessages.push({ type: msg.type(), text: msg.text() }));
  page.on('pageerror', (err) => pageErrors.push(String(err)));
  page.on('requestfailed', (req) => failedRequests.push({ url: req.url(), reason: req.failure() && req.failure().errorText }));
  return { browser, page, consoleMessages, pageErrors, failedRequests };
}

async function gotoNewtab(page, opts = {}) {
  return page.goto(NEWTAB_URL, { waitUntil: 'networkidle2', timeout: 20000, ...opts });
}

module.exports = { launchPage, gotoNewtab, NEWTAB_PATH, NEWTAB_URL, CHROME_PATH };
