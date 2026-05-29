/**
 * hq-components.js — AuDHD HQ Component System
 *
 * Phase B: Component System
 *
 * Provides canonical implementations of UI patterns duplicated across 28+ page files.
 * All components are backward-compatible — pages that haven't migrated still work.
 *
 * Components:
 *   HQToast     — replaces 28 per-page showToast() / toast() implementations
 *   HQTabs      — replaces 10+ identical sw(id, btn) tab switchers
 *   HQConfirm   — replaces 50+ blocking window.confirm() calls (async, themed)
 *   HQComponents — empty state, badge, chip utilities
 *
 * Backward compatibility:
 *   window.showToast(msg)        → HQToast.show(msg)   [already aliased in hq-core.js]
 *   window.sw(id, btn)           → HQTabs.sw(id, btn)  [patched after DOMContentLoaded]
 *   window.confirm(msg)          → NOT replaced globally — use HQConfirm.ask(msg) in new code
 *
 * Loading order: ... → hq-modal.js → hq-components.js → page scripts
 */

(function () {
  'use strict';

  // ══════════════════════════════════════════════════════════════════════════
  // HQToast
  // ══════════════════════════════════════════════════════════════════════════
  /**
   * Self-contained toast — creates its own DOM element if #hq-toast is absent.
   * hq-core.js already injects #hq-toast in inject(); this is the fallback
   * for pages that load before inject() runs, or for programmatic use.
   *
   * Supports:
   *   HQToast.show(msg)
   *   HQToast.show(msg, { dur: 3000, type: 'success'|'error'|'warn'|'info' })
   *   HQToast.error(msg)
   *   HQToast.success(msg)
   *   HQToast.warn(msg)
   */

  let _toastEl  = null;
  let _toastTimer = null;
  const TOAST_TYPES = { success: '✅', error: '❌', warn: '⚠️', info: 'ℹ️', default: '' };

  function _getToastEl() {
    if (_toastEl && document.contains(_toastEl)) return _toastEl;
    // Try existing shell toast first
    _toastEl = document.getElementById('hq-toast');
    if (_toastEl) return _toastEl;
    // Create one
    _toastEl = document.createElement('div');
    _toastEl.id = 'hq-toast';
    _toastEl.className = 'hq-toast';
    document.body.appendChild(_toastEl);
    return _toastEl;
  }

  const HQToast = {
    show(msg, opts) {
      const options = Object.assign({ dur: 2200, type: 'default' }, opts);
      const el = _getToastEl();
      const prefix = TOAST_TYPES[options.type] || '';
      el.textContent = prefix ? `${prefix} ${msg}` : msg;
      el.className = `hq-toast hq-toast--${options.type}`;
      el.classList.add('show');
      clearTimeout(_toastTimer);
      _toastTimer = setTimeout(() => el.classList.remove('show'), options.dur);
    },
    success(msg, opts) { this.show(msg, Object.assign({ type: 'success' }, opts)); },
    error(msg, opts)   { this.show(msg, Object.assign({ type: 'error',   dur: 3500 }, opts)); },
    warn(msg, opts)    { this.show(msg, Object.assign({ type: 'warn',    dur: 3000 }, opts)); },
    info(msg, opts)    { this.show(msg, Object.assign({ type: 'info' }, opts)); },
  };

  // Alias — all page-local showToast / toast calls route here
  // hq-core.js already exports window.showToast = hqShowToast;
  // We extend that alias to use HQToast.show directly.
  window.HQToast = HQToast;

  // Override window.showToast to use HQToast (richer than the hq-core version)
  // but only if called with a string (to avoid breaking any edge cases)
  const _prevShowToast = window.showToast;
  window.showToast = function (msg, dur) {
    HQToast.show(msg, dur ? { dur } : undefined);
  };
  window.hqShowToast = window.showToast;


  // ══════════════════════════════════════════════════════════════════════════
  // HQTabs
  // ══════════════════════════════════════════════════════════════════════════
  /**
   * Canonical tab switcher. Replaces sw(id, btn) across 10+ files.
   *
   * Usage (JS):
   *   HQTabs.sw('log', btn)
   *   HQTabs.sw('log', btn, { onSwitch: id => renderLog() })
   *
   * Usage (HTML — declarative, no JS needed):
   *   <button class="ntab" data-tab="log" onclick="HQTabs.sw('log', this)">Log</button>
   *   <div id="tab-log" class="tab">...</div>
   *
   * Scoping: tabs are scoped to a container. If btn is inside a
   * [data-tab-group] element, only tabs/ntabs within that group are toggled.
   * Without a group, falls back to document-wide (legacy behavior).
   */

  const HQTabs = {
    sw(id, btn, opts) {
      const options = opts || {};

      // Determine scope
      const scope = btn ? btn.closest('[data-tab-group]') : null;
      const root  = scope || document;

      // Deactivate all panels and buttons within scope
      root.querySelectorAll('.tab').forEach(t => t.classList.remove('on'));
      root.querySelectorAll('.ntab').forEach(b => b.classList.remove('on'));
      // Also support .active and .tab-panel variants (dream-journal, checkin)
      root.querySelectorAll('.tab-panel').forEach(t => t.classList.remove('active'));
      root.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));

      // Activate target panel
      const panel = document.getElementById('tab-' + id);
      if (panel) {
        panel.classList.add('on');
        panel.classList.add('active'); // support both
      }

      // Activate button
      if (btn) {
        btn.classList.add('on');
        btn.classList.add('active');
      }

      // Callback hook (replaces per-tab if(id==='x') renderX() blocks)
      if (typeof options.onSwitch === 'function') options.onSwitch(id);

      // Emit for observability
      try {
        if (window.HQBus) window.HQBus.emit('tabs:switched', { id, scope: scope ? scope.id : null });
      } catch (_) {}
    },
  };

  window.HQTabs = HQTabs;

  // Patch page-local sw() after load — only if it's the simple 4-liner variant
  // (detect by checking it doesn't reference unique page state)
  // Universal sw() wiring.
  // Handles all patterns: no sw at all (A), thin HQTabs arrow (B), legacy DOM (C), chained callbacks (D).
  // Result: window.sw always calls HQTabs.sw first for DOM work, then any page render callbacks.
  function _patchSw() {
    if (typeof window.sw !== 'function') {
      // Pattern A: no sw exported (non-IIFE pages) — install clean delegate
      window.sw = function (id, btn) { HQTabs.sw(id, btn); };
      return;
    }

    const src = window.sw.toString();

    if (src.includes('HQTabs.sw') && !src.includes('querySelectorAll')) {
      // Pattern B: thin arrow already delegating to HQTabs — re-wrap to guarantee call
      window.sw = function (id, btn) { HQTabs.sw(id, btn); };
      return;
    }

    // Pattern C/D: legacy DOM-manipulation sw or render-callback wrapper — chain HQTabs first
    const _pageSw = window.sw;
    window.sw = function (id, btn) {
      HQTabs.sw(id, btn);
      try { _pageSw(id, btn); } catch (_) {}
    };
  }


  // ══════════════════════════════════════════════════════════════════════════
  // HQConfirm
  // ══════════════════════════════════════════════════════════════════════════
  /**
   * Non-blocking async confirm dialog. Replaces window.confirm().
   * Themed, mobile-friendly, respects the modal stack.
   *
   * Usage:
   *   const ok = await HQConfirm.ask('Delete this item?')
   *   const ok = await HQConfirm.ask('Wipe all data?', { danger: true, confirmLabel: 'Wipe' })
   *   HQConfirm.ask('Continue?').then(ok => { if (ok) doThing(); })
   *
   * The dialog uses #hq-confirm-modal which is injected on first use.
   * It composes with HQModal for focus trap + escape key.
   */

  const _CONFIRM_ID = 'hq-confirm-modal';
  let _confirmResolve = null;

  function _injectConfirmModal() {
    if (document.getElementById(_CONFIRM_ID)) return;
    const el = document.createElement('div');
    el.id = _CONFIRM_ID;
    el.className = 'hq-modal-bg';
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-labelledby', 'hq-confirm-title');
    el.innerHTML = `
      <div class="hq-modal hq-modal--simple hq-confirm-box">
        <div id="hq-confirm-title" class="hq-modal-title" style="margin-bottom:10px"></div>
        <p id="hq-confirm-body" style="font-size:13px;color:var(--muted,var(--text2));line-height:1.55;margin:0 0 18px"></p>
        <div class="hq-modal-actions">
          <button id="hq-confirm-cancel" class="hq-btn-cancel">Cancel</button>
          <button id="hq-confirm-ok"     class="hq-btn-save">Confirm</button>
        </div>
      </div>`;
    document.body.appendChild(el);

    document.getElementById('hq-confirm-ok').addEventListener('click', () => _resolve(true), {once: true});
    document.getElementById('hq-confirm-cancel').addEventListener('click', () => _resolve(false), {once: true});
    // Backdrop click
    el.addEventListener('click', e => { if (e.target === el) _resolve(false); }, {once: true});
  }

  function _resolve(result) {
    if (window.HQModal) window.HQModal.close(_CONFIRM_ID);
    else {
      const el = document.getElementById(_CONFIRM_ID);
      if (el) el.classList.remove('open', 'show');
    }
    if (_confirmResolve) { _confirmResolve(result); _confirmResolve = null; }
  }

  const HQConfirm = {
    /**
     * Show a confirm dialog.
     * @param {string} msg         — main message (shown as title if no body)
     * @param {object} [opts]
     *   opts.body        {string}  — secondary body text
     *   opts.danger      {boolean} — style confirm button as destructive
     *   opts.confirmLabel {string} — confirm button label (default 'Confirm')
     *   opts.cancelLabel  {string} — cancel button label  (default 'Cancel')
     * @returns {Promise<boolean>}
     */
    ask(msg, opts) {
      const options = Object.assign({ danger: false, confirmLabel: 'Confirm', cancelLabel: 'Cancel' }, opts);

      return new Promise(resolve => {
        _injectConfirmModal();
        _confirmResolve = resolve;

        const titleEl  = document.getElementById('hq-confirm-title');
        const bodyEl   = document.getElementById('hq-confirm-body');
        const okBtn    = document.getElementById('hq-confirm-ok');
        const cancelBtn = document.getElementById('hq-confirm-cancel');

        titleEl.textContent  = options.title || msg;
        bodyEl.textContent   = options.body  || (options.title ? msg : '');
        bodyEl.style.display = bodyEl.textContent ? 'block' : 'none';
        okBtn.textContent    = options.confirmLabel;
        cancelBtn.textContent = options.cancelLabel;

        // Style ok button based on danger flag
        okBtn.className = options.danger ? 'hq-btn-danger' : 'hq-btn-save';

        if (window.HQModal) {
          window.HQModal.open(_CONFIRM_ID);
        } else {
          const el = document.getElementById(_CONFIRM_ID);
          if (el) { el.classList.add('open'); el.style.display = 'flex'; }
        }
      });
    },

    /** Convenience: danger-styled confirm */
    danger(msg, opts) {
      return this.ask(msg, Object.assign({ danger: true, confirmLabel: 'Delete' }, opts));
    },
  };

  window.HQConfirm = HQConfirm;


  // ══════════════════════════════════════════════════════════════════════════
  // HQComponents — utility renderers
  // ══════════════════════════════════════════════════════════════════════════

  const HQComponents = {

    /**
     * Render an empty state block.
     * @param {string} icon    — emoji or text icon
     * @param {string} title   — primary message
     * @param {string} [sub]   — secondary message / link HTML
     * @returns {string} HTML string
     */
    emptyState(icon, title, sub) {
      return `<div class="hq-empty-state">
        <div class="hq-empty-icon">${icon || '📭'}</div>
        <div class="hq-empty-title">${HQUtils ? HQUtils.esc(title) : title}</div>
        ${sub ? `<div class="hq-empty-sub">${sub}</div>` : ''}
      </div>`;
    },

    /**
     * Render a badge/chip element.
     * @param {string} label
     * @param {string} [color]  — CSS color value or var()
     * @param {string} [cls]    — extra CSS class
     * @returns {string} HTML string
     */
    badge(label, color, cls) {
      const style = color ? `style="background:${color}20;color:${color};border-color:${color}40"` : '';
      return `<span class="hq-badge ${cls || ''}" ${style}>${label}</span>`;
    },

    /**
     * Render a chip/filter button.
     * @param {string} label
     * @param {boolean} active
     * @param {string} onclick
     * @returns {string} HTML string
     */
    chip(label, active, onclick) {
      return `<button class="hq-chip${active ? ' on' : ''}" onclick="${onclick}">${label}</button>`;
    },

    /**
     * Render a section divider with optional label.
     * @param {string} [label]
     * @returns {string} HTML string
     */
    divider(label) {
      return label
        ? `<div class="hq-divider"><span>${label}</span></div>`
        : `<div class="hq-divider"></div>`;
    },
  };

  window.HQComponents = HQComponents;


  // ══════════════════════════════════════════════════════════════════════════
  // Init
  // ══════════════════════════════════════════════════════════════════════════

  function _init() {
    _patchSw();
    _injectConfirmModal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _init, {once: true});
  } else {
    _init();
  }

  window.dispatchEvent(new CustomEvent('hq-components-ready'));

})();
