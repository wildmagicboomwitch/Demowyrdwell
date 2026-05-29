// ═══════════════════════════════════════════════════════════════
//  AUDHD HQ — Symptom Utilities  (Phase B2)
//  Depends on: symptom-registry.js, condition-pools.js,
//              category-registry.js
//
//  All functions are pure / side-effect-free unless noted.
//  Exposed on window.HQSymptomUtils for global access.
// ═══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ── Registry accessors ────────────────────────────────────────

  function getRegistry() {
    return window.HQSymptomRegistry || {};
  }

  function getPools() {
    return window.HQConditionPools || {};
  }

  function getCategories() {
    return window.HQCategoryRegistry || {};
  }

  // ── Symptom lookup ────────────────────────────────────────────

  /** Return a single symptom object by id, or null. */
  function getSymptom(id) {
    return getRegistry()[id] || null;
  }

  /** Return all symptom objects as an array. */
  function allSymptoms() {
    return Object.values(getRegistry());
  }

  // ── Condition lookup ──────────────────────────────────────────

  /** Return a single condition pool object by id, or null. */
  function getCondition(id) {
    return getPools()[id] || null;
  }

  /** Return all condition pool objects as an array. */
  function allConditions() {
    return Object.values(getPools());
  }

  // ── Symptom resolution ────────────────────────────────────────

  /**
   * Resolve an array of symptom ids to full symptom objects.
   * Skips any ids not found in registry (logs warning).
   */
  function resolveSymptoms(ids) {
    var registry = getRegistry();
    return ids.reduce(function (acc, id) {
      if (registry[id]) {
        acc.push(registry[id]);
      } else {
        console.warn('[HQSymptomUtils] Unknown symptom id:', id);
      }
      return acc;
    }, []);
  }

  /**
   * Build a deduplicated symptom watchlist from an array of
   * selected condition ids. Preserves insertion order;
   * first condition wins on category assignment.
   */
  function buildWatchlistFromConditions(conditionIds) {
    var registry = getRegistry();
    var pools    = getPools();
    var seen     = new Set();
    var watchlist = [];

    conditionIds.forEach(function (condId) {
      var pool = pools[condId];
      if (!pool) return;
      pool.symptoms.forEach(function (symptomId) {
        if (!seen.has(symptomId) && registry[symptomId]) {
          seen.add(symptomId);
          watchlist.push(registry[symptomId]);
        }
      });
    });

    return watchlist;
  }

  // ── Grouping ──────────────────────────────────────────────────

  /**
   * Group an array of symptom objects by primary category.
   * Returns { categoryId: [symptom, …], … }
   */
  function groupByCategory(symptoms) {
    var groups = {};
    symptoms.forEach(function (s) {
      var cat = (s.categories && s.categories[0]) || 'other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(s);
    });
    return groups;
  }

  /**
   * Return symptoms grouped by category, with category metadata
   * resolved from HQCategoryRegistry.
   * Returns [{ category, symptoms: [] }, …] sorted by category label.
   */
  function groupedWithMeta(symptoms) {
    var catReg  = getCategories();
    var grouped = groupByCategory(symptoms);

    return Object.keys(grouped)
      .sort(function (a, b) {
        var la = catReg[a] ? catReg[a].label : a;
        var lb = catReg[b] ? catReg[b].label : b;
        return la.localeCompare(lb);
      })
      .map(function (catId) {
        return {
          category: catReg[catId] || { id: catId, label: catId, emoji: '•' },
          symptoms: grouped[catId]
        };
      });
  }

  // ── Condition-symptom helpers ─────────────────────────────────

  /**
   * Return all condition ids that include a given symptom id.
   */
  function conditionsForSymptom(symptomId) {
    var sym = getSymptom(symptomId);
    return sym ? (sym.conditions || []) : [];
  }

  /**
   * Return symptom objects for a given condition id.
   */
  function symptomsForCondition(conditionId) {
    var pool = getCondition(conditionId);
    if (!pool) return [];
    return resolveSymptoms(pool.symptoms);
  }

  /**
   * Find symptoms shared by two or more given condition ids.
   * Returns deduplicated array of symptom objects.
   */
  function overlappingSymptoms(conditionIds) {
    if (!conditionIds || conditionIds.length < 2) return [];
    var pools = getPools();
    var countMap = {};

    conditionIds.forEach(function (condId) {
      var pool = pools[condId];
      if (!pool) return;
      pool.symptoms.forEach(function (symId) {
        countMap[symId] = (countMap[symId] || 0) + 1;
      });
    });

    var registry = getRegistry();
    return Object.keys(countMap)
      .filter(function (id) { return countMap[id] > 1; })
      .map(function (id) { return registry[id]; })
      .filter(Boolean);
  }

  // ── Validation ────────────────────────────────────────────────

  /**
   * Validate the registry for:
   *   - broken category references
   *   - broken condition references in condition pools
   * Returns { errors: [], warnings: [] }
   */
  function validate() {
    var registry  = getRegistry();
    var pools     = getPools();
    var catReg    = getCategories();
    var errors    = [];
    var warnings  = [];

    // Check each symptom's categories exist
    Object.values(registry).forEach(function (s) {
      (s.categories || []).forEach(function (cat) {
        if (!catReg[cat]) {
          errors.push('Symptom "' + s.id + '" references unknown category "' + cat + '"');
        }
      });
    });

    // Check each condition's symptom ids exist in registry
    Object.values(pools).forEach(function (pool) {
      (pool.symptoms || []).forEach(function (symId) {
        if (!registry[symId]) {
          errors.push('Condition "' + pool.id + '" references unknown symptom "' + symId + '"');
        }
      });
    });

    // Warn on duplicate labels (case-insensitive)
    var labelMap = {};
    Object.values(registry).forEach(function (s) {
      var key = s.label.toLowerCase();
      if (labelMap[key]) {
        warnings.push('Possible duplicate label: "' + s.label + '" (' + labelMap[key] + ' vs ' + s.id + ')');
      }
      labelMap[key] = s.id;
    });

    return { errors: errors, warnings: warnings };
  }

  // ── localStorage helpers ──────────────────────────────────────

  var KEYS = {
    selectedConditions: HQKeys.SELECTED_CONDITIONS,
    symptomWatchlist:   HQKeys.SYMPTOM_WATCHLIST,
    favoriteSymptoms:   HQKeys.FAVORITE_SYMPTOMS,
    symptomHistory:     HQKeys.SYMPTOM_HISTORY
  };

  function loadJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function saveJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function loadSelectedConditions()     { return loadJSON(KEYS.selectedConditions, []); }
  function saveSelectedConditions(ids)  { saveJSON(KEYS.selectedConditions, ids); }
  function loadWatchlist()              { return loadJSON(KEYS.symptomWatchlist, []); }
  function loadFavorites()              { return loadJSON(KEYS.favoriteSymptoms, []); }

  function saveWatchlistFromConditions(conditionIds) {
    var list = buildWatchlistFromConditions(conditionIds);
    saveJSON(KEYS.symptomWatchlist, list);
    return list;
  }

  function toggleFavorite(symptomId) {
    var favs = loadFavorites();
    var idx  = favs.indexOf(symptomId);
    if (idx === -1) {
      favs.push(symptomId);
    } else {
      favs.splice(idx, 1);
    }
    saveJSON(KEYS.favoriteSymptoms, favs);
    return favs;
  }

  function logSymptomEntry(symptomId, severity) {
    var history = loadJSON(KEYS.symptomHistory, []);
    history.push({
      symptomId: symptomId,
      severity:  severity || null,
      ts:        new Date().toISOString()
    });
    // Keep last 500 entries
    if (history.length > 500) history = history.slice(-500);
    saveJSON(KEYS.symptomHistory, history);
    return history;
  }

  // ── Public API ────────────────────────────────────────────────

  window.HQSymptomUtils = {
    // Lookup
    getSymptom:                  getSymptom,
    allSymptoms:                 allSymptoms,
    getCondition:                getCondition,
    allConditions:               allConditions,
    resolveSymptoms:             resolveSymptoms,
    // Build
    buildWatchlistFromConditions: buildWatchlistFromConditions,
    // Grouping
    groupByCategory:             groupByCategory,
    groupedWithMeta:             groupedWithMeta,
    // Analysis
    conditionsForSymptom:        conditionsForSymptom,
    symptomsForCondition:        symptomsForCondition,
    overlappingSymptoms:         overlappingSymptoms,
    // Validation
    validate:                    validate,
    // Storage
    loadSelectedConditions:      loadSelectedConditions,
    saveSelectedConditions:      saveSelectedConditions,
    loadWatchlist:               loadWatchlist,
    loadFavorites:               loadFavorites,
    saveWatchlistFromConditions: saveWatchlistFromConditions,
    toggleFavorite:              toggleFavorite,
    logSymptomEntry:             logSymptomEntry,
    KEYS:                        KEYS
  };

}());
