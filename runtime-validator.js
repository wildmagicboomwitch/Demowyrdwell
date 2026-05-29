/**
 * runtime-validator.js — AuDHD HQ Validation Layer
 *
 * Stage 5: Schema validation, required field validation, timestamp
 * normalization, recurrence validation, duplicate ID prevention.
 *
 * Strategy (per guide — strangler fig):
 *   - Validators are PASSIVE by default. They report problems but do NOT
 *     block writes. This prevents new regressions while data is audited.
 *   - Strict mode (opt-in per key) will reject invalid writes once
 *     schemas are confirmed stable. NOT enabled in Stage 5.
 *   - Normalization (coercing timestamps, filling defaults) IS applied
 *     on write because it is safe and non-destructive.
 *
 * Exposes: window.HQValidator
 *
 * Usage:
 *   HQValidator.validate(HQKeys.CHECKIN_LOG, data)  → { valid, errors, normalized }
 *   HQValidator.normalize(HQKeys.RECURRING_EVENTS, data) → normalizedData
 *   HQValidator.report()  → summary of all validation failures seen this session
 *
 * Integration:
 *   runtime-state.js calls HQValidator.validateAndNormalize(key, value)
 *   before every set(). Returns { value: normalizedValue, errors }.
 *   Errors are logged; write always proceeds (passive mode).
 *
 * Loading order:
 *   hq-store.js → runtime-state.js → runtime-events.js
 *   → runtime-bootstrap.js → runtime-services.js
 *   → runtime-observer.js → runtime-validator.js → hq-core.js
 */

(function () {
  'use strict';

  // ── Validation failure log (ring buffer) ─────────────────────────────────
  const MAX_LOG = 300;
  const _failLog = [];

  function _logFailure(key, errors) {
    const entry = { key, errors, ts: Date.now() };
    _failLog.push(entry);
    if (_failLog.length > MAX_LOG) _failLog.shift();
    // Surface to observer layer
    try {
      window.dispatchEvent(new CustomEvent('hq-validation-failure', { detail: entry }));
    } catch (_) {}
  }

  // ── Utility helpers ───────────────────────────────────────────────────────

  /** True if value is a non-null object (not array) */
  function isObj(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }

  /** True if value is a finite number */
  function isNum(v) { return typeof v === 'number' && isFinite(v); }

  /**
   * Normalize a timestamp field to a ms-since-epoch number.
   * Accepts: number (ms), ISO string, Date object.
   * Returns the number, or Date.now() if unparseable and fallbackToNow=true.
   */
  function normalizeTs(v, fallbackToNow = false) {
    if (isNum(v) && v > 0) return v;
    if (typeof v === 'string' && v.length > 0) {
      const t = Date.parse(v);
      if (!isNaN(t)) return t;
    }
    if (v instanceof Date && !isNaN(v)) return v.getTime();
    return fallbackToNow ? Date.now() : null;
  }

  /**
   * Ensure every item in an array has a unique `id` field.
   * Duplicate IDs after the first occurrence are flagged.
   * Returns { errors: string[], hasDupes: boolean }
   */
  function checkDuplicateIds(arr, label) {
    const seen = new Set();
    const errors = [];
    (arr || []).forEach((item, i) => {
      if (!item || !item.id) return; // missing id checked separately
      if (seen.has(item.id)) {
        errors.push(`${label}[${i}]: duplicate id "${item.id}"`);
      }
      seen.add(item.id);
    });
    return { errors, hasDupes: errors.length > 0 };
  }

  // ── Schema definitions ────────────────────────────────────────────────────
  // Each schema: { validate(data) → string[], normalize(data) → data }
  // validate() returns array of error strings (empty = valid).
  // normalize() returns a safe copy with timestamps coerced, etc.

  const SCHEMAS = {};

  // ── 1. Check-in log ───────────────────────────────────────────────────────
  // Shape: Array<{ date: 'YYYY-MM-DD', timeSlot: string, ts?: number, ... }>
  SCHEMAS[HQKeys.CHECKIN_LOG] = {
    validate(data) {
      const errors = [];
      if (!Array.isArray(data)) { errors.push('checkin-log: must be an array'); return errors; }
      const dupes = checkDuplicateIds(data.filter(e => e && e.id), 'checkin-log');
      errors.push(...dupes.errors);
      data.forEach((entry, i) => {
        if (!isObj(entry)) { errors.push(`checkin-log[${i}]: not an object`); return; }
        if (!entry.date || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
          errors.push(`checkin-log[${i}]: missing or invalid date "${entry.date}"`);
        }
        if (!entry.timeSlot) {
          errors.push(`checkin-log[${i}]: missing timeSlot`);
        }
      });
      return errors;
    },
    normalize(data) {
      if (!Array.isArray(data)) return data;
      return data.map(entry => {
        if (!isObj(entry)) return entry;
        const out = Object.assign({}, entry);
        // Normalize ts to epoch ms
        if (out.ts !== undefined) out.ts = normalizeTs(out.ts, true);
        // Ensure date is present (coerce from ts if missing)
        if (!out.date && out.ts) {
          out.date = new Date(out.ts).toISOString().slice(0, 10);
        }
        return out;
      });
    }
  };

  // ── 2. Recurring events ───────────────────────────────────────────────────
  // Shape: Array<{ id: string, title: string, createdAt: number, updatedAt: number,
  //               recurrence?: { freq: string, interval?: number, byDay?: string[] } }>
  const VALID_FREQ = ['daily', 'weekly', 'monthly', 'yearly', '3x', 'weekdays', 'weekends'];

  SCHEMAS[HQKeys.RECURRING_EVENTS] = {
    validate(data) {
      const errors = [];
      if (!Array.isArray(data)) { errors.push('recurring-events: must be an array'); return errors; }
      const dupes = checkDuplicateIds(data, 'recurring-events');
      errors.push(...dupes.errors);
      data.forEach((ev, i) => {
        if (!isObj(ev)) { errors.push(`recurring-events[${i}]: not an object`); return; }
        if (!ev.id)    errors.push(`recurring-events[${i}]: missing id`);
        if (!ev.title) errors.push(`recurring-events[${i}]: missing title`);
        if (ev.recurrence) {
          if (!isObj(ev.recurrence)) {
            errors.push(`recurring-events[${i}]: recurrence must be an object`);
          } else {
            if (ev.recurrence.freq && !VALID_FREQ.includes(ev.recurrence.freq)) {
              errors.push(`recurring-events[${i}]: unknown recurrence.freq "${ev.recurrence.freq}"`);
            }
            if (ev.recurrence.interval !== undefined && (!isNum(ev.recurrence.interval) || ev.recurrence.interval < 1)) {
              errors.push(`recurring-events[${i}]: recurrence.interval must be a positive integer`);
            }
          }
        }
        if (ev.startDate && !/^\d{4}-\d{2}-\d{2}/.test(ev.startDate)) {
          errors.push(`recurring-events[${i}]: startDate not ISO format`);
        }
        if (ev.endDate && !/^\d{4}-\d{2}-\d{2}/.test(ev.endDate)) {
          errors.push(`recurring-events[${i}]: endDate not ISO format`);
        }
      });
      return errors;
    },
    normalize(data) {
      if (!Array.isArray(data)) return data;
      return data.map(ev => {
        if (!isObj(ev)) return ev;
        const out = Object.assign({}, ev);
        out.createdAt = normalizeTs(out.createdAt, true);
        out.updatedAt = normalizeTs(out.updatedAt, true);
        // Ensure interval is integer if present
        if (out.recurrence && isObj(out.recurrence) && out.recurrence.interval !== undefined) {
          out.recurrence = Object.assign({}, out.recurrence, {
            interval: Math.max(1, Math.round(Number(out.recurrence.interval) || 1))
          });
        }
        return out;
      });
    }
  };

  // ── 3. Flags ──────────────────────────────────────────────────────────────
  // Shape: Array<{ id: string, ts: number, priority: number, source: string, type: string }>
  SCHEMAS[HQKeys.FLAGS] = {
    validate(data) {
      const errors = [];
      if (!Array.isArray(data)) { errors.push('flags: must be an array'); return errors; }
      const dupes = checkDuplicateIds(data, 'flags');
      errors.push(...dupes.errors);
      data.forEach((f, i) => {
        if (!isObj(f)) { errors.push(`flags[${i}]: not an object`); return; }
        if (!f.id)     errors.push(`flags[${i}]: missing id`);
        if (!f.type)   errors.push(`flags[${i}]: missing type`);
        if (f.priority !== undefined && (!isNum(f.priority) || f.priority < 1 || f.priority > 5)) {
          errors.push(`flags[${i}]: priority must be 1–5, got ${f.priority}`);
        }
      });
      return errors;
    },
    normalize(data) {
      if (!Array.isArray(data)) return data;
      return data.map(f => {
        if (!isObj(f)) return f;
        const out = Object.assign({}, f);
        out.ts = normalizeTs(out.ts, true);
        if (out.priority === undefined) out.priority = 3;
        return out;
      });
    }
  };

  // ── 4. Notification config ────────────────────────────────────────────────
  // Shape: Array<{ id: string, type: 'scheduled'|'custom', title: string,
  //               time: 'HH:MM', enabled: boolean, days: number[] }>
  SCHEMAS[HQKeys.NOTIF_CONFIG] = {
    validate(data) {
      const errors = [];
      if (!Array.isArray(data)) { errors.push('notif-config: must be an array'); return errors; }
      const dupes = checkDuplicateIds(data, 'notif-config');
      errors.push(...dupes.errors);
      data.forEach((n, i) => {
        if (!isObj(n)) { errors.push(`notif-config[${i}]: not an object`); return; }
        if (!n.id)     errors.push(`notif-config[${i}]: missing id`);
        if (!n.title)  errors.push(`notif-config[${i}]: missing title`);
        if (!n.time || !/^\d{2}:\d{2}$/.test(n.time)) {
          errors.push(`notif-config[${i}]: time must be HH:MM, got "${n.time}"`);
        }
        if (!['scheduled', 'custom'].includes(n.type)) {
          errors.push(`notif-config[${i}]: unknown type "${n.type}"`);
        }
        if (n.days !== undefined) {
          if (!Array.isArray(n.days)) {
            errors.push(`notif-config[${i}]: days must be an array`);
          } else if (n.days.some(d => !isNum(d) || d < 0 || d > 6)) {
            errors.push(`notif-config[${i}]: days must be integers 0–6`);
          }
        }
      });
      return errors;
    },
    normalize(data) {
      if (!Array.isArray(data)) return data;
      return data.map(n => {
        if (!isObj(n)) return n;
        const out = Object.assign({}, n);
        if (out.enabled === undefined) out.enabled = false;
        if (!Array.isArray(out.days)) out.days = [0, 1, 2, 3, 4, 5, 6];
        return out;
      });
    }
  };

  // ── 5. Taskboard ─────────────────────────────────────────────────────────
  // Shape: { lists: { [listId]: { id, title, items: [{ id, title, ... }] } } }
  SCHEMAS[HQKeys.TASKBOARD] = {
    validate(data) {
      const errors = [];
      if (!isObj(data)) { errors.push('taskboard: must be an object'); return errors; }
      if (!isObj(data.lists)) { errors.push('taskboard: missing lists object'); return errors; }
      Object.entries(data.lists).forEach(([listId, list]) => {
        if (!isObj(list)) { errors.push(`taskboard.lists.${listId}: not an object`); return; }
        if (!list.id)    errors.push(`taskboard.lists.${listId}: missing id`);
        if (!list.title) errors.push(`taskboard.lists.${listId}: missing title`);
        if (list.items !== undefined && !Array.isArray(list.items)) {
          errors.push(`taskboard.lists.${listId}.items: must be an array`);
        } else {
          const dupes = checkDuplicateIds(list.items || [], `taskboard.lists.${listId}.items`);
          errors.push(...dupes.errors);
          (list.items || []).forEach((item, i) => {
            if (!isObj(item)) { errors.push(`taskboard.lists.${listId}.items[${i}]: not an object`); return; }
            if (!item.id)    errors.push(`taskboard.lists.${listId}.items[${i}]: missing id`);
            if (!item.title) errors.push(`taskboard.lists.${listId}.items[${i}]: missing title`);
          });
        }
      });
      return errors;
    },
    normalize(data) {
      if (!isObj(data) || !isObj(data.lists)) return data;
      const out = Object.assign({}, data, { lists: {} });
      Object.entries(data.lists).forEach(([listId, list]) => {
        if (!isObj(list)) { out.lists[listId] = list; return; }
        out.lists[listId] = Object.assign({}, list, {
          items: (list.items || []).map(item => {
            if (!isObj(item)) return item;
            const it = Object.assign({}, item);
            if (it.createdAt) it.createdAt = new Date(normalizeTs(it.createdAt, true)).toISOString();
            if (it.doneAt)    it.doneAt    = new Date(normalizeTs(it.doneAt,    false) || it.doneAt).toISOString();
            return it;
          })
        });
      });
      return out;
    }
  };

  // ── 6. Med log ────────────────────────────────────────────────────────────
  // Shape: Array<{ ts: number, medId?: string, name?: string, dose?: string }>
  SCHEMAS[HQKeys.MED_LOG] = {
    validate(data) {
      const errors = [];
      if (!Array.isArray(data)) { errors.push('med-log: must be an array'); return errors; }
      data.forEach((e, i) => {
        if (!isObj(e)) { errors.push(`med-log[${i}]: not an object`); return; }
        if (!e.ts && !e.at) errors.push(`med-log[${i}]: missing timestamp (ts or at)`);
        if (!e.medId && !e.name) errors.push(`med-log[${i}]: missing medId or name`);
      });
      return errors;
    },
    normalize(data) {
      if (!Array.isArray(data)) return data;
      return data.map((e, i) => {
        if (!isObj(e)) return e;
        const out = Object.assign({}, e);
        out.ts = normalizeTs(out.ts || out.at, true);
        return out;
      });
    }
  };

  // ── 7. Profile ────────────────────────────────────────────────────────────
  // Shape: { name?: string, walkingGoal?: number, walkingUnit?: string, ... }
  SCHEMAS[HQKeys.PROFILE] = {
    validate(data) {
      const errors = [];
      if (!isObj(data)) { errors.push('profile: must be an object'); return errors; }
      if (data.walkingGoal !== undefined && (!isNum(data.walkingGoal) || data.walkingGoal < 0)) {
        errors.push(`profile: walkingGoal must be a non-negative number, got ${data.walkingGoal}`);
      }
      if (data.walkingUnit !== undefined && !['mi', 'km'].includes(data.walkingUnit)) {
        errors.push(`profile: walkingUnit must be 'mi' or 'km', got "${data.walkingUnit}"`);
      }
      return errors;
    },
    normalize(data) {
      if (!isObj(data)) return data;
      const out = Object.assign({}, data);
      if (out.walkingUnit === undefined) out.walkingUnit = 'mi';
      if (out.walkingGoal === undefined) out.walkingGoal = 120;
      return out;
    }
  };

  // ── 8. Theme ──────────────────────────────────────────────────────────────
  SCHEMAS[HQKeys.THEME] = {
    validate(data) {
      const errors = [];
      if (!isObj(data)) { errors.push('theme: must be an object'); return errors; }
      const VALID_THEMES = ['lilac', 'harbor', 'ember', 'volt'];
      const VALID_MODES  = ['dark', 'light'];
      if (data.theme && !VALID_THEMES.includes(data.theme)) {
        errors.push(`theme: unknown theme "${data.theme}"`);
      }
      if (data.mode && !VALID_MODES.includes(data.mode)) {
        errors.push(`theme: unknown mode "${data.mode}"`);
      }
      return errors;
    },
    normalize(data) {
      if (!isObj(data)) return data;
      const out = Object.assign({}, data);
      if (!out.theme) out.theme = 'lilac';
      if (!out.mode)  out.mode  = 'dark';
      if (out.manual === undefined) out.manual = false;
      return out;
    }
  };

  // ── 9. Habits ─────────────────────────────────────────────────────────────
  // Shape: Array<{ id, name, freq: 'daily'|'weekly'|'3x'|'weekdays', log: string[] }>
  SCHEMAS[HQKeys.HABITS] = {
    validate(data) {
      const errors = [];
      if (!Array.isArray(data)) { errors.push('habits: must be an array'); return errors; }
      const dupes = checkDuplicateIds(data, 'habits');
      errors.push(...dupes.errors);
      data.forEach((h, i) => {
        if (!isObj(h)) { errors.push(`habits[${i}]: not an object`); return; }
        if (!h.id)   errors.push(`habits[${i}]: missing id`);
        if (!h.name) errors.push(`habits[${i}]: missing name`);
        if (h.freq && !['daily', 'weekly', '3x', 'weekdays', 'weekends'].includes(h.freq)) {
          errors.push(`habits[${i}]: unknown freq "${h.freq}"`);
        }
        if (h.log !== undefined && !Array.isArray(h.log)) {
          errors.push(`habits[${i}]: log must be an array`);
        }
      });
      return errors;
    },
    normalize(data) {
      if (!Array.isArray(data)) return data;
      return data.map(h => {
        if (!isObj(h)) return h;
        const out = Object.assign({}, h);
        if (!out.freq) out.freq = 'daily';
        if (!Array.isArray(out.log)) out.log = [];
        return out;
      });
    }
  };

  // ── Phase B: Planner Item Schema ─────────────────────────────────────────
  // Canonical monthly item shape (per monthly-planner.js line 127 comment):
  // { id, type, title, category, subcategory?, status, dayTarget?, weekTarget?,
  //   monthTarget?, notes?, location?, prepTasks?, history?, deferCount, priority,
  //   energyCost?, customFlags?, source?, saved? }
  //
  // Validates both monthly store items and weekly inbox/day items.

  const VALID_ITEM_TYPES   = ['task', 'appointment', 'goal', 'routine', 'prep'];
  const VALID_ITEM_STATUSES = ['inbox', 'weekly', 'scheduled', 'done', 'deferred', 'cancelled', 'active'];
  const VALID_PRIORITIES    = ['none', 'low', 'medium', 'high', 'critical'];
  const DATE_RE             = /^\d{4}-\d{2}-\d{2}$/;
  const WEEK_KEY_RE         = /^\d{4}-W\d{2}$/;
  const MONTH_KEY_RE        = /^\d{4}-\d{2}$/;

  function _validatePlannerItem(item, label) {
    const errors = [];
    if (!isObj(item)) { errors.push(`${label}: not an object`); return errors; }
    if (!item.id)     errors.push(`${label}: missing id`);
    if (!item.title)  errors.push(`${label}: missing title`);
    if (item.type && !VALID_ITEM_TYPES.includes(item.type)) {
      errors.push(`${label}: unknown type "${item.type}"`);
    }
    if (item.status && !VALID_ITEM_STATUSES.includes(item.status)) {
      errors.push(`${label}: unknown status "${item.status}"`);
    }
    if (item.priority && !VALID_PRIORITIES.includes(item.priority)) {
      errors.push(`${label}: unknown priority "${item.priority}"`);
    }
    if (item.dayTarget   && !DATE_RE.test(item.dayTarget)) {
      errors.push(`${label}: dayTarget not YYYY-MM-DD: "${item.dayTarget}"`);
    }
    if (item.weekTarget  && !WEEK_KEY_RE.test(item.weekTarget)) {
      errors.push(`${label}: weekTarget not YYYY-Www: "${item.weekTarget}"`);
    }
    if (item.monthTarget && !MONTH_KEY_RE.test(item.monthTarget)) {
      errors.push(`${label}: monthTarget not YYYY-MM: "${item.monthTarget}"`);
    }
    if (item.deferCount !== undefined && (!isNum(item.deferCount) || item.deferCount < 0)) {
      errors.push(`${label}: deferCount must be >= 0`);
    }
    if (item.prepTasks !== undefined && !Array.isArray(item.prepTasks)) {
      errors.push(`${label}: prepTasks must be an array`);
    }
    if (item.history !== undefined && !Array.isArray(item.history)) {
      errors.push(`${label}: history must be an array`);
    }
    return errors;
  }

  function _normalizePlannerItem(item) {
    if (!isObj(item)) return item;
    const out = Object.assign({}, item);
    if (!out.status)     out.status     = 'inbox';
    if (!out.type)       out.type       = 'task';
    if (!out.priority)   out.priority   = 'none';
    if (out.deferCount === undefined) out.deferCount = 0;
    if (!Array.isArray(out.prepTasks))  out.prepTasks  = [];
    if (!Array.isArray(out.history))    out.history    = [];
    if (!Array.isArray(out.customFlags)) out.customFlags = [];
    if (!out.saved) out.saved = new Date().toISOString();
    return out;
  }

  // Monthly store: { [YYYY-MM]: { items: Item[], goals: Goal[], notes: string } }
  SCHEMAS[HQKeys.MONTHLY] = {
    validate(data) {
      const errors = [];
      if (!isObj(data)) { errors.push('monthly: must be an object'); return errors; }
      Object.entries(data).forEach(([mk, month]) => {
        if (!MONTH_KEY_RE.test(mk)) {
          errors.push(`monthly: invalid month key "${mk}"`);
        }
        if (!isObj(month)) { errors.push(`monthly[${mk}]: not an object`); return; }
        const items = month.items || [];
        if (!Array.isArray(items)) { errors.push(`monthly[${mk}].items: must be array`); return; }
        const dupes = checkDuplicateIds(items, `monthly[${mk}].items`);
        errors.push(...dupes.errors);
        items.forEach((item, i) => {
          errors.push(..._validatePlannerItem(item, `monthly[${mk}].items[${i}]`));
        });
      });
      return errors;
    },
    normalize(data) {
      if (!isObj(data)) return data;
      const out = {};
      Object.entries(data).forEach(([mk, month]) => {
        if (!isObj(month)) { out[mk] = month; return; }
        out[mk] = Object.assign({}, month, {
          items: (month.items || []).map(_normalizePlannerItem),
          goals: month.goals || [],
          notes: month.notes || '',
        });
      });
      return out;
    }
  };

  // Weekly store: { [YYYY-Www]: { inbox: Item[], days: { [YYYY-MM-DD]: Item[] },
  //                               goals: Goal[], notes: string, review: any } }
  SCHEMAS[HQKeys.WEEKLY] = {
    validate(data) {
      const errors = [];
      if (!isObj(data)) { errors.push('weekly: must be an object'); return errors; }
      Object.entries(data).forEach(([wk, week]) => {
        if (!WEEK_KEY_RE.test(wk)) {
          errors.push(`weekly: invalid week key "${wk}"`);
        }
        if (!isObj(week)) { errors.push(`weekly[${wk}]: not an object`); return; }
        // Validate inbox
        (week.inbox || []).forEach((item, i) => {
          errors.push(..._validatePlannerItem(item, `weekly[${wk}].inbox[${i}]`));
        });
        // Validate days
        Object.entries(week.days || {}).forEach(([day, items]) => {
          if (!DATE_RE.test(day)) errors.push(`weekly[${wk}].days: invalid day key "${day}"`);
          (items || []).forEach((item, i) => {
            errors.push(..._validatePlannerItem(item, `weekly[${wk}].days[${day}][${i}]`));
          });
        });
      });
      return errors;
    },
    normalize(data) {
      if (!isObj(data)) return data;
      const out = {};
      Object.entries(data).forEach(([wk, week]) => {
        if (!isObj(week)) { out[wk] = week; return; }
        const days = {};
        Object.entries(week.days || {}).forEach(([day, items]) => {
          days[day] = (items || []).map(_normalizePlannerItem);
        });
        out[wk] = Object.assign({}, week, {
          inbox : (week.inbox || []).map(_normalizePlannerItem),
          days,
          goals : week.goals || [],
          notes : week.notes || '',
        });
      });
      return out;
    }
  };

  // ── Core validator API ────────────────────────────────────────────────────

  /**
   * Validate data against the schema registered for key.
   * Returns { valid: bool, errors: string[], schema: bool }
   * schema=false means no schema registered for this key (not a failure).
   */
  function validate(key, data) {
    const schema = SCHEMAS[key];
    if (!schema) return { valid: true, errors: [], schema: false };
    const errors = schema.validate(data);
    return { valid: errors.length === 0, errors, schema: true };
  }

  /**
   * Normalize data for the given key (coerce timestamps, fill safe defaults).
   * Returns data unchanged if no schema registered.
   */
  function normalize(key, data) {
    const schema = SCHEMAS[key];
    if (!schema || typeof schema.normalize !== 'function') return data;
    try { return schema.normalize(data); } catch (_) { return data; }
  }

  /**
   * Combined: validate then normalize.
   * Called by runtime-state.js on every set().
   * Always returns { value, errors } — errors is [] if valid or no schema.
   * Write always proceeds (passive mode — Stage 5 strategy).
   */
  function validateAndNormalize(key, data) {
    const { valid, errors, schema } = validate(key, data);
    if (schema && !valid) {
      _logFailure(key, errors);
      if (window.localStorage && localStorage.getItem('hq-runtime-debug') === '1') {
        console.warn(`[HQValidator] ${key}:`, errors);
      }
    }
    const normalized = normalize(key, data);
    return { value: normalized, errors };
  }

  /**
   * Session validation failure report.
   */
  function report() {
    const grouped = {};
    _failLog.forEach(entry => {
      if (!grouped[entry.key]) grouped[entry.key] = [];
      grouped[entry.key].push(...entry.errors);
    });
    const keys = Object.keys(grouped);
    if (keys.length === 0) {
      console.log('%c✅ HQValidator: no validation failures this session', 'color:green');
      return {};
    }
    console.group('%c⚠️ HQValidator: session failures', 'color:orange;font-weight:bold');
    keys.forEach(k => {
      console.group(k);
      grouped[k].forEach(e => console.warn(e));
      console.groupEnd();
    });
    console.groupEnd();
    return grouped;
  }

  // ── Public API ────────────────────────────────────────────────────────────
  window.HQValidator = {
    validate,
    normalize,
    validateAndNormalize,
    report,
    /** Raw failure log access */
    getFailLog() { return _failLog.slice(); },
    /** Register a custom schema for any key */
    registerSchema(key, schema) { SCHEMAS[key] = schema; },
    /** List all keys with registered schemas */
    schemas() { return Object.keys(SCHEMAS); },
  };

  window.dispatchEvent(new CustomEvent('hq-validator-ready'));

})();
