// ═══════════════════════════════════════════════════════════════
//  AUDHD HQ — Symptom Lazy Loader  (Phase B4)
//  Defers expensive operations until first call.
//  Uses requestIdleCallback (or setTimeout fallback) for
//  background pre-warming without blocking the UI.
//
//  Provides:
//    HQSymptomLazy.prewarm()              → schedule background index build
//    HQSymptomLazy.getGrouped()           → lazy groupedWithMeta over full registry
//    HQSymptomLazy.getConditionSymptoms(id) → lazy per-condition symptom list
//    HQSymptomLazy.getRecentSymptoms(n)   → lazy recent history lookup
//    HQSymptomLazy.getFrequent(n)         → lazy most-logged symptoms
//    HQSymptomLazy.onReady(fn)            → call fn when index is warm
// ═══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  var _readyCallbacks = [];
  var _isWarm         = false;
  var _conditionCache = Object.create(null);  // condId → symptom[]
  var _fullGrouped    = null;

  // ── Schedule idle pre-warm ────────────────────────────────────

  /**
   * Schedule a background index build.
   * Uses requestIdleCallback if available; otherwise defers
   * via setTimeout(fn, 200) to avoid blocking first paint.
   */
  function prewarm() {
    var work = function (deadline) {
      var budget = deadline && typeof deadline.timeRemaining === 'function'
        ? deadline.timeRemaining()
        : 50;

      if (budget > 5) {
        _doWarm();
      } else {
        // Reschedule if not enough idle time
        schedule();
      }
    };

    function schedule() {
      if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(work, { timeout: 2000 });
      } else {
        setTimeout(_doWarm, 200);
      }
    }

    schedule();
  }

  function _doWarm() {
    try {
      // 1. Build index if not already built
      if (window.HQSymptomIndex && !window.HQSymptomIndex.ready) {
        window.HQSymptomIndex.rebuild();
      }

      // 2. Pre-populate search cache with empty query (returns all sorted)
      if (window.HQSymptomCache) {
        window.HQSymptomCache.search('');
      }

      _isWarm = true;
      _readyCallbacks.forEach(function (fn) {
        try { fn(); } catch (e) { console.warn('[HQSymptomLazy] onReady callback error:', e); }
      });
      _readyCallbacks = [];
    } catch (e) {
      console.warn('[HQSymptomLazy] prewarm error:', e);
    }
  }

  // ── Register ready callback ───────────────────────────────────

  function onReady(fn) {
    if (_isWarm) {
      try { fn(); } catch (e) {}
    } else {
      _readyCallbacks.push(fn);
    }
  }

  // ── Lazy full-registry grouped view ──────────────────────────

  /**
   * Returns the full symptom registry grouped by category with
   * metadata. Result is cached for the lifetime of the page.
   * First call is O(n log n); subsequent calls O(1).
   */
  function getGrouped() {
    if (_fullGrouped) return _fullGrouped;

    if (window.HQSymptomCache) {
      var all = window.HQSymptomIndex
        ? window.HQSymptomIndex.allSorted()
        : Object.values(window.HQSymptomRegistry || {});
      _fullGrouped = window.HQSymptomCache.groupedMeta(all);
    } else if (window.HQSymptomUtils) {
      var all2 = Object.values(window.HQSymptomRegistry || {});
      _fullGrouped = window.HQSymptomUtils.groupedWithMeta(all2);
    } else {
      _fullGrouped = [];
    }

    return _fullGrouped;
  }

  // ── Lazy per-condition symptom list ──────────────────────────

  /**
   * Returns symptom objects for a condition, using the index
   * if available, otherwise resolving from pools + registry.
   * Per-condition results are cached in _conditionCache.
   */
  function getConditionSymptoms(condId) {
    if (_conditionCache[condId]) return _conditionCache[condId];

    var result = [];
    if (window.HQSymptomIndex) {
      result = window.HQSymptomIndex.byCondition(condId);
    } else if (window.HQSymptomUtils) {
      result = window.HQSymptomUtils.symptomsForCondition(condId);
    }

    _conditionCache[condId] = result;
    return result;
  }

  // ── Lazy recent symptoms (from history) ──────────────────────

  /**
   * Returns up to n most-recently-logged symptom objects.
   * Reads from HQSymptomCache.historyStats() (TTL-cached).
   */
  function getRecentSymptoms(n) {
    n = n || 10;
    var stats = window.HQSymptomCache
      ? window.HQSymptomCache.historyStats()
      : { recentIds: [] };

    var registry = window.HQSymptomRegistry || {};
    return (stats.recentIds || [])
      .slice(0, n)
      .map(function (id) { return registry[id]; })
      .filter(Boolean);
  }

  // ── Lazy frequent symptoms ────────────────────────────────────

  /**
   * Returns up to n most-frequently-logged symptom objects
   * (sorted by log count, descending).
   */
  function getFrequent(n) {
    n = n || 5;
    var stats = window.HQSymptomCache
      ? window.HQSymptomCache.historyStats()
      : { topSymptoms: [] };

    var registry = window.HQSymptomRegistry || {};
    return (stats.topSymptoms || [])
      .slice(0, n)
      .map(function (entry) {
        var sym = registry[entry.id];
        return sym ? Object.assign({}, sym, { _logCount: entry.count }) : null;
      })
      .filter(Boolean);
  }

  // ── Auto-prewarm after page load ─────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', prewarm);
  } else {
    prewarm();
  }

  // ── Expose ────────────────────────────────────────────────────
  window.HQSymptomLazy = {
    prewarm:              prewarm,
    onReady:              onReady,
    getGrouped:           getGrouped,
    getConditionSymptoms: getConditionSymptoms,
    getRecentSymptoms:    getRecentSymptoms,
    getFrequent:          getFrequent,
    get isWarm()          { return _isWarm; }
  };

}());
