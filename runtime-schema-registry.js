/**
 * runtime-schema-registry.js — AuDHD HQ Schema Version Registry
 *
 * Stage 6: Schema versioning, migration registry, domain model preparation.
 *
 * Purpose:
 *   - Assign a version number to every canonical storage key
 *   - Track the CURRENT live version of each key's data shape
 *   - Register pending migrations (read-only descriptions — no execution yet)
 *   - Stamp schemaVersion on every data export
 *   - Detect keys whose live data is below current schema version
 *
 * This file does NOT rewrite domain models.
 * It builds the infrastructure that makes normalization safe to do later.
 *
 * Exposes: window.HQSchemaRegistry
 *
 * Usage:
 *   HQSchemaRegistry.version(HQKeys.TASKBOARD)  → 1
 *   HQSchemaRegistry.status()                        → { upToDate, needsMigration, unknown }
 *   HQSchemaRegistry.stamp(exportObj)                → exportObj with schemaVersion + keyVersions
 *   HQSchemaRegistry.migrations()                    → pending migration descriptors
 *
 * Loading order:
 *   ... → runtime-validator.js → runtime-schema-registry.js → hq-core.js
 */

(function () {
  'use strict';

  // ── Current schema version for every canonical key ────────────────────────
  // Increment a key's version when its shape changes in a breaking way.
  // The migration registry below maps old version → new version handlers.
  //
  // Version 1 = the shape that existed when Stage 6 was implemented.
  // These are the LIVE current versions — not target versions.

  const KEY_VERSIONS = {
    // Core config
    [HQKeys.THEME]:              { v: 1, domain: 'config',       label: 'Theme'               },
    [HQKeys.FLAGS]:              { v: 1, domain: 'config',       label: 'Flags'               },
    [HQKeys.PROFILE]:            { v: 1, domain: 'config',       label: 'Profile'             },
    [HQKeys.DISPLAY_PREFS]:      { v: 1, domain: 'config',       label: 'Display Preferences' },
    [HQKeys.MODULE_SETTINGS]:    { v: 1, domain: 'config',       label: 'Module Settings'     },
    [HQKeys.REMINDER_CONFIG]:    { v: 1, domain: 'config',       label: 'Reminder Config'     },
    [HQKeys.BOTTOM_NAV_SLOTS]:   { v: 1, domain: 'config',       label: 'Bottom Nav Slots'    },
    [HQKeys.SHORTCUTS]:          { v: 1, domain: 'config',       label: 'Shortcuts'           },
    [HQKeys.CHECKIN_PRESETS]:    { v: 1, domain: 'config',       label: 'Check-in Presets'    },
    [HQKeys.CHECKIN_VISIBILITY]: { v: 1, domain: 'config',       label: 'Check-in Visibility' },
    [HQKeys.ACTIVE_MODULES]:     { v: 1, domain: 'config',       label: 'Active Modules'      },
    [HQKeys.WIZARD_DONE]:        { v: 1, domain: 'config',       label: 'Wizard Done'         },

    // Scheduling / time
    [HQKeys.RECURRING_EVENTS]:   { v: 1, domain: 'scheduling',   label: 'Recurring Events'    },
    [HQKeys.RECURRING]:          { v: 1, domain: 'scheduling',   label: 'Recurring (legacy)'  },
    [HQKeys.MONTHLY]:            { v: 1, domain: 'scheduling',   label: 'Monthly Planner'     },
    [HQKeys.WEEKLY]:             { v: 1, domain: 'scheduling',   label: 'Weekly Planner'      },
    [HQKeys.THEME_SCHEDULE]:     { v: 1, domain: 'scheduling',   label: 'Theme Schedule'      },

    // Tasks / work
    [HQKeys.TASKBOARD]:          { v: 1, domain: 'tasks',        label: 'TaskBoard'           },
    [HQKeys.BRAINDUMP]:          { v: 1, domain: 'tasks',        label: 'Brain Dump'          },
    [HQKeys.ROUTINES]:           { v: 1, domain: 'tasks',        label: 'Routines'            },
    [HQKeys.PREPWORK]:           { v: 1, domain: 'tasks',        label: 'Prepwork'            },
    [HQKeys.HABITS]:             { v: 1, domain: 'tasks',        label: 'Habits'              },
    [HQKeys.DAYBUILDER_V2]:      { v: 1, domain: 'tasks',        label: 'DayBuilder'          },

    // Health / wellness
    [HQKeys.CHECKIN_LOG]:        { v: 1, domain: 'health',       label: 'Check-in Log'        },
    [HQKeys.HEALTH]:             { v: 1, domain: 'health',       label: 'Health Data'         },
    [HQKeys.MEDS]:               { v: 1, domain: 'health',       label: 'Medications'         },
    [HQKeys.MED_LOG]:            { v: 1, domain: 'health',       label: 'Med Log'             },
    [HQKeys.ENERGY_STATE]:       { v: 1, domain: 'health',       label: 'Energy State'        },
    [HQKeys.WALKING]:            { v: 1, domain: 'health',       label: 'Walking Tracker'     },
    [HQKeys.WALKING_HISTORY]:    { v: 1, domain: 'health',       label: 'Walking History'     },
    [HQKeys.DREAMS]:             { v: 1, domain: 'health',       label: 'Dream Journal'       },
    [HQKeys.METRICS]:            { v: 1, domain: 'health',       label: 'Metrics Snapshots'   },

    // Finance
    [HQKeys.FINANCE]:            { v: 1, domain: 'finance',      label: 'Finance'             },
    [HQKeys.DEBTS]:              { v: 1, domain: 'finance',      label: 'Debts'               },
    [HQKeys.INCOME_SMOOTH]:      { v: 1, domain: 'finance',      label: 'Income Smoothing'    },

    // Social / life
    [HQKeys.SOCIAL_BRAIN]:       { v: 1, domain: 'social',       label: 'Social Brain'        },
    [HQKeys.LIFE_ADMIN]:         { v: 1, domain: 'life',         label: 'Life Admin'          },
    [HQKeys.LIFE_AREAS]:         { v: 1, domain: 'life',         label: 'Life Areas'          },
    [HQKeys.KITCHEN]:            { v: 1, domain: 'life',         label: 'Kitchen Brain'       },
    [HQKeys.FRIDGE]:             { v: 1, domain: 'life',         label: 'Fridge'              },
    [HQKeys.SURVIVAL]:           { v: 1, domain: 'life',         label: 'Survival Mode'       },

    // Notifications
    [HQKeys.NOTIF_CONFIG]:       { v: 1, domain: 'notifications',label: 'Notif Config'        },
    [HQKeys.NOTIF_CUSTOM]:       { v: 1, domain: 'notifications',label: 'Notif Custom'        },

    // Tags / categories
    [HQKeys.TAGS]:               { v: 1, domain: 'taxonomy',     label: 'Tags'                },
    [HQKeys.CATEGORIES]:         { v: 1, domain: 'taxonomy',     label: 'Categories'          },

    // Projects
    'hq_projects':                 { v: 1, domain: 'projects',     label: 'Projects'            },
    'hq_concepts':                 { v: 1, domain: 'projects',     label: 'Concepts'            },
  };

  // ── Migration registry ────────────────────────────────────────────────────
  // Each entry describes a pending migration — what needs to happen and why.
  // Migrations are DESCRIPTORS only in Stage 6. Execution happens in a future
  // import pipeline run, not automatically on page load.
  //
  // Format: { id, key, fromVersion, toVersion, description, risk, status }
  //   risk: 'low' | 'medium' | 'high'
  //   status: 'pending' | 'deferred' | 'complete'

  const MIGRATIONS = [

    {
      id: 'mig-recurring-events-recurrence-object',
      key: HQKeys.RECURRING_EVENTS,
      fromVersion: 0,
      toVersion: 1,
      description: 'Ensure all recurring events have a recurrence object with freq field. ' +
                   'Items using flat freq/interval fields at root level need nesting under recurrence{}.',
      risk: 'medium',
      status: 'pending',
      detect(items) {
        if (!Array.isArray(items)) return false;
        return items.some(e => e && (e.freq || e.interval) && !e.recurrence);
      }
    },

    {
      id: 'mig-checkin-log-timeslot-normalise',
      key: HQKeys.CHECKIN_LOG,
      fromVersion: 0,
      toVersion: 1,
      description: 'Normalise timeSlot casing: some entries use "Morning" instead of "morning". ' +
                   'Lowercase all timeSlot values for consistent querying.',
      risk: 'low',
      status: 'pending',
      detect(items) {
        if (!Array.isArray(items)) return false;
        return items.some(e => e && e.timeSlot && e.timeSlot !== e.timeSlot.toLowerCase());
      }
    },

    {
      id: 'mig-taskboard-items-ids',
      key: HQKeys.TASKBOARD,
      fromVersion: 0,
      toVersion: 1,
      description: 'Ensure every task item has a stable id. ' +
                   'Items without id were created before the ID enforcement patch.',
      risk: 'low',
      status: 'pending',
      detect(data) {
        if (!data || !data.lists) return false;
        return Object.values(data.lists).some(list =>
          (list.items || []).some(item => !item.id)
        );
      }
    },

    {
      id: 'mig-flags-priority-clamp',
      key: HQKeys.FLAGS,
      fromVersion: 0,
      toVersion: 1,
      description: 'Clamp flag priority values to 1–5 range. ' +
                   'Legacy flags used 0-based or out-of-range priority numbers.',
      risk: 'low',
      status: 'pending',
      detect(items) {
        if (!Array.isArray(items)) return false;
        return items.some(f => f && f.priority !== undefined &&
          (f.priority < 1 || f.priority > 5 || !Number.isFinite(f.priority)));
      }
    },

    {
      id: 'mig-med-log-ts-normalise',
      key: HQKeys.MED_LOG,
      fromVersion: 0,
      toVersion: 1,
      description: 'Normalise med-log timestamps: some entries use ISO string "at" field ' +
                   'instead of numeric "ts". Coerce all to numeric epoch ms.',
      risk: 'low',
      status: 'pending',
      detect(items) {
        if (!Array.isArray(items)) return false;
        return items.some(e => e && !e.ts && e.at);
      }
    },

    {
      id: 'mig-habits-log-date-strings',
      key: HQKeys.HABITS,
      fromVersion: 0,
      toVersion: 1,
      description: 'Ensure habit log entries are YYYY-MM-DD strings. ' +
                   'Some early entries stored full ISO timestamps instead of date-only strings.',
      risk: 'low',
      status: 'pending',
      detect(items) {
        if (!Array.isArray(items)) return false;
        return items.some(h => (h.log || []).some(
          d => typeof d === 'string' && d.length > 10
        ));
      }
    },

  ];

  // ── Scan live storage for pending migrations ──────────────────────────────
  function scanMigrations() {
    const results = [];
    const S = window.HQState || window.HQStore;
    if (!S) return results;

    MIGRATIONS.filter(m => m.status === 'pending').forEach(mig => {
      let needed = false;
      try {
        const data = S.get(mig.key, null);
        if (data !== null && typeof mig.detect === 'function') {
          needed = mig.detect(data);
        }
      } catch (_) {}
      results.push({ ...mig, needed });
    });

    return results;
  }

  // ── Schema version stamp for exports ─────────────────────────────────────
  // Adds schemaVersion and per-domain keyVersions to any export object.
  // Call this before writing a JSON export to disk or sync.
  function stamp(exportObj) {
    if (!exportObj || typeof exportObj !== 'object') return exportObj;
    return Object.assign({}, exportObj, {
      schemaVersion: 1,
      _exportedAt: new Date().toISOString(),
      _keyVersions: Object.fromEntries(
        Object.entries(KEY_VERSIONS).map(([k, v]) => [k, v.v])
      ),
    });
  }

  // ── Status summary ────────────────────────────────────────────────────────
  function status() {
    const S = window.HQState || window.HQStore;
    const live = {};
    const needsMigration = [];
    const unknown = [];

    Object.keys(KEY_VERSIONS).forEach(key => {
      try {
        const data = S ? S.get(key, null) : null;
        if (data === null) {
          live[key] = 'not-set';
        } else {
          live[key] = KEY_VERSIONS[key].v;
        }
      } catch (_) {
        live[key] = 'error';
      }
    });

    // Check for any keys in localStorage not in our registry
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('audhd-hq-') || k.startsWith('hq_')) && !KEY_VERSIONS[k]) {
          unknown.push(k);
        }
      }
    } catch (_) {}

    const scan = scanMigrations();
    scan.filter(m => m.needed).forEach(m => needsMigration.push(m.id));

    return {
      keyCount: Object.keys(KEY_VERSIONS).length,
      registeredKeys: live,
      needsMigration,
      unknown,
      upToDate: needsMigration.length === 0,
    };
  }

  // ── Console reporter ──────────────────────────────────────────────────────
  function report() {
    const s = status();
    console.group('%c📦 HQSchemaRegistry', 'font-weight:bold;font-size:13px');
    console.log(`Keys registered: ${s.keyCount}`);
    console.log(`Unknown keys in storage: ${s.unknown.length > 0 ? s.unknown.join(', ') : 'none'}`);

    const pending = scanMigrations().filter(m => m.needed);
    if (pending.length === 0) {
      console.log('%c✅ All detected data matches current schemas', 'color:green');
    } else {
      console.group(`%c⚠️ ${pending.length} migration(s) detected`, 'color:orange;font-weight:bold');
      pending.forEach(m => {
        console.warn(`[${m.risk.toUpperCase()}] ${m.id}`);
        console.log(`  Key: ${m.key}`);
        console.log(`  ${m.description}`);
      });
      console.groupEnd();
    }

    if (s.unknown.length > 0) {
      console.group('%c⚠️ Unregistered keys', 'color:orange');
      s.unknown.forEach(k => console.log(`  ${k}`));
      console.groupEnd();
    }

    console.groupEnd();
    return s;
  }

  // ── Public API ────────────────────────────────────────────────────────────
  window.HQSchemaRegistry = {
    /** Get the current schema version for a key */
    version(key) {
      return KEY_VERSIONS[key] ? KEY_VERSIONS[key].v : null;
    },
    /** Get all registered key metadata */
    keys() { return Object.assign({}, KEY_VERSIONS); },
    /** Stamp an export object with schemaVersion and key versions */
    stamp,
    /** Get status summary of all keys */
    status,
    /** Get pending migration descriptors (with live detect results) */
    migrations() { return scanMigrations(); },
    /** Full console report */
    report,
    /** List keys by domain */
    byDomain(domain) {
      return Object.entries(KEY_VERSIONS)
        .filter(([, v]) => v.domain === domain)
        .map(([k, v]) => ({ key: k, ...v }));
    },
  };

  // Run scan at startup and emit result
  function _init() {
    const scan = scanMigrations().filter(m => m.needed);
    if (scan.length > 0) {
      console.group(
        '%c📦 HQSchemaRegistry: migrations detected at startup',
        'color:orange;font-weight:bold'
      );
      scan.forEach(m => console.warn(`[${m.risk}] ${m.id}: ${m.description}`));
      console.groupEnd();
    }
    window.dispatchEvent(new CustomEvent('hq-schema-ready', {
      detail: { pendingMigrations: scan.length }
    }));
  }

  function _waitForState(fn) {
    if (window.HQState || window.HQStore) { fn(); return; }
    window.addEventListener('hq-store-ready', fn, { once: true });
  }
  _waitForState(_init);

})();
