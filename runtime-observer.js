/**
 * runtime-observer.js — AuDHD HQ Observability Layer
 *
 * Stage 3: Event logging, state logging, integrity logging, mutation visibility.
 *
 * This file ONLY observes. It does not change any feature behavior.
 * All checks are passive reads. Nothing here mutates application state.
 *
 * Exposes: window.HQObserver
 *
 * Usage (browser console):
 *   HQObserver.report()          — full status snapshot
 *   HQObserver.mutations()       — recent state mutations
 *   HQObserver.events()          — recent bus events
 *   HQObserver.integrity()       — run integrity checks now
 *   HQObserver.watch(key, fn)    — callback on specific key mutation
 *   HQObserver.unwatch(key, fn)
 *   HQObserver.enable()          — turn on live console logging
 *   HQObserver.disable()
 *
 * Loading order:
 *   hq-store.js → runtime-state.js → runtime-events.js
 *   → runtime-bootstrap.js → runtime-services.js
 *   → runtime-observer.js → hq-core.js
 */

(function () {
  'use strict';

  // ── Live logging toggle ──────────────────────────────────────────────────
  let _live = (() => {
    try { return localStorage.getItem('hq-runtime-debug') === '1'; } catch (_) { return false; }
  })();

  function _log(tag, ...args) {
    if (_live) console.debug(`[HQObserver:${tag}]`, ...args);
  }

  // ── Key watchers ─────────────────────────────────────────────────────────
  // watch(key, fn) → called with { op, key, ts, size } on every mutation to key
  const _watchers = {}; // key → Set<fn>

  window.addEventListener('hq-state-mutation', (e) => {
    const { op, key, ts, size } = e.detail || {};
    _log('mutation', op, key, `${size}b`);
    if (_watchers[key]) {
      _watchers[key].forEach(fn => { try { fn(e.detail); } catch (_) {} });
    }
    // wildcard watchers
    if (_watchers['*']) {
      _watchers['*'].forEach(fn => { try { fn(e.detail); } catch (_) {} });
    }
  });

  // ── Integrity check definitions ──────────────────────────────────────────
  // Each check: { id, label, run() → { pass, detail } }
  // run() must NEVER write to storage. Read-only.

  const INTEGRITY_CHECKS = [

    {
      id: 'schema-keys-present',
      label: 'Canonical KEYS registry present in HQStore',
      run() {
        const ok = !!(window.HQStore && window.HQStore.KEYS && Object.keys(window.HQStore.KEYS).length > 0);
        return { pass: ok, detail: ok ? `${Object.keys(window.HQStore.KEYS).length} keys registered` : 'HQStore.KEYS missing or empty' };
      }
    },

    {
      id: 'runtime-state-active',
      label: 'HQState gateway installed',
      run() {
        const ok = typeof window.HQState === 'object' && typeof window.HQState.get === 'function';
        return { pass: ok, detail: ok ? 'HQState present' : 'HQState not installed — persistence not gated' };
      }
    },

    {
      id: 'runtime-events-active',
      label: 'HQBus event log accessible',
      run() {
        const ok = window.HQBus && typeof window.HQBus.getLog === 'function';
        return { pass: ok, detail: ok ? 'HQBus.getLog available' : 'HQBus.getLog missing — event observability not wired' };
      }
    },

    {
      id: 'storage-quota',
      label: 'Storage usage within safe limits (<80%)',
      run() {
        try {
          const usage = window.HQState ? window.HQState.usage() : (window.HQStore ? window.HQStore.usage() : null);
          if (!usage) return { pass: null, detail: 'Cannot measure — usage() unavailable' };
          const pass = usage.pct < 80;
          return { pass, detail: `${usage.pct}% used (${Math.round(usage.totalBytes / 1024)}KB)` };
        } catch (e) { return { pass: null, detail: `Error: ${e.message}` }; }
      }
    },

    {
      id: 'migration-complete',
      label: 'Store migration flag present',
      run() {
        try {
          const done = !!localStorage.getItem('hq-store-migrated-v1');
          return { pass: done, detail: done ? 'Migration complete' : 'Migration not yet run — legacy keys may still exist' };
        } catch (e) { return { pass: null, detail: `Error: ${e.message}` }; }
      }
    },

    {
      id: 'recurring-events-valid',
      label: 'Recurring events array — no entries missing id or title',
      run() {
        try {
          const events = window.HQStore ? window.HQStore.getRecurringEvents() : [];
          if (!Array.isArray(events)) return { pass: false, detail: 'Not an array' };
          const bad = events.filter(e => !e.id || !e.title);
          return {
            pass: bad.length === 0,
            detail: bad.length === 0
              ? `${events.length} events, all valid`
              : `${bad.length}/${events.length} entries missing id or title`
          };
        } catch (e) { return { pass: null, detail: `Error: ${e.message}` }; }
      }
    },

    {
      id: 'checkin-log-valid',
      label: 'Check-in log — entries have date field',
      run() {
        try {
          const S = window.HQState || window.HQStore;
          const key = (window.HQStore && window.HQStore.KEYS) ? window.HQStore.KEYS.CHECKIN_LOG : HQKeys.CHECKIN_LOG;
          const log = S ? S.get(key, []) : [];
          if (!Array.isArray(log)) return { pass: false, detail: 'Not an array' };
          const bad = log.filter(e => !e.date);
          return {
            pass: bad.length === 0,
            detail: bad.length === 0
              ? `${log.length} entries, all have date`
              : `${bad.length}/${log.length} entries missing date field`
          };
        } catch (e) { return { pass: null, detail: `Error: ${e.message}` }; }
      }
    },

    {
      id: 'module-settings-valid',
      label: 'Module settings — enabled map is an object',
      run() {
        try {
          const S = window.HQState || window.HQStore;
          const settings = S ? S.get(HQKeys.MODULE_SETTINGS, null) : null;
          if (!settings) return { pass: null, detail: 'No module settings saved yet' };
          const ok = settings.enabled && typeof settings.enabled === 'object';
          return { pass: ok, detail: ok ? 'enabled map present' : 'enabled map missing or wrong type' };
        } catch (e) { return { pass: null, detail: `Error: ${e.message}` }; }
      }
    },

    {
      id: 'orphaned-bus-keys',
      label: 'No stale audhd-hq-bus- keys in localStorage',
      run() {
        try {
          const stale = [];
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith('audhd-hq-bus-')) stale.push(k);
          }
          return {
            pass: stale.length === 0,
            detail: stale.length === 0 ? 'No stale bus keys' : `${stale.length} stale bus keys: ${stale.join(', ')}`
          };
        } catch (e) { return { pass: null, detail: `Error: ${e.message}` }; }
      }
    },

    {
      id: 'theme-valid',
      label: 'Stored theme is a known value',
      run() {
        try {
          const S = window.HQState || window.HQStore;
          const t = S ? S.get(HQKeys.THEME, null) : null;
          if (!t) return { pass: null, detail: 'No theme saved yet' };
          const valid = ['lilac', 'harbor', 'ember', 'volt'];
          const ok = valid.includes(t.theme);
          return { pass: ok, detail: ok ? `theme: ${t.theme}, mode: ${t.mode}` : `Unknown theme value: "${t.theme}"` };
        } catch (e) { return { pass: null, detail: `Error: ${e.message}` }; }
      }
    },

    {
      id: 'notification-config-valid',
      label: 'Notification config — scheduled entries have id and time',
      run() {
        try {
          const notifs = window.HQNotif ? window.HQNotif.getAll() : [];
          if (!Array.isArray(notifs)) return { pass: false, detail: 'Not an array' };
          const bad = notifs.filter(n => !n.id || !n.time);
          return {
            pass: bad.length === 0,
            detail: bad.length === 0
              ? `${notifs.length} notif entries, all valid`
              : `${bad.length}/${notifs.length} entries missing id or time`
          };
        } catch (e) { return { pass: null, detail: `Error: ${e.message}` }; }
      }
    },

    // Stage 5: validator layer installed
    {
      id: 'validator-active',
      label: 'HQValidator schema layer installed',
      run() {
        const ok = typeof window.HQValidator === 'object' &&
                   typeof window.HQValidator.validateAndNormalize === 'function';
        const schemas = ok ? window.HQValidator.schemas().length : 0;
        return {
          pass: ok,
          detail: ok ? `${schemas} schemas registered` : 'HQValidator not installed'
        };
      }
    },

    // Stage 5: session validation failures
    {
      id: 'validator-failures',
      label: 'No validation failures recorded this session',
      run() {
        if (!window.HQValidator) return { pass: null, detail: 'HQValidator not loaded' };
        const fails = window.HQValidator.getFailLog();
        const keys  = [...new Set(fails.map(f => f.key))];
        return {
          pass: fails.length === 0,
          detail: fails.length === 0
            ? 'No failures'
            : `${fails.length} failure(s) across keys: ${keys.join(', ')}`
        };
      }
    },

    // Stage 6: schema registry installed
    {
      id: 'schema-registry-active',
      label: 'HQSchemaRegistry installed',
      run() {
        const ok = typeof window.HQSchemaRegistry === 'object' &&
                   typeof window.HQSchemaRegistry.status === 'function';
        const count = ok ? Object.keys(window.HQSchemaRegistry.keys()).length : 0;
        return { pass: ok, detail: ok ? `${count} keys registered` : 'HQSchemaRegistry not installed' };
      }
    },

    // Stage 6: import pipeline installed
    {
      id: 'import-pipeline-active',
      label: 'HQImport pipeline installed',
      run() {
        const ok = typeof window.HQImport === 'object' &&
                   typeof window.HQImport.run === 'function';
        return { pass: ok, detail: ok ? 'HQImport ready' : 'HQImport not installed' };
      }
    },

    // Stage 6: pending migrations detected
    {
      id: 'schema-migrations-pending',
      label: 'No high-risk migrations pending',
      run() {
        if (!window.HQSchemaRegistry) return { pass: null, detail: 'HQSchemaRegistry not loaded' };
        try {
          const pending = window.HQSchemaRegistry.migrations().filter(m => m.needed && m.risk === 'high');
          return {
            pass: pending.length === 0,
            detail: pending.length === 0
              ? 'No high-risk migrations pending'
              : `${pending.length} high-risk migration(s): ${pending.map(m => m.id).join(', ')}`
          };
        } catch (e) { return { pass: null, detail: `Error: ${e.message}` }; }
      }
    },
  ];

  // ── Run integrity checks ──────────────────────────────────────────────────
  function runIntegrity() {
    const results = INTEGRITY_CHECKS.map(check => {
      let result;
      try { result = check.run(); } catch (e) { result = { pass: null, detail: `Uncaught: ${e.message}` }; }
      return { id: check.id, label: check.label, ...result };
    });
    return results;
  }

  // ── Console reporter ──────────────────────────────────────────────────────
  function report() {
    const integrity = runIntegrity();
    const pass  = integrity.filter(r => r.pass === true).length;
    const fail  = integrity.filter(r => r.pass === false).length;
    const warn  = integrity.filter(r => r.pass === null).length;
    const usage = window.HQState ? window.HQState.usage() : null;
    const mutations = window.HQState ? window.HQState.getMutationLog() : [];
    const events = (window.HQBus && window.HQBus.getLog) ? window.HQBus.getLog() : [];

    console.group('%c🔍 HQObserver Report', 'font-weight:bold;font-size:14px');

    // Storage
    if (usage) {
      const pctColor = usage.pct > 80 ? 'color:red' : usage.pct > 60 ? 'color:orange' : 'color:green';
      console.log(`%c💾 Storage: ${usage.pct}% (${Math.round(usage.totalBytes / 1024)}KB)`, pctColor);
    }

    // Integrity
    console.group(`🛡 Integrity: ${pass} pass / ${fail} fail / ${warn} warn`);
    integrity.forEach(r => {
      const icon = r.pass === true ? '✅' : r.pass === false ? '❌' : '⚠️';
      const style = r.pass === true ? 'color:green' : r.pass === false ? 'color:red' : 'color:orange';
      console.log(`%c${icon} ${r.label}`, style, '—', r.detail);
    });
    console.groupEnd();

    // Recent mutations
    const recentMutations = mutations.slice(-20);
    console.group(`✏️ Recent mutations (last ${recentMutations.length})`);
    recentMutations.forEach(m => {
      const age = Math.round((Date.now() - m.ts) / 1000);
      console.log(`  ${m.op.toUpperCase()} ${m.key} — ${m.size}b — ${age}s ago`);
    });
    console.groupEnd();

    // Recent events
    const recentEvents = events.slice(-20);
    console.group(`📡 Recent bus events (last ${recentEvents.length})`);
    recentEvents.forEach(e => {
      const age = Math.round((Date.now() - e.ts) / 1000);
      console.log(`  [${e.source}] ${e.channel} — ${age}s ago`);
    });
    console.groupEnd();

    // Recent validator failures
    if (window.HQValidator) {
      const failLog = window.HQValidator.getFailLog();
      const recentFails = failLog.slice(-10);
      if (recentFails.length > 0) {
        console.group(`🚨 Recent validation failures (last ${recentFails.length})`);
        recentFails.forEach(f => {
          const age = Math.round((Date.now() - f.ts) / 1000);
          console.warn(`  ${f.key} — ${f.errors.join('; ')} — ${age}s ago`);
        });
        console.groupEnd();
      }
    }

    console.groupEnd();
    return { pass, fail, warn, usage, integrity };
  }

  // ── Startup integrity pass ────────────────────────────────────────────────
  // Runs once after hq-core-ready fires. Logs failures and warns to console.
  // Never blocks. Never mutates.
  function _startupCheck() {
    const results = runIntegrity();
    const failures = results.filter(r => r.pass === false);
    if (failures.length > 0) {
      console.group('%c⚠️ HQObserver: startup integrity issues detected', 'color:orange;font-weight:bold');
      failures.forEach(r => console.warn(`❌ ${r.label}: ${r.detail}`));
      console.groupEnd();
    } else {
      _log('startup', 'All integrity checks passed');
    }
    // Dispatch so any future dashboard can listen
    window.dispatchEvent(new CustomEvent('hq-integrity-checked', {
      detail: { results, failures: failures.length }
    }));
  }

  // ── Wait for all runtime layers before startup check ─────────────────────
  function _awaitReady(fn) {
    if (window.HQ_CORE_LOADED) { fn(); return; }
    window.addEventListener('hq-core-ready', fn, { once: true });
  }
  _awaitReady(_startupCheck);

  // ── Public API ────────────────────────────────────────────────────────────
  window.HQObserver = {

    /** Full status report — run in browser console */
    report,

    /** Run integrity checks and return results array */
    integrity: runIntegrity,

    /** Recent state mutations (last 500, from HQState) */
    mutations() {
      return window.HQState ? window.HQState.getMutationLog() : [];
    },

    /** Recent bus events (last 200, from HQBus) */
    events() {
      return (window.HQBus && window.HQBus.getLog) ? window.HQBus.getLog() : [];
    },

    /**
     * Watch a specific storage key for mutations.
     * Use '*' to watch all keys.
     * @param {string} key
     * @param {Function} fn  Called with { op, key, ts, size }
     */
    watch(key, fn) {
      if (!_watchers[key]) _watchers[key] = new Set();
      _watchers[key].add(fn);
    },

    /** Remove a key watcher */
    unwatch(key, fn) {
      if (_watchers[key]) _watchers[key].delete(fn);
    },

    /** Enable live console logging for all state/event traffic */
    enable() {
      _live = true;
      try { localStorage.setItem('hq-runtime-debug', '1'); } catch (_) {}
      console.log('[HQObserver] Live logging enabled');
    },

    /** Disable live console logging */
    disable() {
      _live = false;
      try { localStorage.removeItem('hq-runtime-debug'); } catch (_) {}
      console.log('[HQObserver] Live logging disabled');
    },

    /** Expose integrity check definitions for inspection */
    checks: INTEGRITY_CHECKS,
  };

  window.dispatchEvent(new CustomEvent('hq-observer-ready'));

})();
