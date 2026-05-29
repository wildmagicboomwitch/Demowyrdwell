/**
 * runtime-notif-dedup.js — AuDHD HQ Notification Deduplication Layer
 *
 * Phase B Item 3: Prevent duplicate notifications across the planner cascade.
 *
 * Problem this solves:
 *   The planner cascade (monthly → weekly → day-builder → checkin) emits
 *   multiple bus events per user action. If notifications are added to any
 *   of those events in the future, the user would receive duplicates.
 *   The existing nudge system has a 30-min rate-limit per slot but no
 *   cross-channel dedup. HQNotif uses browser Notification.tag for native
 *   dedup but only within a single delivery call.
 *
 * Strategy:
 *   - Intercept 'notification:queued' on HQBus before HQNotif delivers
 *   - Check a session dedup registry keyed on (tag|title+body hash)
 *   - Suppress if an identical notification fired within the dedup window
 *   - Allow HQNotif to proceed otherwise
 *   - Expose HQNotifDedup for inspection and manual override
 *
 * This file does NOT replace HQNotif. It sits between the bus and HQNotif.
 *
 * Loading order:
 *   ... → runtime-utils.js → runtime-notif-dedup.js → hq-core.js
 *   (must load BEFORE hq-notifications.js wires its bus listener)
 */

(function () {
  'use strict';

  // ── Dedup registry ────────────────────────────────────────────────────────
  // Key: tag or hash → { ts: number, title: string }
  const _registry = new Map();

  // Default dedup window per notification source
  const DEDUP_WINDOWS_MS = {
    nudge    : 30 * 60 * 1000,   // nudge: 30 min (matches existing NUDGE_KEY rate-limit)
    checkin  : 60 * 60 * 1000,   // checkin reminder: 1 hour
    planner  : 10 * 60 * 1000,   // planner cascade signals: 10 min
    default  : 5  * 60 * 1000,   // everything else: 5 min
  };

  // ── Hash helper ───────────────────────────────────────────────────────────
  // Simple non-crypto hash for title+body — good enough for dedup keys.
  function _hash(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h * 0x01000193) >>> 0;
    }
    return h.toString(36);
  }

  function _dedupKey(payload) {
    // Prefer explicit tag, fall back to hash of title+body
    return payload.tag || _hash((payload.title || '') + '|' + (payload.body || ''));
  }

  function _windowMs(payload) {
    const src = (payload.source || '').toLowerCase();
    if (src.includes('nudge'))   return DEDUP_WINDOWS_MS.nudge;
    if (src.includes('checkin')) return DEDUP_WINDOWS_MS.checkin;
    if (src.includes('planner') || src.includes('cascade')) return DEDUP_WINDOWS_MS.planner;
    return DEDUP_WINDOWS_MS.default;
  }

  // ── Core dedup check ─────────────────────────────────────────────────────

  /**
   * Returns true if the notification should be suppressed.
   * @param {object} payload  { title, body, tag?, source?, _fromNotif? }
   */
  function shouldSuppress(payload) {
    if (!payload || !payload.title) return false;
    // Never suppress notifications the user explicitly forced
    if (payload._force) return false;

    const key     = _dedupKey(payload);
    const windowMs = _windowMs(payload);
    const entry   = _registry.get(key);

    if (entry && (Date.now() - entry.ts) < windowMs) {
      return true; // duplicate within window
    }
    return false;
  }

  /**
   * Record a notification as fired.
   * Called by the bus interceptor after allowing delivery.
   */
  function record(payload) {
    const key = _dedupKey(payload);
    _registry.set(key, { ts: Date.now(), title: payload.title || '' });
  }

  // ── Bus interceptor ───────────────────────────────────────────────────────
  // Wraps HQBus.on('notification:queued') before HQNotif wires its listener.
  // We use HQBus middleware pattern: intercept, check, re-emit or drop.

  let _wired = false;

  function _wire() {
    const bus = window.HQBus;
    if (!bus || _wired) return;
    _wired = true;

    // Store original `on` and `emit` so we can intercept at the emit level
    const _originalEmit = bus.emit.bind(bus);

    bus.emit = function (channel, payload) {
      if (channel === 'notification:queued' && !payload._dedupChecked) {
        // Mark as checked to prevent infinite loop
        const tagged = Object.assign({}, payload, { _dedupChecked: true });

        if (shouldSuppress(tagged)) {
          // Log suppression for HQObserver visibility
          try {
            window.dispatchEvent(new CustomEvent('hq-notif-suppressed', {
              detail: { channel, payload: tagged, ts: Date.now() }
            }));
          } catch (_) {}
          return; // drop
        }

        // Allow through — record it
        record(tagged);
        return _originalEmit(channel, tagged);
      }
      return _originalEmit(channel, payload);
    };

    // Also intercept the NUDGE_KEY raw localStorage write in hq-core.js
    // by observing 'hq-state-mutation' for that key and syncing registry
    window.addEventListener('hq-state-mutation', function (e) {
      const { op, key } = e.detail || {};
      if (op === 'set' && key === HQKeys.NUDGE_LAST) {
        // hq-core wrote a nudge — register it so bus dedup knows
        record({ title: 'checkin-nudge', tag: 'hq-checkin-nudge', source: 'nudge' });
      }
    });
  }

  // Wire once HQBus is available
  if (window.HQBus) {
    _wire();
  } else {
    window.addEventListener('hq-store-ready', _wire, { once: true });
  }

  // ── Public API ────────────────────────────────────────────────────────────
  window.HQNotifDedup = {
    shouldSuppress,
    record,
    /** Clear the dedup registry (e.g. after page focus, for testing) */
    clear()   { _registry.clear(); },
    /** List all currently suppressed keys with their timestamps */
    status()  { return Object.fromEntries(_registry); },
    /** Force-allow a notification regardless of dedup window */
    force(payload) {
      return window.HQBus
        ? window.HQBus.emit('notification:queued', Object.assign({}, payload, { _force: true }))
        : null;
    },
    /** Adjust dedup windows */
    setWindow(source, ms) { DEDUP_WINDOWS_MS[source] = ms; },
  };

  window.dispatchEvent(new CustomEvent('hq-notif-dedup-ready'));

})();
