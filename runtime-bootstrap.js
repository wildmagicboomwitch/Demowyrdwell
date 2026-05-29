/**
 * runtime-bootstrap.js — AuDHD HQ Startup Sequencer
 *
 * Phase 2 extraction targets (per guide):
 *   - Constants / startup config       (was hq-core.js ~8–49)
 *   - buildHQConfig()                  (was hq-core.js ~78–118)
 *   - buildHQWorkday()                 (was hq-core.js ~120–165)
 *   - hqSetTheme / hqSetMode / hqSetGreeting  (was hq-core.js ~167–212)
 *   - Navigation bootstrapping hook    (remains in hq-core.js for now;
 *                                       will move to /ui/navigation/ later)
 *
 * This file does NOT rewrite any of those functions.
 * It HOSTS the authoritative copies going forward.
 * hq-core.js now delegates to these implementations.
 *
 * Loading order:
 *   hq-store.js → runtime-state.js → runtime-events.js
 *   → runtime-bootstrap.js → hq-core.js → (feature pages)
 */

(function () {
  'use strict';

  // ── Guard: require runtime-state ─────────────────────────────────────────
  function _waitForState(fn) {
    if (window.HQState) { fn(); return; }
    window.addEventListener('hq-state-ready', fn, { once: true });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 1. CONSTANTS
  //    Extracted from hq-core.js section 1.
  //    hq-core.js reads window.HQConstants so it no longer redeclares these.
  // ══════════════════════════════════════════════════════════════════════════

  const HQConstants = {
    THEME_KEY        : HQKeys.THEME,
    FLAG_KEY         : HQKeys.FLAGS,
    CHECKIN_KEY      : HQKeys.CHECKIN_LOG,
    HEALTH_KEY       : HQKeys.HEALTH,
    ENERGY_KEY       : HQKeys.ENERGY_STATE,
    REMINDER_KEY     : HQKeys.REMINDER_CONFIG,
    PROFILE_KEY      : HQKeys.PROFILE,
    THEME_SCHED_KEY  : HQKeys.THEME_SCHEDULE,
    INDEX_LAYOUT_KEY : HQKeys.INDEX_LAYOUT,
    TAGS_KEY         : HQKeys.TAGS,
    MONTHLY_KEY      : HQKeys.MONTHLY,
    WEEKLY_KEY       : HQKeys.WEEKLY,

    VALID_THEMES : [
      // ── HQ Originals ──
      'lilac', 'harbor', 'ember', 'volt',
      // ── WyrdWell: Fated Palettes ──
      'seidr', 'muspell', 'blod-rune', 'yggdrasil', 'holt',
      'freyja', 'bifrost', 'urdarbr', 'ginnungagap', 'var', 'njordr',
    ],
    VALID_MODES  : ['dark', 'light'],

    THEMES: {
      // ── HQ Originals ──
      lilac:       { label: 'Lilac',       emoji: '🌸', badge: '🌸 Lilac',       group: 'HQ Originals' },
      harbor:      { label: 'Harbor',      emoji: '🌅', badge: '🌅 Harbor',      group: 'HQ Originals' },
      ember:       { label: 'Ember',       emoji: '🍂', badge: '🍂 Ember',       group: 'HQ Originals' },
      volt:        { label: 'Volt',        emoji: '⚡', badge: '⚡ Volt',        group: 'HQ Originals' },
      // ── WyrdWell: Fated Palettes ──
      seidr:       { label: 'Seiðr',       emoji: '🔮', badge: '🔮 Seiðr',       group: 'WyrdWell' },
      muspell:     { label: 'Múspell',     emoji: '🔥', badge: '🔥 Múspell',     group: 'WyrdWell' },
      'blod-rune': { label: 'Blóð-Rune',  emoji: '🩸', badge: '🩸 Blóð-Rune',  group: 'WyrdWell' },
      yggdrasil:   { label: 'Yggdrasil',   emoji: '🌳', badge: '🌳 Yggdrasil',   group: 'WyrdWell' },
      holt:        { label: 'Holt',        emoji: '🌲', badge: '🌲 Holt',        group: 'WyrdWell' },
      freyja:      { label: 'Freyja',      emoji: '⚔️', badge: '⚔️ Freyja',      group: 'WyrdWell' },
      bifrost:     { label: 'Bifröst',     emoji: '🌈', badge: '🌈 Bifröst',     group: 'WyrdWell' },
      urdarbr:     { label: 'Urðarbrunnr', emoji: '🌀', badge: '🌀 Urðarbrunnr', group: 'WyrdWell' },
      ginnungagap: { label: 'Ginnungagap', emoji: '🌑', badge: '🌑 Ginnungagap', group: 'WyrdWell' },
      'var':       { label: 'Vár',         emoji: '🌷', badge: '🌷 Vár',         group: 'WyrdWell' },
      njordr:      { label: 'Njörðr',      emoji: '🌊', badge: '🌊 Njörðr',      group: 'WyrdWell' },
    },

    DEFAULT_REMINDER_WINDOWS: [
      { id: 'morning', start:  6, end:  9, label: 'Morning Check-In'  },
      { id: 'midday',  start: 12, end: 15, label: 'Midday Check-In'   },
      { id: 'evening', start: 18, end: 21, label: 'Evening Check-In'  },
      { id: 'eod',     start: 22, end: 24, label: 'End of Day Log'    }
    ],

    // Derived from HQStore.BEHAVIORS (IDs only) — HQStore is the source of truth.
    get BEHAVIORS() {
      return window.HQStore
        ? window.HQStore.BEHAVIORS.map(b => b.id)
        : ['surface-index', 'surface-checkin', 'energy-gate', 'block-cascade',
           'auto-defer', 'notify-save', 'cascade-signal', 'pin-daybuilder',
           'weekly-review', 'survival-safe'];
    }
  };

  window.HQConstants = HQConstants;

  // ══════════════════════════════════════════════════════════════════════════
  // 2. CONFIG INITIALIZATION
  //    Extracted from hq-core.js ~78–118.
  //    Returns window.HQConfig — reads all config keys through HQState.
  // ══════════════════════════════════════════════════════════════════════════

  function buildHQConfig() {
    const S = window.HQState;

    const profile        = S.get(HQConstants.PROFILE_KEY,      {});
    const themeSchedule  = S.get(HQConstants.THEME_SCHED_KEY,  { morningHour: 5, afternoonHour: 12, nightHour: 19 });
    const indexLayout    = S.get(HQConstants.INDEX_LAYOUT_KEY, { heroShortcuts: [], quickActions: [] });
    const reminderConfig = S.get(HQConstants.REMINDER_KEY,     {});
    const tags           = S.get(HQConstants.TAGS_KEY,          { categories: [], flags: {}, customFlags: [] });
    const energyState    = S.get(HQConstants.ENERGY_KEY,        { level: null, ts: null });
    const moduleSettings = S.get(HQKeys.MODULE_SETTINGS,   { enabled: {}, order: {} });
    const displayPrefs   = S.get(HQKeys.DISPLAY_PREFS,     { reduceMotion: false, highContrast: false, density: 'comfortable' });
    const shortcuts      = S.get(HQKeys.SHORTCUTS,         []);
    const bottomNavSlots = S.get(HQKeys.BOTTOM_NAV_SLOTS,  []);
    const checkinPresets = S.get(HQKeys.CHECKIN_PRESETS,   {});
    const checkinVis     = S.get(HQKeys.CHECKIN_VISIBILITY,{});
    const theme          = S.get(HQConstants.THEME_KEY,        { theme: null, manual: false });

    window.HQConfig = {
      // raw config objects
      profile, themeSchedule, indexLayout, reminderConfig, tags, energyState,
      moduleSettings, displayPrefs, shortcuts, bottomNavSlots, checkinPresets, checkinVis, theme,

      // convenience accessors
      name         : profile.name         || null,
      walkingGoal  : profile.walkingGoal  || 120,
      walkingUnit  : profile.walkingUnit  || 'mi',
      density      : displayPrefs.density || profile.density || 'comfortable',
      reduceMotion : !!displayPrefs.reduceMotion,
      highContrast : !!displayPrefs.highContrast,

      // tag / flag helpers — delegates to HQStore (already loaded)
      categories   : (tags.categories || []),
      flags        : (tags.flags      || {}),

      // refresh() — call after any config save to rebuild and notify pages
      refresh() {
        buildHQConfig();
        if (window.HQBus) {
          window.HQBus?.emit('config:updated', { ts: Date.now() }); // FIX-09: guarded
        } else {
          window.dispatchEvent(new CustomEvent('hq-config-updated', { detail: { ts: Date.now() } }));
        }
      },
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 3. WORKDAY HELPERS
  //    Extracted from hq-core.js ~120–165.
  // ══════════════════════════════════════════════════════════════════════════

  function buildHQWorkday() {
    const S = window.HQState;

    function toDateStr(d) {
      if (typeof d === 'string') return d;
      const date = d || new Date();
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    function getMonthlyDay(dateStr) {
      const monthly = S.get(HQConstants.MONTHLY_KEY, {});
      return (monthly.days && monthly.days[dateStr]) || null;
    }

    function getWeeklyDay(dateStr) {
      const weekly = S.get(HQConstants.WEEKLY_KEY, []);
      if (!Array.isArray(weekly)) return null;
      for (const week of weekly) {
        if (week.days && week.days[dateStr]) return week.days[dateStr];
      }
      return null;
    }

    window.HQWorkday = {
      isWorkday(date) {
        const ds = toDateStr(date);
        const weekly = getWeeklyDay(ds);
        if (weekly) {
          if (weekly.dayOff) return false;
          if (weekly.workdayOverride) return true;
        }
        const monthly = getMonthlyDay(ds);
        return monthly ? (monthly.isWorkday === true) : false;
      },
      getShiftStart(date) {
        const ds = toDateStr(date);
        const weekly = getWeeklyDay(ds);
        return (weekly && weekly.shiftStart) || (getMonthlyDay(ds) && getMonthlyDay(ds).shiftStart) || null;
      },
      getShiftEnd(date) {
        const ds = toDateStr(date);
        const weekly = getWeeklyDay(ds);
        return (weekly && weekly.shiftEnd) || (getMonthlyDay(ds) && getMonthlyDay(ds).shiftEnd) || null;
      },
      isToday: (date) => toDateStr(date) === toDateStr(new Date()),
      toDateStr,
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 4. THEME + GREETING
  //    Extracted from hq-core.js ~167–212.
  //    hq-core.js forwards calls here via window.HQBootstrap.
  // ══════════════════════════════════════════════════════════════════════════

  function hqSetTheme(theme, manual, mode) {
    if (manual === undefined) manual = false;
    const C = HQConstants;
    if (!C.VALID_THEMES.includes(theme)) return;
    const S = window.HQState;
    const stored = S.get(C.THEME_KEY, {});
    const _mode = mode || (stored && stored.mode) || 'dark';
    const safeMode = C.VALID_MODES.includes(_mode) ? _mode : 'dark';

    S.set(C.THEME_KEY, { theme, mode: safeMode, manual });

    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-mode', safeMode);
    const wrap = document.getElementById('appWrap');
    if (wrap) { wrap.setAttribute('data-theme', theme); wrap.setAttribute('data-mode', safeMode); }

    hqSetGreeting();

    // Emit via HQBus channel first (runtime-events bridges to window event)
    if (window.HQBus) {
      window.HQBus?.emit('theme:changed', { theme, mode: safeMode }); // FIX-09: guarded
    } else {
      window.dispatchEvent(new CustomEvent('hq-theme-change', { detail: { theme, mode: safeMode } }));
    }
  }

  function hqSetMode(mode, manual) {
    if (manual === undefined) manual = true;
    if (!HQConstants.VALID_MODES.includes(mode)) return;
    const stored = window.HQState.get(HQConstants.THEME_KEY, {});
    const _theme = (stored && stored.theme) || 'lilac';
    hqSetTheme(_theme, manual, mode);
  }

  function hqSetGreeting() {
    const name = (window.HQConfig && window.HQConfig.name) || '';
    const nameEl = document.getElementById('greetingName');
    if (nameEl) nameEl.textContent = name;

    const _mins = new Date().getHours() * 60 + new Date().getMinutes();
    let word, emoji;
    if      (_mins >= 240 && _mins < 690)  { word = 'morning';   emoji = '☀️'; }
    else if (_mins >= 690 && _mins < 990)  { word = 'afternoon'; emoji = '🌦️'; }
    else if (_mins >= 990 && _mins < 1170) { word = 'evening';   emoji = '🌆'; }
    else                                   { word = 'night';     emoji = '🌙'; }

    const greetEl = document.getElementById('greetingWord');
    if (greetEl) greetEl.textContent = word;
    const emojiEl = document.getElementById('greetingEmoji');
    if (emojiEl) emojiEl.textContent = emoji;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 5. PUBLIC BOOTSTRAP NAMESPACE
  // ══════════════════════════════════════════════════════════════════════════

  window.HQBootstrap = {
    buildHQConfig,
    buildHQWorkday,
    hqSetTheme,
    hqSetMode,
    hqSetGreeting,
    HQConstants,

    /** Run all startup tasks in the correct order. Called once per page. */
    init() {
      buildHQConfig();
      buildHQWorkday();
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 6. AUTO-INIT
  //    Run once HQState is available (which means HQStore is already loaded).
  // ══════════════════════════════════════════════════════════════════════════

  _waitForState(function () {
    window.HQBootstrap.init();
    window.dispatchEvent(new CustomEvent('hq-bootstrap-ready'));
  });

})();
