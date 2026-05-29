# AuDHD HQ — Audit Progress

*Last updated: post-patch merge + batch 2 fixes (all items complete)*

---

## ✅ Done (40 items — ALL CLEAR 🎉)

| ID | What | How resolved |
|----|------|--------------|
| C-01 | Apple touch icon paths + missing 120×120 link | Paths already correct in merged output; added `120x120` `<link>` tag |
| C-02 | `iconforge.html` — 4 native `window.confirm()` calls | Zero `confirm` calls found — all removed |
| C-03 | Duplicate "Income" tab labels in money-brain | Already distinct: `💵 Income` vs `📈 Income Smoothing` |
| C-04 | `checkin.html/js` EOW modal bypasses HQModal | `openEOW()` / `closeEOW()` now call `HQModal.open/close('eow-overlay')` |
| C-05 | Taskboard missing Time Brain Strip | Strip with 5 correct links present |
| C-06 | Tool Vault orphaned from navigation | Present in `index.html` card grid + `hq-core.js` AUDHD_NAV_SECTIONS |
| C-07 | Card descriptions permanently hidden | `pages/index.css` has `.card-desc { display:block }` |
| H-01 | Tab overflow scroll affordance | `.tv-nav` CSS mask-fade + JS `_initTabScrollShadows`; active tab auto-centres |
| H-02 | `checkin.html` — 25+ sections visible simultaneously | Progressive disclosure via collapsible section cards; auto-expand on interaction |
| H-03 | Brain-dump route grid visible before text entered | `.route-reveal` hidden by default; revealed via `bdRevealRoute()` oninput |
| H-04 | `checkin.html` emoji buttons invisible tooltip on mobile | All energy/sensory buttons have both `title` and `aria-label` |
| H-05 | `checkin.html` save button 340px scroll away | Sticky save bar at bottom; original button hidden |
| H-06 | 15 pages — dual modal system (57 non-HQModal calls) | All 22 raw `.style.display` modal calls → `HQModal.open/close()` in 4 JS files + 3 HTML backdrops; zero remaining |
| H-07 | `notifications.html` — 12 hardcoded hex/font values | CSS in `pages/notifications.css`; all values use `var(--…)` tokens |
| H-08 | Fragile index-based tab refs in walking-tracker + firebird | `walking-tracker.js` uses attribute selector; firebird has no index refs |
| H-09 | `kitchen-brain.html` sidebar hidden `<899px` | Mobile bottom nav + "More" tray for overflow sections |
| H-10 | Rainbow progress bar — no `prefers-reduced-motion` | Full `.rb-fill` + `.rb-fill::after` reduced-motion block in `hq-shell.css` |
| H-11 | PWA manifest DayBuilder shortcut → redirect stub | Manifest uses `./day-view.html#plan` directly |
| H-12 | manifest.json — same PNG for `any` and `maskable` | Separate `-maskable.png` variants generated (192px + 512px) with 10% safe-zone padding; manifest updated |
| H-13 | `day-view.html` — 11,570 chars of inline CSS | Zero `<style>` tags; CSS in `pages/day-view.css` |
| L-01 | `customize.js` dead code + `showToast` alias | Alias removed; 43 call sites use `HQToast.show()`; `sw()` retained intentionally |
| L-02 | 46 `window.confirm()` calls across 17 files | Zero remaining |
| L-03 | `weekly-planner.css` last file with per-page modal CSS | 0 modal CSS rules remain |
| L-04 | Stray `console.log` in 3 JS files | Zero in all three target files |
| L-05 | `index.html` — some `card-desc` never render | All cards have `card-desc` content; `display:block` confirmed |
| L-06 | Keyboard shortcuts undocumented | `brain-dump.html` line 177: visible Ctrl+Enter/⌘+Enter tip; `iconforge.html` `#selHint` span shows Ctrl+Alt+drag |
| M-01 | Inline style density — hardcoded `rgba()` bypasses theming | 74 inline `rgba(R,G,B,A)` values → `rgba(var(--token),A)` across 19 HTML files |
| M-02 | Redirect stubs run `requireAuth()` before redirect | Stripped auth script from all 3 stubs; pure `http-equiv` refresh |
| M-03 | 11 pages with inline `<style>` blocks | All 11 pages: 0 inline `<style>` tags; CSS in `pages/` |
| M-04 | `aria-label` coverage ~4.6% (104 / ~2,241 elements) | 768 labels across all HTML (up from 104) |
| M-05 | `hq-shell.css` — no skeleton/loading states | `.skeleton` / `.skeleton-text` / `hq-shimmer` keyframe system added |
| M-06 | `checkin.html` — no zero state / first-run hint | `#ci-first-run-hint` div; shown on first load, dismissable |
| M-07 | `checkin.html` — no "what next?" on positive check-ins | `#ci-what-next` panel present |
| M-08 | `checkin.html` — EOW buttons disabled, no unlock signal | `#eow-unlock-hint` shows lock message + conditions |
| M-09 | `project-brain.html` uses `tab-btn` instead of `ntab` | Already `ntab` throughout; JS uses `.ntab` selectors |
| M-10 | Back navigation inconsistent across pages | `404.html` fixed (was `history.back()` → `href="index.html"` `hq-back-btn`); all app pages have topbar 🏠 via hq-core.js injection |
| M-11 | `--font-base` / `--font-sm` undefined in day-builder CSS | Both tokens defined in `hq-shell.css` |
| M-12 | `.sn-section-hd` at 8px — below minimum readable | Now `font-size: 12px` |
| M-13 | 116 animations — only 2 CSS files have `prefers-reduced-motion` | 28 CSS files include `prefers-reduced-motion` blocks |
| M-14 | `deep-clean.compiled.js` stale vs source | Recompiled via `@babel/core` + `@babel/preset-react` + `@babel/preset-env` from source JSX (88KB source → 141KB compiled) |

---

## 🔴 Critical — Remaining (0)
## 🟠 High — Remaining (0)
## 🟡 Medium — Remaining (0)
## 🟢 Low — Remaining (0)

*All 40 audit items resolved. ✅*

---

## Summary

| Severity | Total | Done | Remaining |
|----------|-------|------|-----------|
| 🔴 Critical | 7 | 7 | 0 |
| 🟠 High | 13 | 13 | 0 |
| 🟡 Medium | 14 | 14 | 0 |
| 🟢 Low | 6 | 6 | 0 |
| **Total** | **40** | **40** | **0** |
