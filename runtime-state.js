/**
 * runtime-state.js — AuDHD HQ Persistence Gateway
 *
 * Phase 2: Centralized storage abstraction boundary.
 *
 * ALL persistence routes through HQState.  This file does NOT replace
 * HQStore — it wraps it.  Once every feature reads/writes through here,
 * future upgrades (IndexedDB, validation, migrations, repair, analytics)
 * only need to be wired in this one place.
 *
 * Loading order:  hq-store.js  →  runtime-state.js  →  hq-core.js
 */

(function () {
  'use strict';

  // ── Internal logging helper ──────────────────────────────────────────────
  // Opt-in via localStorage flag: set 'hq-runtime-debug' to '1' to enable.
  const _debug = (() => {
    try { return localStorage.getItem('hq-runtime-debug') === '1'; } catch (_) { return false; }
  })();

  function _log(...args) {
    if (_debug) console.debug('[HQState]', ...args);
  }

  // ── Mutation log (ring buffer, capped at 500) ────────────────────────────
  // Records every set() and remove() call with key, value size, and timestamp.
  // Observers (HQObserver) read this to detect unexpected mutation patterns.
  const MAX_MUTATIONS = 500;
  const _mutationLog = [];

  function _recordMutation(op, key, value) {
    const entry = {
      op,
      key,
      ts: Date.now(),
      size: value !== undefined ? JSON.stringify(value).length : 0,
    };
    _mutationLog.push(entry);
    if (_mutationLog.length > MAX_MUTATIONS) _mutationLog.shift();
    // Notify observers passively
    try {
      window.dispatchEvent(new CustomEvent('hq-state-mutation', { detail: entry }));
    } catch (_) {}
  }

  // ── Phase 2 Transitional State Pattern ──────────────────────────────────
  // Simple pass-through to HQStore.  Future upgrades go here only.
  //
  // Future hook points (add here when needed):
  //   - beforeGet / afterGet interceptors  (validation)
  //   - beforeSet / afterSet interceptors  (migration stamps, integrity)
  //   - async adapter swap                 (IndexedDB)
  //   - mutation log                       (observability / audit)

  const HQState = {

    /**
     * Read a value from persistent storage.
     * @param {string} key
     * @param {*} [fallback=null]
     * @returns {*}
     */
    get(key, fallback = null) {
      _log('get', key);
      if (window.HQStore) return window.HQStore.get(key, fallback);
      // Bare fallback if HQStore hasn't loaded (should never happen in production)
      try {
        const raw = localStorage.getItem(key);
        return raw !== null ? JSON.parse(raw) : fallback;
      } catch (_) { return fallback; }
    },

    /**
     * Write a value to persistent storage.
     * Stage 5: passes through HQValidator.validateAndNormalize() before write.
     * Validation is passive — errors are logged but writes always proceed.
     * @param {string} key
     * @param {*} value
     * @returns {boolean}
     */
    set(key, value) {
      _log('set', key);

      // Stage 5: validate and normalize before write
      let writeValue = value;
      if (window.HQValidator && typeof window.HQValidator.validateAndNormalize === 'function') {
        try {
          const result = window.HQValidator.validateAndNormalize(key, value);
          writeValue = result.value;
        } catch (_) {
          // Validator failure must never block a write
          writeValue = value;
        }
      }

      _recordMutation('set', key, writeValue);
      if (window.HQStore) return window.HQStore.set(key, writeValue);
      try {
        localStorage.setItem(key, JSON.stringify(writeValue));
        return true;
      } catch (e) {
        console.warn('[HQState] set failed:', key, e);
        return false;
      }
    },

    /**
     * Remove a value from persistent storage.
     * @param {string} key
     */
    remove(key) {
      _log('remove', key);
      _recordMutation('remove', key, undefined);
      if (window.HQStore) { window.HQStore.remove(key); return; }
      try { localStorage.removeItem(key); } catch (_) {}
    },

    // ── Convenience: access the canonical key registry ───────────────────
    get KEYS() {
      return (window.HQStore && window.HQStore.KEYS) || {};
    },

    // ── Storage health snapshot ───────────────────────────────────────────
    usage() {
      return (window.HQStore && typeof window.HQStore.usage === 'function')
        ? window.HQStore.usage()
        : { totalBytes: 0, pct: 0, byKey: {} };
    },

    // ── Mutation log access (Stage 3 observability) ───────────────────────
    getMutationLog() { return _mutationLog.slice(); },
    clearMutationLog() { _mutationLog.length = 0; }
  };

  window.HQState = HQState;

  // Signal that the runtime persistence gateway is available.
  window.dispatchEvent(new CustomEvent('hq-state-ready'));
  _log('HQState ready');

})();
