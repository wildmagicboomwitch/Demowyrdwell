/**
 * runtime-utils.js — AuDHD HQ Shared Utilities
 *
 * Phase B Item 1+2: Canonical uid(), HQDate shared date utilities.
 *
 * Replaces:
 *   - uid()      in monthly-planner.js, weekly-planner.js, day-builder.js,
 *                   recurring-events.js, hq-store.js (_uid)
 *   - wsUid()    in monthly-planner.js (ws-import)
 *   - getWeekStr() in monthly-planner.js, day-view.js, timeline.js
 *   - monthKey() in monthly-planner.js
 *   - toDateStr() in hq-core.js (HQBootstrap)
 *   - todayStr() in monthly-planner.js
 *   - esc()      in monthly-planner.js, timeline.js
 *
 * Strategy: expose on window so all pages use the same implementation
 * without a module bundler. Pages can call HQUtils.uid() immediately
 * OR keep calling their local uid() — both work. The local definitions
 * become dead code and are removed in the next pass.
 *
 * Loading order: hq-store.js → runtime-state.js → ... → runtime-utils.js → hq-core.js
 */

(function () {
  'use strict';

  // ── HQUtils ───────────────────────────────────────────────────────────────

  const HQUtils = {

    /**
     * Canonical uid — base36 timestamp + 4 random chars.
     * Identical to hq-store._uid() and monthly-planner uid().
     * @param {string} [prefix] — optional prefix (e.g. 'wp-', 'ws-')
     * @returns {string}
     */
    uid(prefix) {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      return prefix ? prefix + id : id;
    },

    /**
     * HTML-escape a string. Replaces all page-local esc() functions.
     * @param {string} s
     * @returns {string}
     */
    esc(s) {
      return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    },

    /**
     * Clamp a number between min and max (inclusive).
     */
    clamp(n, min, max) {
      return Math.min(max, Math.max(min, n));
    },

    /**
     * Deep clone a JSON-safe value.
     */
    clone(v) {
      try { return JSON.parse(JSON.stringify(v)); } catch (_) { return v; }
    },

    /**
     * Debounce a function.
     * @param {Function} fn
     * @param {number} ms
     * @returns {Function}
     */
    debounce(fn, ms) {
      let t;
      return function (...args) {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), ms);
      };
    },
  };

  // ── HQDate ────────────────────────────────────────────────────────────────

  const HQDate = {

    /**
     * Today as YYYY-MM-DD (local time).
     * Replaces todayStr() in monthly-planner.js.
     */
    today() {
      return this.toDateStr(new Date());
    },

    /**
     * Convert a Date (or YYYY-MM-DD string) to YYYY-MM-DD.
     * Replaces toDateStr() in hq-core/HQBootstrap.
     * @param {Date|string} d
     * @returns {string}
     */
    toDateStr(d) {
      if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
      const date = (d instanceof Date) ? d : new Date();
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    },

    /**
     * YYYY-MM month key from year + 0-indexed month.
     * Replaces monthKey(y, m) in monthly-planner.js.
     * @param {number} y  full year
     * @param {number} m  0-indexed month
     * @returns {string}  e.g. '2026-05'
     */
    monthKey(y, m) {
      return `${y}-${String(m + 1).padStart(2, '0')}`;
    },

    /**
     * ISO week key YYYY-Www from a Date object.
     * Identical algorithm used by monthly-planner, day-view, timeline.
     * Replaces all three getWeekStr() implementations.
     * @param {Date} [d]  defaults to today
     * @returns {string}  e.g. '2026-W19'
     */
    weekKey(d) {
      const dt = new Date(Date.UTC(
        (d || new Date()).getFullYear(),
        (d || new Date()).getMonth(),
        (d || new Date()).getDate()
      ));
      const dayNum = dt.getUTCDay() || 7;
      dt.setUTCDate(dt.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
      const wn = Math.ceil((((dt - yearStart) / 86400000) + 1) / 7);
      return `${dt.getUTCFullYear()}-W${String(wn).padStart(2, '0')}`;
    },

    /**
     * Get the ISO week number for a date.
     * @param {Date} [d]
     * @returns {number}
     */
    weekNumber(d) {
      return parseInt(this.weekKey(d).split('-W')[1], 10);
    },

    /**
     * Get Monday and Sunday (ISO week) for a YYYY-Www key.
     * @param {string} wk  e.g. '2026-W19'
     * @returns {{ mon: Date, sun: Date }}
     */
    weekBounds(wk) {
      const [year, week] = wk.split('-W').map(Number);
      // Jan 4 is always in week 1 (ISO)
      const jan4 = new Date(Date.UTC(year, 0, 4));
      const dayOfWeek = jan4.getUTCDay() || 7;
      const monday = new Date(jan4);
      monday.setUTCDate(jan4.getUTCDate() - (dayOfWeek - 1) + (week - 1) * 7);
      const sunday = new Date(monday);
      sunday.setUTCDate(monday.getUTCDate() + 6);
      return { mon: monday, sun: sunday };
    },

    /**
     * Get all 7 date strings (Mon–Sun) for a YYYY-Www key.
     * @param {string} wk
     * @returns {string[]}  7 YYYY-MM-DD strings, Mon first
     */
    weekDates(wk) {
      const { mon } = this.weekBounds(wk);
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(mon);
        d.setUTCDate(mon.getUTCDate() + i);
        return this.toDateStr(d);
      });
    },

    /**
     * Format a YYYY-MM-DD date string for display.
     * Replaces fmtDate() in monthly-planner.js.
     * @param {string} s  YYYY-MM-DD
     * @param {object} [opts]  Intl.DateTimeFormat options
     * @returns {string}
     */
    fmt(s, opts) {
      if (!s) return '';
      return new Date(s + 'T12:00:00').toLocaleDateString('en-US',
        opts || { month: 'short', day: 'numeric' }
      );
    },

    /**
     * True if dateStr a is before dateStr b.
     * @param {string} a  YYYY-MM-DD
     * @param {string} b  YYYY-MM-DD
     */
    isBefore(a, b) { return a < b; },

    /**
     * True if dateStr a is after dateStr b.
     */
    isAfter(a, b)  { return a > b; },

    /**
     * Days between two YYYY-MM-DD strings (b - a).
     */
    daysBetween(a, b) {
      return Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000);
    },

    /**
     * Add N days to a YYYY-MM-DD string.
     * @param {string} s
     * @param {number} n
     * @returns {string}
     */
    addDays(s, n) {
      const d = new Date(s + 'T12:00:00');
      d.setDate(d.getDate() + n);
      return this.toDateStr(d);
    },
  };

  // ── Expose globally ───────────────────────────────────────────────────────
  window.HQUtils = HQUtils;
  window.HQDate  = HQDate;

  // Backwards-compat shims: pages that still call uid() locally are fine.
  // These globals let any page that wants to migrate call HQUtils.uid() directly.
  // Do NOT override page-local uid() here — let them co-exist during transition.

  window.dispatchEvent(new CustomEvent('hq-utils-ready'));

})();
