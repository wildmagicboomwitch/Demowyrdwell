# AuDHD HQ — Stabilization Patch v3
**Date:** May 2026 | **SW cache:** v19

---

## What This Is

Drop-in patch. Replace each file at its matching path. No feature changes. No UI changes.

**97 files:**
- 13 new runtime files (`core/runtime/`)
- 4 new core files (modal + component system)
- 3 core files patched
- 30 page JS files patched
- 29 HTML files wired (go to project root)
- 1 SW updated

---

## File Map

```
patch/
├── README.md
├── CHANGELOG.md
├── PROGRESS.md                            ← tasks done vs remaining
├── sw.js                                  → project root
│
├── core/
│   ├── hq-store.js                        → core/hq-store.js
│   ├── hq-core.js                         → core/hq-core.js
│   ├── hq-notifications.js                → core/hq-notifications.js
│   ├── hq-modal.css                       → core/hq-modal.css        (NEW)
│   ├── hq-modal.js                        → core/hq-modal.js         (NEW)
│   ├── hq-components.css                  → core/hq-components.css   (NEW)
│   ├── hq-components.js                   → core/hq-components.js    (NEW)
│   └── runtime/                           → core/runtime/            (NEW DIR)
│       ├── runtime-state.js
│       ├── runtime-events.js
│       ├── runtime-bootstrap.js
│       ├── runtime-services.js
│       ├── runtime-observer.js
│       ├── runtime-validator.js
│       ├── runtime-schema-registry.js
│       ├── runtime-import-pipeline.js
│       ├── runtime-utils.js
│       ├── runtime-notif-dedup.js
│       ├── runtime-cascade.js
│       ├── runtime-recurrence.js
│       └── runtime-item-status.js
│
├── pages/                                 → pages/ (all 30 files)
│   └── [30 JS files]
│
└── html/                                  → PROJECT ROOT (not html/)
    └── [29 HTML files]
```

---

## How To Apply

```bash
# 1. Back up
cp -r your-project/ your-project-backup-$(date +%Y%m%d)/

# 2. Create runtime directory
mkdir -p your-project/core/runtime/

# 3. Copy files
cp core/*.js core/*.css     your-project/core/
cp core/runtime/*.js        your-project/core/runtime/
cp pages/*.js               your-project/pages/
cp html/*.html              your-project/          # root, not html/
cp sw.js                    your-project/

# 4. Deploy — SW v17 handles cache invalidation automatically
```

The HTML files already have all `<script>` tags wired in the correct order.
No manual HTML editing required.

---

## Runtime Load Order (reference)

```html
<link rel="stylesheet" href="core/hq-shell.css">
<link rel="stylesheet" href="core/hq-modal.css">
<link rel="stylesheet" href="core/hq-components.css">

<script src="core/hq-keys.js"></script>
<script src="core/hq-migrate.js"></script>
<script src="core/hq-store.js"></script>
<script src="core/runtime/runtime-state.js"></script>
<script src="core/runtime/runtime-events.js"></script>
<script src="core/runtime/runtime-bootstrap.js"></script>
<script src="core/runtime/runtime-services.js"></script>
<script src="core/runtime/runtime-observer.js"></script>
<script src="core/runtime/runtime-validator.js"></script>
<script src="core/runtime/runtime-schema-registry.js"></script>
<script src="core/runtime/runtime-import-pipeline.js"></script>
<script src="core/runtime/runtime-utils.js"></script>
<script src="core/runtime/runtime-recurrence.js"></script>
<script src="core/runtime/runtime-item-status.js"></script>
<script src="core/runtime/runtime-notif-dedup.js"></script>
<script src="core/runtime/runtime-cascade.js"></script>
<script src="core/hq-core.js"></script>
<script src="core/hq-modal.js"></script>
<script src="core/hq-components.js"></script>
<script src="core/hq-notifications.js"></script>
```

---

## Verification

```javascript
// All 15 checks green (or orange non-critical)
HQObserver.report()

// Schema status — schemaVersion 1, no high-risk migrations
HQSchemaRegistry.report()

// All runtime globals present
[HQState, HQBus, HQBootstrap, HQValidator, HQSchemaRegistry, HQImport,
 HQUtils, HQDate, HQNotifDedup, HQCascade, HQRecurrence, HQStatus,
 HQModal, HQToast, HQConfirm].every(x => !!x) // → true

// No pending cascade transactions
HQCascade.pending().length // → 0

// Recurrence engine working
HQRecurrence.matchesDate(
  { freq: 'weekly', dayOfWeek: new Date().getDay() },
  new Date().toISOString().slice(0,10)
) // → true

// Import pipeline dry run (writes nothing)
HQImport.inspect(JSON.stringify(HQStore.getExport()))
```

---

## Debugging

```javascript
HQObserver.enable()          // live logging for all storage + event traffic
HQObserver.watch('*', e => console.log(e))  // every storage mutation
HQCascade.log()              // cascade transaction history
HQNotifDedup.status()        // active dedup suppressions
HQValidator.getFailLog()     // schema validation failures this session
```

---

## What's Still Remaining

See `PROGRESS.md` for the full task list. Summary:

| Item | Risk | Effort |
|---|---|---|
| `confirm()` migration — 17 page files, 46 calls | Low | Medium |
| Per-page modal CSS strip — 21 CSS files | Low | Low |
| `showToast()` dead code alias — ~25 files | Low | Low |
| `sw()` dead code alias — ~10 files | Low | Low |
| `HQStatus.transition()` adoption | Medium | Medium |
| CSS variable consolidation | Low | Medium |
| Phase C Item 4 — rendering extraction | High | High |
