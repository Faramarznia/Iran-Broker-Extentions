# Security Policy

> Verified against today's code, not against the state of a prior audit. Last verified: 2026-08-18.

## Reporting a Vulnerability

If you discover a security vulnerability, please **do not open a public Issue**. Contact the Iran
Broker product team directly through an internal/security channel. Do not disclose technical details
of the vulnerability publicly until it has been fully resolved.

## Supported Versions

Only the latest version published on the Chrome Web Store receives security fixes. Older versions
are not supported — users should update to the latest release.

| Version | Supported |
|---|---|
| Latest (Chrome Web Store) | ✅ |
| Older releases | ❌ |

## Known Issues (in progress)

- **API key exposed in client code (P0 — REQ-1, still open):** the "Aira" chat service
  (`NewTab Extention/js/airo.js`) currently keeps its API key hardcoded in code that runs in the
  user's browser. Anyone using browser developer tools can extract this key. Fixing this requires
  routing Aira's calls through a backend proxy so the key is never shipped to the client. Until it is
  fully resolved, treat this key as carrying financial-abuse risk and keep its access/usage limits
  restricted.

## Permissions & Access Level

- **Chrome permissions:** only `notifications` (used to show the native "focus session ended"
  notification via the standard Web Notification API, not `chrome.notifications`). The `storage`
  permission was already removed from `manifest.json` in an earlier audit because there were zero
  `chrome.storage.*` calls in the code — all local storage uses standard `localStorage`. No other
  permission (tabs, history, cookies, etc.) is requested.
- **Network access:** only to the domains listed in `NewTab Extention/manifest.json`
  (`connect-src`/`host_permissions`); full list in [DATA-SOURCES.md](DATA-SOURCES.md). Any request to
  another origin is blocked by CSP.
- **User data:** all state (settings, journal entries, focus sessions) is stored only in the user's
  local browser, with no cross-device sync. The only exception is Aira chat messages, which are sent
  directly to the active AI service (`api.gapgpt.app`). Users can enable "private mode" in the chat
  header so that conversations are not written to `localStorage` (the message is still sent to the AI
  service to get a response — only local persistence is disabled).

## Scope

This policy covers the Chrome extension source in `NewTab Extention/`. It does not cover
`iranbroker.net` or `forum.iranbroker.net`, which are separate systems outside this repository.
