// Shared helper: launches the system Chrome with "تب جدید ایران بروکر" loaded as an
// unpacked MV3 extension, and opens its real newtab.html override page (not about:blank).
//
// ⚠️ NOT CURRENTLY WORKING IN THIS ENVIRONMENT. --load-extension silently loads zero
// extensions under Chrome 151.0.7922.76 / macOS 26.1 — verified with a from-scratch trivial
// 3-line MV3 manifest too, so it is not specific to this project. All qa-reports/tools/*.js
// scripts use launch-page.js (file:// navigation) instead — see the long comment at the top
// of that file for the full diagnostic record and why it's still a fair substitute. Kept
// here, unmodified from the version that was being debugged, in case a future Chrome/macOS
// combination fixes whatever changed — re-test this file first before re-writing it.
'use strict';
const puppeteer = require('puppeteer-core');
const path = require('path');
const os = require('os');
const fs = require('fs');

const CHROME_PATH = process.env.CHROME_PATH ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const EXT_PATH = path.resolve(__dirname, '..', '..'); // "NewTab Extention/"

async function launchWithExtension({ width = 1400, height = 900, userDataDir = null, freshProfile = true } = {}) {
  let profileDir = userDataDir;
  if (!profileDir) {
    profileDir = freshProfile
      ? fs.mkdtempSync(path.join(os.tmpdir(), 'ib-newtab-qa-'))
      : path.join(os.tmpdir(), 'ib-newtab-qa-persistent');
  }
  if (!userDataDir && !freshProfile && !fs.existsSync(profileDir)) fs.mkdirSync(profileDir, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    // Puppeteer's own defaultArgs() silently includes --disable-extensions, which wins
    // over --disable-extensions-except unless explicitly stripped out here.
    ignoreDefaultArgs: ['--disable-extensions'],
    args: [
      `--disable-extensions-except=${EXT_PATH}`,
      `--load-extension=${EXT_PATH}`,
      `--user-data-dir=${profileDir}`,
      `--window-size=${width},${height}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-sync',
    ],
    defaultViewport: { width, height },
  });

  // Give the extension a moment to register before we ask Chrome to resolve chrome://newtab.
  await new Promise((r) => setTimeout(r, 300));

  // In headless=new automation, navigating to chrome://newtab resolves to Chrome's own
  // built-in NTP (chrome://new-tab-page/) rather than triggering the extension's
  // chrome_url_overrides.newtab the way a real "open a new tab" UI action would. So we
  // find the unpacked extension's id directly via chrome://extensions (piercing its
  // Shadow DOM) and navigate straight to its newtab.html — that's the page under test
  // either way, and every one of the 7 QA tasks cares about that page's behavior, not
  // about the chrome://newtab URL-resolution mechanism itself.
  const extPage = await browser.newPage();
  await extPage.goto('chrome://extensions/', { waitUntil: 'networkidle2', timeout: 20000 });
  const extensionId = await extPage.evaluate(() => {
    const mgr = document.querySelector('extensions-manager');
    if (!mgr || !mgr.shadowRoot) return null;
    const list = mgr.shadowRoot.querySelector('extensions-item-list');
    if (!list || !list.shadowRoot) return null;
    const item = list.shadowRoot.querySelector('extensions-item');
    return item ? item.id : null;
  });
  await extPage.close();

  if (!extensionId) {
    throw new Error('Could not find the loaded extension on chrome://extensions — it may have failed to load; check --load-extension errors.');
  }

  const page = await browser.newPage();
  const consoleMessages = [];
  const pageErrors = [];
  page.on('console', (msg) => consoleMessages.push({ type: msg.type(), text: msg.text() }));
  page.on('pageerror', (err) => pageErrors.push(String(err)));

  await page.goto(`chrome-extension://${extensionId}/newtab.html`, { waitUntil: 'networkidle2', timeout: 20000 });

  return { browser, page, profileDir, extensionId, consoleMessages, pageErrors };
}

module.exports = { launchWithExtension, EXT_PATH, CHROME_PATH };
