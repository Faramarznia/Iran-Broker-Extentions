// Background service worker.
// Strips framing-protection headers (X-Frame-Options / Content-Security-Policy
// frame-ancestors) from web.telegram.org responses so the Telegram web app can
// be embedded inside the left sidebar iframe on the new tab page.
//
// IMPORTANT: the message listener is registered FIRST and unconditionally, and
// every chrome.declarativeNetRequest access is guarded, so the worker can never
// crash at load — otherwise the panel's diagnostic gets "Receiving end does not
// exist" and we learn nothing.

const TG_RULE_ID = 1001;

const TG_RULE = {
  id: TG_RULE_ID,
  priority: 1,
  action: {
    type: 'modifyHeaders',
    responseHeaders: [
      { header: 'x-frame-options', operation: 'remove' },
      { header: 'content-security-policy', operation: 'remove' },
      { header: 'content-security-policy-report-only', operation: 'remove' }
    ]
  },
  condition: {
    urlFilter: '||web.telegram.org',
    resourceTypes: ['main_frame', 'sub_frame']
  }
};

// ── Diagnostic responder (registered first, fully guarded) ──────────────────
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (!msg || msg.type !== 'tg-diag') return;
  var dnr = chrome.declarativeNetRequest;
  if (!dnr) { sendResponse({ apiInSw: false }); return; }
  var getMatched = dnr.getMatchedRules
    ? dnr.getMatchedRules({}).catch(function () { return { rulesMatchedInfo: [] }; })
    : Promise.resolve({ rulesMatchedInfo: [] });
  Promise.all([dnr.getDynamicRules(), getMatched])
    .then(function (res) {
      var rules = res[0] || [];
      var matched = (res[1] && res[1].rulesMatchedInfo) || [];
      sendResponse({
        apiInSw: true,
        registered: rules.some(function (r) { return r.id === TG_RULE_ID; }),
        matched: matched.filter(function (m) {
          return m.rule && (m.rule.ruleId === TG_RULE_ID || m.rule.ruleId === 1);
        }).length
      });
    })
    .catch(function (e) { sendResponse({ apiInSw: true, error: String(e) }); });
  return true; // keep the channel open for the async response
});

// ── Register the un-frame rule as a dynamic rule (persists across restarts) ──
async function ensureTelegramRule() {
  try {
    if (!chrome.declarativeNetRequest) {
      console.warn('[IranBroker] declarativeNetRequest is NOT available in the service worker — permission inactive.');
      return;
    }
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [TG_RULE_ID],
      addRules: [TG_RULE]
    });
    const rules = await chrome.declarativeNetRequest.getDynamicRules();
    console.log('[IranBroker] Telegram un-frame rule active:', rules);
  } catch (e) {
    console.error('[IranBroker] Failed to register Telegram rule:', e);
  }
}

chrome.runtime.onInstalled.addListener(ensureTelegramRule);
chrome.runtime.onStartup.addListener(ensureTelegramRule);
ensureTelegramRule();

// ── Optional matched-rule logging (guarded; dev/unpacked only) ──────────────
try {
  if (chrome.declarativeNetRequest && chrome.declarativeNetRequest.onRuleMatchedDebug) {
    chrome.declarativeNetRequest.onRuleMatchedDebug.addListener(function (info) {
      console.log('[IranBroker] DNR rule matched →', info.request && info.request.url, info.rule);
    });
  }
} catch (e) {
  console.warn('[IranBroker] onRuleMatchedDebug unavailable:', e);
}
