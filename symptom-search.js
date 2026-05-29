// ═══════════════════════════════════════════════════════════════
//  AUDHD HQ — Symptom Search  (Phase B4 upgrade)
//  Uses HQSymptomIndex (indexed, fast) when available,
//  falls back to tiered scan. Results memoized via HQSymptomCache.
// ═══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  /**
   * Search symptoms by label, tags, category, or condition name.
   * Uses memoized cache → index → fallback scan, in that order.
   * Returns tiered results (label-start > label-contains > tag/cat).
   */
  function searchSymptoms(query) {
    // 1. Try cache (returns memoized result if query was seen before)
    if (window.HQSymptomCache) {
      return window.HQSymptomCache.search(query);
    }

    // 2. Use index directly
    if (window.HQSymptomIndex) {
      return window.HQSymptomIndex.prefixMatch(query);
    }

    // 3. Fallback: full tiered scan (original B2 implementation)
    if (!query || !query.trim()) {
      return (window.HQSymptomUtils && window.HQSymptomUtils.allSymptoms()) ||
             Object.values(window.HQSymptomRegistry || {});
    }

    var q        = query.toLowerCase().trim();
    var catReg   = window.HQCategoryRegistry || {};
    var symptoms = (window.HQSymptomUtils && window.HQSymptomUtils.allSymptoms()) ||
                   Object.values(window.HQSymptomRegistry || {});
    var t1 = [], t2 = [], t3 = [];

    symptoms.forEach(function (s) {
      var labelLower = s.label.toLowerCase();
      if (labelLower.startsWith(q))  { t1.push(s); return; }
      if (labelLower.includes(q))    { t2.push(s); return; }
      var tagHit = (s.tags || []).some(function (t) { return t.toLowerCase().includes(q); });
      var catHit = (s.categories || []).some(function (cid) {
        var cat = catReg[cid];
        return cat && cat.label.toLowerCase().includes(q);
      });
      if (tagHit || catHit) t3.push(s);
    });

    return t1.concat(t2, t3);
  }

  /**
   * Search within a single condition's symptom pool.
   * Uses index when available; otherwise resolves from registry.
   */
  function searchWithinCondition(conditionId, query) {
    var symptoms;

    if (window.HQSymptomIndex) {
      symptoms = window.HQSymptomIndex.byCondition(conditionId);
    } else {
      var pool = window.HQConditionPools && window.HQConditionPools[conditionId];
      if (!pool) return [];
      var registry = window.HQSymptomRegistry || {};
      symptoms = (pool.symptoms || []).map(function (id) { return registry[id]; }).filter(Boolean);
    }

    if (!query || !query.trim()) return symptoms;
    var q = query.toLowerCase().trim();
    return symptoms.filter(function (s) {
      return s.label.toLowerCase().includes(q) ||
             (s.tags || []).some(function (t) { return t.includes(q); });
    });
  }

  /**
   * Search within current watchlist.
   * Uses cache's watchlist() for O(1) parse after first call.
   */
  function searchWatchlist(query) {
    var wl = window.HQSymptomCache
      ? window.HQSymptomCache.watchlist()
      : (window.HQSymptomUtils && window.HQSymptomUtils.loadWatchlist()) || [];

    if (!query || !query.trim()) return wl;
    var q = query.toLowerCase().trim();
    return wl.filter(function (s) {
      return s.label.toLowerCase().includes(q) ||
             (s.tags || []).some(function (t) { return t.includes(q); });
    });
  }

  window.HQSymptomSearch = {
    searchSymptoms:        searchSymptoms,
    searchWithinCondition: searchWithinCondition,
    searchWatchlist:       searchWatchlist
  };

}());
