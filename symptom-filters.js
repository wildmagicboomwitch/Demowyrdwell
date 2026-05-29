// ═══════════════════════════════════════════════════════════════
//  AUDHD HQ — Symptom Filters  (Phase B2)
//  Depends on: symptom-registry.js, symptom-utils.js
// ═══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  /** Filter symptom objects by category id. */
  function byCategory(symptoms, categoryId) {
    if (!categoryId) return symptoms;
    return symptoms.filter(function (s) {
      return (s.categories || []).includes(categoryId);
    });
  }

  /** Filter to only quickLog-enabled symptoms. */
  function quickLogOnly(symptoms) {
    return symptoms.filter(function (s) { return s.quickLog === true; });
  }

  /** Filter to only severity-supported symptoms. */
  function severitySupported(symptoms) {
    return symptoms.filter(function (s) { return s.severitySupported === true; });
  }

  /** Filter to flag-type symptoms (categories includes 'flag'). */
  function flagsOnly(symptoms) {
    return symptoms.filter(function (s) {
      return (s.categories || []).includes('flag');
    });
  }

  /**
   * Filter symptoms to those in a user's current watchlist.
   * Accepts either the watchlist array directly, or reads from storage.
   */
  function inWatchlist(symptoms, watchlistOverride) {
    var wl = watchlistOverride ||
             (window.HQSymptomUtils && window.HQSymptomUtils.loadWatchlist()) || [];
    var ids = new Set(wl.map(function (s) { return s.id; }));
    return symptoms.filter(function (s) { return ids.has(s.id); });
  }

  /**
   * Filter symptoms to user's favorites.
   */
  function inFavorites(symptoms) {
    var favs = (window.HQSymptomUtils && window.HQSymptomUtils.loadFavorites()) || [];
    var favSet = new Set(favs);
    return symptoms.filter(function (s) { return favSet.has(s.id); });
  }

  /**
   * Apply multiple filters in sequence.
   * filters: array of { type, value } objects
   *   { type: 'category', value: 'pain' }
   *   { type: 'quickLog' }
   *   { type: 'severity' }
   *   { type: 'watchlist' }
   *   { type: 'favorites' }
   */
  function applyFilters(symptoms, filters) {
    if (!filters || !filters.length) return symptoms;
    return filters.reduce(function (acc, f) {
      switch (f.type) {
        case 'category':  return byCategory(acc, f.value);
        case 'quickLog':  return quickLogOnly(acc);
        case 'severity':  return severitySupported(acc);
        case 'watchlist': return inWatchlist(acc, f.value);
        case 'favorites': return inFavorites(acc);
        case 'flags':     return flagsOnly(acc);
        default:          return acc;
      }
    }, symptoms);
  }

  window.HQSymptomFilters = {
    byCategory:        byCategory,
    quickLogOnly:      quickLogOnly,
    severitySupported: severitySupported,
    flagsOnly:         flagsOnly,
    inWatchlist:       inWatchlist,
    inFavorites:       inFavorites,
    applyFilters:      applyFilters
  };

}());
