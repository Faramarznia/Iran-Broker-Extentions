# Iran Broker New Tab

A Chrome extension (Manifest V3) that turns the browser's New Tab page into a trading dashboard for
Persian-speaking forex/crypto/stock traders: live market prices, an economic calendar, a content feed,
a trading journal, a focus mode, and an AI assistant ("Aira" — آیرا).

> ⚠️ This README was rewritten from a direct audit of today's code, not from prior documentation. If
> you find a discrepancy between this document and the current code, **the code is the source of
> truth** — please open an Issue.

The extension's source lives in [`NewTab Extention/`](NewTab%20Extention/), not the repo root (see
[Repository Layout](#repository-layout) below). Detailed, extension-specific documentation in Persian
is also maintained there: [`NewTab Extention/README.md`](NewTab%20Extention/README.md) and
[`NewTab Extention/DATA-SOURCES.md`](NewTab%20Extention/DATA-SOURCES.md).

## Features

- Live prices across 4 markets: crypto, forex/gold/oil/DXY, Iran's free-market rates (USD/gold/coins), Tehran Stock Exchange
- Economic calendar and a daily hub (weather, occasions, customizable quick-access grid)
- Trading journal: manual entry, import from MT4 history (CSV), CSV export compatible with Persian Excel, R:R stats, and a daily heatmap
- Focus mode: Pomodoro / trading-session timer with ambient sound
- "Aira" AI assistant for market questions and broker recommendations — responses are streamed
- Articles sidebar and a "community hot topics" sidebar

## Repository Layout

```
Iran-Broker-Extentions/
├── README.md                  ← this file (English, project-wide entry point)
├── CONTRIBUTING.md            ← contribution guide
├── SECURITY.md                ← security policy
├── DATA-SOURCES.md            ← external APIs / domains reference
└── NewTab Extention/          ← the actual extension source (yes, "Extention" — kept as-is, it's
                                  the real directory name in this repo)
    ├── manifest.json          ← Manifest V3, permissions, CSP
    ├── newtab.html            ← markup (no inline scripts/handlers)
    ├── newtab.css
    ├── newtab.js               ← core: clock/date, search, per-tab live prices, feed, settings
    ├── js/
    │   ├── init-state.js       ← pre-paint theme/layout sync (prevents flash on load)
    │   ├── airo.js              ← "Aira" AI assistant
    │   ├── focus.js              ← Focus Mode / Pomodoro
    │   ├── journal.js             ← trading journal
    │   ├── hub.js                  ← daily hub (calendar, weather, quick access)
    │   ├── articles.js              ← articles sidebar
    │   ├── sidebars.js               ← shared open/close control for sidebars
    │   └── tour.js                    ← first-run onboarding tour
    ├── README.md               ← detailed Persian docs (extension-specific)
    └── DATA-SOURCES.md         ← detailed Persian data-sources reference
```

Everything that actually loads is 9 independent scripts (IIFEs) tagged with `<script src="...">` in
`newtab.html` — there is no build step, no bundler, and no ES modules. Full breakdown with line
numbers in [`NewTab Extention/README.md`](NewTab%20Extention/README.md).

## Architecture at a Glance

**No build, no npm, no bundler.** The product is plain HTML/CSS/JS. Every code change takes effect
only after clicking Reload on the extension in `chrome://extensions` (a page refresh is not enough).

Each widget owns an independent `localStorage` key (e.g. `ib_newtab_v2`, `ib_focus_v3`,
`ib_journal_v1`). There are **zero `chrome.storage.*` calls** anywhere in the code — the `storage`
permission was already removed from `manifest.json` for that reason (the current permission list is
just `notifications`). There is no cross-device sync. No user data is sent to any server except chat
messages sent to the Aira AI service — see [SECURITY.md](SECURITY.md) for details.

## Local Development

```bash
git clone https://github.com/Faramarznia/Iran-Broker-Extentions.git
cd "Iran-Broker-Extentions/NewTab Extention"
```

1. Enable Developer mode in `chrome://extensions`.
2. Click "Load unpacked" and select the `NewTab Extention` folder (**not** the repo root).
3. Open a new tab to see the dashboard.
4. After every code change, click the Reload button for the extension in `chrome://extensions`.

See [CONTRIBUTING.md](CONTRIBUTING.md) for architecture rules and the pull request checklist.

## Data Sources & Permissions

Full list of allowed domains, consumed APIs, and which file uses which data source: see
[DATA-SOURCES.md](DATA-SOURCES.md).

## Security

Known security issues (including the current status of the Aira API key) and how to report a
vulnerability: see [SECURITY.md](SECURITY.md).

## License

Proprietary — Iran Broker. Copying or redistribution without permission is prohibited.
