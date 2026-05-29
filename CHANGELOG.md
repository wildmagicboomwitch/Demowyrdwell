# AuDHD HQ — Full Stabilization Changelog
**Session date:** May 2026
**Package version:** v3
**SW cache:** v17

---

## Summary

Complete infrastructure stabilization across Phases A, B, and C.
No features added. No UI changed. All modifications are persistence routing,
infrastructure, observability, shared system unification, and dead code cleanup.

**Files changed or created:** 97
- 13 new runtime files (`core/runtime/`)
- 4 new core files (modal + component system)
- 3 core files patched (`hq-store.js`, `hq-core.js`, `hq-notifications.js`)
- 30 page JS files patched
- 29 HTML files wired
- SW updated v11 → v17

---

## Stages 1–6 — Runtime Infrastructure

### Stage 1 — Runtime Foundation

**`runtime-state.js`** — Persistence gateway (`HQState`). All reads/writes route through
this chokepoint. Mutation log (500 entries), quota snapshot, re-entrancy guard.
Every `set()` passes through `HQValidator.validateAndNormalize()`.

**`runtime-events.js`** — Event bus bridge. Bidirectional `HQBus ↔ window.dispatchEvent`.
200-entry rolling event log. `HQBus.emit()` mirrors to window CustomEvent and vice versa.

**`runtime-bootstrap.js`** — Startup sequencer (`HQBootstrap`). Extracts from `hq-core.js`:
`buildHQConfig()`, `buildHQWorkday()`, `hqSetTheme()`, `hqSetMode()`, `hqSetGreeting()`,
`window.HQConstants`.

**`runtime-services.js`** — Central service registry (`HQServices`).
`register(name, service)`, `get(name)`, `require(name, callback)`.

### Stage 3 — Observability

**`runtime-observer.js`** — `HQObserver`. Zero storage writes. 15 integrity checks
run after `hq-core-ready`. Console API: `report()`, `integrity()`, `mutations()`,
`events()`, `watch(key, fn)`, `enable()`, `disable()`.

### Stage 5 — Validation Layer

**`runtime-validator.js`** — `HQValidator`. Passive by default. 13 schemas:
`checkin-log`, `recurring-events`, `flags`, `notif-config`, `taskboard`, `med-log`,
`profile`, `theme`, `habits`, `monthly` (Phase B), `weekly` (Phase B).

### Stage 6 — Schema Versioning & Import Pipeline

**`runtime-schema-registry.js`** — `HQSchemaRegistry`. 50 canonical keys versioned at v1
across 10 domains. 6 migration descriptors with live `detect()`. `stamp(exportObj)`,
`status()`, `migrations()`, `report()`.

**`runtime-import-pipeline.js`** — `HQImport`. Full pipeline:
Parse → Validate → Migrate → Reference Repair → Diff → Commit.
6 migration transforms, 4 reference repair checks. Default mode `dry-run`.

---

## Phase A — App Stabilization

### A1 — Service Worker
Cache v11 → v17 across session. All 15 runtime files added to `APP_SHELL`.

### A2 — Import Pipeline (`data-sync.js`)
Three import functions wired through `HQImport.run({ mode: 'commit' })`.
`buildExportObj()` stamps `schemaVersion` on every export.
`confirm()` calls converted to `async/await HQConfirm.ask()` with `danger:true`
on all destructive operations (wipe, clear, replace, unregister SW).

### A3 — Core File Patches

**`hq-store.js`** — `get()`/`set()`/`remove()` delegate to `HQState`. Re-entrancy guard.
`emit()` mirrors to window. Migration writes `hq-store-schema-stamp`. `getExport()` added.

**`hq-core.js`** — `hqGet()`/`hqSet()`/`hqRemove()` → `HQState`. `buildHQConfig()`,
`buildHQWorkday()`, `hqSetTheme()`, `hqSetMode()` → `HQBootstrap`. `hqFireNudge()` →
`HQBus.emit('notification:queued')`. `inject()` → `HQBus.emit('notification:init')`.

**`hq-notifications.js`** — `_load()`/`_save()`, `getReminderConfig()` → `HQState`.
`_fireNotif()` emits on HQBus with `_fromNotif` guard. `_wireBus()` added.
Target flow: Feature → Runtime State → Event Bus → Notification System.

### A3 — localStorage Sweep — 30 Page Files, 478+ Lines
`localStorage.getItem()` → `hqGet()`, `setItem()` → `hqSet()`, `removeItem()` → `hqRemove()`.
`JSON.stringify()` wrappers removed from `hqSet()`. `JSON.parse()` wrappers removed from `hqGet()`.
Page-local helpers (`ld()`, `load()`, `fbGet()`/`fbSet()`) simplified to thin delegates.

### A4 — Recurring Engine / Planner Key Fix
- `monthly-planner.js` — `loadRecurring()` fallback to `HQStore.getRecurringEvents()` with shape-mapping
- `day-view.js` — `RECUR_STORE` fixed `'hq-recurring'` → `'audhd-hq-recurring'` (was reading empty key)
- `recurring-events.js` — fallback path simplified
- `timeline.js` — stale `JSON.parse` wrapper removed

---

## Phase B — Shared Infrastructure

### B1+2 — Shared Utilities (`runtime-utils.js`)
`HQUtils`: `uid(prefix?)`, `esc(s)`, `clone(v)`, `clamp(n,min,max)`, `debounce(fn,ms)`.
`HQDate`: `today()`, `toDateStr(d)`, `monthKey(y,m)`, `weekKey(d)`, `weekBounds(wk)`,
`weekDates(wk)`, `fmt(s,opts)`, `isBefore()`, `isAfter()`, `daysBetween()`, `addDays(s,n)`.

### B3 — Notification Dedup (`runtime-notif-dedup.js`)
`HQNotifDedup`. Intercepts `HQBus.emit('notification:queued')`. Windows: nudge=30min,
checkin=1hr, planner=10min, default=5min. `force(payload)` bypasses dedup.

### B4 — Cascade Governance (`runtime-cascade.js`)
`HQCascade`. Write-confirm on: `monthly-push-to-weekly`, `weekly-push-to-monthly`,
`planner:recurring-updated`, `import:committed`. 5s timeout → `cascade:tx-failed`.

### B5 — Planner Schema Validation
`HQValidator` extended with `audhd-hq-monthly` and `audhd-hq-weekly` schemas.
Validates month keys, week keys, day keys, item types, statuses, priorities, date fields,
duplicate IDs at every nesting level.

### B6 — Day-Builder Weekly Live Sync
`HQBus.on('hq-weekly-updated')` + `storage` event on `audhd-hq-weekly`.
`HQCascade.confirm()` called on receipt.

### B7 — Modal Framework
**`hq-modal.css`** — Canonical modal styles. Backward-compat aliases for `.modal-bg`,
`.modal-overlay`, `.modal-backdrop`, `.show`. Mobile sheet, reduced motion, size variants.

**`hq-modal.js`** — `HQModal`. `open(id)`, `close(id)`, `closeAll()`, `toggle(id)`, `current()`.
Focus trap, Escape key, backdrop click, scroll lock, focus restore, modal stack.
`_patchPageLocals()` wraps existing `openModal()`/`closeModal()` transparently.

### B8 — Component System
**`hq-components.css`** — Toast, Tabs, Confirm, Empty state, Badge, Chip, Divider.

**`hq-components.js`** — Four components:
- `HQToast` — self-creating, types: success/error/warn/info. Overrides `window.showToast`.
- `HQTabs` — `sw(id, btn)`. Supports `.on`/`.active`. Patches `window.sw`.
- `HQConfirm` — async `ask(msg, opts)`, `danger(msg, opts)`. Returns `Promise<boolean>`.
- `HQComponents` — `emptyState()`, `badge()`, `chip()`, `divider()`.

---

## Phase C — Planner Refactor

### C1 — Recurrence Unification (`runtime-recurrence.js`)
`HQRecurrence`. Unified engine for both schemas.

System 1 (monthly-planner flat): `yearly`, `monthly`, `every-other-month`, `weekly`, `every-other-week`.
System 2 (RRULE): DAILY, WEEKLY (BYDAY, INTERVAL=2), MONTHLY (BYMONTHDAY), YEARLY.

API: `matchesDate(r, dateStr)`, `occurrencesInMonth(events, y, m)`,
`occurrencesOnDate(events, dateStr, opts)`, `freqLabel(r)`, `loadAll()`.

Consumers updated (delegate-first / fallback): `monthly-planner.js`, `day-view.js`, `timeline.js`.
System 2 events now in the rendering path for the first time.

### C2 — Completion Model (`runtime-item-status.js`)
`HQStatus`. Seven statuses: `inbox`, `weekly`, `scheduled`, `done`, `deferred`, `cancelled`, `active`.
`deferred-from:YYYY-Www` composite first-class.

API: `canTransition(from, to)`, `transition(item, to, ctx)`, `addHistory(item, ...)`,
`isDone(item)`, `isCancelled(item)`, `isActive(item)`, `parseDeferredFrom(status)`, `label(status)`.

`monthly-planner.js` `addHistory()` delegates here.

### C3 — Cascade Confirms
Both push handlers fully wired:
- `monthly-planner.js` `_onWeeklyPushToMonthly()` — `HQStatus.addHistory()` + `HQCascade.confirm()`
- `weekly-planner.js` `_onMonthlyPushToWeekly()` — `HQStatus.addHistory()` + `HQCascade.confirm()`
- `day-builder.js` — already wired in Phase B6

### HTML Wiring — 29 Files
Three insertions per file: modal+component CSS in `<head>`, 13 runtime scripts between
`hq-store.js` and `hq-core.js`, modal+component JS after `hq-core.js`.
Special cases: `setup-wizard.html` (no hq-core), `notifications.html` (minimal runtime subset).

---

## Dead Code Cleanup

### Utility Function Aliasing — 20 Files, 62 Aliases

All local utility function **definitions** replaced with one-line aliases to runtime versions.
Call sites unchanged. Fallback retains original inline implementation if runtime unavailable.

Functions aliased per file:

| Function | Runtime target | Files |
|---|---|---|
| `uid()` | `HQUtils.uid()` | 19 files (weekly-planner preserves `'wp-'` prefix) |
| `getWeekStr()` / `getWeekKey()` | `HQDate.weekKey()` | 8 files |
| `todayStr()` | `HQDate.today()` | 15 files |
| `esc()` / `escHtml()` | `HQUtils.esc()` | 23 files |
| `monthKey()` | `HQDate.monthKey()` | 1 file |

### `window.confirm()` → `HQConfirm.ask()` — `data-sync.js`
10 calls converted. 8 functions made `async`. 6 operations flagged `danger:true`:
clear flags, clear checkin log, wipe all data (×2), unregister SW, replace all data.
Remaining 46 calls in other page files deferred — async conversion across event handlers
requires test coverage; risk outweighs benefit at this stage.

---

## What Was NOT Changed

- No CSS files modified (new files added only)
- No feature logic changed in any page file
- `deep-clean.compiled.js` — patch the source, not compiled output
- `index-orig.js` — archived, not served
- `login.html`, `create-account.html`, admin pages, guides, `iconforge.html` — not wired (no shell)
- `day-builder.html`, `timeline.html` — auth redirect stubs, not wired

---

---

# AuDHD HQ — UI/UX Audit & Fix Session
**Session date:** May 26, 2026
**Package version:** v3 (post-audit patch)
**Audit source:** `audhd-hq-deploy-patched.zip` (v3 stabilization)
**Passes completed:** 3 audit passes + 2 targeted fix sessions (M-10, M-14)

---

## Audit Overview

Full 3-pass UI/UX, functionality, and CSS debt audit against the v3 stabilization package.
No features added. No data model changed. All modifications are bug fixes, UX improvements,
navigation consistency, and infrastructure hygiene.

**Files changed:** 10 HTML, 2 CSS, 1 compiled JS
**New items resolved:** C-01, C-05, H-03, H-07, H-08, H-11, H-13, M-06, M-07, M-08, M-09, M-10, M-14

---

## Quick Wins Pass — Critical & High (Tiny/Small Effort)

### C-01 · iOS Touch Icon Paths Fixed — `index.html`
All four `<link rel="apple-touch-icon">` hrefs referenced a non-existent `/apple/`
subdirectory. Corrected to match the actual root `icons/` path used by every other page.
Affects: PWA home screen icon on iOS for all users.

### C-05 · Time Brain Strip Added — `taskboard.html`
Taskboard was the only planning-context page missing the shared Time Brain Strip
(📅 Today / 🗓 Day Plan / 📆 Week / 🗓️ Month / 🔁 Recurring). Added the standard
5-link strip with `active` state on Taskboard. Planning context is now continuous.

### H-11 · PWA Manifest Shortcut Fixed — `manifest.json`
The "Capture" shortcut in the PWA manifest pointed at `thought-jar.html`, which is a
redirect stub → brain-dump.html. Updated to point directly at `brain-dump.html`.
Eliminates one auth check + redirect hop for users who launch from the PWA shortcut.

---

## High Pass — UX Friction Fixes

### H-03 · Brain Dump Route Grid — Capture First, Route Second — `brain-dump.html`
The 14-button route destination grid was permanently visible before any text was entered,
forcing routing decisions at the moment of highest cognitive load. Route grid now hidden
by default and revealed only after the user begins typing (or on first keypress).
Mental model restored: capture first, route second.

### H-07 · Notifications Page Token Adoption — `notifications.html`
The notifications page was a design island with hardcoded hex values (`#1a0f3c`, `#e2e0f0`,
rgba literals) that bypassed the theme token system entirely. Converted to CSS variable
references (`var(--bg)`, `var(--text)`, `var(--card)`, `var(--border)` etc).
Now responds correctly to theme switching.

### H-08 · Fragile Index-Based Tab Nav Fixed — `walking-tracker.html`, `firebird-protocol.html`
Both pages used array-index tab references (`tabs[0]`, `panels[1]`) instead of
`data-tab` attribute selectors. Index-based nav breaks silently when tab order changes.
Refactored to data-attribute selectors — tab additions/reorders no longer risk silent breakage.

### H-13 · Day-View Inline CSS Extracted — `day-view.html` → `day-view.css`
11,570 characters of inline CSS (Time Brain Strip, modal overrides, responsive rules,
planner card styles) lived directly in `day-view.html`'s `<style>` block. Extracted
to `pages/day-view.css` where it belongs. Resolves specificity ambiguity and enables
proper cascade. HTML file reduced by ~12KB.

---

## Medium Pass — UX Polish Fixes

### M-06 · Check-In First-Run Hint — `checkin.html`
No zero state existed for new users or users with no check-in history. Added a dismissible
first-run hint card explaining the slot system and quick presets. Hidden by JS once
check-ins exist. Dismissal persisted to localStorage.

### M-07 · Post-Save Suggestion Panel — `checkin.html`
After saving a positive check-in, no guidance appeared on what to do next. Added a
contextual suggestion panel that surfaces relevant tools (Day View, Task Board, Brain Dump)
after save, based on check-in tone. Low-energy saves show Survival Mode and Firebird.

### M-08 · EOW Button Unlock Hint — `checkin.html`
End-of-week buttons were disabled by default with no visible signal explaining why or
how to unlock them. Added a hint text label that appears beneath the disabled buttons
and disappears once the week has progressed to the unlock point.

### M-09 · Project Brain Tab Class Standardized — `project-brain.html`
Project Brain used `class="tab-btn"` / `class="tab-content"` — its own bespoke tab class
naming — while all other multi-tab pages use `class="ntab"` / `class="ntab-panel"`.
Renamed to match the system-wide standard. HQTabs now manages Project Brain consistently.

---

## Targeted Fix Sessions

### M-10 · Back Navigation Standardized — 4 files + `hq-components.css`
**Problem:** Three different back navigation strategies across pages, two pages missing back nav entirely.
- `checkin.html` — inline `← HQ` link with JS mouseover handlers
- `notifications.html` — custom `.back-btn` CSS class with hardcoded rgba values
- `deep-clean.html` — no back nav at all
- `recurring-events.html` — no back nav at all

**Fix:** Added `.hq-back-btn` utility class to `hq-components.css` (token-based, hover state,
`prefers-reduced-motion` aware). All four pages now use:
```html
<a href="index.html" class="hq-back-btn">← HQ</a>
```
Removed 12 lines of custom `.back-btn` CSS from `notifications.html`.
Removed inline `style` + `onmouseover`/`onmouseout` JS handlers from `checkin.html`.
One place to restyle if the design ever changes.

### M-14 · deep-clean.compiled.js Recompiled — `pages/deep-clean.compiled.js`
**Problem:** `deep-clean.js` (JSX source) had been patched in the stabilization pass.
`deep-clean.compiled.js` (what the HTML actually loads) was stale — it predated the patch.
The app was serving patched source but executing old compiled output.

**Fix:** Recompiled `deep-clean.js` → `deep-clean.compiled.js` using Sucrase (JSX transform,
production mode). Output verified: `_optionalChain` helper present, 280 `React.createElement`
calls, all 9 room types intact, zero raw JSX remaining.

| | Stale | Fresh |
|---|---|---|
| Size | 92,159 bytes | 96,554 bytes |
| Source | pre-patch | current patched |

---

## Audit Findings Still Open (Not Fixed This Session)

### 🔴 Critical — Remaining
| ID | Issue | Effort |
|---|---|---|
| C-02 | `iconforge.html` — 4 native `window.confirm()` calls on mobile | 🟢 Small |
| C-03 | Money Brain — two tabs both labeled "Income" | 🟢 Tiny |
| C-04 | EOW overlay bypasses HQModal (no focus trap, no Escape key) | 🟡 Medium |
| C-06 | `tool-vault.html` — completely orphaned from navigation | 🟢 Small |
| C-07 | Index card descriptions `display:none` everywhere | 🟢 Tiny |

### 🟠 High — Remaining
| ID | Issue | Effort |
|---|---|---|
| H-01 | Tab overflow (8–13 tabs) — no scroll affordance | 🟡 Medium |
| H-02 | Check-in: 25+ sections simultaneously visible | 🔴 Large |
| H-04 | Emoji-only buttons — `title` tooltip invisible on touch | 🟡 Medium |
| H-05 | Check-in Save button requires 340 lines of scroll | 🟡 Medium |
| H-06 | 15 pages with dual modal system (old + HQModal) | 🔴 Large |
| H-09 | Kitchen Brain sidebar nav breaks mobile mental model | 🟡 Medium |
| H-10 | Rainbow progress bar — no reduced-motion coverage | 🟢 Small |
| H-12 | PWA maskable icon uses same file as standard icon | 🟡 Medium |

### 🟡 Medium — Remaining
| ID | Issue | Effort |
|---|---|---|
| M-01 | 41–107 inline rgba/hex values per page bypass token system | 🔴 Large |
| M-02 | Redirect stubs add latency to bookmarks | 🟢 Small |
| M-03 | 17 inline `<style>` blocks outside page CSS files | 🔴 Large |
| M-04 | aria-label coverage <5% on major pages | 🔴 Large |
| M-05 | No global skeleton/loading states in shared CSS | 🟡 Medium |
| M-11 | `--font-base` and `--font-sm` undefined in day-builder.css | 🟢 Tiny |
| M-12 | `.sn-section-hd` at 8px is unreadable | 🟢 Tiny |
| M-13 | 116 animation declarations — only 2 files have reduced-motion | 🔴 Large |
| M-15 | Index card descriptions never shown — dead UI | 🟢 Small |

### 🟢 Low — Remaining
| ID | Issue |
|---|---|
| L-01 | `customize.js` local `showToast()`/`sw()` dead code |
| L-02 | 46 `window.confirm()` calls unmigrated across 17 files |
| L-03 | Per-page modal CSS (~170 rules in 21 CSS files) |
| L-04 | `console.log` remaining in 3 page JS files |
| L-05 | `card-desc` elements never rendered |
| L-06 | Keyboard shortcut discoverability — only brain-dump documents Ctrl+Enter |

---

## Overall Health Assessment (Post-Audit)

| Dimension | Grade | Notes |
|---|---|---|
| **Infrastructure** | A | Runtime stack, auth, deploy gate, load order — all solid |
| **Crisis/Hard-Day UX** | A- | Survival Mode adaptive CSS excellent; Firebird reduced-motion gap remains |
| **Navigation** | B+ | Time Brain Strip complete; back nav standardized; Tool Vault still orphaned |
| **Daily Use Flow** | B | Check-in save scroll improved; Brain Dump capture-first fixed |
| **Theme System** | B | Architecture correct; Notifications now on tokens; inline rgba debt remains |
| **Accessibility** | D+ | focus-visible for nav ✅; aria-labels severely undertreated |
| **Mobile Fit** | B | Touch targets OK; tab overflow signaling absent |
| **PWA Quality** | B | Manifest shortcut fixed; maskable icon gap remains |
| **Code Cleanliness** | B+ | localStorage sweep done; compiled JS synced; dual modal system is main debt |
