/**
 * runtime-import-pipeline.js — AuDHD HQ Import Pipeline
 *
 * Stage 6: Import → Validation → Migration → Reference Repair → Safe Commit
 *
 * This is the authoritative entry point for ALL data imports.
 * No data should ever be written to storage by pasting raw JSON directly.
 * Every import runs through this pipeline.
 *
 * Pipeline stages:
 *   1. PARSE        — deserialize and detect schemaVersion
 *   2. VALIDATE     — run HQValidator against every key
 *   3. MIGRATE      — apply any pending migration transforms
 *   4. REPAIR       — detect and fix orphaned references
 *   5. DIFF         — show what will change before committing
 *   6. COMMIT       — write to storage through HQState (all or nothing per key)
 *
 * Modes:
 *   'dry-run'  — runs all stages, returns report, writes nothing (default)
 *   'commit'   — writes after user confirmation
 *
 * Exposes: window.HQImport
 *
 * Usage:
 *   // Dry run (safe, always start here)
 *   const report = await HQImport.run(jsonString);
 *   console.log(report);
 *
 *   // Commit after reviewing report
 *   const result = await HQImport.run(jsonString, { mode: 'commit' });
 *
 *   // Import a single key
 *   const report = await HQImport.runKey(HQKeys.CHECKIN_LOG, data);
 *
 * Loading order:
 *   ... → runtime-validator.js → runtime-schema-registry.js
 *   → runtime-import-pipeline.js → hq-core.js
 */

(function () {
  'use strict';

  // ── Utility ───────────────────────────────────────────────────────────────

  function _ts() { return Date.now(); }

  function _clone(v) {
    try { return JSON.parse(JSON.stringify(v)); } catch (_) { return v; }
  }

  // ── STAGE 1: PARSE ────────────────────────────────────────────────────────
  // Accept string or object. Extract schemaVersion and key map.
  // Returns { ok, data, schemaVersion, errors }

  function _parse(input) {
    let raw;
    if (typeof input === 'string') {
      try { raw = JSON.parse(input); }
      catch (e) { return { ok: false, errors: [`Parse error: ${e.message}`] }; }
    } else if (input && typeof input === 'object') {
      raw = input;
    } else {
      return { ok: false, errors: ['Input must be a JSON string or object'] };
    }

    const schemaVersion = raw.schemaVersion || 0;
    const exportedAt    = raw._exportedAt   || null;

    // Strip registry metadata — everything else is key → value
    const STRIP = new Set(['schemaVersion', '_exportedAt', '_keyVersions', '_hqExport']);
    const data  = {};
    Object.entries(raw).forEach(([k, v]) => {
      if (!STRIP.has(k)) data[k] = v;
    });

    if (Object.keys(data).length === 0) {
      return { ok: false, errors: ['Import contains no data keys'] };
    }

    return { ok: true, data, schemaVersion, exportedAt, errors: [] };
  }

  // ── STAGE 2: VALIDATE ─────────────────────────────────────────────────────
  // Run HQValidator on every key that has a schema.
  // Returns { results: { [key]: { valid, errors } }, hasErrors }

  function _validate(data) {
    const results  = {};
    let hasErrors  = false;

    Object.entries(data).forEach(([key, value]) => {
      if (!window.HQValidator) {
        results[key] = { valid: true, errors: [], schema: false };
        return;
      }
      const r = window.HQValidator.validate(key, value);
      results[key] = r;
      if (!r.valid && r.schema) hasErrors = true;
    });

    return { results, hasErrors };
  }

  // ── STAGE 3: MIGRATE ──────────────────────────────────────────────────────
  // Apply migration transforms to keys that need them.
  // Transforms are safe coercions only — they match what the migration
  // descriptors in HQSchemaRegistry describe.
  // Returns { data: migratedData, applied: string[], skipped: string[] }

  // Migration transform functions — one per migration id
  // These mirror the descriptors in runtime-schema-registry.js
  const TRANSFORMS = {

    'mig-recurring-events-recurrence-object'(items) {
      if (!Array.isArray(items)) return items;
      return items.map(ev => {
        if (!ev || ev.recurrence) return ev;
        const out = Object.assign({}, ev);
        if (ev.freq || ev.interval || ev.byDay) {
          out.recurrence = {
            freq     : ev.freq     || 'weekly',
            interval : ev.interval || 1,
          };
          if (ev.byDay) out.recurrence.byDay = ev.byDay;
          delete out.freq;
          delete out.interval;
          delete out.byDay;
        }
        return out;
      });
    },

    'mig-checkin-log-timeslot-normalise'(items) {
      if (!Array.isArray(items)) return items;
      return items.map(e => {
        if (!e || !e.timeSlot) return e;
        return Object.assign({}, e, { timeSlot: e.timeSlot.toLowerCase() });
      });
    },

    'mig-taskboard-items-ids'(data) {
      if (!data || !data.lists) return data;
      let counter = Date.now();
      const lists = {};
      Object.entries(data.lists).forEach(([listId, list]) => {
        lists[listId] = Object.assign({}, list, {
          items: (list.items || []).map(item => {
            if (!item || item.id) return item;
            return Object.assign({}, item, { id: 'task-' + (counter++) });
          })
        });
      });
      return Object.assign({}, data, { lists });
    },

    'mig-flags-priority-clamp'(items) {
      if (!Array.isArray(items)) return items;
      return items.map(f => {
        if (!f || f.priority === undefined) return f;
        const p = Number(f.priority);
        const clamped = Math.min(5, Math.max(1, Math.round(isFinite(p) ? p : 3)));
        return Object.assign({}, f, { priority: clamped });
      });
    },

    'mig-med-log-ts-normalise'(items) {
      if (!Array.isArray(items)) return items;
      return items.map(e => {
        if (!e || e.ts) return e;
        const ts = e.at ? Date.parse(e.at) : Date.now();
        const out = Object.assign({}, e, { ts: isNaN(ts) ? Date.now() : ts });
        delete out.at;
        return out;
      });
    },

    'mig-habits-log-date-strings'(items) {
      if (!Array.isArray(items)) return items;
      return items.map(h => {
        if (!h || !Array.isArray(h.log)) return h;
        return Object.assign({}, h, {
          log: h.log.map(d => {
            if (typeof d === 'string' && d.length > 10) return d.slice(0, 10);
            return d;
          })
        });
      });
    },
  };

  // Map migration id → key it operates on
  const MIGRATION_KEYS = {
    'mig-recurring-events-recurrence-object' : HQKeys.RECURRING_EVENTS,
    'mig-checkin-log-timeslot-normalise'      : HQKeys.CHECKIN_LOG,
    'mig-taskboard-items-ids'                 : HQKeys.TASKBOARD,
    'mig-flags-priority-clamp'                : HQKeys.FLAGS,
    'mig-med-log-ts-normalise'                : HQKeys.MED_LOG,
    'mig-habits-log-date-strings'             : HQKeys.HABITS,
  };

  function _migrate(data) {
    const out     = _clone(data);
    const applied = [];
    const skipped = [];

    // Get pending migrations from registry if available
    const pending = window.HQSchemaRegistry
      ? window.HQSchemaRegistry.migrations().filter(m => m.status === 'pending')
      : [];

    // For each migration that has a transform and whose key is in the import
    Object.entries(TRANSFORMS).forEach(([migId, transform]) => {
      const key = MIGRATION_KEYS[migId];
      if (!key || !(key in out)) { skipped.push(migId); return; }

      // Check if migration is actually needed on this data
      const descriptor = pending.find(m => m.id === migId);
      const needed = descriptor
        ? (typeof descriptor.detect === 'function' ? descriptor.detect(out[key]) : true)
        : true; // if registry not available, run all matching transforms

      if (!needed) { skipped.push(migId); return; }

      try {
        out[key] = transform(out[key]);
        applied.push(migId);
      } catch (e) {
        console.warn(`[HQImport] Migration ${migId} failed:`, e);
        skipped.push(migId);
      }
    });

    return { data: out, applied, skipped };
  }

  // ── STAGE 4: REFERENCE REPAIR ─────────────────────────────────────────────
  // Detect and fix orphaned cross-domain references.
  // Currently detects; repair is conservative (reports but does not delete).
  // Returns { orphans: [], repaired: [] }

  function _repair(data) {
    const orphans  = [];
    const repaired = [];

    // Check 1: recurring event IDs referenced in taskboard items
    if (data[HQKeys.RECURRING_EVENTS] && data[HQKeys.TASKBOARD]) {
      const recurringIds = new Set(
        (data[HQKeys.RECURRING_EVENTS] || []).map(e => e && e.id).filter(Boolean)
      );
      const taskboard = data[HQKeys.TASKBOARD];
      Object.entries(taskboard.lists || {}).forEach(([listId, list]) => {
        (list.items || []).forEach(item => {
          if (item && item.recurringId && !recurringIds.has(item.recurringId)) {
            orphans.push({
              type: 'orphaned-recurring-ref',
              location: `taskboard.lists.${listId}.items[id=${item.id}]`,
              field: 'recurringId',
              value: item.recurringId,
              detail: 'References a recurring event that does not exist in audhd-hq-recurring-events'
            });
          }
        });
      });
    }

    // Check 2: flag source IDs — flags reference module/source keys
    if (data[HQKeys.FLAGS]) {
      const flags = data[HQKeys.FLAGS];
      if (Array.isArray(flags)) {
        // Detect flags with moduleId that reference modules not in module-settings
        const enabledModules = data[HQKeys.MODULE_SETTINGS]
          ? Object.keys(data[HQKeys.MODULE_SETTINGS].enabled || {})
          : [];
        if (enabledModules.length > 0) {
          flags.forEach((f, i) => {
            if (f && f.moduleId && !enabledModules.includes(f.moduleId)) {
              orphans.push({
                type: 'orphaned-module-ref',
                location: `flags[${i}]`,
                field: 'moduleId',
                value: f.moduleId,
                detail: 'References a module not found in module-settings.enabled'
              });
            }
          });
        }

        // Detect duplicate flag IDs
        const seen = new Set();
        flags.forEach((f, i) => {
          if (!f || !f.id) return;
          if (seen.has(f.id)) {
            orphans.push({
              type: 'duplicate-id',
              location: `flags[${i}]`,
              field: 'id',
              value: f.id,
              detail: 'Duplicate flag ID — only the first occurrence will be used'
            });
          }
          seen.add(f.id);
        });
      }
    }

    // Check 3: checkin log entries referencing unknown timeSlot IDs
    if (data[HQKeys.CHECKIN_LOG] && data[HQKeys.REMINDER_CONFIG]) {
      const reminderWindows = new Set(
        (data[HQKeys.REMINDER_CONFIG].windows || []).map(w => w && w.id).filter(Boolean)
      );
      if (reminderWindows.size > 0) {
        (data[HQKeys.CHECKIN_LOG] || []).forEach((entry, i) => {
          if (entry && entry.timeSlot && !reminderWindows.has(entry.timeSlot)) {
            orphans.push({
              type: 'orphaned-timeslot-ref',
              location: `checkin-log[${i}]`,
              field: 'timeSlot',
              value: entry.timeSlot,
              detail: 'References a timeSlot not in reminder-config.windows — possibly renamed'
            });
          }
        });
      }
    }

    // Check 4: recurring events with endDate before startDate
    if (data[HQKeys.RECURRING_EVENTS]) {
      (data[HQKeys.RECURRING_EVENTS] || []).forEach((ev, i) => {
        if (!ev || !ev.startDate || !ev.endDate) return;
        if (ev.endDate < ev.startDate) {
          orphans.push({
            type: 'invalid-date-range',
            location: `recurring-events[${i}]`,
            field: 'endDate',
            value: ev.endDate,
            detail: `endDate "${ev.endDate}" is before startDate "${ev.startDate}"`
          });
        }
      });
    }

    return { orphans, repaired };
  }

  // ── STAGE 5: DIFF ─────────────────────────────────────────────────────────
  // Compare import data against live storage.
  // Returns { changes: { [key]: { action, liveSize, importSize } } }

  function _diff(data) {
    const S = window.HQState || window.HQStore;
    const changes = {};

    Object.keys(data).forEach(key => {
      const live = S ? S.get(key, null) : null;
      const importSize = JSON.stringify(data[key]).length;
      if (live === null) {
        changes[key] = { action: 'add', liveSize: 0, importSize };
      } else {
        const liveSize = JSON.stringify(live).length;
        const changed  = JSON.stringify(live) !== JSON.stringify(data[key]);
        changes[key] = changed
          ? { action: 'update', liveSize, importSize }
          : { action: 'unchanged', liveSize, importSize };
      }
    });

    return { changes };
  }

  // ── STAGE 6: COMMIT ───────────────────────────────────────────────────────
  // Write all keys through HQState. Skips unchanged keys.
  // Returns { written: string[], skipped: string[], errors: string[] }

  function _commit(data, diff) {
    const S = window.HQState;
    if (!S) {
      return { written: [], skipped: Object.keys(data), errors: ['HQState not available — cannot commit'] };
    }

    const written = [];
    const skipped = [];
    const errors  = [];

    Object.entries(data).forEach(([key, value]) => {
      const change = diff.changes[key];
      if (change && change.action === 'unchanged') {
        skipped.push(key);
        return;
      }
      try {
        const ok = S.set(key, value);
        if (ok !== false) written.push(key);
        else errors.push(`${key}: set() returned false`);
      } catch (e) {
        errors.push(`${key}: ${e.message}`);
      }
    });

    if (written.length > 0) {
      // Notify other runtime layers
      try {
        window.dispatchEvent(new CustomEvent('hq-import-committed', {
          detail: { written, errors, ts: _ts() }
        }));
        if (window.HQBus) window.HQBus.emit('import:committed', { written, errors });
      } catch (_) {}
    }

    return { written, skipped, errors };
  }

  // ── FULL PIPELINE ─────────────────────────────────────────────────────────

  /**
   * Run the full import pipeline.
   * @param {string|object} input   JSON string or parsed object
   * @param {{ mode?: 'dry-run'|'commit', allowOrphans?: boolean }} options
   * @returns {object} Pipeline report
   */
  function run(input, options) {
    const opts = Object.assign({ mode: 'dry-run', allowOrphans: true }, options);
    const report = {
      mode      : opts.mode,
      ts        : _ts(),
      stages    : {},
      summary   : { ok: false, keyCount: 0, validationErrors: 0, migrationsApplied: 0, orphans: 0, written: 0 },
    };

    // 1. Parse
    const parsed = _parse(input);
    report.stages.parse = { ok: parsed.ok, schemaVersion: parsed.schemaVersion, exportedAt: parsed.exportedAt, errors: parsed.errors };
    if (!parsed.ok) { report.summary.error = 'Parse failed'; return report; }

    report.summary.keyCount = Object.keys(parsed.data).length;

    // 2. Validate
    const validation = _validate(parsed.data);
    report.stages.validate = { hasErrors: validation.hasErrors, results: validation.results };
    report.summary.validationErrors = Object.values(validation.results).reduce(
      (n, r) => n + (r.errors ? r.errors.length : 0), 0
    );

    // 3. Migrate
    const migration = _migrate(parsed.data);
    report.stages.migrate = { applied: migration.applied, skipped: migration.skipped };
    report.summary.migrationsApplied = migration.applied.length;

    // After migration, normalize via validator
    let normalizedData = migration.data;
    if (window.HQValidator) {
      Object.keys(normalizedData).forEach(key => {
        try {
          const r = window.HQValidator.validateAndNormalize(key, normalizedData[key]);
          normalizedData[key] = r.value;
        } catch (_) {}
      });
    }

    // 4. Reference repair
    const repair = _repair(normalizedData);
    report.stages.repair = { orphans: repair.orphans, repaired: repair.repaired };
    report.summary.orphans = repair.orphans.length;

    // Block commit if orphans detected and allowOrphans=false
    if (!opts.allowOrphans && repair.orphans.length > 0) {
      report.summary.error = `${repair.orphans.length} orphaned reference(s) detected — set allowOrphans:true to proceed`;
      return report;
    }

    // 5. Diff
    const diff = _diff(normalizedData);
    report.stages.diff = diff;

    // 6. Commit (only in commit mode)
    if (opts.mode === 'commit') {
      const commit = _commit(normalizedData, diff);
      report.stages.commit = commit;
      report.summary.written = commit.written.length;
      report.summary.ok = commit.errors.length === 0;
    } else {
      report.summary.ok = true;
      report.summary.note = 'Dry run — no data written. Pass { mode: "commit" } to write.';
    }

    return report;
  }

  /**
   * Import a single key's data through the full pipeline.
   * @param {string} key
   * @param {*} value
   * @param {{ mode?: 'dry-run'|'commit' }} options
   */
  function runKey(key, value, options) {
    return run({ [key]: value }, options);
  }

  /**
   * Pretty-print a pipeline report to the console.
   * @param {object} report  Result of run() or runKey()
   */
  function printReport(report) {
    const ok = report.summary.ok;
    console.group(
      `%c📥 HQImport report [${report.mode}] — ${ok ? '✅ OK' : '⚠️ Issues'}`,
      `font-weight:bold;color:${ok ? 'green' : 'orange'}`
    );

    // Parse
    const p = report.stages.parse || {};
    console.log(`📄 Parse: ${p.ok ? 'OK' : 'FAILED'} | schemaVersion: ${p.schemaVersion ?? '—'} | keys: ${report.summary.keyCount}`);
    if (p.errors && p.errors.length) p.errors.forEach(e => console.error('  ', e));

    // Validate
    const v = report.stages.validate || {};
    if (v.hasErrors) {
      console.group(`❌ Validation: ${report.summary.validationErrors} error(s)`);
      Object.entries(v.results || {}).forEach(([k, r]) => {
        if (r.errors && r.errors.length) {
          console.warn(k, r.errors);
        }
      });
      console.groupEnd();
    } else {
      console.log(`✅ Validation: all schemas passed`);
    }

    // Migrate
    const m = report.stages.migrate || {};
    if (m.applied && m.applied.length) {
      console.log(`🔧 Migrations applied: ${m.applied.join(', ')}`);
    } else {
      console.log('🔧 Migrations: none needed');
    }

    // Repair
    const r = report.stages.repair || {};
    if (r.orphans && r.orphans.length) {
      console.group(`⚠️ Orphans detected: ${r.orphans.length}`);
      r.orphans.forEach(o => console.warn(`  [${o.type}] ${o.location}.${o.field} = "${o.value}" — ${o.detail}`));
      console.groupEnd();
    } else {
      console.log('🔗 References: no orphans detected');
    }

    // Diff
    const d = report.stages.diff || {};
    if (d.changes) {
      const adds    = Object.values(d.changes).filter(c => c.action === 'add').length;
      const updates = Object.values(d.changes).filter(c => c.action === 'update').length;
      const same    = Object.values(d.changes).filter(c => c.action === 'unchanged').length;
      console.log(`📊 Diff: ${adds} add / ${updates} update / ${same} unchanged`);
    }

    // Commit
    if (report.stages.commit) {
      const c = report.stages.commit;
      console.log(`💾 Committed: ${c.written.length} written, ${c.skipped.length} skipped`);
      if (c.errors.length) {
        console.group('❌ Commit errors');
        c.errors.forEach(e => console.error(' ', e));
        console.groupEnd();
      }
    } else {
      console.log(`💾 Commit: dry run — nothing written`);
    }

    if (report.summary.note) console.log(`ℹ️  ${report.summary.note}`);
    if (report.summary.error) console.error(`❌ ${report.summary.error}`);

    console.groupEnd();
    return report;
  }

  // ── Public API ────────────────────────────────────────────────────────────
  window.HQImport = {
    run,
    runKey,
    printReport,
    /** Convenience: run + print in one call */
    inspect(input, options) {
      return printReport(run(input, options));
    },
  };

  window.dispatchEvent(new CustomEvent('hq-import-pipeline-ready'));

})();
