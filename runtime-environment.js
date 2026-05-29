/**
 * runtime-environment.js — AuDHD HQ Adaptive Environment State Registry
 *
 * Phase: Post-Stabilization · Environment Layer
 *
 * What this does:
 *   Provides a shared, bus-driven environment mode that any module can
 *   subscribe to and react to — without coupling to a central controller
 *   or to each other.
 *
 *   Modules subscribe to 'environment:mode-changed' on HQBus and adjust
 *   their rendering or behavior accordingly. They never poll or check
 *   other modules' state directly.
 *
 * Modes (start with 2, expand later):
 *   'maintenance' — default / baseline. Normal operation.
 *   'survival'    — hard day mode. Floor tasks only. Reduce visual noise,
 *                   suppress non-essential nudges, surface Survival Mode link.
 *
 * Future modes (not yet implemented):
 *   'recovery'    — post-crash / post-episode. Gentle re-entry support.
 *   'focus'       — deep work session. Suppress interruptions.
 *   'low-energy'  — reduced capacity but not crisis. Simplified UI.
 *
 * Storage:
 *   HQState key: HQKeys.ENVIRONMENT
 *   Shape: { mode, setAt, setBy, sessionId, history[] }
 *
 * Events emitted:
 *   HQBus:    'environment:mode-changed'  { from, to, ts, source }
 *   window:   'hq-environment-changed'   (detail: same payload)
 *
 * Events listened:
 *   'hq-store-ready'             — deferred init guard
 *   'hq-flags-updated'           — passive survival detection
 *   'hq-environment-set-mode'    — external pages can trigger a mode change
 *                                   without importing this module
 *
 * Integration points:
 *   - Registers as 'environment' in HQServices
 *   - Reads survival-mode flags passively to auto-suggest (not auto-set) survival mode
 *   - Body data-environment attribute updated on every mode change
 *
 * Passive-first philosophy:
 *   This module NEVER forces UI changes on pages that don't subscribe.
 *   It only emits. Subscribing modules opt in.
 *
 * Loading order:
 *   ... → runtime-cascade.js → runtime-environment.js → hq-core.js
 *
 * Exposes: window.HQEnvironment
 */

(function () {
  'use strict';

  // ── Mode definitions ───────────────────────────────────────────────────────

  const MODES = {
    maintenance : {
      id          : 'maintenance',
      label       : 'Maintenance',
      emoji       : '🌿',
      description : 'Normal operation — baseline support active',
    },
    survival : {
      id          : 'survival',
      label       : 'Survival',
      emoji       : '🛟',
      description : 'Hard day mode — floor tasks only, reduced noise',
    },
    // Stubs for future implementation — defined but not yet activatable
    recovery : {
      id          : 'recovery',
      label       : 'Recovery',
      emoji       : '🌱',
      description : 'Gentle re-entry after a difficult period',
      _stub       : true,
    },
    focus : {
      id          : 'focus',
      label       : 'Focus',
      emoji       : '🎯',
      description : 'Deep work session — reduced interruptions',
      _stub       : true,
    },
    'low-energy' : {
      id          : 'low-energy',
      label       : 'Low Energy',
      emoji       : '🪫',
      description : 'Reduced capacity — simplified interface',
      _stub       : true,
    },
  };

  const VALID_MODES     = Object.keys(MODES).filter(k => !MODES[k]._stub);
  const STORE_KEY       = HQKeys.ENVIRONMENT;
  const DEFAULT_MODE    = 'maintenance';
  const MAX_HISTORY     = 30;
  const SURVIVAL_FLAG   = 'survival-active-'; // prefix — suffix is today's date

  // ── Internal state ─────────────────────────────────────────────────────────

  let _initialized  = false;
  let _current      = DEFAULT_MODE;
  let _sessionId    = _genSessionId();

  function _genSessionId() {
    return 'env-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
  }

  // ── Storage helpers ────────────────────────────────────────────────────────

  function _load() {
    try {
      const S = window.HQState;
      if (!S) return null;
      return S.get(STORE_KEY, null);
    } catch (e) {
      return null;
    }
  }

  function _save(data) {
    try {
      const S = window.HQState;
      if (!S) return;
      S.set(STORE_KEY, data);
    } catch (e) {
      console.warn('[HQEnvironment] save failed:', e);
    }
  }

  // ── Core: set mode ─────────────────────────────────────────────────────────

  /**
   * Transition to a new environment mode.
   * Passive — emits only. Modules subscribe and react independently.
   *
   * @param {string} toMode   — target mode id
   * @param {object} [opts]
   *   opts.source   {string}  — which module/page triggered the change
   *   opts.reason   {string}  — human-readable context (stored in history)
   *   opts.silent   {boolean} — save state but don't emit events (internal use)
   * @returns {boolean} true if mode changed, false if already in that mode or invalid
   */
  function setMode(toMode, opts) {
    const options = opts || {};

    if (!VALID_MODES.includes(toMode)) {
      console.warn('[HQEnvironment] invalid mode:', toMode, '— valid:', VALID_MODES);
      return false;
    }

    const from = _current;
    if (from === toMode) return false;

    _current   = toMode;
    const ts   = Date.now();
    const source = options.source || 'unknown';

    // Persist
    const stored = _load() || { history: [] };
    if (!Array.isArray(stored.history)) stored.history = [];
    stored.history.push({
      from, to: toMode, ts, source,
      reason: options.reason || undefined,
      session: _sessionId,
    });
    if (stored.history.length > MAX_HISTORY) stored.history = stored.history.slice(-MAX_HISTORY);
    stored.mode      = toMode;
    stored.setAt     = ts;
    stored.setBy     = source;
    stored.sessionId = _sessionId;
    _save(stored);

    // Update body attribute so CSS can respond
    try {
      document.documentElement.setAttribute('data-hq-env', toMode);
    } catch (_) {}

    if (options.silent) return true;

    // Emit
    const payload = { from, to: toMode, ts, source };

    try {
      if (window.HQBus && typeof window.HQBus.emit === 'function') {
        window.HQBus?.emit('environment:mode-changed', payload); // FIX-09: guarded
      }
    } catch (_) {}

    try {
      window.dispatchEvent(new CustomEvent('hq-environment-changed', { detail: payload }));
    } catch (_) {}

    return true;
  }

  // ── Passive survival detection ─────────────────────────────────────────────
  // Reads the flags store to detect if survival-mode.js has set an active flag
  // for today. Does NOT auto-set survival mode — emits a suggestion event only,
  // so pages can surface a prompt rather than forcing a switch.

  function _checkSurvivalSignal() {
    try {
      if (!window.HQState) return;
      const flags = window.HQState.get(HQKeys.FLAGS, []);
      if (!Array.isArray(flags)) return;
      const today = new Date().toISOString().split('T')[0];
      const active = flags.some(f => f.id && f.id.startsWith(SURVIVAL_FLAG + today));
      if (active && _current !== 'survival') {
        // Emit a suggestion, not a forced transition
        try {
          if (window.HQBus) window.HQBus.emit('environment:survival-signal', {
            ts: Date.now(),
            currentMode: _current,
          });
        } catch (_) {}
        try {
          window.dispatchEvent(new CustomEvent('hq-environment-survival-signal', {
            detail: { currentMode: _current, ts: Date.now() }
          }));
        } catch (_) {}
      }
    } catch (e) {
      // Non-fatal — passive check
    }
  }

  // ── Init ───────────────────────────────────────────────────────────────────

  function _init() {
    if (_initialized) return;
    _initialized = true;

    // Restore persisted mode
    const stored = _load();
    if (stored && stored.mode && VALID_MODES.includes(stored.mode)) {
      _current = stored.mode;
    }

    // Apply body attribute immediately (before any events)
    try {
      document.documentElement.setAttribute('data-hq-env', _current);
    } catch (_) {}

    // Passive survival signal check on load
    _checkSurvivalSignal();

    // Listen for flag updates — survival mode completion fires hq-flags-updated
    window.addEventListener('hq-flags-updated', _checkSurvivalSignal);

    // External mode-set via window event (pages don't need to import this module)
    window.addEventListener('hq-environment-set-mode', function (e) {
      if (e.detail && e.detail.mode) {
        setMode(e.detail.mode, {
          source : e.detail.source || 'external',
          reason : e.detail.reason,
        });
      }
    });

    // Register with HQServices
    try {
      if (window.HQServices) window.HQServices.register('environment', window.HQEnvironment);
    } catch (_) {}

    // Add ENVIRONMENT_MODE_CHANGED to HQBus.CHANNELS if bus is ready
    try {
      if (window.HQBus && window.HQBus.CHANNELS) {
        if (window.HQBus) window.HQBus.CHANNELS = window.HQBus.CHANNELS || {}; // FIX-09: guard
        if (window.HQBus) window.HQBus.CHANNELS.ENVIRONMENT_MODE_CHANGED = 'environment:mode-changed';
        if (window.HQBus) window.HQBus.CHANNELS.ENVIRONMENT_SURVIVAL_SIGNAL = 'environment:survival-signal';
      }
    } catch (_) {}

    window.dispatchEvent(new CustomEvent('hq-environment-ready'));
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  window.HQEnvironment = {
    /**
     * Set the active environment mode.
     * @param {string} mode   — 'survival' | 'maintenance'
     * @param {object} [opts] — { source, reason, silent }
     * @returns {boolean}
     */
    setMode,

    /**
     * Get the current mode id.
     * @returns {string}
     */
    getMode() {
      return _current;
    },

    /**
     * Get full mode definition object for a mode (or current if omitted).
     * @param {string} [modeId]
     * @returns {object|null}
     */
    getModeInfo(modeId) {
      return MODES[modeId || _current] || null;
    },

    /**
     * Check if currently in survival mode.
     * Convenience for modules that need a quick boolean.
     * @returns {boolean}
     */
    isSurvival() {
      return _current === 'survival';
    },

    /**
     * Check if currently in maintenance (normal) mode.
     * @returns {boolean}
     */
    isMaintenance() {
      return _current === 'maintenance';
    },

    /**
     * List all activatable modes (excludes stubs).
     * @returns {object[]}
     */
    listModes() {
      return VALID_MODES.map(id => ({ ...MODES[id] }));
    },

    /**
     * Get environment history from storage.
     * @returns {object[]}
     */
    getHistory() {
      const stored = _load();
      return stored && Array.isArray(stored.history) ? stored.history.slice() : [];
    },

    /**
     * Reset environment to maintenance mode.
     * @param {string} [source]
     */
    reset(source) {
      setMode(DEFAULT_MODE, { source: source || 'reset' });
    },

    /** All mode definitions including stubs */
    MODES,
    /** Activatable mode ids */
    VALID_MODES,
  };

  // ── Boot ───────────────────────────────────────────────────────────────────

  if (window.HQState) {
    _init();
  } else {
    window.addEventListener('hq-state-ready', _init, { once: true });
  }

})();
