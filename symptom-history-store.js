// ═══════════════════════════════════════════════════════════════
//  AUDHD HQ — Symptom History Store  (Phase B4)
//  Compact serialization for symptom history localStorage.
//  Replaces full-object arrays with a compact columnar format
//  to keep localStorage usage small even after 500+ entries.
//
//  Compact format (string):
//    "v2|id,sev,ts|id,sev,ts|…"
//    where ts is a Unix timestamp in seconds (not full ISO string)
//    and sev is 0 when null/undefined
//
//  Backward-compatible: reads legacy full-object arrays and
//  transparently upgrades them on first write.
//
//  Provides:
//    HQSymptomHistoryStore.append(symptomId, severity)
//    HQSymptomHistoryStore.load()            → [{symptomId, severity, ts}]
//    HQSymptomHistoryStore.loadCompact()     → compact string
//    HQSymptomHistoryStore.clear()
//    HQSymptomHistoryStore.byteSize()        → estimated localStorage bytes
//    HQSymptomHistoryStore.trimTo(n)         → keep last n entries
// ═══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  var KEY     = HQKeys.SYMPTOM_HISTORY;
  var MAX_LEN = 500;
  var V2_PREFIX = 'v2|';

  // ── Serialization ─────────────────────────────────────────────

  function serializeEntry(e) {
    // id,severity(0 if null),unix-seconds
    var sev = (e.severity != null && !isNaN(e.severity)) ? Math.round(e.severity) : 0;
    var ts  = e.ts
      ? Math.round(new Date(e.ts).getTime() / 1000)
      : Math.round(Date.now() / 1000);
    // sanitize id: replace pipe and comma (reserved delimiters)
    var id = (e.symptomId || '').replace(/[|,]/g, '_');
    return id + ',' + sev + ',' + ts;
  }

  function deserializeEntry(chunk) {
    var parts = chunk.split(',');
    if (parts.length < 3) return null;
    var sev = parseInt(parts[1], 10);
    var ts  = parseInt(parts[2], 10);
    return {
      symptomId: parts[0],
      severity:  sev || null,
      ts:        new Date(ts * 1000).toISOString()
    };
  }

  // ── Read ──────────────────────────────────────────────────────

  function loadRaw() {
    return localStorage.getItem(KEY) || '';
  }

  /**
   * Load history as normalized object array.
   * Handles both v2 compact format and legacy JSON format.
   */
  function load() {
    var raw = loadRaw();
    if (!raw) return [];

    // v2 compact format
    if (raw.startsWith(V2_PREFIX)) {
      var body = raw.slice(V2_PREFIX.length);
      if (!body) return [];
      return body.split('|').map(deserializeEntry).filter(Boolean);
    }

    // Legacy JSON array
    try {
      var arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      // Normalize: ensure each entry has symptomId and ts
      return arr.map(function (e) {
        return {
          symptomId: e.symptomId || e.id || '',
          severity:  e.severity != null ? e.severity : null,
          ts:        e.ts || e.timestamp || new Date().toISOString()
        };
      }).filter(function (e) { return e.symptomId; });
    } catch (e) {
      return [];
    }
  }

  // ── Write ─────────────────────────────────────────────────────

  function save(entries) {
    if (!entries.length) {
      localStorage.removeItem(KEY);
      return;
    }
    // Keep last MAX_LEN
    var trimmed = entries.length > MAX_LEN ? entries.slice(-MAX_LEN) : entries;
    var compact = V2_PREFIX + trimmed.map(serializeEntry).join('|');
    try { localStorage.setItem(KEY, compact); } catch (e) { console.warn('[HQSymptomHistory] save failed:', e); }
  }

  // ── Append ────────────────────────────────────────────────────

  /**
   * Append a single symptom log entry. Loads current history,
   * appends, trims to MAX_LEN, writes back in compact format.
   */
  function append(symptomId, severity) {
    if (!symptomId) return;
    var entries = load();
    entries.push({
      symptomId: symptomId,
      severity:  severity != null ? severity : null,
      ts:        new Date().toISOString()
    });
    save(entries);

    // Invalidate cache
    if (window.HQSymptomCache) window.HQSymptomCache.invalidate('history');
  }

  // ── Utility ───────────────────────────────────────────────────

  function clear() {
    localStorage.removeItem(KEY);
    if (window.HQSymptomCache) window.HQSymptomCache.invalidate('history');
  }

  function trimTo(n) {
    var entries = load();
    if (entries.length > n) {
      save(entries.slice(-n));
    }
  }

  function byteSize() {
    var raw = loadRaw();
    // localStorage stores UTF-16; rough estimate: 2 bytes per char
    return raw.length * 2;
  }

  function loadCompact() {
    return loadRaw();
  }

  // ── Migrate legacy format on load ────────────────────────────
  (function migrateLegacy() {
    var raw = loadRaw();
    if (!raw || raw.startsWith(V2_PREFIX)) return;
    // Has legacy data — migrate it
    try {
      var entries = load();
      if (entries.length) {
        save(entries);
        console.info('[HQSymptomHistoryStore] Migrated ' + entries.length + ' entries to compact v2 format');
      }
    } catch (e) {
      console.warn('[HQSymptomHistoryStore] Migration failed:', e);
    }
  }());

  // ── Expose ────────────────────────────────────────────────────
  window.HQSymptomHistoryStore = {
    append:      append,
    load:        load,
    loadCompact: loadCompact,
    save:        save,
    clear:       clear,
    trimTo:      trimTo,
    byteSize:    byteSize,
    MAX_LEN:     MAX_LEN
  };

  // Patch HQSymptomUtils.logSymptomEntry to use the compact store
  // (runs after DOMContentLoaded so HQSymptomUtils is already defined)
  document.addEventListener('DOMContentLoaded', function () {
    if (window.HQSymptomUtils && typeof window.HQSymptomUtils.logSymptomEntry === 'function') {
      window.HQSymptomUtils.logSymptomEntry = function (symptomId, severity) {
        window.HQSymptomHistoryStore.append(symptomId, severity);
        return window.HQSymptomHistoryStore.load();
      };
    }
  });

}());
