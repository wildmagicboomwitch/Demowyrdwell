// ════════════════════════════════════════════════════════════════
// AuDHD HQ · data-sync.js · Phase 14 — Dual Backup System
// ════════════════════════════════════════════════════════════════

// ── Key → Module map ─────────────────────────────────
// NOTE: KEY_MODULE_MAP is intentionally NOT extended in Phase 14.
// Missing keys are tracked in key-audit-plan.md for a dedicated pass.
const KEY_MODULE_MAP = {
  [HQKeys.THEME]:             'Theme / Customize',
  [HQKeys.FLAGS]:             'HQ Flags (Global)',
  [HQKeys.CHECKIN_LOG]:       'Quick Check-In',
  [HQKeys.CHECKIN]:           'Check-In State',
  [HQKeys.BOXES]:             'Box Tracker',
  [HQKeys.LIFE_AREAS]:        'Box Tracker / Life Areas',
  [HQKeys.BRAINDUMP]:         'Thought Jar',
  [HQKeys.DREAMS]:            'Dream Journal',
  [HQKeys.WALKING]:           'Walking Tracker',
  [HQKeys.WALKING_UNIT]:      'Walking Unit Pref',
  [HQKeys.HEALTH]:            'Health Tracker',
  [HQKeys.MIGRAINE]:          'Migraine Log',
  [HQKeys.FINANCE]:           'Money Brain',
  [HQKeys.KITCHEN]:           'Kitchen Brain',
  [HQKeys.FRIDGE]:            'Kitchen / Fridge',
  [HQKeys.DEEPCLEAN]:         'Deep Clean',
  [HQKeys.DEEPCLEAN_STATS]:   'Deep Clean Stats',
  [HQKeys.TIMELINE]:          'Timeline',
  [HQKeys.DAYBUILDER]:        'Day Builder (legacy)',
  [HQKeys.DAYBUILDER_V2]:   'Day Builder',
  [HQKeys.WEEKLY]:            'Weekly Planner',
  [HQKeys.MONTHLY]:           'Monthly Planner (legacy)',
  'hq-monthly':                 'Monthly Planner',
  [HQKeys.RECURRING]:         'Recurring Tasks (legacy)',
  'hq-recurring':               'Recurring Tasks',
  [HQKeys.TASKBOARD]:         'Taskboard',
  [HQKeys.PROJECTS]:          'Project Brain',
  [HQKeys.PROJECTS_CONCEPTS]: 'Project Brain Concepts',  // BUG-02 fix — was missing from export list
  [HQKeys.PREPWORK]:          'Prepwork',
  [HQKeys.ROUTINES]:          'Routines',
  [HQKeys.RP_LOG]:            'Routines Log',
  [HQKeys.RP_LASTTAB]:        'Routines Tab',
  [HQKeys.SURVIVAL]:          'Survival Mode',
  [HQKeys.SURV_MIG_V1]:    'Survival Migraine',
  [HQKeys.WINS]:              'Wins Log',
  [HQKeys.NONNEG]:            'Non-Negotiables',
  [HQKeys.TAGS]:              'Custom Tags',
  [HQKeys.REMINDER_WINDOWS]:  'Reminder Windows',
  [HQKeys.CASCADE_SIGNAL]:    'Cascade Signal',
  [HQKeys.DB_SIGNAL]:         'DayBuilder Signal',
  [HQKeys.RECUR_PENDING]:     'Recurring Pending',
  [HQKeys.RECUR_EDIT_PENDING]:'Recur Edit Queue',
  [HQKeys.TL_MIGRATED]:       'TL Migration Flag',
  [HQKeys.CHECKIN_PRESETS]:   'Check-In Quick Presets',
  [HQKeys.BOTTOM_NAV_SLOTS]:  'Bottom Nav Slots',
  [HQKeys.DISPLAY_PREFS]:     'Display Prefs (Motion/Contrast)',
  [HQKeys.SHORTCUTS]:         'Shortcuts Drawer Items',
  [HQKeys.CHECKIN_VISIBILITY]:'Check-In Section Visibility',
};

// Keys that must NEVER be restored from a backup file.
// These reflect live runtime state — restoring them would break the deploy gate loop.
const IMPORT_SKIP_KEYS = new Set([
  HQKeys.DEPLOY_VERSION, // written by hq-deploy-gate.js on every update; importing an old value re-triggers the gate
]);

// ── Phase 14: Dual Stream Key Classification ──────────
// Settings keys: config, prefs, setup data — OVERWRITE on import
const SETTINGS_KEYS = new Set([
  HQKeys.TAGS,
  HQKeys.FLAGS,
  HQKeys.THEME,
  HQKeys.THEME_SCHEDULE,
  HQKeys.DISPLAY_PREFS,
  HQKeys.INDEX_LAYOUT,
  HQKeys.SHORTCUTS,
  HQKeys.BOTTOM_NAV_SLOTS,
  HQKeys.REMINDER_CONFIG,
  HQKeys.REMINDER_WINDOWS,
  HQKeys.PROFILE,
  HQKeys.MODULE_SETTINGS,
  HQKeys.CHECKIN_PRESETS,
  HQKeys.CHECKIN_VISIBILITY,
  HQKeys.NONNEG,
  // All *-setup keys are settings — matched by suffix below
]);

// User data keys: actual user content — MERGE on import by default
const USER_DATA_KEYS = new Set([
  HQKeys.CHECKIN_LOG,
  HQKeys.CHECKIN,
  HQKeys.HEALTH,
  HQKeys.MIGRAINE,
  HQKeys.FINANCE,
  HQKeys.MONTHLY,
  'hq-monthly',
  HQKeys.WEEKLY,
  HQKeys.RECURRING,
  'hq-recurring',
  HQKeys.RECUR_PENDING,
  HQKeys.RECUR_EDIT_PENDING,
  HQKeys.BRAINDUMP,
  HQKeys.DREAMS,
  HQKeys.WALKING,
  HQKeys.WALKING_UNIT,
  HQKeys.KITCHEN,
  HQKeys.FRIDGE,
  HQKeys.DEEPCLEAN,
  HQKeys.DEEPCLEAN_STATS,
  HQKeys.TIMELINE,
  HQKeys.TL_MIGRATED,
  HQKeys.DAYBUILDER,
  HQKeys.DAYBUILDER_V2,
  HQKeys.DB_SIGNAL,
  HQKeys.CASCADE_SIGNAL,
  HQKeys.TASKBOARD,
  HQKeys.PROJECTS,
  HQKeys.PROJECTS_CONCEPTS, // BUG-02 fix — concepts now exported/imported alongside projects
  HQKeys.PREPWORK,
  HQKeys.ROUTINES,
  HQKeys.RP_LOG,
  HQKeys.RP_LASTTAB,
  HQKeys.BOXES,
  HQKeys.LIFE_AREAS,
  HQKeys.SURVIVAL,
  HQKeys.SURV_MIG_V1,
  HQKeys.WINS,
  HQKeys.MEDS,
  HQKeys.MED_LOG,
  HQKeys.LIFE_ADMIN,
  HQKeys.TOOL_VAULT,
  HQKeys.SOCIAL_BRAIN,
  // NOTE: some of these keys are not yet in KEY_MODULE_MAP
  // They are tracked in key-audit-plan.md
]);

// Classify any live key — setup keys always go to settings stream
function classifyKey(k) {
  if (k.endsWith('-setup')) return 'settings';
  if (SETTINGS_KEYS.has(k)) return 'settings';
  if (USER_DATA_KEYS.has(k)) return 'data';
  return 'data'; // fallback: treat unknown as user data to avoid losing it
}

// ── Core Utilities ────────────────────────────────────
function getAllHQKeys() {
  return Object.keys(localStorage).filter(k =>
    k.startsWith('audhd-hq-') || k.startsWith('hq-')
  ).sort();
}

function getStreamKeys(stream) {
  // stream: 'settings' | 'data'
  return getAllHQKeys().filter(k => classifyKey(k) === stream);
}

function byteSize(str) { return new TextEncoder().encode(str).length; }
function fmtSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

function showMsg(id, msg, type = 'ok') {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className = 'status-msg ' + type;
  setTimeout(() => { if (el.textContent === msg) el.className = 'status-msg'; }, 4500);
}

function todayStamp() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

function buildExportObj(keys, streamLabel) {
  const out = {
    _meta: {
      exported: new Date().toISOString(),
      app: 'AuDHD HQ',
      stream: streamLabel || 'full',
      keyCount: keys.length
    }
  };
  keys.forEach(k => {
    const v = localStorage.getItem(k);
    if (v !== null) {
      try { out[k] = JSON.parse(v); } catch(e) { out[k] = v; }
    }
  });
  // Wire: stamp schemaVersion via HQSchemaRegistry if available
  return (window.HQSchemaRegistry && typeof window.HQSchemaRegistry.stamp === 'function')
    ? window.HQSchemaRegistry.stamp(out)
    : Object.assign({ schemaVersion: 1 }, out);
}

function downloadJSON(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── Stream stats helpers for UI ───────────────────────
function streamStats(stream) {
  const keys = getStreamKeys(stream);
  const totalBytes = keys.reduce((a, k) => {
    const v = localStorage.getItem(k);
    return a + (v ? byteSize(v) : 0);
  }, 0);
  return { count: keys.length, size: fmtSize(totalBytes) };
}

function refreshStreamStats() {
  const sStats = streamStats('settings');
  const dStats = streamStats('data');
  const sEl = document.getElementById('settings-stream-stats');
  const dEl = document.getElementById('data-stream-stats');
  if (sEl) sEl.textContent = sStats.count + ' keys · ' + sStats.size;
  if (dEl) dEl.textContent = dStats.count + ' keys · ' + dStats.size;
  // Also refresh full export stats
  const statsEl = document.getElementById('export-stats');
  if (statsEl) {
    const keys = getAllHQKeys();
    const total = keys.reduce((a, k) => {
      const v = localStorage.getItem(k);
      return a + (v ? byteSize(v) : 0);
    }, 0);
    statsEl.textContent = keys.length + ' keys · ' + fmtSize(total) + ' total';
  }
}

// ════════════════════════════════════════════════════════
// PHASE 14 · STREAM EXPORTS
// ════════════════════════════════════════════════════════

// ── Export Settings Stream ────────────────────────────
function exportSettings() {
  const keys = getStreamKeys('settings');
  if (!keys.length) {
    showMsg('settings-export-status', 'No settings keys found. Run setup wizard first.', 'info');
    return;
  }
  const obj = buildExportObj(keys, 'settings');
  downloadJSON(obj, 'audhdhq-settings-' + todayStamp() + '.json');
  showMsg('settings-export-status', '✅ Settings downloaded — ' + keys.length + ' keys (' + fmtSize(JSON.stringify(obj).length) + ')', 'ok');
}

function copySettings() {
  const keys = getStreamKeys('settings');
  if (!keys.length) { showMsg('settings-export-status', 'No settings keys to copy.', 'err'); return; }
  const obj = buildExportObj(keys, 'settings');
  navigator.clipboard.writeText(JSON.stringify(obj, null, 2))
    .then(() => showMsg('settings-export-status', '📋 Copied ' + keys.length + ' settings keys', 'ok'))
    .catch(() => showMsg('settings-export-status', 'Clipboard failed — use Download.', 'err'));
}

// ── Export User Data Stream ───────────────────────────
function exportUserData() {
  const keys = getStreamKeys('data');
  if (!keys.length) {
    showMsg('data-export-status', 'No user data keys found yet.', 'info');
    return;
  }
  const obj = buildExportObj(keys, 'data');
  downloadJSON(obj, 'audhdhq-data-' + todayStamp() + '.json');
  showMsg('data-export-status', '✅ Data downloaded — ' + keys.length + ' keys (' + fmtSize(JSON.stringify(obj).length) + ')', 'ok');
}

function copyUserData() {
  const keys = getStreamKeys('data');
  if (!keys.length) { showMsg('data-export-status', 'No user data keys to copy.', 'err'); return; }
  const obj = buildExportObj(keys, 'data');
  navigator.clipboard.writeText(JSON.stringify(obj, null, 2))
    .then(() => showMsg('data-export-status', '📋 Copied ' + keys.length + ' data keys', 'ok'))
    .catch(() => showMsg('data-export-status', 'Clipboard failed — use Download.', 'err'));
}

// ════════════════════════════════════════════════════════
// PHASE 14 · STREAM IMPORTS
// ════════════════════════════════════════════════════════

// ── Detect which stream a backup file belongs to ──────
function detectImportStream(parsed) {
  const meta = parsed._meta;
  if (meta && (meta.stream === 'settings' || meta.stream === 'data')) return meta.stream;
  // Heuristic: count how many keys match each stream
  const keys = Object.keys(parsed).filter(k => k.startsWith('audhd-hq-') || k.startsWith('hq-'));
  let sCount = 0, dCount = 0;
  keys.forEach(k => {
    if (classifyKey(k) === 'settings') sCount++;
    else dCount++;
  });
  if (sCount > 0 && dCount === 0) return 'settings';
  if (dCount > 0 && sCount === 0) return 'data';
  return 'full'; // mixed backup
}

// ── Load file into the correct import box ─────────────
function loadSettingsImportFile(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const raw = e.target.result;
    document.getElementById('settings-import-box').value = raw;
    try {
      const parsed = JSON.parse(raw);
      const stream = detectImportStream(parsed);
      if (stream === 'data') {
        showMsg('settings-import-status', '⚠️ This looks like a User Data backup, not a Settings backup. Check your file.', 'info');
      } else {
        showMsg('settings-import-status', '📁 File loaded — review then click Import Settings.', 'info');
      }
    } catch(e) {
      showMsg('settings-import-status', '❌ Could not parse JSON: ' + e.message, 'err');
    }
  };
  reader.readAsText(file);
}

function loadDataImportFile(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const raw = e.target.result;
    document.getElementById('data-import-box').value = raw;
    try {
      const parsed = JSON.parse(raw);
      const stream = detectImportStream(parsed);
      if (stream === 'settings') {
        showMsg('data-import-status', '⚠️ This looks like a Settings backup, not a User Data backup. Check your file.', 'info');
      } else {
        showMsg('data-import-status', '📁 File loaded — review then click Import Data.', 'info');
      }
    } catch(e) {
      showMsg('data-import-status', '❌ Could not parse JSON: ' + e.message, 'err');
    }
  };
  reader.readAsText(file);
}

// ── Import Settings (always overwrite) ───────────────
async function importSettings() {
  const raw = document.getElementById('settings-import-box').value.trim();
  if (!raw) {
    showMsg('settings-import-status', 'Paste or load a settings backup first.', 'err');
    return;
  }
  let parsed;
  try { parsed = JSON.parse(raw); } catch(e) {
    showMsg('settings-import-status', '❌ Invalid JSON: ' + e.message, 'err');
    return;
  }
  const hqKeys = Object.keys(parsed).filter(k =>
    (k.startsWith('audhd-hq-') || k.startsWith('hq-')) && classifyKey(k) === 'settings'
  );
  if (!hqKeys.length) {
    showMsg('settings-import-status', '❌ No settings keys found in this file. Is this a settings backup?', 'err');
    return;
  }
  if (!(await HQConfirm.ask(`Import ${hqKeys.length} settings keys? Existing settings will be overwritten.`))) return;

  // Wire: route through HQImport pipeline (validate → migrate → repair → commit)
  if (window.HQImport) {
    // Build a filtered object containing only settings keys
    const settingsOnly = {};
    hqKeys.forEach(k => { settingsOnly[k] = parsed[k]; });

    const report = window.HQImport.run(settingsOnly, { mode: 'commit', allowOrphans: true });
    const written = (report.stages.commit && report.stages.commit.written) || [];
    const errors  = (report.stages.commit && report.stages.commit.errors)  || [];
    const valErrs = report.summary.validationErrors || 0;
    const migrations = report.summary.migrationsApplied || 0;

    const note = [
      migrations  ? `${migrations} migration(s) applied` : '',
      valErrs     ? `⚠️ ${valErrs} validation warning(s) — data still imported` : '',
      errors.length ? `${errors.length} key(s) failed` : '',
    ].filter(Boolean).join(' · ');

    showMsg('settings-import-status',
      `✅ Imported ${written.length} settings keys${errors.length ? `, ${errors.length} failed` : ''}.${note ? ' ' + note : ''}`,
      errors.length ? 'info' : 'ok'
    );

    const sumLines = written.map(k => `<span class="import-key-ok">✓ ${k}</span>`);
    errors.forEach(e => sumLines.push(`<span class="import-key-skip">✗ ${e}</span>`));
    const sum = document.getElementById('settings-import-summary');
    if (sum) { sum.innerHTML = sumLines.join('<br>'); sum.classList.add('show'); }

  } else {
    // Fallback: direct write (pre-pipeline behaviour — zero regression)
    let ok = 0, skipped = 0;
    const sumLines = [];
    hqKeys.forEach(k => {
      if (IMPORT_SKIP_KEYS.has(k)) return; // never restore deploy-gate runtime keys
      try {
        localStorage.setItem(k, JSON.stringify(parsed[k]));
        ok++;
        sumLines.push(`<span class="import-key-ok">✓ ${k}</span>`);
      } catch(e) {
        skipped++;
        sumLines.push(`<span class="import-key-skip">✗ ${k} (${e.message})</span>`);
      }
    });
    showMsg('settings-import-status', `✅ Imported ${ok} settings keys${skipped ? `, ${skipped} failed` : ''}.`, 'ok');
    const sum = document.getElementById('settings-import-summary');
    if (sum) { sum.innerHTML = sumLines.join('<br>'); sum.classList.add('show'); }
  }

  refreshStreamStats();
  buildSelTable();
  buildMgrTable();
  window.dispatchEvent(new CustomEvent('hq-flags-updated'));
  window.dispatchEvent(new CustomEvent('hq-config-updated'));
}

// ── Import User Data (merge — no wipe, incoming merges with existing) ──
async function importUserData() {
  const raw = document.getElementById('data-import-box').value.trim();
  if (!raw) {
    showMsg('data-import-status', 'Paste or load a user data backup first.', 'err');
    return;
  }
  let parsed;
  try { parsed = JSON.parse(raw); } catch(e) {
    showMsg('data-import-status', '❌ Invalid JSON: ' + e.message, 'err');
    return;
  }
  const hqKeys = Object.keys(parsed).filter(k =>
    k.startsWith('audhd-hq-') || k.startsWith('hq-')
  ).filter(k => k !== '_meta');
  if (!hqKeys.length) {
    showMsg('data-import-status', '❌ No HQ data keys found in this file.', 'err');
    return;
  }

  const settingsInFile = hqKeys.filter(k => classifyKey(k) === 'settings');
  const dataInFile     = hqKeys.filter(k => classifyKey(k) === 'data');
  let warningNote = '';
  if (settingsInFile.length > 0 && dataInFile.length > 0) {
    warningNote = `\n\nNote: ${settingsInFile.length} settings keys detected in this file — they will be imported too. For settings-only restores, use Import Settings instead.`;
  }
  if (!(await HQConfirm.ask(`Import ${hqKeys.length} data keys? Existing keys will be overwritten with backup values.${warningNote}`))) return;

  // Wire: route through HQImport pipeline (validate → migrate → repair → commit)
  if (window.HQImport) {
    const dataOnly = {};
    hqKeys.forEach(k => { dataOnly[k] = parsed[k]; });

    const report = window.HQImport.run(dataOnly, { mode: 'commit', allowOrphans: true });
    const written    = (report.stages.commit && report.stages.commit.written) || [];
    const errors     = (report.stages.commit && report.stages.commit.errors)  || [];
    const valErrs    = report.summary.validationErrors || 0;
    const migrations = report.summary.migrationsApplied || 0;
    const orphans    = report.summary.orphans || 0;

    const note = [
      migrations ? `${migrations} migration(s) applied` : '',
      valErrs    ? `⚠️ ${valErrs} validation warning(s)` : '',
      orphans    ? `⚠️ ${orphans} orphaned reference(s) detected — run HQObserver.report() for details` : '',
      errors.length ? `${errors.length} key(s) failed` : '',
    ].filter(Boolean).join(' · ');

    showMsg('data-import-status',
      `✅ Imported ${written.length} data keys${errors.length ? `, ${errors.length} failed` : ''}.${note ? ' ' + note : ''}`,
      (errors.length || orphans) ? 'info' : 'ok'
    );

    const sumLines = written.map(k => `<span class="import-key-ok">✓ ${k}</span>`);
    errors.forEach(e => sumLines.push(`<span class="import-key-skip">✗ ${e}</span>`));
    const sum = document.getElementById('data-import-summary');
    if (sum) { sum.innerHTML = sumLines.join('<br>'); sum.classList.add('show'); }

  } else {
    // Fallback: direct write (pre-pipeline behaviour — zero regression)
    let ok = 0, skipped = 0;
    const sumLines = [];
    hqKeys.forEach(k => {
      if (IMPORT_SKIP_KEYS.has(k)) return; // never restore deploy-gate runtime keys
      try {
        localStorage.setItem(k, JSON.stringify(parsed[k]));
        ok++;
        sumLines.push(`<span class="import-key-ok">✓ ${k}</span>`);
      } catch(e) {
        skipped++;
        sumLines.push(`<span class="import-key-skip">✗ ${k} (${e.message})</span>`);
      }
    });
    showMsg('data-import-status', `✅ Imported ${ok} data keys${skipped ? `, ${skipped} failed` : ''}.`, 'ok');
    const sum = document.getElementById('data-import-summary');
    if (sum) { sum.innerHTML = sumLines.join('<br>'); sum.classList.add('show'); }
  }

  refreshStreamStats();
  buildSelTable();
  buildMgrTable();
  window.dispatchEvent(new CustomEvent('hq-flags-updated'));
}

// ════════════════════════════════════════════════════════
// PHASE 14 · AUTO-BACKUP (download-on-save)
// Triggered by hq-data-saved events. Downloads a file
// automatically if the relevant auto-backup toggle is on.
// ════════════════════════════════════════════════════════

const AB_KEY = HQKeys.AUTOBACKUP_PREFS;

function getAutoBackupPrefs() {
  try { return JSON.parse(localStorage.getItem(AB_KEY) || '{}'); } catch(e) { return {}; }
}
function saveAutoBackupPrefs(prefs) {
  localStorage.setItem(AB_KEY, JSON.stringify(prefs));
}

// Called by the toggle checkboxes in the UI
function toggleAutoBackup(stream, checkbox) {
  const prefs = getAutoBackupPrefs();
  prefs[stream] = checkbox.checked;
  saveAutoBackupPrefs(prefs);
  showMsg('autobackup-status', checkbox.checked
    ? `✅ Auto-backup ${stream === 'settings' ? 'Settings' : 'Data'}: ON — will download on next save`
    : `⏸ Auto-backup ${stream === 'settings' ? 'Settings' : 'Data'}: OFF`,
    checkbox.checked ? 'ok' : 'info'
  );
}

// Sync checkboxes to saved prefs on load
function syncAutoBackupToggles() {
  const prefs = getAutoBackupPrefs();
  const sToggle = document.getElementById('ab-settings-toggle');
  const dToggle = document.getElementById('ab-data-toggle');
  if (sToggle) sToggle.checked = !!prefs.settings;
  if (dToggle) dToggle.checked = !!prefs.data;
}

// Wire up the event listener — fires when any module writes data
function initAutoBackupListeners() {
  const EVENTS = ['hq-data-saved', 'hq-checkin-saved', 'hq-flags-updated'];
  EVENTS.forEach(evtName => {
    window.addEventListener(evtName, (e) => {
      const prefs = getAutoBackupPrefs();
      const hint = e && e.detail && e.detail.stream; // optional hint from event

      // Settings auto-backup: fires on config-type events
      if (prefs.settings && (!hint || hint === 'settings')) {
        const sKeys = getStreamKeys('settings');
        if (sKeys.length) {
          const obj = buildExportObj(sKeys, 'settings');
          downloadJSON(obj, 'audhdhq-settings-' + todayStamp() + '.json');
        }
      }
      // Data auto-backup: fires on data-type events
      if (prefs.data && (!hint || hint === 'data')) {
        const dKeys = getStreamKeys('data');
        if (dKeys.length) {
          const obj = buildExportObj(dKeys, 'data');
          downloadJSON(obj, 'audhdhq-data-' + todayStamp() + '.json');
        }
      }
    });
  });
}

// ════════════════════════════════════════════════════════
// LEGACY — Full Export / Selective Export (unchanged)
// ════════════════════════════════════════════════════════

function exportAll() {
  const keys = getAllHQKeys();
  if (!keys.length) { showMsg('export-status', 'No audhd-hq-* keys found.', 'err'); return; }
  const obj = buildExportObj(keys, 'full');
  downloadJSON(obj, 'audhdhq-backup-' + todayStamp() + '.json');
  showMsg('export-status', '✅ Downloaded full backup — ' + keys.length + ' keys (' + fmtSize(JSON.stringify(obj).length) + ')', 'ok');
  const stats = document.getElementById('export-stats');
  if (stats) stats.textContent = keys.join(' · ');
}

function copyAll() {
  const keys = getAllHQKeys();
  if (!keys.length) { showMsg('export-status', 'No keys to copy.', 'err'); return; }
  const obj = buildExportObj(keys, 'full');
  navigator.clipboard.writeText(JSON.stringify(obj, null, 2))
    .then(() => showMsg('export-status', '📋 Copied ' + keys.length + ' keys', 'ok'))
    .catch(() => showMsg('export-status', 'Clipboard failed — use Download.', 'err'));
}

function buildSelTable() {
  const tbody = document.getElementById('sel-tbody');
  if (!tbody) return;
  const keys = getAllHQKeys();
  tbody.innerHTML = keys.map(k => {
    const raw = localStorage.getItem(k);
    const bytes = raw ? byteSize(raw) : 0;
    const mod = KEY_MODULE_MAP[k] || 'Unknown';
    const stream = classifyKey(k);
    const streamBadge = stream === 'settings'
      ? `<span class="badge badge-stream-settings">⚙️ cfg</span>`
      : `<span class="badge badge-stream-data">📦 data</span>`;
    const badge = raw
      ? (bytes > 50000 ? `<span class="badge badge-warn">LARGE</span>` : `<span class="badge badge-ok">✓</span>`)
      : `<span class="badge badge-empty">—</span>`;
    return `
      <tr>
        <td><input type="checkbox" class="chk sel-chk" data-key="${k}" onchange="updateSelCount()"></td>
        <td><span class="key-mono">${k}</span></td>
        <td style="font-size:10px;color:var(--text2)">${mod}</td>
        <td>${streamBadge}</td>
        <td class="sz">${raw ? fmtSize(bytes) : '—'}</td>
        <td>${badge}</td>
      </tr>`;
  }).join('');
  if (!keys.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:16px;color:var(--text-muted)">No data found</td></tr>';
  }
  updateSelCount();
}

function updateSelCount() {
  const checked = document.querySelectorAll('.sel-chk:checked').length;
  const el = document.getElementById('sel-count');
  if (el) el.textContent = checked + ' selected';
}

function toggleSelectAll(cb) {
  document.querySelectorAll('.sel-chk').forEach(c => c.checked = cb.checked);
  updateSelCount();
}

function getSelectedKeys() {
  return [...document.querySelectorAll('.sel-chk:checked')].map(c => c.dataset.key);
}

function exportSelected() {
  const keys = getSelectedKeys();
  if (!keys.length) { showMsg('sel-status', 'Select at least one key first.', 'err'); return; }
  const obj = buildExportObj(keys, 'partial');
  downloadJSON(obj, 'audhdhq-partial-' + todayStamp() + '.json');
  showMsg('sel-status', '✅ Downloaded ' + keys.length + ' selected keys', 'ok');
}

function copySelected() {
  const keys = getSelectedKeys();
  if (!keys.length) { showMsg('sel-status', 'Select at least one key first.', 'err'); return; }
  const obj = buildExportObj(keys, 'partial');
  navigator.clipboard.writeText(JSON.stringify(obj, null, 2))
    .then(() => showMsg('sel-status', '📋 Copied ' + keys.length + ' keys', 'ok'))
    .catch(() => showMsg('sel-status', 'Clipboard failed — use Download.', 'err'));
}

// ── Legacy single-box Import (full backup restore) ────
function loadImportFile(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('import-box').value = e.target.result;
    showMsg('import-status', '📁 File loaded — review then click Import.', 'info');
  };
  reader.readAsText(file);
}

async function importData(replaceAll) {
  const raw = document.getElementById('import-box').value.trim();
  if (!raw) { showMsg('import-status', 'Nothing to import — paste or load a JSON backup first.', 'err'); return; }

  let parsed;
  try { parsed = JSON.parse(raw); } catch(e) {
    showMsg('import-status', '❌ Invalid JSON: ' + e.message, 'err'); return;
  }

  const hqKeys = Object.keys(parsed).filter(k => k.startsWith('audhd-hq-') || k.startsWith('hq-'));
  if (!hqKeys.length) {
    showMsg('import-status', '❌ No audhd-hq-* or hq-* keys found. Is this a valid HQ export?', 'err');
    return;
  }

  const confirm1 = await (replaceAll
    ? HQConfirm.ask(`⚠️ REPLACE ALL will clear all existing HQ data first, then import ${hqKeys.length} keys. Cannot be undone. Continue?`, { danger: true, confirmLabel: 'Replace All' })
    : HQConfirm.ask(`Import ${hqKeys.length} audhd-hq-* keys? Existing keys will be overwritten.`));
  if (!confirm1) return;

  if (replaceAll) {
    getAllHQKeys().forEach(k => localStorage.removeItem(k));
  }

  // Wire: route through HQImport pipeline (validate → migrate → repair → commit)
  if (window.HQImport) {
    const importOnly = {};
    hqKeys.forEach(k => { importOnly[k] = parsed[k]; });

    const report = window.HQImport.run(importOnly, { mode: 'commit', allowOrphans: true });
    const written    = (report.stages.commit && report.stages.commit.written) || [];
    const errors     = (report.stages.commit && report.stages.commit.errors)  || [];
    const migrations = report.summary.migrationsApplied || 0;
    const orphans    = report.summary.orphans || 0;

    const note = [
      migrations ? `${migrations} migration(s) applied` : '',
      orphans    ? `⚠️ ${orphans} orphaned reference(s) — run HQObserver.report() for details` : '',
      replaceAll ? 'All previous data replaced.' : '',
    ].filter(Boolean).join(' · ');

    showMsg('import-status',
      `✅ Imported ${written.length} keys${errors.length ? `, ${errors.length} failed` : ''}.${note ? ' ' + note : ''}`,
      (errors.length || orphans) ? 'info' : 'ok'
    );

    const sumLines = written.map(k => `<span class="import-key-ok">✓ ${k}</span>`);
    errors.forEach(e => sumLines.push(`<span class="import-key-skip">✗ ${e}</span>`));
    const sum = document.getElementById('import-summary');
    if (sum) { sum.innerHTML = sumLines.join('<br>'); sum.classList.add('show'); }

  } else {
    // Fallback: direct write (pre-pipeline behaviour — zero regression)
    let ok = 0, skipped = 0;
    const sumLines = [];
    hqKeys.forEach(k => {
      if (IMPORT_SKIP_KEYS.has(k)) return; // never restore deploy-gate runtime keys
      try {
        localStorage.setItem(k, JSON.stringify(parsed[k]));
        ok++;
        sumLines.push(`<span class="import-key-ok">✓ ${k}</span>`);
      } catch(e) {
        skipped++;
        sumLines.push(`<span class="import-key-skip">✗ ${k} (${e.message})</span>`);
      }
    });
    showMsg('import-status', `✅ Imported ${ok} keys${skipped ? `, ${skipped} failed` : ''}.${replaceAll ? ' All previous data replaced.' : ''}`, 'ok');
    const sum = document.getElementById('import-summary');
    if (sum) { sum.innerHTML = sumLines.join('<br>'); sum.classList.add('show'); }
  }

  refreshStreamStats();
  buildSelTable();
  buildMgrTable();
  window.dispatchEvent(new CustomEvent('hq-flags-updated'));
}

// ── Key Manager ───────────────────────────────────────
function buildMgrTable() {
  const tbody = document.getElementById('mgr-tbody');
  if (!tbody) return;
  const keys = getAllHQKeys();
  tbody.innerHTML = keys.map(k => {
    const raw = localStorage.getItem(k);
    const bytes = raw ? byteSize(raw) : 0;
    const mod = KEY_MODULE_MAP[k] || 'Unknown';
    const stream = classifyKey(k);
    const streamBadge = stream === 'settings'
      ? `<span class="badge badge-stream-settings">⚙️ cfg</span>`
      : `<span class="badge badge-stream-data">📦 data</span>`;
    return `
      <tr id="mgr-row-${CSS.escape(k)}">
        <td><span class="key-mono">${k}</span></td>
        <td style="font-size:10px;color:var(--text2)">${mod}</td>
        <td>${streamBadge}</td>
        <td class="sz">${fmtSize(bytes)}</td>
        <td>
          <button class="btn-clr" onclick="clearKey('${k}')">🗑 Clear</button>
        </td>
      </tr>`;
  }).join('');
  if (!keys.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:16px;color:var(--text-muted)">No audhd-hq-* data found</td></tr>';
  }
}

async function clearKey(k) {
  if (!(await HQConfirm.ask(`Clear "${k}"? This data will be lost unless you have a backup.`))) return;
  localStorage.removeItem(k);
  const row = document.getElementById('mgr-row-' + CSS.escape(k));
  if (row) row.remove();
  showMsg('mgr-status', `🗑 Cleared: ${k}`, 'ok');
  refreshStreamStats();
  buildSelTable();
}

// ── Danger Zone ───────────────────────────────────────
async function clearFlags() {
  if (!(await HQConfirm.ask('Clear all active HQ flags? They will be re-generated on next page visit.', { danger: true, confirmLabel: 'Clear' }))) return;
  localStorage.removeItem(HQKeys.FLAGS);
  showMsg('danger-status', '🚩 Flags cleared.', 'ok');
  buildMgrTable(); buildSelTable(); refreshStreamStats();
}

async function clearCheckinLog() {
  if (!(await HQConfirm.ask('Clear entire check-in log? This cannot be undone.', { danger: true, confirmLabel: 'Clear Log' }))) return;
  localStorage.removeItem(HQKeys.CHECKIN_LOG);
  localStorage.removeItem(HQKeys.CHECKIN);
  showMsg('danger-status', '✅ Check-in log cleared.', 'ok');
  buildMgrTable(); buildSelTable(); refreshStreamStats();
}

async function clearAllHQ() {
  if (!(await HQConfirm.ask('⚠️ WIPE ALL audhd-hq-* data? This permanently deletes ALL HQ data. Make a backup first!', { danger: true, confirmLabel: 'Wipe Everything' }))) return;
  if (!(await HQConfirm.ask('Are you absolutely sure? This cannot be undone.', { danger: true, confirmLabel: 'Yes, Wipe It' }))) return;
  const n = getAllHQKeys().length;
  getAllHQKeys().forEach(k => localStorage.removeItem(k));
  showMsg('danger-status', `💥 Wiped ${n} keys. All HQ data cleared.`, 'info');
  buildMgrTable(); buildSelTable(); refreshStreamStats();
}

// ── PWA / Service Worker ──────────────────────────────
function checkSW() {
  const el = document.getElementById('pwa-info');
  if (!('serviceWorker' in navigator)) {
    showMsg('sw-status', '❌ Service workers not supported in this browser.', 'err'); return;
  }
  navigator.serviceWorker.getRegistrations().then(regs => {
    if (!regs.length) {
      showMsg('sw-status', '⚠️ No service worker registered. Go to index.html to install.', 'info');
      return;
    }
    const reg = regs[0];
    const state = reg.active ? 'active' : reg.waiting ? 'waiting' : reg.installing ? 'installing' : 'unknown';
    showMsg('sw-status', `✅ SW registered. State: ${state}. Scope: ${reg.scope}`, 'ok');
  });
  if (el) {
    el.innerHTML = navigator.onLine
      ? '🌐 Online — cache-first strategy active. New file changes may require a force-update.'
      : '📴 Offline — serving from cache.';
  }
}

function updateSW() {
  if (!('serviceWorker' in navigator)) { showMsg('sw-status', 'SW not supported.', 'err'); return; }
  navigator.serviceWorker.getRegistrations().then(regs => {
    if (!regs.length) { showMsg('sw-status', 'No SW registered.', 'err'); return; }
    regs[0].update().then(() => {
      showMsg('sw-status', '🔄 SW update requested. Reload to apply.', 'ok');
    });
  });
}

async function unregisterSW() {
  if (!(await HQConfirm.ask('Unregister service worker? App will require network until re-installed.', { danger: true, confirmLabel: 'Unregister' }))) return;
  navigator.serviceWorker.getRegistrations().then(regs => {
    Promise.all(regs.map(r => r.unregister())).then(() => {
      showMsg('sw-status', '🗑 SW unregistered. Reload to re-install from index.html.', 'info');
    });
  });
}

// ── Provider Export ───────────────────────────────────
var _dsDays = 14;
function setDSRange(days, btn) {
  _dsDays = days;
  document.querySelectorAll('.ds-range-btn').forEach(b => b.classList.toggle('on', b.dataset.days == days));
}

function generateDSProviderReport(mode) {
  var statusEl = document.getElementById('ds-provider-status');
  var notes    = (document.getElementById('ds-notes').value || '').trim();
  var mental   = document.getElementById('ds-mental').checked;
  var physical = document.getElementById('ds-physical').checked;
  var clinical = document.getElementById('ds-clinical').checked;
  var success  = document.getElementById('ds-success').checked;
  var today    = new Date().toISOString().split('T')[0];
  var cutoff   = new Date(); cutoff.setDate(cutoff.getDate() - _dsDays);
  var cutoffStr = cutoff.toISOString().split('T')[0];
  var rangeLabel = _dsDays === 14 ? 'Last 2 weeks' : _dsDays === 30 ? 'Last month' : 'Last 3 months';

  function inRange(d) { return d >= cutoffStr && d <= today; }
  function ld2(key, def) { try { var r = localStorage.getItem(key); return r ? JSON.parse(r) : def; } catch(e) { return def; } }

  var lines = [
    '═══════════════════════════════════════════════════════',
    '  PATIENT-REPORTED DATA SUMMARY',
    '  AuDHD HQ — ' + rangeLabel + ' (' + cutoffStr + ' → ' + today + ')',
    '  Generated: ' + new Date().toLocaleDateString('en-US', {year:'numeric', month:'long', day:'numeric'}),
    '═══════════════════════════════════════════════════════',
    '',
  ];

  if (mental) {
    var cis = ld2(HQKeys.CHECKIN_LOG, []).filter(c => inRange(c.date || (c.at || '').split('T')[0]));
    var moods = cis.filter(c => c.mood).map(c => c.mood);
    var engs  = cis.filter(c => c.energy).map(c => c.energy);
    var anxs  = cis.filter(c => c.anxiety).map(c => c.anxiety);
    lines.push('🧠 MENTAL / EMOTIONAL');
    lines.push('──────────────────────────────────────────────');
    if (moods.length) lines.push('  Avg mood: ' + (moods.reduce((a,b)=>a+b,0)/moods.length).toFixed(1) + '/5 (' + moods.length + ' check-ins)');
    if (engs.length)  lines.push('  Avg energy: ' + (engs.reduce((a,b)=>a+b,0)/engs.length).toFixed(1) + '/5');
    if (anxs.length)  lines.push('  Avg anxiety: ' + (anxs.reduce((a,b)=>a+b,0)/anxs.length).toFixed(1) + '/5');
    var crashes = cis.filter(c => (c.bodyTags||[]).some(t=>t.toLowerCase().includes('shutdown')) || (c.energy||0) <= 1).length;
    lines.push('  Crash/shutdown days: ' + crashes);
    lines.push('');
  }

  if (physical) {
    var hd = ld2(HQKeys.HEALTH, {});
    var sleepL = (hd.sleep || []).filter(s => inRange(s.date || ''));
    var haL    = (hd.headaches || []).filter(h => inRange(h.date || ''));
    lines.push('🏥 PHYSICAL');
    lines.push('──────────────────────────────────────────────');
    if (sleepL.length) lines.push('  Avg sleep: ' + (sleepL.reduce((a,s)=>a+(s.hours||0),0)/sleepL.length).toFixed(1) + 'h / ' + (sleepL.reduce((a,s)=>a+(s.quality||0),0)/sleepL.length).toFixed(1) + '/5 quality (' + sleepL.length + ' nights)');
    lines.push('  Headaches: ' + haL.length + (haL.length ? (' — avg intensity ' + (haL.reduce((a,h)=>a+(h.intensity||0),0)/haL.length).toFixed(1) + '/10') : ''));
    lines.push('');
  }

  if (clinical) {
    var meds = ld2(HQKeys.MEDS, []);
    lines.push('💊 CLINICAL');
    lines.push('──────────────────────────────────────────────');
    if (meds.length) lines.push('  Medications: ' + meds.map(m => m.name + (m.dose ? ' ' + m.dose : '')).join(', '));
    lines.push('');
  }

  if (success) {
    var metr = ld2(HQKeys.METRICS, {});
    var mKeys = Object.keys(metr.snapshots || {}).sort().slice(-(_dsDays <= 14 ? 2 : _dsDays <= 30 ? 4 : 12));
    var mSnaps = mKeys.map(k => (metr.snapshots[k] || {}).calc || {});
    function mAvg(f) { var v = mSnaps.map(s=>s[f]).filter(v=>v!=null); return v.length ? v.reduce((a,b)=>a+b,0)/v.length : null; }
    lines.push('📊 FUNCTIONING');
    lines.push('──────────────────────────────────────────────');
    var sc=mAvg('score'), tc=mAvg('taskCompletion'), hb=mAvg('habitRate');
    if (sc != null) lines.push('  Avg weekly score: ' + sc.toFixed(0) + '/100');
    if (tc != null) lines.push('  Task completion:  ' + Math.round(tc * 100) + '%');
    if (hb != null) lines.push('  Habit consistency: ' + Math.round(hb * 100) + '%');
    lines.push('');
  }

  if (notes) { lines.push('📝 NOTES'); lines.push('──────────────────────────────────────────────'); lines.push('  ' + notes.replace(/\n/g, '\n  ')); lines.push(''); }

  lines.push('  AuDHD HQ · All data stored locally on patient device only.');
  lines.push('═══════════════════════════════════════════════════════');
  var text = lines.join('\n');

  if (mode === 'copy') {
    navigator.clipboard.writeText(text).then(() => {
      if (statusEl) { statusEl.textContent = '✅ Copied to clipboard!'; statusEl.style.color = 'var(--success)'; }
    }).catch(() => { if (statusEl) statusEl.textContent = 'Select text above manually.'; });
  } else {
    var w = window.open('', '_blank');
    if (w) {
      w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Provider Report</title></head><body><pre>' + text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</pre></body></html>');
      w.document.close(); setTimeout(() => w.print(), 400);
    }
  }
}

// ── Init ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  buildSelTable();
  buildMgrTable();
  refreshStreamStats();
  syncAutoBackupToggles();
  checkSW();
  initAutoBackupListeners();
});
