/**
 * runtime-events.js — AuDHD HQ Unified Event Bus
 *
 * Phase 2: Observational / passive event layer.
 *
 * Strategy (per guide):
 *   Phase 2  — Events OBSERVE behavior, do NOT control it.
 *   Future   — Gradually migrate window.dispatchEvent / HQBus.emit
 *              calls so all coordination routes through HQBus.
 *
 * This file installs a thin bridge so that:
 *   1. window.dispatchEvent(CustomEvent) calls are mirrored onto HQBus.
 *   2. HQBus.emit calls are mirrored onto window.dispatchEvent so legacy
 *      window.addEventListener listeners keep working without changes.
 *   3. A central event log is maintained (ring buffer, capped at 200) for
 *      debugging and architecture validation.
 *
 * Loading order:  hq-store.js  →  runtime-state.js  →  runtime-events.js
 *                 →  runtime-bootstrap.js  →  hq-core.js
 *
 * DO NOT convert the app to fully event-driven here.  Just observe.
 */

(function () {
  'use strict';

  // ── Debug flag ────────────────────────────────────────────────────────────
  const _debug = (() => {
    try { return localStorage.getItem('hq-runtime-debug') === '1'; } catch (_) { return false; }
  })();

  function _log(...args) {
    if (_debug) console.debug('[HQBus]', ...args);
  }

  // ── Event log (ring buffer) ───────────────────────────────────────────────
  const MAX_LOG = 200;
  const _eventLog = [];

  function _appendLog(channel, payload, source) {
    _eventLog.push({ channel, payload, source, ts: Date.now() });
    if (_eventLog.length > MAX_LOG) _eventLog.shift();
  }

  // ── First-class event channels (per guide) ────────────────────────────────
  // Used as canonical names.  Add future channels here.
  const CHANNELS = {
    CONFIG_UPDATED:        'config:updated',
    THEME_CHANGED:         'theme:changed',
    PLANNER_UPDATED:       'planner:updated',
    TASK_COMPLETED:        'task:completed',
    ENERGY_CHANGED:        'energy:changed',
    MODULES_UPDATED:       'modules:updated',
    NOTIFICATION_QUEUED:   'notification:queued',
  };

  // ── Internal: test whether HQBus (from hq-store.js) is already present ────
  // HQStore exposes HQBus; we extend it rather than replace it.
  function _bus() { return window.HQBus || null; }

  // ── Phase 2 bridge: map window CustomEvents ↔ HQBus ─────────────────────
  // We intercept window.dispatchEvent at the prototype level so legacy
  // window.dispatchEvent(new CustomEvent('hq-theme-change', …)) calls are
  // also forwarded to HQBus subscribers — and vice-versa — without touching
  // any feature file.

  const _originalDispatch = window.dispatchEvent.bind(window);

  // Map of legacy window event names → HQBus channel names
  const WINDOW_TO_BUS = {
    'hq-theme-change':            CHANNELS.THEME_CHANGED,
    'hq-config-updated':          CHANNELS.CONFIG_UPDATED,
    'hq-energy-updated':          CHANNELS.ENERGY_CHANGED,
    'hq-store-ready':             'store:ready',
    'hq-core-ready':              'core:ready',
    'hq-state-ready':             'state:ready',
    'modules-updated':            CHANNELS.MODULES_UPDATED,
    'hq-cascade-signal':          'cascade:signal',
    'hq-flags-updated':           'flags:updated',
    'hq-checkin-surface-updated': 'checkin:surface-updated',
    'hq-daybuilder-pins-updated': 'daybuilder:pins-updated',
    'hq-auto-defer-updated':      'auto-defer:updated',
    'hq-weekly-review-updated':   'weekly-review:updated',
  };

  window.dispatchEvent = function (event) {
    // Always execute the real dispatch first so existing listeners fire.
    _originalDispatch(event);
    // Then forward to HQBus if we have a mapping.
    const busChannel = WINDOW_TO_BUS[event.type];
    if (busChannel) {
      const payload = (event instanceof CustomEvent) ? (event.detail || {}) : {};
      _appendLog(busChannel, payload, 'window');
      _log('window→bus', event.type, '→', busChannel);
      const bus = _bus();
      if (bus && typeof bus.emit === 'function') bus.emit(busChannel, payload);
    }
    return true;
  };

  // ── Phase 2 bridge: mirror HQBus → window events ─────────────────────────
  // After HQStore is ready we attach listeners for all channels so that
  // any HQBus.emit() also fires as a window CustomEvent.
  const BUS_TO_WINDOW = Object.fromEntries(
    Object.entries(WINDOW_TO_BUS).map(([w, b]) => [b, w])
  );

  function _installBusMirrors() {
    const bus = _bus();
    if (!bus) return;
    Object.entries(BUS_TO_WINDOW).forEach(([busChannel, windowEvent]) => {
      bus.on(busChannel, (payload) => {
        _appendLog(busChannel, payload, 'bus');
        _log('bus→window', busChannel, '→', windowEvent);
        // Fire as window event so any legacy addEventListener catches it.
        _originalDispatch(new CustomEvent(windowEvent, { detail: payload }));
      });
    });
  }

  // ── Public API extension on HQBus ────────────────────────────────────────
  // We attach runtime helpers to the existing HQBus rather than replacing it.
  function _extendBus() {
    const bus = _bus();
    if (!bus) return;

    // Named channels constant — accessible as HQBus.CHANNELS
    bus.CHANNELS = CHANNELS;

    // Access to the rolling event log
    bus.getLog = () => _eventLog.slice();
    bus.clearLog = () => { _eventLog.length = 0; };

    _log('HQBus extended with runtime layer');
  }

  // ── Initialise after HQStore is ready ────────────────────────────────────
  function _init() {
    _extendBus();
    _installBusMirrors();
    window.dispatchEvent(new CustomEvent('hq-events-ready'));
    _log('runtime-events ready');
  }

  if (window.HQStore) {
    _init();
  } else {
    window.addEventListener('hq-store-ready', _init, { once: true });
  }

})();
