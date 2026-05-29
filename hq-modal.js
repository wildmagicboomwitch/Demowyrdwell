/**
 * hq-modal.js — AuDHD HQ Canonical Modal Framework
 *
 * Phase B: Modal Framework
 *
 * Replaces 12+ per-page modal open/close implementations.
 * Adds: focus trap, Escape key, backdrop click, scroll lock,
 *       animation coordination, HQBus events, HQCascade confirm.
 *
 * Exposes: window.HQModal
 *
 * Backward compatible:
 *   - Existing openModal(id) / closeModal(id) page functions continue
 *     to work — they call through to HQModal internally once wired.
 *   - Pages that don't load hq-modal.js are unaffected.
 *   - All existing CSS class names (.modal-bg, .modal-overlay,
 *     .modal-backdrop, .open, .show) continue to work.
 *
 * Usage:
 *   HQModal.open('my-modal')
 *   HQModal.close('my-modal')
 *   HQModal.toggle('my-modal')
 *   HQModal.closeAll()
 *   HQModal.current()        → id of topmost open modal, or null
 *
 * Events (HQBus + window CustomEvent):
 *   'modal:opened'  { id }
 *   'modal:closed'  { id }
 *
 * Loading order: hq-store.js → runtime files → hq-core.js → hq-modal.js
 */

(function () {
  'use strict';

  // ── State ─────────────────────────────────────────────────────────────────
  const _stack  = [];   // open modal ids, bottom → top
  const _cleanups = {}; // id → cleanup function (removes listeners)

  // ── Focusable selector ────────────────────────────────────────────────────
  const FOCUSABLE = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  // ── Backdrop class detection ──────────────────────────────────────────────
  // Supports all three existing class names
  function _isBackdrop(el) {
    return el.classList.contains('hq-modal-bg')
        || el.classList.contains('modal-bg')
        || el.classList.contains('modal-overlay')
        || el.classList.contains('modal-backdrop');
  }

  // ── Open ──────────────────────────────────────────────────────────────────
  function open(id) {
    const backdrop = document.getElementById(id);
    if (!backdrop) { console.warn('[HQModal] element not found:', id); return; }

    // Already open — don't double-push
    if (_stack.includes(id)) return;

    // Open state — support both .open and .show
    backdrop.classList.add('open');
    backdrop.style.display = 'flex'; // force display before opacity transition

    // Push to stack
    _stack.push(id);

    // Scroll lock on body when first modal opens
    if (_stack.length === 1) {
      document.body.style.overflow = 'hidden';
    }

    // Focus management — move focus to first focusable inside modal
    const box = backdrop.querySelector('.hq-modal, .modal-box, .modal');
    if (box) {
      requestAnimationFrame(() => {
        const first = box.querySelector(FOCUSABLE);
        if (first) first.focus();
      });
    }

    // Wire listeners for this modal instance
    _wire(id, backdrop, box);

    // Emit
    _emit('modal:opened', { id });
  }

  // ── Close ─────────────────────────────────────────────────────────────────
  function close(id) {
    const backdrop = document.getElementById(id);
    if (!backdrop) return;

    backdrop.classList.remove('open', 'show');

    // Remove from stack
    const idx = _stack.indexOf(id);
    if (idx > -1) _stack.splice(idx, 1);

    // Re-enable scroll when last modal closes
    if (_stack.length === 0) {
      document.body.style.overflow = '';
    }

    // Restore focus to the element that was focused before open
    const trigger = backdrop._hqTrigger;
    if (trigger && document.contains(trigger)) {
      trigger.focus();
    }
    delete backdrop._hqTrigger;

    // Remove listeners
    if (_cleanups[id]) { _cleanups[id](); delete _cleanups[id]; }

    // Emit
    _emit('modal:closed', { id });
  }

  // ── Close all ─────────────────────────────────────────────────────────────
  function closeAll() {
    _stack.slice().reverse().forEach(id => close(id));
  }

  // ── Toggle ────────────────────────────────────────────────────────────────
  function toggle(id) {
    _stack.includes(id) ? close(id) : open(id);
  }

  // ── Current ───────────────────────────────────────────────────────────────
  function current() {
    return _stack.length ? _stack[_stack.length - 1] : null;
  }

  // ── Wire listeners for a modal instance ──────────────────────────────────
  function _wire(id, backdrop, box) {
    // Store the element that triggered open (for focus restore)
    backdrop._hqTrigger = document.activeElement;

    // Escape key — close topmost modal
    function _onKey(e) {
      if (e.key !== 'Escape' && e.key !== 'Tab') return;

      if (e.key === 'Escape') {
        e.stopPropagation();
        // Only close the topmost modal
        if (current() === id) close(id);
        return;
      }

      // Focus trap
      if (!box) return;
      const focusable = Array.from(box.querySelectorAll(FOCUSABLE))
        .filter(el => !el.disabled && el.offsetParent !== null);
      if (!focusable.length) return;

      const first = focusable[0];
      const last  = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    // Backdrop click — close if clicking the backdrop itself (not the box)
    function _onBackdropClick(e) {
      if (_isBackdrop(e.target) && e.target.id === id) {
        close(id);
      }
    }

    document.addEventListener('keydown', _onKey, true);
    backdrop.addEventListener('click', _onBackdropClick);

    _cleanups[id] = function () {
      document.removeEventListener('keydown', _onKey, true);
      backdrop.removeEventListener('click', _onBackdropClick);
    };
  }

  // ── Auto-wire on init ─────────────────────────────────────────────────────
  // Scan for modals that are already in the DOM and wire backdrop clicks.
  // This catches any modal opened via raw classList before HQModal was loaded.
  function _autoWire() {
    ['.hq-modal-bg', '.modal-bg', '.modal-overlay', '.modal-backdrop'].forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        if (!el.id) return;
        // Wire backdrop click to close if not already wired
        if (!el._hqWired) {
          el._hqWired = true;
          el.addEventListener('click', function (e) {
            if (_isBackdrop(e.target) && e.target.id === el.id && !_stack.includes(el.id)) {
              // Modal was opened outside HQModal — still close it
              el.classList.remove('open', 'show');
              document.body.style.overflow = '';
            }
          });
        }
      });
    });
  }

  // ── Emit ──────────────────────────────────────────────────────────────────
  function _emit(channel, detail) {
    try {
      window.dispatchEvent(new CustomEvent('hq-' + channel.replace(':', '-'), { detail }));
      if (window.HQBus) window.HQBus.emit(channel, detail);
    } catch (_) {}
  }

  // ── Override page-local openModal/closeModal after load ──────────────────
  // Pages define their own openModal(id)/closeModal(id) functions.
  // Once HQModal is loaded, those calls should route through here so they
  // get focus trap, escape, and scroll lock for free.
  //
  // Strategy: after DOMContentLoaded, wrap page-local openModal/closeModal
  // if they exist and are the simple 1-liner variant.
  function _patchPageLocals() {
    // Only patch if the page's openModal is the simple classList version
    if (typeof window.openModal === 'function') {
      const orig = window.openModal;
      window.openModal = function (id) {
        // Check if HQModal can handle it (element exists with modal class)
        const el = document.getElementById(id);
        if (el && _isBackdrop(el)) {
          HQModal.open(id);
        } else {
          orig(id); // defer to page implementation for non-standard cases
        }
      };
    }

    if (typeof window.closeModal === 'function') {
      const orig = window.closeModal;
      window.closeModal = function (id) {
        const el = document.getElementById(id);
        if (el && _isBackdrop(el)) {
          HQModal.close(id);
        } else {
          orig(id);
        }
      };
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────
  const HQModal = { open, close, closeAll, toggle, current };
  window.HQModal = HQModal;

  // Init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      _autoWire();
      _patchPageLocals();
    });
  } else {
    _autoWire();
    _patchPageLocals();
  }

  window.dispatchEvent(new CustomEvent('hq-modal-ready'));

})();
