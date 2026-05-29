// core/hq-migrate.js — Centralised migration registry (FIX-03)
//
// PROBLEM SOLVED: Tag schema migrations (migrateTagsV2, migrateTagsV3) previously
// only ran when the user opened customize.html. This meant returning users who
// opened any other page first were reading stale tag schema until they visited
// Customize — causing flag/subcategory mismatches across the app.
//
// SOLUTION: Each page that consumes tag data (health-tracker, global-tracker,
// checkin, taskboard, weekly-planner, etc.) calls HQMigrate.run('tags') on init.
// hq-migrate.js queues the migrations centrally, runs them once (per session and
// per user lifetime via sentinel), and delegates the data-shape work back to
// customize.js through a registered callback — so we never duplicate schema logic.
//
// KEY RULES:
// - Migrations that only rename localStorage keys: run directly here (no page deps).
// - Migrations that reshape data: register a callback; the owning page calls register().
// - Every migration is idempotent (sentinel-guarded).
// - hq-migrate.js loads before hq-core.js so it is always available.
//
// USAGE (in page scripts that read tag data):
//   HQMigrate.run('tags');   // safe no-op if already done or callback not yet registered
//
// USAGE (in customize.js, after load() sets up DB/persist):
//   HQMigrate.register('tags-v2', migrateTagsV2);
//   HQMigrate.register('tags-v3', migrateTagsV3);
//   HQMigrate.run('tags');   // runs any that haven't fired yet this session

(function() {
  'use strict';

  // ── Internal registry ────────────────────────────────────────────────────
  var _callbacks = {};   // id → fn
  var _ran       = {};   // id → true  (session-level dedup on top of localStorage sentinels)

  // ── Public API ───────────────────────────────────────────────────────────
  window.HQMigrate = {

    /**
     * register(id, fn)
     * Called by the owning module (e.g. customize.js) to hand off the migration
     * function. Safe to call multiple times — second call is ignored.
     */
    register: function(id, fn) {
      if (typeof fn !== 'function') return;
      if (!_callbacks[id]) _callbacks[id] = fn;
    },

    /**
     * run(group)
     * Runs all registered migrations whose id starts with `group`.
     * If a callback isn't registered yet, the call is silently deferred —
     * it will be attempted again when customize.js loads and calls run() itself.
     *
     * Examples:
     *   HQMigrate.run('tags')    → runs 'tags-v2', 'tags-v3'
     *   HQMigrate.run('tags-v2') → runs only 'tags-v2'
     *   HQMigrate.run()          → runs all registered
     */
    run: function(group) {
      Object.keys(_callbacks).forEach(function(id) {
        if (group && id.indexOf(group) !== 0) return;
        if (_ran[id]) return;
        _ran[id] = true;
        try {
          _callbacks[id]();
        } catch(e) {
          _ran[id] = false; // allow retry on error
          if (window.console) console.warn('[HQMigrate] Error in migration "' + id + '":', e);
        }
      });
    },

    /**
     * runKeyRenames()
     * Handles simple localStorage key renames that have no data-shape dependency.
     * Called automatically on DOMContentLoaded. Idempotent.
     *
     * Note: bulk key renames are already handled by hq-store.js (_migrate / MERGE_PAIRS).
     * This handles the remaining stragglers not covered by hq-store.js.
     */
    runKeyRenames: function() {
      if (localStorage.getItem('hq-migrate-renames-v1')) return;
      var safe = window.HQSafe && window.HQSafe.store;

      // hq-setup-guide-checks → audhd-hq-setup-guide-checks
      (function() {
        try {
          var old = localStorage.getItem('hq-setup-guide-checks');
          if (old !== null && localStorage.getItem(HQKeys.SETUP_GUIDE_CHECKS) === null) {
            localStorage.setItem(HQKeys.SETUP_GUIDE_CHECKS, old);
            localStorage.removeItem('hq-setup-guide-checks');
          } else if (old !== null) {
            localStorage.removeItem('hq-setup-guide-checks');
          }
        } catch(e) {}
      })();

      // iconforge_v5 → audhd-hq-iconforge
      (function() {
        try {
          var old = localStorage.getItem('iconforge_v5');
          if (old !== null && localStorage.getItem(HQKeys.ICONFORGE) === null) {
            localStorage.setItem(HQKeys.ICONFORGE, old);
            localStorage.removeItem('iconforge_v5');
          } else if (old !== null) {
            localStorage.removeItem('iconforge_v5');
          }
        } catch(e) {}
      })();

      localStorage.setItem('hq-migrate-renames-v1', '1');
    }
  };

  // Run key renames automatically when DOM is ready (hq-store.js will be loaded by then)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      window.HQMigrate.runKeyRenames();
    });
  } else {
    window.HQMigrate.runKeyRenames();
  }

})();
