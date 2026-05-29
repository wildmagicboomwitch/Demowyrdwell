// ═══════════════════════════════════════════════════════════════
//  AUDHD HQ — Symptom Cache  (Phase B4)
//  Memoized search results + lazy-loaded heavy operations.
//
//  Provides:
//    HQSymptomCache.search(query)           → symptom[] (memoized)
//    HQSymptomCache.groupedMeta(symptoms)   → grouped[] (memoized)
//    HQSymptomCache.overlapping(condIds)    → symptom[] (memoized)
//    HQSymptomCache.watchlist()             → symptom[] (cached until key changes)
//    HQSymptomCache.historyStats()          → stats object (lazy, cached 30s)
//    HQSymptomCache.invalidate(reason)      → clear relevant caches
//    HQSymptomCache.stats()                 → hit/miss counters for debugging
// ═══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ── Cache stores ──────────────────────────────────────────────
  var _searchCache    = Object.create(null);  // query → result[]
  var _groupedCache   = Object.create(null);  // JSON key → grouped[]
  var _overlapCache   = Object.create(null);  // sorted condIds key → symptom[]
  var _watchlistCache = null;                 // { key, value }
  var _historyCache   = null;                 // { ts, value }
  var HISTORY_TTL_MS  = 30000;               // 30 s

  // ── Debug stats ───────────────────────────────────────────────
  var _hits   = 0;
  var _misses = 0;

  // ── Search (memoized by query string) ─────────────────────────

  /**
   * Memoized symptom search.
   * Uses HQSymptomIndex.prefixMatch when available (fastest),
   * falls back to HQSymptomSearch.searchSymptoms.
   */
  function search(query) {
    var key = (query || '').toLowerCase().trim();

    if (_searchCache[key] !== undefined) {
      _hits++;
      return _searchCache[key];
    }

    _misses++;
    var result;

    if (window.HQSymptomIndex && typeof window.HQSymptomIndex.prefixMatch === 'function') {
      result = window.HQSymptomIndex.prefixMatch(key);
    } else if (window.HQSymptomSearch && typeof window.HQSymptomSearch.searchSymptoms === 'function') {
      result = window.HQSymptomSearch.searchSymptoms(key);
    } else {
      result = Object.values(window.HQSymptomRegistry || {});
    }

    _searchCache[key] = result;
    return result;
  }

  // ── Grouped-with-meta (memoized by symptom id fingerprint) ────

  /**
   * Memoized groupedWithMeta.
   * Cache key = sorted symptom ids joined.
   * groupedWithMeta is O(n log n) so worth caching for large symptom arrays.
   */
  function groupedMeta(symptoms) {
    if (!symptoms || !symptoms.length) return [];

    var key = symptoms.map(function (s) { return s.id; }).sort().join(',');

    if (_groupedCache[key] !== undefined) {
      _hits++;
      return _groupedCache[key];
    }

    _misses++;
    var result;
    if (window.HQSymptomUtils && typeof window.HQSymptomUtils.groupedWithMeta === 'function') {
      result = window.HQSymptomUtils.groupedWithMeta(symptoms);
    } else {
      result = [];
    }

    _groupedCache[key] = result;
    return result;
  }

  // ── Overlapping symptoms (memoized by condition set) ──────────

  function overlapping(conditionIds) {
    if (!conditionIds || !conditionIds.length) return [];

    var key = conditionIds.slice().sort().join(',');

    if (_overlapCache[key] !== undefined) {
      _hits++;
      return _overlapCache[key];
    }

    _misses++;
    var result;
    if (window.HQSymptomUtils && typeof window.HQSymptomUtils.overlappingSymptoms === 'function') {
      result = window.HQSymptomUtils.overlappingSymptoms(conditionIds);
    } else {
      result = [];
    }

    _overlapCache[key] = result;
    return result;
  }

  // ── Watchlist (cached until localStorage key changes) ─────────

  /**
   * Returns the watchlist array. Caches the parsed value and the
   * raw string it came from — invalidates automatically if the
   * storage value has changed since last call.
   */
  function watchlist() {
    var raw = localStorage.getItem(HQKeys.SYMPTOM_WATCHLIST) || '[]';
    if (_watchlistCache && _watchlistCache.key === raw) {
      _hits++;
      return _watchlistCache.value;
    }

    _misses++;
    var parsed = [];
    try { parsed = JSON.parse(raw); } catch (e) {}
    _watchlistCache = { key: raw, value: parsed };
    return parsed;
  }

  // ── History stats (lazy, TTL-cached) ─────────────────────────

  /**
   * Compute summary stats from symptom history.
   * Expensive (scans up to 500 entries) — cached for 30 s.
   * Returns: { total, topSymptoms, avgSeverity, recentIds }
   */
  function historyStats() {
    var now = Date.now();
    if (_historyCache && (now - _historyCache.ts) < HISTORY_TTL_MS) {
      _hits++;
      return _historyCache.value;
    }

    _misses++;
    var history = [];
    try {
      var raw = localStorage.getItem(HQKeys.SYMPTOM_HISTORY);
      history = raw ? JSON.parse(raw) : [];
    } catch (e) {}

    var counts   = Object.create(null);
    var sevTotal = 0;
    var sevCount = 0;
    var recentIds = [];

    history.forEach(function (entry) {
      var id = entry.symptomId;
      counts[id] = (counts[id] || 0) + 1;
      if (entry.severity != null) { sevTotal += entry.severity; sevCount++; }
    });

    // Top 5 most-logged symptoms
    var topSymptoms = Object.keys(counts)
      .sort(function (a, b) { return counts[b] - counts[a]; })
      .slice(0, 5)
      .map(function (id) { return { id: id, count: counts[id] }; });

    // Last 10 unique symptom ids (most recent first)
    var seenRecent = new Set();
    for (var i = history.length - 1; i >= 0 && recentIds.length < 10; i--) {
      var rid = history[i].symptomId;
      if (!seenRecent.has(rid)) { recentIds.push(rid); seenRecent.add(rid); }
    }

    var result = {
      total:       history.length,
      topSymptoms: topSymptoms,
      avgSeverity: sevCount ? (sevTotal / sevCount).toFixed(1) : null,
      recentIds:   recentIds
    };

    _historyCache = { ts: now, value: result };
    return result;
  }

  // ── Invalidation ──────────────────────────────────────────────

  /**
   * Clear relevant caches.
   * reason: 'search' | 'registry' | 'watchlist' | 'history' | 'all'
   */
  function invalidate(reason) {
    switch (reason || 'all') {
      case 'search':
        _searchCache    = Object.create(null);
        break;
      case 'registry':
        _searchCache    = Object.create(null);
        _groupedCache   = Object.create(null);
        _overlapCache   = Object.create(null);
        if (window.HQSymptomIndex) window.HQSymptomIndex.rebuild();
        break;
      case 'watchlist':
        _watchlistCache = null;
        _groupedCache   = Object.create(null);
        break;
      case 'history':
        _historyCache   = null;
        break;
      default:
        _searchCache    = Object.create(null);
        _groupedCache   = Object.create(null);
        _overlapCache   = Object.create(null);
        _watchlistCache = null;
        _historyCache   = null;
        if (window.HQSymptomIndex) window.HQSymptomIndex.rebuild();
        break;
    }
  }

  // ── Storage event listener — auto-invalidate ─────────────────
  window.addEventListener('storage', function (e) {
    if (e.key === HQKeys.SYMPTOM_WATCHLIST) invalidate('watchlist');
    if (e.key === HQKeys.SYMPTOM_HISTORY)   invalidate('history');
  });

  // ── Debug stats ───────────────────────────────────────────────
  function stats() {
    var total = _hits + _misses;
    return {
      hits:      _hits,
      misses:    _misses,
      total:     total,
      hitRate:   total ? (_hits / total * 100).toFixed(1) + '%' : 'n/a',
      searchKeys:  Object.keys(_searchCache).length,
      groupedKeys: Object.keys(_groupedCache).length,
      overlapKeys: Object.keys(_overlapCache).length
    };
  }

  // ── Expose ────────────────────────────────────────────────────
  window.HQSymptomCache = {
    search:       search,
    groupedMeta:  groupedMeta,
    overlapping:  overlapping,
    watchlist:    watchlist,
    historyStats: historyStats,
    invalidate:   invalidate,
    stats:        stats
  };

}());
