/* ══════════════════════════════════════════════════════════════════════
   hq-deploy-gate.js — AuDHD HQ Deploy Gate v2
   ──────────────────────────────────────────────────────────────────────
   HOW IT WORKS
   ─────────────
   1. Registers the service worker (replaces every page's inline snippet).
   2. Reads APP_VERSION embedded directly in THIS file — no SW messaging,
      no async, no race conditions.
   3. Compares against the last-seen version stored in localStorage.
   4. If mismatch → injects a full-screen forced gate modal.
      The modal walks the user through 3 required steps:
        Step 1: Export Settings backup   (triggers exportSettings logic)
        Step 2: Export User Data backup  (triggers exportUserData logic)
        Step 3: Clear cache + reload     (clears all caches, hard reloads)
      Steps unlock sequentially. Cannot dismiss without completing all 3.
   5. On first-ever load (no stored version) → gate is skipped, version saved.

   WHY NO SW MESSAGES?
   ─────────────────────
   • reg.active on a returning visit is the OLD SW — askVersion() would
     get the old version, see no mismatch, and do nothing.
   • The updatefound listener misses installs that completed before page
     load (extremely common when skipWaiting() is set).
   • skipWaiting() means the new SW is already active before this script
     runs — any broadcast to old clients is already gone.
   Embedding the version here gives an instant, synchronous, race-free
   check on every single page load.

   DEPLOY CHECKLIST
   ─────────────────
   • Bump APP_VERSION below              ← in THIS file
   • Bump APP_VERSION in sw.js           ← keep in sync
   • Bump CACHE string in sw.js
   • firebase deploy

   USAGE (add to every HTML page, replacing the old inline snippet)
   ─────────────
   <script src="core/hq-deploy-gate.js"></script>
══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Version embedded directly here — bump on every deploy ────────── */
  const APP_VERSION   = '2026-05-27-b';            /* ← bump this each deploy */

  const VERSION_KEY   = HQKeys.DEPLOY_VERSION;  /* localStorage key */
  const GATE_ID       = 'hq-deploy-gate-overlay';

  /* ── 1. Register service worker ──────────────────────────────────── */
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(function (e) {
      console.warn('[HQGate] SW registration failed:', e);
    });
  }

  /* ── 2. Synchronous version check — no messaging, no waiting ─────── */
  handleVersion(APP_VERSION);

  /* ── 3. Version comparison + gate trigger ────────────────────────── */
  function handleVersion(incoming) {
    if (!incoming) return;
    const stored = localStorage.getItem(VERSION_KEY);

    /* First ever load — just save version, no gate */
    if (!stored) {
      localStorage.setItem(VERSION_KEY, incoming);
      return;
    }

    /* Same version — nothing to do */
    if (stored === incoming) return;

    /* Version mismatch — show gate */
    if (!document.getElementById(GATE_ID)) {
      /* Wait for DOM if script runs in <head> */
      if (document.body) {
        injectGate(incoming);
      } else {
        document.addEventListener('DOMContentLoaded', function () {
          injectGate(incoming);
        });
      }
    }
  }

  /* ── 4. Build and inject the forced gate modal ───────────────────── */
  function injectGate(newVersion) {

    /* ── Scoped styles (injected once) ─────────────────────────────── */
    const style = document.createElement('style');
    style.textContent = `
      #hq-deploy-gate-overlay {
        position: fixed;
        inset: 0;
        z-index: 99999;
        background: rgba(0,0,0,0.88);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        font-family: var(--font-sans, system-ui, sans-serif);
        box-sizing: border-box;
      }
      #hq-deploy-gate-box {
        background: var(--hq-surface, #1e1a2e);
        border: 1.5px solid var(--hq-accent, #7c6fcd);
        border-radius: 18px;
        padding: 28px 24px 24px;
        max-width: 480px;
        width: 100%;
        box-sizing: border-box;
        color: var(--hq-text, #e8e4f0);
      }
      #hq-deploy-gate-box h2 {
        margin: 0 0 6px;
        font-size: 20px;
        font-weight: 600;
        color: var(--hq-text, #e8e4f0);
        display: flex;
        align-items: center;
        gap: 10px;
      }
      #hq-deploy-gate-box .gate-sub {
        font-size: 13px;
        color: var(--hq-muted, #a09ab8);
        margin: 0 0 22px;
        line-height: 1.5;
      }
      .gate-step {
        border-radius: 12px;
        border: 1px solid var(--hq-border, #3a3454);
        padding: 14px 16px;
        margin-bottom: 10px;
        transition: border-color 0.2s, background 0.2s;
        display: flex;
        align-items: flex-start;
        gap: 14px;
      }
      .gate-step.step-locked {
        opacity: 0.45;
      }
      .gate-step.step-done {
        border-color: #4ade80;
        background: rgba(74,222,128,0.07);
      }
      .gate-step.step-active {
        border-color: var(--hq-accent, #7c6fcd);
        background: rgba(124,111,205,0.08);
      }
      .gate-step-num {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: var(--hq-border, #3a3454);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: 600;
        flex-shrink: 0;
        transition: background 0.2s;
      }
      .gate-step.step-done .gate-step-num {
        background: #4ade80;
        color: #0a1a0a;
      }
      .gate-step.step-active .gate-step-num {
        background: var(--hq-accent, #7c6fcd);
        color: #fff;
      }
      .gate-step-body { flex: 1; min-width: 0; }
      .gate-step-title {
        font-size: 14px;
        font-weight: 600;
        margin: 0 0 4px;
        color: var(--hq-text, #e8e4f0);
      }
      .gate-step-desc {
        font-size: 12px;
        color: var(--hq-muted, #a09ab8);
        margin: 0 0 10px;
        line-height: 1.4;
      }
      .gate-step-desc.hidden { display: none; }
      .gate-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 9px 18px;
        border-radius: 8px;
        border: none;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: opacity 0.15s, transform 0.1s;
      }
      .gate-btn:active { transform: scale(0.97); }
      .gate-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
      .gate-btn-primary {
        background: var(--hq-accent, #7c6fcd);
        color: #fff;
      }
      .gate-btn-danger {
        background: #dc2626;
        color: #fff;
      }
      .gate-btn.hidden { display: none; }
      .gate-done-check {
        font-size: 18px;
        display: none;
      }
      .gate-step.step-done .gate-done-check { display: inline; }
      .gate-step.step-done .gate-btn { display: none; }
      .gate-footer {
        margin-top: 18px;
        padding-top: 14px;
        border-top: 1px solid var(--hq-border, #3a3454);
        font-size: 11px;
        color: var(--hq-muted, #a09ab8);
        text-align: center;
        line-height: 1.5;
      }
      .gate-version-badge {
        display: inline-block;
        background: var(--hq-border, #3a3454);
        border-radius: 6px;
        padding: 1px 8px;
        font-size: 11px;
        font-family: monospace;
        color: var(--hq-muted, #a09ab8);
        margin-top: 4px;
      }
    `;
    document.head.appendChild(style);

    /* ── Gate HTML ──────────────────────────────────────────────────── */
    const overlay = document.createElement('div');
    overlay.id = GATE_ID;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'hq-gate-title');
    overlay.innerHTML = `
      <div id="hq-deploy-gate-box">
        <h2 id="hq-gate-title">🚀 AuDHD HQ Updated</h2>
        <p class="gate-sub">
          A new version has been deployed. To protect your data, complete all 3 steps
          before the app reloads. <strong>Do not skip — your data lives in this browser.</strong>
        </p>

        <!-- Step 1: Export Settings -->
        <div class="gate-step step-active" id="gate-step-1">
          <div class="gate-step-num">1</div>
          <div class="gate-step-body">
            <div class="gate-step-title">Export Settings backup</div>
            <div class="gate-step-desc" id="gate-desc-1">
              Tags, theme, nav slots, shortcuts, module config. Saves as a .json file.
            </div>
            <button class="gate-btn gate-btn-primary" id="gate-btn-1" onclick="window._hqGateStep1()">
              ⬇️ Download Settings
            </button>
            <span class="gate-done-check">✅ Settings saved</span>
          </div>
        </div>

        <!-- Step 2: Export User Data -->
        <div class="gate-step step-locked" id="gate-step-2">
          <div class="gate-step-num">2</div>
          <div class="gate-step-body">
            <div class="gate-step-title">Export User Data backup</div>
            <div class="gate-step-desc hidden" id="gate-desc-2">
              All your journal entries, tasks, plans, trackers, health logs. Saves as a .json file.
            </div>
            <button class="gate-btn gate-btn-primary hidden" id="gate-btn-2" onclick="window._hqGateStep2()">
              ⬇️ Download Data
            </button>
            <span class="gate-done-check">✅ Data saved</span>
          </div>
        </div>

        <!-- Step 3: Clear cache + reload -->
        <div class="gate-step step-locked" id="gate-step-3">
          <div class="gate-step-num">3</div>
          <div class="gate-step-body">
            <div class="gate-step-title">Clear cache &amp; reload</div>
            <div class="gate-step-desc hidden" id="gate-desc-3">
              Clears the old cached app files and loads the new version.
              Your backups are already saved — this is safe.
            </div>
            <button class="gate-btn gate-btn-danger hidden" id="gate-btn-3" onclick="window._hqGateStep3()">
              🗑️ Clear &amp; Reload
            </button>
            <span class="gate-done-check">✅ Done</span>
          </div>
        </div>

        <div class="gate-footer">
          After reloading, go to <strong>⚙️ Data Sync</strong> to re-import your backups.
          <br>
          <span class="gate-version-badge">v${newVersion}</span>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    /* Trap focus inside modal */
    trapFocus(overlay);

    /* ── Step logic ─────────────────────────────────────────────────── */

    function unlockStep(n) {
      const el   = document.getElementById('gate-step-' + n);
      const btn  = document.getElementById('gate-btn-'  + n);
      const desc = document.getElementById('gate-desc-' + n);
      if (!el) return;
      el.classList.remove('step-locked');
      el.classList.add('step-active');
      if (btn)  btn.classList.remove('hidden');
      if (desc) desc.classList.remove('hidden');
    }

    function markDone(n) {
      const el  = document.getElementById('gate-step-' + n);
      const btn = document.getElementById('gate-btn-'  + n);
      if (!el) return;
      el.classList.remove('step-active');
      el.classList.add('step-done');
      if (btn) btn.disabled = true;
    }

    /* Step 1: export settings ─────────────────────────────────────── */
    window._hqGateStep1 = function () {
      try {
        hqGateExportSettings();
      } catch (e) {
        console.warn('[HQGate] exportSettings error:', e);
      }
      /* Mark done after a brief delay so the download triggers */
      setTimeout(function () {
        markDone(1);
        unlockStep(2);
      }, 600);
    };

    /* Step 2: export user data ────────────────────────────────────── */
    window._hqGateStep2 = function () {
      try {
        hqGateExportData();
      } catch (e) {
        console.warn('[HQGate] exportData error:', e);
      }
      setTimeout(function () {
        markDone(2);
        unlockStep(3);
      }, 600);
    };

    /* Step 3: clear cache + update version + reload ───────────────── */
    window._hqGateStep3 = function () {
      const btn = document.getElementById('gate-btn-3');
      if (btn) { btn.disabled = true; btn.textContent = '⏳ Clearing…'; }

      /* Save new version before reload so gate doesn't re-fire */
      localStorage.setItem(VERSION_KEY, newVersion);

      /* Clear all SW caches */
      (caches.keys ? caches.keys() : Promise.resolve([]))
        .then(function (keys) {
          return Promise.all(keys.map(function (k) { return caches.delete(k); }));
        })
        .then(function () {
          /* Unregister SW so it re-installs fresh */
          return navigator.serviceWorker.getRegistrations
            ? navigator.serviceWorker.getRegistrations()
            : Promise.resolve([]);
        })
        .then(function (regs) {
          return Promise.all(regs.map(function (r) { return r.unregister(); }));
        })
        .then(function () {
          window.location.reload(true);
        })
        .catch(function () {
          window.location.reload(true);
        });
    };
  }

  /* ── Standalone export helpers (no dependency on data-sync.js) ─── */
  /* These replicate the logic from data-sync.js so the gate works    */
  /* on every page, not just data-sync.html.                          */

  var SETTINGS_KEY_PATTERNS = [
    HQKeys.TAGS, HQKeys.FLAGS, HQKeys.THEME,
    HQKeys.THEME_SCHEDULE, HQKeys.DISPLAY_PREFS,
    HQKeys.INDEX_LAYOUT, HQKeys.SHORTCUTS,
    HQKeys.BOTTOM_NAV_SLOTS, HQKeys.REMINDER_CONFIG,
    HQKeys.REMINDER_WINDOWS, HQKeys.PROFILE,
    HQKeys.MODULE_SETTINGS, HQKeys.CHECKIN_PRESETS,
    HQKeys.CHECKIN_VISIBILITY, HQKeys.NONNEG,
  ];

  function isSettingsKey(k) {
    if (SETTINGS_KEY_PATTERNS.indexOf(k) !== -1) return true;
    if (k.endsWith('-setup')) return true;
    return false;
  }

  function getAllHQKeys() {
    var keys = [];
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && (k.startsWith('audhd-hq-') || k.startsWith('hq-'))) {
        keys.push(k);
      }
    }
    return keys;
  }

  function buildExport(keys, label) {
    var out = {
      _meta: {
        exported:     new Date().toISOString(),
        app:          'AuDHD HQ',
        stream:       label,
        keyCount:     keys.length,
        exportedFrom: 'deploy-gate'
      }
    };
    keys.forEach(function (k) {
      var v = localStorage.getItem(k);
      if (v !== null) {
        try { out[k] = JSON.parse(v); } catch (e) { out[k] = v; }
      }
    });
    return out;
  }

  function downloadJSON(obj, filename) {
    var blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1200);
  }

  function todayStamp() {
    var d = new Date();
    return d.getFullYear() + '-'
      + String(d.getMonth() + 1).padStart(2, '0') + '-'
      + String(d.getDate()).padStart(2, '0');
  }

  function hqGateExportSettings() {
    var all  = getAllHQKeys();
    var keys = all.filter(isSettingsKey);
    var obj  = buildExport(keys, 'settings');
    downloadJSON(obj, 'audhdhq-settings-' + todayStamp() + '.json');
  }

  function hqGateExportData() {
    var all  = getAllHQKeys();
    var keys = all.filter(function (k) { return !isSettingsKey(k); });
    var obj  = buildExport(keys, 'data');
    downloadJSON(obj, 'audhdhq-data-' + todayStamp() + '.json');
  }

  /* ── Focus trap ─────────────────────────────────────────────────── */
  function trapFocus(el) {
    var focusable = el.querySelectorAll('button:not([disabled])');
    if (!focusable.length) return;
    focusable[0].focus();
    el.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var active = el.querySelectorAll('button:not([disabled])');
      if (!active.length) return;
      var first = active[0], last = active[active.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { last.focus(); e.preventDefault(); }
      } else {
        if (document.activeElement === last) { first.focus(); e.preventDefault(); }
      }
    });
    /* Block Escape — modal cannot be dismissed */
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') e.preventDefault();
    });
  }


  /* ── SW_ACTIVATED: soft "reload for latest" banner ───────────────────
     FIX-07: The SW posts SW_ACTIVATED after activate + clients.claim().
     We show a dismissable top banner — NOT the forced gate — so users
     aren't interrupted mid-task. They can reload at their convenience.

     This is separate from the forced gate (version mismatch):
       • Forced gate  = new APP_VERSION detected on page load → must export + reload
       • Soft banner  = SW just activated in this tab → gentle nudge to reload

     The banner auto-dismisses if the user reloads anyway.
  ─────────────────────────────────────────────────────────────────── */
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', function (evt) {
      if (!evt.data || evt.data.type !== 'SW_ACTIVATED') return;

      /* Don't show banner if the forced gate is already visible */
      if (document.getElementById('hq-deploy-gate-overlay')) return;

      /* Don't show if already shown this session */
      if (sessionStorage.getItem('hq-sw-banner-shown')) return;
      sessionStorage.setItem('hq-sw-banner-shown', '1');

      showSWUpdateBanner(evt.data.cache || '');
    });
  }

  function showSWUpdateBanner(cacheLabel) {
    /* Remove any existing banner first */
    var existing = document.getElementById('hq-sw-update-banner');
    if (existing) existing.remove();

    var banner = document.createElement('div');
    banner.id = 'hq-sw-update-banner';
    banner.setAttribute('role', 'status');
    banner.setAttribute('aria-live', 'polite');
    banner.style.cssText = [
      'position:fixed',
      'bottom:16px',
      'left:50%',
      'transform:translateX(-50%)',
      'z-index:99999',
      'display:flex',
      'align-items:center',
      'gap:10px',
      'padding:10px 16px',
      'background:var(--accent-teal,#2dd4bf)',
      'color:#0a1628',
      'font-family:var(--font-main,system-ui,sans-serif)',
      'font-size:13px',
      'font-weight:600',
      'border-radius:10px',
      'box-shadow:0 4px 20px rgba(0,0,0,.35)',
      'max-width:calc(100vw - 32px)',
      'white-space:nowrap',
    ].join(';');

    var msg = document.createElement('span');
    msg.textContent = '⚡ Update ready' + (cacheLabel ? ' (' + cacheLabel + ')' : '') + ' — reload for latest';
    banner.appendChild(msg);

    var reloadBtn = document.createElement('button');
    reloadBtn.textContent = 'Reload';
    reloadBtn.style.cssText = [
      'background:#0a1628',
      'color:#fff',
      'border:none',
      'border-radius:6px',
      'padding:4px 10px',
      'font-size:12px',
      'font-weight:700',
      'cursor:pointer',
      'flex-shrink:0',
    ].join(';');
    reloadBtn.addEventListener('click', function () { window.location.reload(); });
    banner.appendChild(reloadBtn);

    var dismissBtn = document.createElement('button');
    dismissBtn.textContent = '✕';
    dismissBtn.setAttribute('aria-label', 'Dismiss update banner');
    dismissBtn.style.cssText = [
      'background:none',
      'border:none',
      'color:#0a1628',
      'font-size:14px',
      'font-weight:900',
      'cursor:pointer',
      'padding:0 2px',
      'flex-shrink:0',
      'opacity:.7',
    ].join(';');
    dismissBtn.addEventListener('click', function () { banner.remove(); });
    banner.appendChild(dismissBtn);

    /* Inject after DOM is ready */
    if (document.body) {
      document.body.appendChild(banner);
    } else {
      document.addEventListener('DOMContentLoaded', function () {
        document.body.appendChild(banner);
      });
    }
  }

})();
