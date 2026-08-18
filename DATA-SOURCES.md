# Data Sources & APIs

> All paths below are relative to `NewTab Extention/`, the actual extension source directory — not
> the repo root. Every row in the table was verified against today's code with `grep`, not assumed
> from prior documentation.
>
> Historical note: very old versions of this document incorrectly listed the Iran-market/stock
> exchange domain as `call4.tgju.org` (confirmed via `git log -p` — that string genuinely exists in
> this file's history). Both the current code and this document use `call2.tgju.org` +
> `call3.tgju.org`.

## Summary Table (live files only)

| Dashboard section | Live file | Data source | Access type | Cache / frequency |
|---|---|---|---|---|
| Live crypto prices | [newtab.js](NewTab%20Extention/newtab.js) | `api.coingecko.com` | Public API (no key) | every 90s |
| Forex / gold / oil / DXY | [newtab.js](NewTab%20Extention/newtab.js) | `query1.finance.yahoo.com` (unofficial endpoint) | Public API (no key) | every 90s |
| Iran free-market rates (USD, gold, coins) & Tehran Stock Exchange | [newtab.js](NewTab%20Extention/newtab.js) | `call2.tgju.org` + `call3.tgju.org` (mirror pair, failover) + `cdn.tsetmc.com` for equal-weight/OTC index | Public API (CORS may restrict) | every 90s |
| Economic calendar (inside Hub mode) | [hub.js](NewTab%20Extention/js/hub.js) | `nfs.faireconomy.media` (Forex Factory weekly feed) | Public JSON API | on Hub open |
| Weather | [hub.js](NewTab%20Extention/js/hub.js) | `api.open-meteo.com` | Public API (no key) | on Hub open |
| City search for weather | [hub.js](NewTab%20Extention/js/hub.js) | `geocoding-api.open-meteo.com` | Public API (no key) | while user types |
| Main content feed + articles sidebar | [newtab.js](NewTab%20Extention/newtab.js), [articles.js](NewTab%20Extention/js/articles.js) | `iranbroker.net` (WordPress REST `wp-json`) with fallback to RSS (`iranbroker.net/feed/`) | Our own site's public REST/RSS | every 30 min (cached) |
| "Community hot topics" sidebar | [newtab.js](NewTab%20Extention/newtab.js) | `forum.iranbroker.net` (`/latest.json`, `/hot.json`) | Public Discourse API | on sidebar open |
| "Aira" AI chat assistant | [airo.js](NewTab%20Extention/js/airo.js) | `api.gapgpt.app` (active default) or `api.anthropic.com` (alternate, intentionally disabled) | Key-based API — the key is currently exposed client-side, ⚠️ see [SECURITY.md](SECURITY.md) | on every user message |
| — | [init-state.js](NewTab%20Extention/js/init-state.js) | none | `localStorage` only, no network calls | — |
| — | [journal.js](NewTab%20Extention/js/journal.js), [focus.js](NewTab%20Extention/js/focus.js), [sidebars.js](NewTab%20Extention/js/sidebars.js), [tour.js](NewTab%20Extention/js/tour.js) | none | fully local, `localStorage` only | — |

## Domains Allowed in the Manifest

`host_permissions`/CSP `connect-src` in `NewTab Extention/manifest.json` contains exactly the 12
domains in the table above — no more, no fewer. The domains below **used to be in the manifest and
were fully removed** (not merely unused-but-present) because no live file called them:

- `query2.finance.yahoo.com`
- `open.er-api.com`
- `api.accesstoexchange.com`
- `api.frankfurter.app` (its only consumer was `js/watchlist.js`, part of the dead module tree)

If any document still lists those four domains as "granted but unused," that document is stale.

## Files/Domains Tied to Code That No Longer Loads (Legacy)

- The dead ES module tree (`js/main.js` and the 20 files it imported — `store.js`, `settings.js`,
  `calendar.js`, `crypto.js`, `watchlist.js`, `feed.js`, `community.js`, `alerts.js`,
  `iran-market.js`, and others) was never loaded via `<script>` in `newtab.html` and has been deleted
  from the repo. If a domain was only ever called from these files (e.g. `api.frankfurter.app`), it
  is not part of the actual product.
- `js/news-timeline.js` (the forex news ribbon, formerly a consumer of `nfs.faireconomy.media`) was
  added for a short period but reverted in commit `75ed28a` — it no longer exists in the repo. The
  only current consumer of `nfs.faireconomy.media` is `js/hub.js` (see table above).

## What "Scraping" Is Not Happening Here

- The "community hot topics" sidebar talks to Discourse's public API, not HTML scraping.
- The content feed and articles sidebar use the official WordPress REST API (`wp-json`) or the
  standard RSS feed of our own site (`iranbroker.net`), not scraping of another site.

## Security Note

Details on the exposed Aira API key are documented in [SECURITY.md](SECURITY.md).

---

Last verified against live code: 2026-08-18 (every row above was confirmed with `grep`/direct
inspection of `newtab.html` and `manifest.json` on that date).
