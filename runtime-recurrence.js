/**
 * runtime-recurrence.js — AuDHD HQ Unified Recurrence Engine
 *
 * Phase C Item 1: Recurrence Unification
 *
 * Replaces:
 *   - recurringMatchesMonth()   in monthly-planner.js
 *   - recurringDaysInMonth()    in monthly-planner.js
 *   - getRecurringForMonth()    in monthly-planner.js (delegates here)
 *   - RECURRING.forEach() match logic in day-view.js
 *   - RECURRING.forEach() match logic in timeline.js
 *
 * Adds:
 *   - RRULE string parser for System 2 (audhd-hq-recurring-events)
 *   - Unified occurrence generator that handles both schemas
 *   - HQRecurrence.matchesDate(event, dateStr) — single API for all consumers
 *   - HQRecurrence.occurrencesInMonth(events, y, m) — replaces getRecurringForMonth
 *   - HQRecurrence.occurrencesOnDate(events, dateStr) — replaces RECURRING.forEach inline
 *
 * Schema support:
 *   System 1 — { id, title, emoji, freq, allDay, day, dayOfWeek, month,
 *                 startMonth, startWeekOffset }
 *   System 2 — { id, title, emoji, rrule, startDate, startTime, endTime, allDay }
 *
 * Strategy:
 *   - System 1 events are identified by presence of r.freq (string, no 'FREQ=')
 *   - System 2 events are identified by presence of r.rrule (contains 'FREQ=')
 *   - Both produce the same normalized occurrence object
 *   - Non-breaking: monthly-planner, day-view, timeline get identical output
 *     to what they produced before — just routed through one place
 *
 * Exposes: window.HQRecurrence
 *
 * Loading order: ... → runtime-utils.js → runtime-recurrence.js → hq-core.js
 */

(function () {
  'use strict';

  // ── Constants ─────────────────────────────────────────────────────────────

  // System 1 freq values
  const S1_FREQ = {
    YEARLY          : 'yearly',
    MONTHLY         : 'monthly',
    EVERY_OTHER_MONTH: 'every-other-month',
    WEEKLY          : 'weekly',
    EVERY_OTHER_WEEK: 'every-other-week',
  };

  // Day-of-week names for RRULE BYDAY parsing
  const DOW_MAP = { SU:0, MO:1, TU:2, WE:3, TH:4, FR:5, SA:6 };

  // ── Schema detection ──────────────────────────────────────────────────────

  function isSystem1(r) {
    return r && r.freq && !r.rrule;
  }

  function isSystem2(r) {
    return r && r.rrule;
  }

  // ── RRULE parser ──────────────────────────────────────────────────────────
  // Parses the subset of RRULE strings used by recurring-events.js.
  // Full RFC 5545 is NOT implemented — only what the app produces.
  //
  // Supported:
  //   FREQ=DAILY
  //   FREQ=WEEKLY;BYDAY=MO          (one day)
  //   FREQ=WEEKLY;BYDAY=MO,WE,FR    (multiple days)
  //   FREQ=WEEKLY;INTERVAL=2;BYDAY=MO  (every other week)
  //   FREQ=MONTHLY;BYMONTHDAY=15
  //   FREQ=YEARLY;BYMONTH=12;BYMONTHDAY=25

  function parseRrule(rrule) {
    if (!rrule) return null;
    const parts = {};
    rrule.split(';').forEach(part => {
      const [k, v] = part.split('=');
      if (k && v !== undefined) parts[k.trim()] = v.trim();
    });
    return {
      freq       : parts.FREQ     || null,
      interval   : parseInt(parts.INTERVAL || '1', 10),
      byDay      : parts.BYDAY    ? parts.BYDAY.split(',').map(d => d.trim()) : null,
      byMonthDay : parts.BYMONTHDAY ? parseInt(parts.BYMONTHDAY, 10) : null,
      byMonth    : parts.BYMONTH    ? parseInt(parts.BYMONTH, 10)    : null,
    };
  }

  // ── ISO week number helper ────────────────────────────────────────────────
  // Used by every-other-week and WEEKLY;INTERVAL=2 matching.

  function isoWeekNumber(y, m, d) {
    const dt = new Date(Date.UTC(y, m, d));
    const dayNum = dt.getUTCDay() || 7;
    dt.setUTCDate(dt.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
    return Math.ceil((((dt - yearStart) / 86400000) + 1) / 7);
  }

  // ── System 1 — match and occurrence generation ────────────────────────────

  function s1MatchesMonth(r, y, m) {
    const freq = r.freq || S1_FREQ.YEARLY;
    switch (freq) {
      case S1_FREQ.YEARLY:
        return r.month === m + 1;
      case S1_FREQ.MONTHLY:
        return true;
      case S1_FREQ.EVERY_OTHER_MONTH: {
        const diff = ((m + 1) - (r.startMonth || 1) + 12) % 12;
        return diff % 2 === 0;
      }
      case S1_FREQ.WEEKLY:
      case S1_FREQ.EVERY_OTHER_WEEK:
        return true; // day-level check in s1DaysInMonth
      default:
        return false;
    }
  }

  function s1DaysInMonth(r, y, m) {
    const freq    = r.freq || S1_FREQ.YEARLY;
    const daysIn  = new Date(y, m + 1, 0).getDate();

    if ([S1_FREQ.YEARLY, S1_FREQ.MONTHLY, S1_FREQ.EVERY_OTHER_MONTH].includes(freq)) {
      const d = r.day;
      return (d >= 1 && d <= daysIn) ? [d] : [];
    }

    if ([S1_FREQ.WEEKLY, S1_FREQ.EVERY_OTHER_WEEK].includes(freq)) {
      const targetDow = r.dayOfWeek; // 0=Sun … 6=Sat
      const days = [];
      for (let d = 1; d <= daysIn; d++) {
        const dow = new Date(y, m, d).getDay();
        if (dow !== targetDow) continue;
        if (freq === S1_FREQ.WEEKLY) {
          days.push(d);
        } else {
          const wn = isoWeekNumber(y, m, d);
          const offset = r.startWeekOffset || 0;
          if (wn % 2 === offset % 2) days.push(d);
        }
      }
      return days;
    }

    return [];
  }

  // Match a System 1 event against a specific YYYY-MM-DD date
  function s1MatchesDate(r, y, m, d) {
    const freq = r.freq || S1_FREQ.YEARLY;
    const dow  = new Date(y, m, d).getDay();

    switch (freq) {
      case S1_FREQ.YEARLY:
        return r.month === m + 1 && r.day === d;
      case S1_FREQ.MONTHLY:
        return r.day === d;
      case S1_FREQ.EVERY_OTHER_MONTH: {
        const diff = ((m + 1) - (r.startMonth || 1) + 12) % 12;
        return diff % 2 === 0 && r.day === d;
      }
      case S1_FREQ.WEEKLY:
        return r.dayOfWeek === dow;
      case S1_FREQ.EVERY_OTHER_WEEK: {
        if (r.dayOfWeek !== dow) return false;
        const wn = isoWeekNumber(y, m, d);
        return wn % 2 === (r.startWeekOffset || 0) % 2;
      }
      default:
        return false;
    }
  }

  // ── System 2 — match against date ────────────────────────────────────────

  function s2MatchesDate(r, y, m, d) {
    if (!r.rrule || !r.startDate) return false;

    // Respect startDate — no occurrences before it
    const dateStr = `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    if (dateStr < r.startDate) return false;

    // Respect endDate if present
    if (r.endDate && dateStr > r.endDate) return false;

    const rule = parseRrule(r.rrule);
    if (!rule || !rule.freq) return false;

    const dow = new Date(y, m, d).getDay(); // 0=Sun … 6=Sat

    switch (rule.freq) {
      case 'DAILY': {
        if (rule.interval <= 1) return true;
        // Count days from startDate
        const start = new Date(r.startDate + 'T12:00:00');
        const target = new Date(dateStr + 'T12:00:00');
        const days = Math.round((target - start) / 86400000);
        return days >= 0 && days % rule.interval === 0;
      }

      case 'WEEKLY': {
        if (!rule.byDay) {
          // No BYDAY — use day of startDate
          const startDow = new Date(r.startDate + 'T12:00:00').getDay();
          if (dow !== startDow) return false;
        } else {
          // BYDAY: check if today's DOW is in the list
          const byDayNums = rule.byDay.map(d => DOW_MAP[d]).filter(n => n !== undefined);
          if (!byDayNums.includes(dow)) return false;
        }
        if (rule.interval <= 1) return true;
        // INTERVAL=2 (every other week): check ISO week parity from startDate
        const startWn = isoWeekNumber(
          ...r.startDate.split('-').map((v, i) => i === 1 ? parseInt(v)-1 : parseInt(v))
        );
        const thisWn = isoWeekNumber(y, m, d);
        return (thisWn - startWn) % rule.interval === 0;
      }

      case 'MONTHLY': {
        if (rule.byMonthDay !== null) return d === rule.byMonthDay;
        // If no BYMONTHDAY, use day of startDate
        const startDay = parseInt(r.startDate.split('-')[2], 10);
        return d === startDay;
      }

      case 'YEARLY': {
        const sm = rule.byMonth    || parseInt(r.startDate.split('-')[1], 10);
        const sd = rule.byMonthDay || parseInt(r.startDate.split('-')[2], 10);
        return (m + 1) === sm && d === sd;
      }

      default:
        return false;
    }
  }

  // ── Normalized occurrence object ──────────────────────────────────────────
  // Both systems produce this shape — identical to what getRecurringForMonth
  // produced before, so all existing consumers work without change.

  function makeOccurrence(r, dateStr, index) {
    return {
      id          : `recur-${r.id}-${dateStr}-${index}`,
      type        : 'appointment',
      title       : (r.emoji || '🔁') + ' ' + r.title,
      dayTarget   : dateStr,
      status      : 'scheduled',
      notes       : r.notes  || '',
      category    : r.category || '',
      subcategory : r.subcategory || null,
      allDay      : r.allDay !== false, // default true for recurring
      startTime   : r.startTime || null,
      endTime     : r.endTime   || null,
      _isRecurring: true,
      _recurId    : r.id,
      _recurFreq  : isSystem2(r)
        ? (parseRrule(r.rrule) || {}).freq || 'custom'
        : (r.freq || 'yearly'),
      _recurSource: isSystem2(r) ? 'system2' : 'system1',
    };
  }

  // ── Public API ────────────────────────────────────────────────────────────

  const HQRecurrence = {

    /**
     * Does a recurring event match a specific date?
     * Handles both System 1 and System 2 schemas.
     * @param {object} r   — recurring event object
     * @param {string} dateStr — YYYY-MM-DD
     * @returns {boolean}
     */
    matchesDate(r, dateStr) {
      if (!r || !dateStr) return false;
      const parts = dateStr.split('-');
      if (parts.length < 3) return false;
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1; // 0-indexed
      const d = parseInt(parts[2], 10);

      if (isSystem2(r)) return s2MatchesDate(r, y, m, d);
      return s1MatchesDate(r, y, m, d);
    },

    /**
     * Get all occurrence objects for a set of recurring events in a month.
     * Direct replacement for monthly-planner.js getRecurringForMonth().
     *
     * @param {object[]} events  — array of recurring event objects (S1 or S2)
     * @param {number}   y       — full year
     * @param {number}   m       — 0-indexed month
     * @returns {object[]}       — normalized occurrence objects
     */
    occurrencesInMonth(events, y, m) {
      if (!Array.isArray(events)) return [];
      const pad    = n => String(n).padStart(2, '0');
      const daysIn = new Date(y, m + 1, 0).getDate();
      const result = [];

      events.forEach(r => {
        if (!r || !r.id) return;

        if (isSystem1(r)) {
          // Use original System 1 logic (unchanged behavior)
          if (!s1MatchesMonth(r, y, m)) return;
          const days = s1DaysInMonth(r, y, m);
          days.forEach((d, i) => {
            const dateStr = `${y}-${pad(m + 1)}-${pad(d)}`;
            result.push(makeOccurrence(r, dateStr, i));
          });

        } else if (isSystem2(r)) {
          // System 2 — check each day in the month
          for (let d = 1; d <= daysIn; d++) {
            if (s2MatchesDate(r, y, m, d)) {
              const dateStr = `${y}-${pad(m + 1)}-${pad(d)}`;
              result.push(makeOccurrence(r, dateStr, d));
            }
          }
        }
      });

      return result;
    },

    /**
     * Get all occurrences of a set of recurring events on a specific date.
     * Replaces the RECURRING.forEach() inline match logic in day-view.js and timeline.js.
     *
     * @param {object[]} events   — array of recurring event objects (S1 or S2)
     * @param {string}   dateStr  — YYYY-MM-DD
     * @param {object}   [opts]
     *   opts.allDayOnly  {boolean} — only return allDay events (default false)
     * @returns {object[]}
     */
    occurrencesOnDate(events, dateStr, opts) {
      if (!Array.isArray(events) || !dateStr) return [];
      const options = Object.assign({ allDayOnly: false }, opts);
      const result  = [];

      events.forEach((r, i) => {
        if (!r || !r.id) return;
        if (options.allDayOnly && !r.allDay) return;
        if (this.matchesDate(r, dateStr)) {
          result.push(makeOccurrence(r, dateStr, i));
        }
      });

      return result;
    },

    /**
     * Get a human-readable label for a recurring event's frequency.
     * Works for both schemas.
     * @param {object} r
     * @returns {string}
     */
    freqLabel(r) {
      if (!r) return '—';
      if (isSystem2(r)) {
        const rrule = r.rrule || '';
        if (rrule.includes('FREQ=DAILY'))   return '📅 Daily';
        if (rrule.includes('INTERVAL=2') && rrule.includes('WEEKLY')) return '🔁 Every 2 Weeks';
        if (rrule.includes('FREQ=WEEKLY'))  return '📆 Weekly';
        if (rrule.includes('FREQ=MONTHLY')) return '🗓️ Monthly';
        if (rrule.includes('FREQ=YEARLY'))  return '🎂 Yearly';
        return '🔁 Custom';
      }
      // System 1
      const labels = {
        [S1_FREQ.YEARLY]           : '🎂 Yearly',
        [S1_FREQ.MONTHLY]          : '🗓️ Monthly',
        [S1_FREQ.EVERY_OTHER_MONTH]: '🔁 Every Other Month',
        [S1_FREQ.WEEKLY]           : '📆 Weekly',
        [S1_FREQ.EVERY_OTHER_WEEK] : '🔁 Every Other Week',
      };
      return labels[r.freq] || '🔁 Recurring';
    },

    /**
     * Load all recurring events from both stores and merge.
     * Returns a combined array for engines that want both systems at once.
     * System 1 events are loaded from audhd-hq-recurring (via HQState).
     * System 2 events are loaded from HQStore.getRecurringEvents().
     * @returns {object[]}
     */
    loadAll() {
      const s1 = (window.HQState ? window.HQState.get(HQKeys.RECURRING, []) : []) || [];
      const s2 = (window.HQStore && typeof window.HQStore.getRecurringEvents === 'function')
        ? window.HQStore.getRecurringEvents()
        : [];
      return [...s1, ...s2];
    },

    /** Expose internals for testing */
    _parseRrule: parseRrule,
    _s1MatchesDate: s1MatchesDate,
    _s2MatchesDate: s2MatchesDate,
    _isoWeekNumber: isoWeekNumber,
  };

  window.HQRecurrence = HQRecurrence;
  window.dispatchEvent(new CustomEvent('hq-recurrence-ready'));

})();
