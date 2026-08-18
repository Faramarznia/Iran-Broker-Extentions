# Contributing Guide

Thanks for considering a contribution to Iran Broker New Tab. This guide covers local setup,
architecture rules that are non-negotiable for this codebase, and what to check before opening a
pull request.

## Core Principles

- **No build, no npm, no CDN.** Plain HTML/CSS/JS only. Do not introduce a bundler or a package
  manager without an explicit team decision — this is a deliberate constraint, not an oversight.
- **The live code is the source of truth, not the docs.** Before editing any file in
  `NewTab Extention/js/`, check `NewTab Extention/newtab.html` to confirm it is actually loaded via a
  `<script src="...">` tag (the current live-file list is in
  [`README.md`](README.md#repository-layout)).
- New features must reuse the existing design tokens defined at the top of `newtab.css` for each
  theme (`--primary`, `--orange` `#f6a723`, `--surface`, `--border`, etc.) and stay within the
  dashboard's dark/blue/amber visual identity.

## Development Setup

The extension's code is **not** at the repository root — it lives in `NewTab Extention/`.

1. Clone the repo.
2. `chrome://extensions` → enable Developer mode → "Load unpacked" → select the
   `NewTab Extention/` folder (not the repo root).
3. To see the effect of any change, click Reload on the extension in `chrome://extensions` (a page
   refresh is not enough).

## Architecture Rules (mandatory)

- **Manifest V3 + strict CSP**: `connect-src` only allows the domains listed in
  `NewTab Extention/manifest.json`. Adding a new domain means editing `manifest.json` **and**
  updating `DATA-SOURCES.md` in the same change.
- No `inline script` or inline event handler is allowed inside HTML — neither in
  `newtab.html` nor in HTML generated at runtime via `innerHTML`.
- Every `fetch` must use `AbortController` with a timeout (8 seconds by default, via the shared
  `fetchTimeout()` pattern already used in each file), and most widgets should define a static
  fallback for when the network call fails.
- State is kept only in `localStorage` — **there must be zero `chrome.storage.*` calls**; the
  `storage` permission was intentionally removed from the manifest for this reason. No user data may
  be sent to a server without explicit consent.
- RTL support and the Jalali (Persian) calendar must be preserved in any new UI.
- **Responsive design**: this codebase does not have a clean two-tier breakpoint system. The real
  CSS has 8 different breakpoints (`560px`, `680px`, `700px`, `720px`, `760px`, `900px`/`920px`,
  `1080px`, `1099px`, plus `1400px` for the hub/bento grid — documented in
  `NewTab Extention/qa-reports/01-visual-regression-3-breakpoints.md`). Reuse an existing breakpoint
  for new work rather than introducing an arbitrary new one.

## Before Opening a Pull Request

- [ ] Verified the change at least at two different widths (e.g. below 700px and above 1400px) and
      in RTL mode.
- [ ] If a new domain is fetched, it has been added to both `NewTab Extention/manifest.json`
      (`connect-src`/`host_permissions`) and `DATA-SOURCES.md`.
- [ ] If a file was added to or removed from `newtab.html`, `README.md`'s Repository Layout section
      has been updated — documentation must never lag behind the code.
- [ ] For visual changes, before/after screenshots are attached (use the tooling in
      `NewTab Extention/qa-reports/tools/` if applicable).
- [ ] No API key or secret is hardcoded and committed.

## Commit Messages

This project uses [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`,
`docs:`, `chore:`, `refactor:`.

Example: `fix(journal): resolve live-price autofill using data-pxid instead of data-symbol`
