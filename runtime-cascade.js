/**
 * runtime-cascade.js — AuDHD HQ Cascade Governance Layer
 *
 * Phase B Item 4: Write-confirm reply channel for planner cascade.
 *
 * Problem this solves:
 *   The bidirectional monthly↔weekly push is event-driven with no
 *   acknowledgement. If monthly emits 'monthly-push-to-weekly' and
 *   weekly-planner isn't open (or fails to write), monthly's item
 *   stays in status:'weekly' with no rollback and no visibility.
 *
 * What this adds:
 *   1. A write-confirm reply channel: any module that handles a push
 *      event calls HQCascade.confirm(txId, result) on completion.
 *   2. A timeout-based failure detection: if no confirm arrives within
 *      CONFIRM_TIMEOUT_MS, the transaction is marked failed and
 *      'cascade:tx-failed' is emitted for the originator to handle.
 *   3. A transaction log for HQObserver visibility.
 *   4. Passive — modules that don't call confirm() continue to work
 *      exactly as before. Confirmation is opt-in.
 *
 * Cascade channels tracked:
 *   'monthly-push-to-weekly'    → weekly-planner confirms
 *   'weekly-push-to-monthly'    → monthly-planner confirms
 *   'planner:recurring-updated' → day-view / timeline confirms
 *
 * Loading order:
 *   ... → runtime-utils.js → runtime-cascade.js → hq-core.js
 */

(function () {
  'use strict';

  let CONFIRM_TIMEOUT_MS = 5000; // 5s — generous for same-tab delivery
  const MAX_TX_LOG = 200;

  // ── Transaction registry ──────────────────────────────────────────────────
  const _pending = new Map();  // txId → { channel, payload, ts, timer }
  const _txLog   = [];

  function _log(entry) {
    _txLog.push(entry);
    if (_txLog.length > MAX_TX_LOG) _txLog.shift();
  }

  // ── Channels that cascade governance tracks ───────────────────────────────
  const GOVERNED_CHANNELS = new Set([
    'monthly-push-to-weekly',
    'weekly-push-to-monthly',
    'planner:recurring-updated',
    'import:committed',
  ]);

  // ── Transaction lifecycle ─────────────────────────────────────────────────

  /**
   * Begin a tracked transaction. Returns a txId.
   * Called internally by the bus interceptor for governed channels.
   */
  function _begin(channel, payload) {
    const txId = (window.HQUtils ? window.HQUtils.uid('tx-') : 'tx-' + Date.now().toString(36));
    const ts   = Date.now();

    const timer = setTimeout(() => {
      if (_pending.has(txId)) {
        _pending.delete(txId);
        const entry = { txId, channel, status: 'timeout', ts, resolvedAt: Date.now() };
        _log(entry);
        try {
          window.dispatchEvent(new CustomEvent('hq-cascade-tx-failed', { detail: entry }));
          if (window.HQBus) window.HQBus.emit('cascade:tx-failed', entry);
        } catch (_) {}
      }
    }, CONFIRM_TIMEOUT_MS);

    _pending.set(txId, { txId, channel, payload, ts, timer });
    _log({ txId, channel, status: 'pending', ts });
    return txId;
  }

  /**
   * Confirm a transaction as succeeded or failed.
   * Called by the receiving module after it completes its write.
   * @param {string} txId
   * @param {{ ok: boolean, error?: string }} result
   */
  function confirm(txId, result) {
    const tx = _pending.get(txId);
    if (!tx) return; // already timed out or unknown

    clearTimeout(tx.timer);
    _pending.delete(txId);

    const entry = {
      txId,
      channel : tx.channel,
      status  : result && result.ok ? 'confirmed' : 'failed',
      error   : result && result.error,
      ts      : tx.ts,
      resolvedAt: Date.now(),
      latencyMs : Date.now() - tx.ts,
    };
    _log(entry);

    try {
      const evtName = entry.status === 'confirmed' ? 'hq-cascade-tx-confirmed' : 'hq-cascade-tx-failed';
      window.dispatchEvent(new CustomEvent(evtName, { detail: entry }));
      if (window.HQBus) window.HQBus.emit('cascade:tx-' + entry.status, entry);
    } catch (_) {}
  }

  // ── Bus interceptor ───────────────────────────────────────────────────────
  // Wraps HQBus.emit for governed channels to attach txId to payload.
  // Receiving modules see payload._txId and can call HQCascade.confirm().

  let _wired = false;

  function _wire() {
    const bus = window.HQBus;
    if (!bus || _wired) return;
    _wired = true;

    const _originalEmit = bus.emit.bind(bus);

    bus.emit = function (channel, payload) {
      if (GOVERNED_CHANNELS.has(channel) && payload && !payload._txId) {
        const txId   = _begin(channel, payload);
        const tagged = Object.assign({}, payload, { _txId: txId });
        return _originalEmit(channel, tagged);
      }
      return _originalEmit(channel, payload);
    };
  }

  // HQBus.emit may already have been wrapped by runtime-notif-dedup.js.
  // Both wrappers compose cleanly — each calls through to the previous.
  if (window.HQBus) {
    _wire();
  } else {
    window.addEventListener('hq-store-ready', _wire, { once: true });
  }

  // ── Public API ────────────────────────────────────────────────────────────
  window.HQCascade = {
    confirm,
    /** List pending (unconfirmed) transactions */
    pending()    { return Array.from(_pending.values()).map(t => ({ ...t, timer: undefined })); },
    /** Full transaction log */
    log()        { return _txLog.slice(); },
    /** Clear the log */
    clearLog()   { _txLog.length = 0; },
    /** Set confirm timeout in ms */
    setTimeout(ms) { CONFIRM_TIMEOUT_MS = ms; },
    /** Governed channel set — add custom channels */
    govern(channel) { GOVERNED_CHANNELS.add(channel); },
  };

  window.dispatchEvent(new CustomEvent('hq-cascade-ready'));

})();
