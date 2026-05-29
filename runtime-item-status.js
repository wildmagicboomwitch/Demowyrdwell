/**
 * runtime-item-status.js — AuDHD HQ Item Status State Machine
 *
 * Phase C Item 2: Completion Model
 *
 * Provides:
 *   - Canonical status values and valid transitions
 *   - HQStatus.transition(item, toStatus, context) — the one safe way to change status
 *   - HQStatus.canTransition(fromStatus, toStatus) — validation check
 *   - HQStatus.addHistory(item, action, from, to, reason) — canonical history append
 *   - HQStatus.isDone(item) — completion check
 *   - HQStatus.isActive(item) — actionable check
 *   - HQStatus.label(status) — display label
 *   - HQStatus.parseDeferredFrom(status) — parses 'deferred-from:YYYY-Www' composite
 *
 * Replaces:
 *   - addHistory() in monthly-planner.js (delegates here)
 *   - Inline status assignments across monthly-planner, weekly-planner, day-view
 *
 * Strategy:
 *   - Passive — existing code that sets item.status = 'foo' directly still works
 *   - New code and migrated code use HQStatus.transition() for safety
 *   - HQValidator already enforces VALID_ITEM_STATUSES on write — this adds
 *     the transition rules on top
 *
 * Loading order: ... → runtime-validator.js → runtime-item-status.js → hq-core.js
 */

(function () {
  'use strict';

  // ── Canonical status values ───────────────────────────────────────────────

  const STATUS = {
    INBOX      : 'inbox',
    WEEKLY     : 'weekly',
    SCHEDULED  : 'scheduled',
    DONE       : 'done',
    DEFERRED   : 'deferred',
    CANCELLED  : 'cancelled',
    ACTIVE     : 'active',      // used for goals/long-running items
  };

  // ── Valid transitions ─────────────────────────────────────────────────────
  // Maps fromStatus → Set of valid toStatuses.
  // '*' means any status is a valid origin (catch-all).
  //
  // 'deferred-from:YYYY-Www' is a composite — treated as 'deferred' origin.

  const TRANSITIONS = {
    [STATUS.INBOX]     : new Set([STATUS.WEEKLY, STATUS.SCHEDULED, STATUS.DONE, STATUS.DEFERRED, STATUS.CANCELLED, STATUS.ACTIVE]),
    [STATUS.WEEKLY]    : new Set([STATUS.SCHEDULED, STATUS.DONE, STATUS.DEFERRED, STATUS.CANCELLED, STATUS.INBOX]),
    [STATUS.SCHEDULED] : new Set([STATUS.DONE, STATUS.DEFERRED, STATUS.CANCELLED, STATUS.WEEKLY, STATUS.INBOX]),
    [STATUS.DONE]      : new Set([STATUS.INBOX, STATUS.ACTIVE]),           // undo / reopen
    [STATUS.DEFERRED]  : new Set([STATUS.INBOX, STATUS.WEEKLY, STATUS.SCHEDULED, STATUS.CANCELLED]),
    [STATUS.CANCELLED] : new Set([STATUS.INBOX]),                           // reinstate
    [STATUS.ACTIVE]    : new Set([STATUS.DONE, STATUS.CANCELLED, STATUS.DEFERRED]),
  };

  // ── Helper: normalize a composite status to its base ─────────────────────
  // 'deferred-from:2026-W19' → 'deferred'

  function normalizeStatus(status) {
    if (!status) return STATUS.INBOX;
    if (status.startsWith('deferred-from:')) return STATUS.DEFERRED;
    return status;
  }

  // ── Core state machine ────────────────────────────────────────────────────

  /**
   * Check if a transition is valid according to the state machine.
   * @param {string} from
   * @param {string} to
   * @returns {boolean}
   */
  function canTransition(from, to) {
    const normFrom = normalizeStatus(from);
    const validTos = TRANSITIONS[normFrom];
    if (!validTos) return true; // unknown origin — allow (passive mode)
    return validTos.has(normalizeStatus(to));
  }

  /**
   * Canonical history entry append.
   * Replaces addHistory() in monthly-planner.js.
   * @param {object} item
   * @param {string} action  — e.g. 'cascaded-to-weekly', 'deferred', 'done'
   * @param {string} from    — previous status
   * @param {string} to      — new status
   * @param {string} [reason]
   */
  function addHistory(item, action, from, to, reason) {
    if (!item) return;
    if (!Array.isArray(item.history)) item.history = [];
    item.history.push({
      action,
      at    : new Date().toISOString(),
      from,
      to,
      reason: reason || undefined,
    });
    // Cap history at 50 entries per item to prevent unbounded growth
    if (item.history.length > 50) item.history = item.history.slice(-50);
  }

  /**
   * Transition an item to a new status.
   * Records the transition in item.history.
   * Warns (but does not block) on invalid transitions — passive mode.
   *
   * @param {object} item    — the planner item to mutate
   * @param {string} to      — target status
   * @param {object} [ctx]   — optional context
   *   ctx.action     {string}  — history action label (defaults to 'status-change')
   *   ctx.reason     {string}  — human reason (for defer/cancel)
   *   ctx.weekTarget {string}  — YYYY-Www (set when cascading to weekly)
   *   ctx.dayTarget  {string}  — YYYY-MM-DD (set when scheduling)
   *   ctx.source     {string}  — which page triggered the transition
   *   ctx.composite  {string}  — full composite value e.g. 'deferred-from:2026-W19'
   * @returns {object} item (mutated)
   */
  function transition(item, to, ctx) {
    if (!item) return item;
    const context = ctx || {};
    const from    = item.status || STATUS.INBOX;

    // Warn on invalid transition — passive, never blocks
    if (!canTransition(from, to)) {
      console.warn(`[HQStatus] invalid transition ${from} → ${to} on item "${item.id}"`);
      if (window.HQBus) {
        window.HQBus?.emit('status:invalid-transition', { // FIX-09: guarded
          itemId: item.id, from, to, source: context.source || 'unknown'
        });
      }
    }

    // Apply the composite status if provided (e.g. 'deferred-from:2026-W19')
    const effectiveStatus = context.composite || to;
    item.status = effectiveStatus;

    // Apply target fields
    if (context.weekTarget !== undefined) item.weekTarget = context.weekTarget;
    if (context.dayTarget  !== undefined) item.dayTarget  = context.dayTarget;

    // Increment deferCount on defer transitions
    if (normalizeStatus(to) === STATUS.DEFERRED) {
      item.deferCount = (item.deferCount || 0) + 1;
      if (context.reason) item.deferReason = context.reason;
    }

    // Record in history
    addHistory(
      item,
      context.action || 'status-change',
      from,
      effectiveStatus,
      context.reason
    );

    // Emit for observability
    try {
      if (window.HQBus) {
        window.HQBus?.emit('status:transitioned', { // FIX-09: guarded
          itemId : item.id,
          from,
          to     : effectiveStatus,
          source : context.source || 'unknown',
          ts     : Date.now(),
        });
      }
    } catch (_) {}

    return item;
  }

  // ── Query helpers ─────────────────────────────────────────────────────────

  /** True if item is in a terminal done state */
  function isDone(item) {
    return item && item.status === STATUS.DONE;
  }

  /** True if item is in a terminal cancelled state */
  function isCancelled(item) {
    return item && item.status === STATUS.CANCELLED;
  }

  /** True if item is in an actionable (non-terminal, non-deferred) state */
  function isActive(item) {
    if (!item) return false;
    const s = normalizeStatus(item.status);
    return s !== STATUS.DONE && s !== STATUS.CANCELLED && s !== STATUS.DEFERRED;
  }

  /** Parse a 'deferred-from:YYYY-Www' composite status */
  function parseDeferredFrom(status) {
    if (!status || !status.startsWith('deferred-from:')) return null;
    return status.replace('deferred-from:', '');
  }

  // ── Display helpers ───────────────────────────────────────────────────────

  const LABELS = {
    [STATUS.INBOX]    : { label: 'Inbox',     emoji: '📥', color: 'var(--muted)' },
    [STATUS.WEEKLY]   : { label: 'This Week', emoji: '📆', color: 'var(--accent)' },
    [STATUS.SCHEDULED]: { label: 'Scheduled', emoji: '📅', color: 'var(--blue, var(--accent))' },
    [STATUS.DONE]     : { label: 'Done',      emoji: '✅', color: 'var(--green, #2ecc71)' },
    [STATUS.DEFERRED] : { label: 'Deferred',  emoji: '⏭️', color: 'var(--yellow, #f39c12)' },
    [STATUS.CANCELLED]: { label: 'Cancelled', emoji: '🚫', color: 'var(--red, #e74c3c)' },
    [STATUS.ACTIVE]   : { label: 'Active',    emoji: '▶️', color: 'var(--purple, var(--accent))' },
  };

  function label(status) {
    const norm = normalizeStatus(status);
    const meta = LABELS[norm];
    if (!meta) return { label: status || '—', emoji: '❓', color: 'var(--muted)' };
    // For composite deferred-from statuses, append the week
    if (status && status.startsWith('deferred-from:')) {
      return { ...meta, label: `Deferred from ${parseDeferredFrom(status)}` };
    }
    return meta;
  }

  // ── Public API ────────────────────────────────────────────────────────────

  window.HQStatus = {
    STATUS,
    TRANSITIONS,
    canTransition,
    transition,
    addHistory,
    isDone,
    isCancelled,
    isActive,
    parseDeferredFrom,
    normalizeStatus,
    label,
  };

  window.dispatchEvent(new CustomEvent('hq-status-ready'));

})();
