// ═══════════════════════════════════════════════════════════════
//  AUDHD HQ — Symptom Index  (Phase B4)
//  Pre-built inverted indexes over HQSymptomRegistry.
//  Built once on first access, then reused (memoized).
//
//  Provides:
//    HQSymptomIndex.byCategory(catId)      → symptom[]
//    HQSymptomIndex.byCondition(condId)    → symptom[]
//    HQSymptomIndex.byTag(tag)             → symptom[]
//    HQSymptomIndex.prefixMatch(query)     → symptom[] (fast typeahead)
//    HQSymptomIndex.quickLogIndex          → Set<id>
//    HQSymptomIndex.severityIndex          → Set<id>
//    HQSymptomIndex.rebuild()              → force rebuild
//    HQSymptomIndex.ready                  → boolean
// ═══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ── Internal index state ──────────────────────────────────────
  var _built      = false;
  var _byCategory = {};   // { catId: [symptom, …] }
  var _byCondition = {};  // { condId: [symptom, …] }
  var _byTag       = {};  // { tag: [symptom, …] }
  var _labelTokens = [];  // [{ tokens: string[], sym: symptom }, …]  for prefix search
  var _quickLogSet = null; // Set<id>
  var _severitySet = null; // Set<id>
  var _allSorted   = null; // all symptoms, sorted by label

  // ── Build ─────────────────────────────────────────────────────

  function build() {
    var registry   = window.HQSymptomRegistry  || {};
    var pools      = window.HQConditionPools   || {};

    _byCategory  = {};
    _byCondition = {};
    _byTag       = {};
    _labelTokens = [];
    _quickLogSet = new Set();
    _severitySet = new Set();

    // ── Index by category & build label token list ────────────
    Object.values(registry).forEach(function (s) {

      // category index
      (s.categories || []).forEach(function (catId) {
        if (!_byCategory[catId]) _byCategory[catId] = [];
        _byCategory[catId].push(s);
      });

      // tag index
      (s.tags || []).forEach(function (tag) {
        var t = tag.toLowerCase();
        if (!_byTag[t]) _byTag[t] = [];
        _byTag[t].push(s);
      });

      // quickLog / severity sets
      if (s.quickLog)           _quickLogSet.add(s.id);
      if (s.severitySupported)  _severitySet.add(s.id);

      // label token list: split on space, /, –, (, ) for fast prefix matching
      var tokens = s.label.toLowerCase().split(/[\s\/\-–—()\[\]]+/).filter(Boolean);
      _labelTokens.push({ tokens: tokens, sym: s });
    });

    // ── Index by condition (from condition pools) ─────────────
    Object.values(pools).forEach(function (pool) {
      var symptoms = (pool.symptoms || []).map(function (id) {
        return registry[id];
      }).filter(Boolean);
      _byCondition[pool.id] = symptoms;
    });

    // ── Sorted all-symptoms list ──────────────────────────────
    _allSorted = Object.values(registry).slice().sort(function (a, b) {
      return a.label.localeCompare(b.label);
    });

    _built = true;
  }

  function ensureBuilt() {
    if (!_built) build();
  }

  // ── Public accessors ──────────────────────────────────────────

  function byCategory(catId) {
    ensureBuilt();
    return _byCategory[catId] || [];
  }

  function byCondition(condId) {
    ensureBuilt();
    return _byCondition[condId] || [];
  }

  function byTag(tag) {
    ensureBuilt();
    return _byTag[tag.toLowerCase()] || [];
  }

  function allSorted() {
    ensureBuilt();
    return _allSorted || [];
  }

  /**
   * Fast prefix-based typeahead search.
   * Returns results scored and sorted:
   *   tier 1: any label token starts with query
   *   tier 2: any label token contains query
   *   tier 3: tag or condition name match
   * Deduplicates by id.
   */
  function prefixMatch(query) {
    ensureBuilt();
    if (!query || !query.trim()) return _allSorted || [];

    var q    = query.toLowerCase().trim();
    var seen = new Set();
    var t1   = [], t2   = [], t3 = [];

    _labelTokens.forEach(function (entry) {
      var s = entry.sym;
      if (seen.has(s.id)) return;

      var labelLower = s.label.toLowerCase();

      // Tier 1: full label or any token starts with query
      if (labelLower.startsWith(q) || entry.tokens.some(function (tok) { return tok.startsWith(q); })) {
        t1.push(s); seen.add(s.id); return;
      }

      // Tier 2: label contains query anywhere
      if (labelLower.includes(q)) {
        t2.push(s); seen.add(s.id); return;
      }

      // Tier 3: tag match
      var tagHit = (s.tags || []).some(function (tag) { return tag.toLowerCase().includes(q); });
      if (tagHit) {
        t3.push(s); seen.add(s.id); return;
      }

      // Tier 3b: condition name match
      var condHit = (s.conditions || []).some(function (cid) {
        var pool = window.HQConditionPools && window.HQConditionPools[cid];
        return pool && pool.name && pool.name.toLowerCase().includes(q);
      });
      if (condHit && !seen.has(s.id)) {
        t3.push(s); seen.add(s.id);
      }
    });

    return t1.concat(t2, t3);
  }

  function rebuild() {
    _built = false;
    build();
  }

  // ── Expose ────────────────────────────────────────────────────

  window.HQSymptomIndex = {
    byCategory:  byCategory,
    byCondition: byCondition,
    byTag:       byTag,
    allSorted:   allSorted,
    prefixMatch: prefixMatch,
    rebuild:     rebuild,
    get ready()      { return _built; },
    get quickLogIds(){ ensureBuilt(); return _quickLogSet; },
    get severityIds(){ ensureBuilt(); return _severitySet; }
  };

  // Auto-build after registries load (deferred so registries are available)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(build, 0);
    });
  } else {
    setTimeout(build, 0);
  }

}());
