/* global HQStore, HQBus, HQNotif */
/**
 * hq-core.js — AuDHD HQ Shared Shell v3 (Fixed & Organized)
 */
(function () {
  'use strict';

  // ═══════════════════════════════════════════════════════════════
  // 1. CONSTANTS
  // ═══════════════════════════════════════════════════════════════
  const HQ = {
    THEME_KEY        : HQKeys.THEME,
    FLAG_KEY         : HQKeys.FLAGS,
    CHECKIN_KEY      : HQKeys.CHECKIN_LOG,
    HEALTH_KEY       : HQKeys.HEALTH,
    ENERGY_KEY       : HQKeys.ENERGY_STATE, // [ENERGY-SUSPENDED]
    REMINDER_KEY     : HQKeys.REMINDER_CONFIG,
    PROFILE_KEY      : HQKeys.PROFILE,
    INDEX_LAYOUT_KEY : HQKeys.INDEX_LAYOUT,
    TAGS_KEY         : HQKeys.TAGS,
    MONTHLY_KEY      : HQKeys.MONTHLY,
    WEEKLY_KEY       : HQKeys.WEEKLY,

    VALID_THEMES: [
      // ── HQ Originals ──
      'lilac', 'harbor', 'ember', 'volt',
      // ── WyrdWell: Fated Palettes ──
      'seidr', 'muspell', 'blod-rune', 'yggdrasil', 'holt',
      'freyja', 'bifrost', 'urdarbr', 'ginnungagap', 'var', 'njordr',
    ],
    VALID_MODES: ['dark', 'light'],
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
      { id: 'morning',   start:  6, end:  9, label: 'Morning Check-In'  },
      { id: 'midday',    start: 12, end: 15, label: 'Midday Check-In'   },
      { id: 'evening',   start: 18, end: 21, label: 'Evening Check-In'  },
      { id: 'eod',       start: 22, end: 24, label: 'End of Day Log'    }
    ],

    // P12: Derived from HQStore.BEHAVIORS (IDs only) — HQStore is the source of truth.
    // HQStore loads before hq-core.js so window.HQStore is always available here.
    BEHAVIORS: window.HQStore
      ? window.HQStore.BEHAVIORS.map(b => b.id)
      : ['surface-index', 'surface-checkin', 'energy-gate', 'block-cascade',
         'auto-defer', 'notify-save', 'cascade-signal', 'pin-daybuilder',
         'weekly-review', 'survival-safe']
  };

  // ═══════════════════════════════════════════════════════════════
  // 2. SAFE localStorage HELPERS
  // ═══════════════════════════════════════════════════════════════

  // Stage 2: all persistence routes through HQState (runtime-state.js gateway).
  // Falls back to HQStore, then bare localStorage — zero regression risk.
  function hqGet(key, fallback = null) {
    if (window.HQState) return window.HQState.get(key, fallback);
    if (window.HQStore) return window.HQStore.get(key, fallback);
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch(e) { return fallback; }
  }

  function hqSet(key, value) {
    if (window.HQState) return window.HQState.set(key, value);
    if (window.HQStore) return window.HQStore.set(key, value);
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch(e) {
      console.warn('[hq-core] hqSet failed:', key, e);
      return false;
    }
  }

  function hqRemove(key) {
    if (window.HQState)  { window.HQState.remove(key); return; }
    if (window.HQStore)  { window.HQStore.remove(key); return; }
    try { localStorage.removeItem(key); } catch(e) {}
  }

  // ═══════════════════════════════════════════════════════════════
  // 3. CONFIG & WORKDAY RESOLUTION
  // ═══════════════════════════════════════════════════════════════

  function buildHQConfig() {
    // Stage 2: delegate to runtime-bootstrap.js if loaded
    if (window.HQBootstrap) { window.HQBootstrap.buildHQConfig(); return; }
    const profile        = hqGet(HQ.PROFILE_KEY,       {});
    const indexLayout    = hqGet(HQ.INDEX_LAYOUT_KEY,  { heroShortcuts: [], quickActions: [] });
    const reminderConfig = hqGet(HQ.REMINDER_KEY,      {});
    const tags           = hqGet(HQ.TAGS_KEY,           { categories: [], flags: {}, customFlags: [] });
    const energyState    = hqGet(HQ.ENERGY_KEY,         { level: null, ts: null }); // [ENERGY-SUSPENDED]
    // P3: all config keys now included at build time
    const moduleSettings  = hqGet(HQKeys.MODULE_SETTINGS,  { enabled: {}, order: {} });
    const displayPrefs    = hqGet(HQKeys.DISPLAY_PREFS,    { reduceMotion: false, highContrast: false, density: 'comfortable' });
    const shortcuts       = hqGet(HQKeys.SHORTCUTS,        []);
    const bottomNavSlots  = hqGet(HQKeys.BOTTOM_NAV_SLOTS, []);
    const checkinPresets  = hqGet(HQKeys.CHECKIN_PRESETS,  {});
    const checkinVis      = hqGet(HQKeys.CHECKIN_VISIBILITY, {});
    const theme           = hqGet(HQ.THEME_KEY,                { theme: null, manual: false });

    window.HQConfig = {
      // raw config objects
      profile, indexLayout, reminderConfig, tags, energyState,
      moduleSettings, displayPrefs, shortcuts, bottomNavSlots, checkinPresets, checkinVis, theme,
      // convenience accessors (avoids .profile.x everywhere)
      name         : profile.name         || null,
      walkingGoal  : profile.walkingGoal  || 120,
      walkingUnit  : profile.walkingUnit  || 'mi',
      density      : displayPrefs.density || profile.density || 'comfortable',
      reduceMotion : !!displayPrefs.reduceMotion,
      highContrast : !!displayPrefs.highContrast,
      // tag/flag helpers — delegates to HQStore (P2) which is already loaded
      categories   : (tags.categories || []),
      flags        : (tags.flags      || {}),
      // P3: refresh() — call after any config save to rebuild and notify pages
      refresh() {
        buildHQConfig();
        window.dispatchEvent(new CustomEvent('hq-config-updated', { detail: { ts: Date.now() } }));
      },
    };
  }

  function buildHQWorkday() {
    // Stage 2: delegate to runtime-bootstrap.js if loaded
    if (window.HQBootstrap) { window.HQBootstrap.buildHQWorkday(); return; }
    function toDateStr(d) {
      if (typeof d === 'string') return d;
      const date = d || new Date();
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    function getMonthlyDay(dateStr) {
      const monthly = hqGet(HQ.MONTHLY_KEY, {});
      return (monthly.days && monthly.days[dateStr]) || null;
    }

    function getWeeklyDay(dateStr) {
      const weekly = hqGet(HQ.WEEKLY_KEY, []);
      if (!Array.isArray(weekly)) return null;
      for (const week of weekly) {
        if (week.days && week.days[dateStr]) return week.days[dateStr];
      }
      return null;
    }

    window.HQWorkday = {
      isWorkday: function(date) {
        const ds = toDateStr(date);
        const weekly = getWeeklyDay(ds);
        if (weekly) {
          if (weekly.dayOff) return false;
          if (weekly.workdayOverride) return true;
        }
        const monthly = getMonthlyDay(ds);
        return monthly ? (monthly.isWorkday === true) : false;
      },
      getShiftStart: function(date) {
        const ds = toDateStr(date);
        const weekly = getWeeklyDay(ds);
        return (weekly && weekly.shiftStart) || (getMonthlyDay(ds) && getMonthlyDay(ds).shiftStart) || null;
      },
      getShiftEnd: function(date) {
        const ds = toDateStr(date);
        const weekly = getWeeklyDay(ds);
        return (weekly && weekly.shiftEnd) || (getMonthlyDay(ds) && getMonthlyDay(ds).shiftEnd) || null;
      },
      isToday: (date) => toDateStr(date) === toDateStr(new Date()),
      toDateStr
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 4. THEME & GREETING
  // ═══════════════════════════════════════════════════════════════

  function hqSetTheme(theme, manual, mode) {
    // Stage 2: delegate to runtime-bootstrap.js if loaded
    if (window.HQBootstrap) { window.HQBootstrap.hqSetTheme(theme, manual, mode); return; }
    if (manual === undefined) manual = false;
    if (!HQ.VALID_THEMES.includes(theme)) return;
    // Resolve mode: use passed mode, fall back to stored, fall back to 'dark'
    var _stored = hqGet(HQ.THEME_KEY, {});
    var _mode = mode || (_stored && _stored.mode) || 'dark';
    if (!HQ.VALID_MODES.includes(_mode)) _mode = 'dark';
    hqSet(HQ.THEME_KEY, { theme: theme, mode: _mode, manual: manual });
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-mode', _mode);
    var wrap = document.getElementById('appWrap');
    if (wrap) { wrap.setAttribute('data-theme', theme); wrap.setAttribute('data-mode', _mode); }
    hqSetGreeting();
    window.dispatchEvent(new CustomEvent('hq-theme-change', { detail: { theme: theme, mode: _mode } }));
  }

  function hqSetMode(mode, manual) {
    // Stage 2: delegate to runtime-bootstrap.js if loaded
    if (window.HQBootstrap) { window.HQBootstrap.hqSetMode(mode, manual); return; }
    if (manual === undefined) manual = true;
    if (!HQ.VALID_MODES.includes(mode)) return;
    var _stored = hqGet(HQ.THEME_KEY, {});
    var _theme = (_stored && _stored.theme) || 'lilac';
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

  // ═══════════════════════════════════════════════════════════════
  // 5. FLAG & BEHAVIOR SYSTEM
  // ═══════════════════════════════════════════════════════════════

  function hqFlag(item) {
    let flags = hqGet(HQ.FLAG_KEY, []);
    flags = flags.filter(f => f.id !== item.id);
    flags.push(Object.assign({ ts: Date.now(), priority: 3 }, item));
    hqSet(HQ.FLAG_KEY, flags);
    window.dispatchEvent(new CustomEvent('hq-flags-updated'));
  }

  function hqUnflag(id) {
    let flags = hqGet(HQ.FLAG_KEY, []);
    flags = flags.filter(f => f.id !== id);
    hqSet(HQ.FLAG_KEY, flags);
    window.dispatchEvent(new CustomEvent('hq-flags-updated'));
  }

  const BEHAVIOR_HANDLERS = {
    'surface-index': (item) => hqFlag({
      id: item.id || `bh-${Date.now()}`,
      source: item.source || 'unknown',
      type: 'reminder',
      text: item.title || item.name || 'Flagged item',
      href: item.href || '#',
      priority: item.priority || 3
    }),
    'notify-save': (item, def) => hqShowToast(`🚩 ${def ? def.name : 'Flag'} applied`),
    'cascade-signal': (item) => {
      // Respect block-cascade: skip propagation if item is in blocked list
      const blocked = hqGet(HQKeys.BLOCKED_CASCADE, []);
      if (blocked.find(b => b.id === item.id)) return;
      hqSet(HQKeys.CASCADE_SIGNAL, { ts: Date.now(), source: item.source || 'flag', item });
      window.dispatchEvent(new CustomEvent('hq-cascade-signal', { detail: item }));
    },
    'energy-gate': (item) => {
      const gated = hqGet(HQKeys.ENERGY_GATED, []);
      if (!gated.find(g => g.id === item.id)) {
        gated.push({ id: item.id, source: item.source, ts: Date.now() });
        hqSet(HQKeys.ENERGY_GATED, gated);
      }
    },

    // ── P5: implemented handlers ────────────────────────────────────────────

    // surface-checkin: writes item to checkin-surface store so checkin.js
    // can surface it as a contextual prompt during the check-in flow.
    'surface-checkin': (item) => {
      const surfaced = hqGet(HQKeys.CHECKIN_SURFACE, []);
      if (!surfaced.find(s => s.id === item.id)) {
        surfaced.push({
          id: item.id || `bh-${Date.now()}`,
          source: item.source || 'unknown',
          text: item.title || item.name || 'Flagged item',
          href: item.href || '#',
          ts: Date.now()
        });
        hqSet(HQKeys.CHECKIN_SURFACE, surfaced);
        window.dispatchEvent(new CustomEvent('hq-checkin-surface-updated'));
      }
    },

    // block-cascade: prevents cascade-signal from propagating for this item.
    // Checked by cascade-signal handler and by any module that reads cascade state.
    'block-cascade': (item) => {
      const blocked = hqGet(HQKeys.BLOCKED_CASCADE, []);
      if (!blocked.find(b => b.id === item.id)) {
        blocked.push({ id: item.id, source: item.source || 'unknown', ts: Date.now() });
        hqSet(HQKeys.BLOCKED_CASCADE, blocked);
      }
    },

    // auto-defer: registers item in auto-defer queue. Day-end sweep (run by
    // index.js or a future cron-equivalent) checks this queue and bumps the
    // item's date forward by deferDays if not marked done by EOD.
    'auto-defer': (item, def) => {
      const deferDays = (def && def.deferDays) ? def.deferDays : 1;
      const queue = hqGet(HQKeys.AUTO_DEFER_QUEUE, []);
      if (!queue.find(q => q.id === item.id)) {
        queue.push({
          id: item.id,
          source: item.source || 'unknown',
          text: item.title || item.name || 'Deferred item',
          href: item.href || '#',
          deferDays,
          appliedAt: Date.now()
        });
        hqSet(HQKeys.AUTO_DEFER_QUEUE, queue);
        window.dispatchEvent(new CustomEvent('hq-auto-defer-updated'));
      }
    },

    // pin-daybuilder: writes item to daybuilder-pins store. DayBuilder reads
    // this on render and surfaces pinned items at the top of the day view
    // on the item's scheduled date (or today if no date set).
    'pin-daybuilder': (item) => {
      const pins = hqGet(HQKeys.DAYBUILDER_PINS, []);
      if (!pins.find(p => p.id === item.id)) {
        pins.push({
          id: item.id || `pin-${Date.now()}`,
          source: item.source || 'unknown',
          text: item.title || item.name || 'Pinned item',
          href: item.href || '#',
          date: item.date || new Date().toISOString().slice(0, 10),
          ts: Date.now()
        });
        hqSet(HQKeys.DAYBUILDER_PINS, pins);
        window.dispatchEvent(new CustomEvent('hq-daybuilder-pins-updated'));
      }
    },

    // weekly-review: appends item to the current ISO week's flaggedItems list
    // inside the weekly store (audhd-hq-weekly). weekly-planner.js renderReview()
    // reads flaggedItems and surfaces them in the Review tab.
    'weekly-review': (item) => {
      const _getWeekKey = () => {
        const now = new Date();
        const dt = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
        const dn = dt.getUTCDay() || 7;
        dt.setUTCDate(dt.getUTCDate() + 4 - dn);
        const ys = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
        const wn = Math.ceil((((dt - ys) / 86400000) + 1) / 7);
        return `${dt.getUTCFullYear()}-W${String(wn).padStart(2, '0')}`;
      };
      const weekKey = _getWeekKey();
      const wdb = hqGet(HQKeys.WEEKLY, {});
      if (!wdb[weekKey]) wdb[weekKey] = { inbox: [], days: {}, goals: [], notes: '', review: {}, flaggedItems: [] };
      if (!wdb[weekKey].flaggedItems) wdb[weekKey].flaggedItems = [];
      if (!wdb[weekKey].flaggedItems.find(f => f.id === item.id)) {
        wdb[weekKey].flaggedItems.push({
          id: item.id || `wr-${Date.now()}`,
          source: item.source || 'unknown',
          text: item.title || item.name || 'Review item',
          href: item.href || '#',
          ts: Date.now()
        });
        hqSet(HQKeys.WEEKLY, wdb);
        window.dispatchEvent(new CustomEvent('hq-weekly-review-updated'));
      }
    },

    // survival-safe: registers item in survival-store. Marks it as relevant
    // to Survival Mode — it will always appear on hard/crash days regardless of
    // energy gate. Full activation (surfacing in dopamine menu) happens in P16.
    'survival-safe': (item) => {
      const store = hqGet(HQKeys.SURVIVAL_STORE, { items: [] });
      if (!store.items) store.items = [];
      if (!store.items.find(s => s.id === item.id)) {
        store.items.push({
          id: item.id || `ss-${Date.now()}`,
          source: item.source || 'unknown',
          text: item.title || item.name || 'Survival item',
          href: item.href || '#',
          ts: Date.now(),
          active: false   // stub: fully activated in P16
        });
        hqSet(HQKeys.SURVIVAL_STORE, store);
      }
    }
  };

  function hqApplyFlagBehaviors(item, flagIds) {
    if (!Array.isArray(flagIds)) return;
    const tags = hqGet(HQ.TAGS_KEY, {});
    const allFlagDefs = [...(tags.flags ? Object.values(tags.flags).flat() : []), ...(tags.customFlags || [])];
    
    flagIds.forEach(fid => {
      const def = allFlagDefs.find(f => f.id === fid);
      const behaviors = def?.behaviors || [];
      behaviors.forEach(b => BEHAVIOR_HANDLERS[b]?.(item, def));
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // 6. NAV MODULE MANIFEST
  // ═══════════════════════════════════════════════════════════════

  const AUDHD_NAV_SECTIONS = [
    {
      id: 'daily', label: '🌅 DAILY',
      modules: [
        { id: 'routines',  label: 'Prepwork + Routines', emoji: '🔁', href: 'routines-prepwork.html', page: 'routines',  core: false },
        { id: 'checkin',   label: 'Check-In',            emoji: '✅', href: 'checkin.html',           page: 'checkin',   core: true  },
        { id: 'braindump', label: 'Thought Jar',          emoji: '🫙', href: 'brain-dump.html',        page: 'braindump', core: false },
      ]
    },
    {
      id: 'planning', label: '🗂 PLANNING + ORGANIZING',
      modules: [
        { type: 'subsection', label: '⏱ Time Brain Suite' },
        { id: 'timeline',    label: "Today's Timeline",  emoji: '📅', href: 'day-view.html',         page: 'timeline',    core: false, indent: true },
        { id: 'monthly',     label: 'Monthly Planner',   emoji: '🗓️', href: 'monthly-planner.html',  page: 'monthly',     core: false, indent: true },
        { id: 'weekly',      label: 'Weekly Planner',    emoji: '📆', href: 'weekly-planner.html',   page: 'weekly',      core: false, indent: true },
        { id: 'daybuilder',  label: 'Day Builder',        emoji: '🗓',  href: 'day-view.html#plan',    page: 'daybuilder',  core: false, indent: true },
        { id: 'recurring',   label: 'Recurring Events',  emoji: '🔁', href: 'recurring-events.html', page: 'recurring',   core: false, indent: true },
        { id: 'taskboard',   label: 'Taskboards',        emoji: '📋', href: 'taskboard.html',        page: 'taskboard',   core: true  },
        { id: 'idea-studio', label: 'Idea Studio',       emoji: '💡', href: 'idea-studio.html',      page: 'idea-studio', core: false },
      ]
    },
    {
      id: 'brains', label: '🧠 CORE BRAINS',
      modules: [
        { id: 'money',        label: 'Money Brain',      emoji: '💰', href: 'money-brain.html',    page: 'money',        core: false },
        { id: 'kitchen',      label: 'Kitchen Brain',    emoji: '🍳', href: 'kitchen-brain.html',  page: 'kitchen',      core: false },
        { id: 'life-admin',   label: 'Life Admin Brain', emoji: '📑', href: 'life-admin.html',     page: 'life-admin',   core: false },
        { id: 'projects',     label: 'Project Brain',    emoji: '🗂',  href: 'project-brain.html',  page: 'projects',     core: false },
        { id: 'social-brain', label: 'Social Brain',     emoji: '💬', href: 'social-brain.html',   page: 'social-brain', core: false },
      ]
    },
    {
      id: 'wellness', label: '❤️ HEALTH + WELLNESS',
      modules: [
        { id: 'walking',  label: 'Walking Tracker',   emoji: '👟', href: 'walking-tracker.html',   page: 'walking',  core: false },
        { id: 'health',   label: 'Health Tracker',    emoji: '🩺', href: 'health-tracker.html',    page: 'health',   core: false },
        { id: 'dream',    label: 'Dream Journal',     emoji: '💭', href: 'dream-journal.html',     page: 'dream',    core: false },
        { id: 'firebird', label: 'Firebird Protocol', emoji: '🔥', href: 'firebird-protocol.html', page: 'firebird', core: false },
        { id: 'survival', label: 'Survival Mode',     emoji: '🛟', href: 'survival-mode.html',     page: 'survival', core: false },
      ]
    },
    {
      id: 'specialty', label: '⭐ SPECIALTY + DATA',
      modules: [
        { id: 'deepclean',  label: 'Deep Clean',  emoji: '🧹', href: 'deep-clean.html',     page: 'deepclean',  core: false },
        { id: 'global',     label: 'Global Data', emoji: '🌍', href: 'global-tracker.html', page: 'global',     core: false },
        { id: 'tool-vault', label: 'Tool Vault',  emoji: '🔧', href: 'tool-vault.html',     page: 'tool-vault', core: false },
        { id: 'box',        label: 'Box Tracker', emoji: '📦', href: 'box-tracker.html',    page: 'box',        core: false },
        { id: 'iconforge',  label: 'Icon Forge',  emoji: '🎨', href: 'iconforge.html',      page: 'iconforge',  core: false },
      ]
    },
    {
      id: 'settings', label: '⚙️ SETTINGS',
      modules: [
        { id: 'customize', label: 'Customize', emoji: '⚙️', href: 'customize.html', page: 'customize', core: true },
        { id: 'sync',      label: 'Data Sync', emoji: '🔄', href: 'data-sync.html', page: 'sync',      core: true },
      ]
    },
  ];
  // Expose for customize.js Modules tab and any page that needs the manifest
  window.AUDHD_NAV_SECTIONS = AUDHD_NAV_SECTIONS;

  // Mark the current page's nav items as active
  function markActive() {
    const p = window.HQ_CURRENT_PAGE || '';
    document.querySelectorAll('[data-page]').forEach(function(el) {
      el.classList.toggle('active', el.dataset.page === p);
    });
  }
  window.markActive = markActive;

  // Re-order module list by user's saved order, preserving subsection dividers
  function _applyModuleOrder(mods, orderedIds) {
    var subsections = [];
    var regular = [];
    for (var i = 0; i < mods.length; i++) {
      if (mods[i].type === 'subsection') {
        subsections.push({ idx: i, mod: mods[i] });
      } else {
        regular.push(mods[i]);
      }
    }
    regular.sort(function(a, b) {
      var ai = orderedIds.indexOf(a.id);
      var bi = orderedIds.indexOf(b.id);
      if (ai === -1) ai = 9999;
      if (bi === -1) bi = 9999;
      return ai - bi;
    });
    var result = regular.slice();
    subsections.forEach(function(s) {
      var insertAt = Math.min(s.idx, result.length);
      result.splice(insertAt, 0, s.mod);
    });
    return result;
  }

  // Re-render the sidenav in place (called by HQBus modules-updated event)
  // C1: patch-in-place instead of full teardown + re-inject
  function hqRebuildSidenav() {
    var nav = document.getElementById('hq-sidenav');
    if (!nav) {
      // First run — shell not yet injected, inject fresh
      document.body.insertAdjacentHTML('afterbegin', _buildSidenavHTML());
      markActive();
      return;
    }
    // Subsequent runs — patch visibility only; don't tear out the nav
    _patchSidenavItems(nav);
    markActive();
  }
  window.hqRebuildSidenav = hqRebuildSidenav;

  // Patch sidenav item visibility without touching DOM structure
  function _patchSidenavItems(nav) {
    var settings = hqGet(HQKeys.MODULE_SETTINGS, { enabled: {}, order: {} });
    var enabled  = settings.enabled || {};
    nav.querySelectorAll('[data-module-id]').forEach(function(el) {
      el.hidden = enabled[el.dataset.moduleId] === false;
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // 7. UI BUILDERS (Sidenav, Topbar, BottomNav, Shortcuts)
  // ═══════════════════════════════════════════════════════════════

  function _buildSidenavHTML() {
    var settings = hqGet(HQKeys.MODULE_SETTINGS, { enabled: {}, order: {} });
    var enabled  = settings.enabled || {};
    var order    = settings.order   || {};

    var html = '<div class="hq-sidenav-overlay" id="hq-sidenav-overlay" onclick="hqCloseSidenav()"></div>\n' +
               '<nav class="hq-sidenav" id="hq-sidenav">\n' +
               '<div class="sn-header"><div class="sn-brand">🧠 AuDHD HQ</div>' +
               '<button class="sn-close-btn" onclick="hqCloseSidenav()">✕</button></div>\n';

    for (var si = 0; si < AUDHD_NAV_SECTIONS.length; si++) {
      var section = AUDHD_NAV_SECTIONS[si];
      var mods    = section.modules.slice();

      // Apply user's custom order for this section
      if (order[section.id] && order[section.id].length) {
        mods = _applyModuleOrder(mods, order[section.id]);
      }

      // Skip sections where no items are visible
      var hasVisible = mods.some(function(m) {
        if (m.type === 'subsection') return false;
        return m.core || enabled[m.id] !== false;
      });
      if (!hasVisible) continue;

      html += '<div class="sn-section-hd">' + section.label + '</div>\n';

      var pendingSubsection = null;
      var pendingSubsectionId = null;
      var subsectionHasVisible = false;

      for (var mi = 0; mi < mods.length; mi++) {
        var mod = mods[mi];
        if (mod.type === 'subsection') {
          // Close previous subsection wrapper if open
          if (pendingSubsection) html += '</div>\n';
          pendingSubsection = mod.label;
          pendingSubsectionId = 'tb-' + mod.label.replace(/[^a-z0-9]/gi,'').toLowerCase();
          subsectionHasVisible = false;
          var isCollapsed = localStorage.getItem('hq-nav-collapse-' + pendingSubsectionId) === '1';
          html += '<div class="sn-subsection-hd" id="snsh-' + pendingSubsectionId + '" ' +
                  'onclick="hqToggleNavSubsection(\'' + pendingSubsectionId + '\')">' +
                  '<span class="sn-arrow" id="snsa-' + pendingSubsectionId + '">' + (isCollapsed ? '▶' : '▼') + '</span>' +
                  '<span>' + pendingSubsection + '</span></div>\n';
          html += '<div id="snsb-' + pendingSubsectionId + '" style="' + (isCollapsed ? 'display:none' : '') + '">\n';
          continue;
        }
        if (!mod.core && enabled[mod.id] === false) continue;
        if (pendingSubsection) subsectionHasVisible = true;
        var cls = 'sn-item' + (mod.indent ? ' sn-indent' : '');
        // data-module-id enables C1 _patchSidenavItems() to show/hide without full rebuild
        html += '<a href="' + mod.href + '" class="' + cls + '" data-page="' + mod.page + '"' +
                (mod.core ? '' : ' data-module-id="' + mod.id + '"') + '>' +
                '<span class="sn-em">' + mod.emoji + '</span>' +
                '<span class="sn-label">' + mod.label + '</span></a>\n';
      }
      // Close any open subsection wrapper
      if (pendingSubsection) html += '</div>\n';
    }
    html += '</nav>';
    return html;
  }

  var _BOTTOM_NAV_DEFAULTS = [
    {id:'checkin',    label:'Check-In',   emoji:'✅', href:'checkin.html',      page:'checkin'},
    {id:'taskboard',  label:'Tasks',      emoji:'📋', href:'taskboard.html',    page:'taskboard'},
    {id:'daybuilder', label:'DayBuilder', emoji:'🗓', href:'day-view.html#plan', page:'daybuilder'},
  ];

  function _buildBottomNavHTML() {
    var slots;
    try {
      var raw = localStorage.getItem(HQKeys.BOTTOM_NAV_SLOTS);
      if (raw) {
        var arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length === 3) slots = arr;
      }
    } catch(e) {}
    if (!slots) slots = _BOTTOM_NAV_DEFAULTS.slice();

    // Build page→section map for data-page attributes
    function getPage(id) {
      for (var si = 0; si < AUDHD_NAV_SECTIONS.length; si++) {
        for (var mi = 0; mi < AUDHD_NAV_SECTIONS[si].modules.length; mi++) {
          if (AUDHD_NAV_SECTIONS[si].modules[mi].id === id) {
            return AUDHD_NAV_SECTIONS[si].modules[mi].page || id;
          }
        }
      }
      return id;
    }

    var html = '<nav class="hq-bottom-nav" id="hq-bottom-nav">\n';
    html += '  <a href="index.html" class="navbtn" data-page="index"><span class="navbtn-ico">🏠</span><span class="navbtn-lbl">Home</span></a>\n';
    slots.forEach(function(s) {
      var page = s.page || getPage(s.id);
      html += '  <a href="' + s.href + '" class="navbtn" data-page="' + page + '"><span class="navbtn-ico">' + s.emoji + '</span><span class="navbtn-lbl">' + s.label + '</span></a>\n';
    });
    html += '  <button class="navbtn" onclick="hqOpenSidenav()"><span class="navbtn-ico">☰</span><span class="navbtn-lbl">More</span></button>\n';
    html += '</nav>';
    return html;
  }

  function _buildTopbarHTML() {
    const cfg = window.HQ_PAGE_CONFIG || {};
    const center = cfg.centerHTML || '<span id="hq-clock" class="hdr-clock"></span>';
    return `<header class="hq-topbar">
      <div class="hdr-left">
        <button class="hdr-hamburger" onclick="hqOpenSidenav()">☰</button>
        <a href="index.html" class="hdr-home-btn">🏠</a>
      </div>
      <div class="hdr-center">${center}</div>
      <div class="hdr-btns">
        <button class="hdr-shortcuts-btn" onclick="hqToggleShortcuts()">⚡</button>
        <button class="hdr-display-btn" id="hq-display-btn" onclick="hqToggleDisplayMenu()">🖥</button>
        <a href="customize.html" class="hdr-sync-btn">⚙️</a>
      </div>
      <div class="hq-display-menu" id="hq-display-menu">
        <div class="hq-display-menu-section">View Mode</div>
        <button class="hq-dmenu-btn" data-view="mobile" onclick="hqSetView('mobile')">📱 Mobile</button>
        <button class="hq-dmenu-btn" data-view="standard" onclick="hqSetView('standard')">🖥 Standard</button>
        <button class="hq-dmenu-btn" data-view="tv" onclick="hqSetView('tv')">📺 TV Mode</button>
        <div class="hq-display-menu-sep"></div>
        <div class="hq-display-menu-section">Guides &amp; Setup</div>
        <a href="setup-wizard.html?redo=1" class="hq-dmenu-btn hq-dmenu-link">🧙 Setup Wizard</a>
        <a href="audhdhq-setup-guide.html" class="hq-dmenu-btn hq-dmenu-link">📖 Setup Guide</a>
        <a href="audhdhq-feature-guide.html" class="hq-dmenu-btn hq-dmenu-link">📋 Feature Guide</a>
      </div>
    </header>`;
  }

  function _buildShortcutsHTML() {
    const items = hqGet(HQKeys.SHORTCUTS, [
      {id:'braindump', label:'Thought Jar', emoji:'🫙', href:'brain-dump.html'},
      {id:'checkin', label:'Check-In', emoji:'✅', href:'checkin.html'}
    ]);
    let html = `<div class="hq-shortcuts-drawer" id="hq-shortcuts-drawer"><div class="hq-shortcuts-title">⚡ Shortcuts</div>`;
    items.forEach(it => {
      html += `<a href="${it.href}" class="hq-sc-btn">${it.emoji} ${it.label}</a>`;
    });
    return html + `</div>`;
  }

  // ═══════════════════════════════════════════════════════════════
  // 8. VIEW MODE & UTILS
  // ═══════════════════════════════════════════════════════════════

  function hqApplyView(mode) {
    const effective = (mode === 'auto' || !mode) ? (window.innerWidth > 1400 ? 'tv' : 'standard') : mode;
    document.documentElement.setAttribute('data-view', effective);
    
    const sn = document.getElementById('hq-sidenav');
    if (sn) {
      if (effective === 'tv') {
        sn.classList.add('open');
        sn._tvPinned = true;
      } else {
        sn._tvPinned = false;
        sn.classList.remove('open');
      }
    }
  }

  function hqShowToast(msg, dur = 2200) {
    const el = document.getElementById('hq-toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), dur);
  }


  // ═══════════════════════════════════════════════════════════════
  // 8b. ENERGY STATE  [ENERGY-SUSPENDED — restore in Phase 15]
  //    hqWriteEnergyState(level) — called by checkin and brain-dump.
  //    level: 'low' | 'medium' | 'high'
  //    Writes to audhd-hq-energy-state AND appends to audhd-hq-health.
  //    NOTE: task energy tags (cosmetic sort only) are completely separate.
  // ═══════════════════════════════════════════════════════════════

  function hqWriteEnergyState(level) { // [ENERGY-SUSPENDED]
    if (!['low', 'medium', 'high'].includes(level)) return;
    const ts = Date.now();
    const state = { level, ts };

    // Write current state (read by HQConfig + all modules for display)
    hqSet(HQ.ENERGY_KEY, state); // [ENERGY-SUSPENDED]

    // Also append to unified energy-log if HQHistory is available (LZ-compressed, IDB-archived)
    if (window.HQHistory && typeof window.HQHistory.appendEnergyEntry === 'function') {
      var levelNum = { low: 1, medium: 3, high: 5 }[level] || null;
      window.HQHistory.appendEnergyEntry({ level: levelNum, label: level, source: 'checkin' });
    }

    // Append to health log so health tracker + global tracker see it
    const health = hqGet(HQ.HEALTH_KEY, { energyLog: [] });
    if (!Array.isArray(health.energyLog)) health.energyLog = [];
    health.energyLog.push({ level, ts, source: 'checkin' });
    // Keep last 180 entries (~6 months daily)
    if (health.energyLog.length > 180) health.energyLog = health.energyLog.slice(-180);
    hqSet(HQ.HEALTH_KEY, health);

    // Refresh HQConfig so any live module reads the new value
    if (window.HQConfig) window.HQConfig.energyState = state;

    // Dispatch event so health tracker can update live if open
    window.dispatchEvent(new CustomEvent('hq-energy-updated', { detail: state })); // [ENERGY-SUSPENDED]
  }

  // ═══════════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════════
  // 8c. THEME + FLAG + SIDENAV HELPERS (backward compat exports)
  // ═══════════════════════════════════════════════════════════════
  // hqGetDefaultTheme — returns stored theme or 'lilac' as fallback
  // (replaces time-based hqGetAutoTheme; kept as alias for any external callers)
  function hqGetDefaultTheme() {
    var stored = hqGet(HQ.THEME_KEY, {});
    if (stored && stored.theme && HQ.VALID_THEMES.includes(stored.theme)) return stored.theme;
    return 'lilac';
  }
  function hqGetAutoTheme() { return hqGetDefaultTheme(); } // backward compat alias
  window.hqGetAutoTheme = hqGetAutoTheme;
  window.hqGetDefaultTheme = hqGetDefaultTheme;

    function hqGetFlags(type) {
    const flags = hqGet(HQ.FLAG_KEY, []);
    if (!Array.isArray(flags)) return [];
    return type ? flags.filter(function(f) { return f.type === type; }) : flags;
  }
  window.hqGetFlags = hqGetFlags;

    function hqToggleSidenav() {
    document.getElementById('hq-sidenav')?.classList.contains('open')
      ? hqCloseSidenav() : hqOpenSidenav();
  }
  window.hqToggleSidenav = hqToggleSidenav;

    function hqTickClock() {
    const el = document.getElementById('hq-clock');
    if (!el) return;
    const now  = new Date();
    const h    = now.getHours();
    const m    = now.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hh   = h % 12 || 12;
    const mm   = String(m).padStart(2, '0');
    el.textContent = hh + ':' + mm + ' ' + ampm;
  }
  window.hqTickClock = hqTickClock;

  function hqOpenPrintView(title, textContent) {
    var w = window.open('', '_blank');
    if (!w) { hqShowToast('Pop-up blocked — allow pop-ups for print view'); return; }
    w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + title + '</title><style>'
      + 'body{font-family:monospace;font-size:12px;line-height:1.7;max-width:780px;margin:40px auto;padding:0 24px;color:#111}'
      + 'pre{white-space:pre-wrap;word-break:break-word}'
      + '@media print{body{margin:0;padding:20px}}'
      + '</style></head><body><pre>' + textContent.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      + '</pre></body></html>');
    w.document.close();
    setTimeout(function(){ w.print(); }, 400);
  }
  window.hqOpenPrintView = hqOpenPrintView;

  // ═══════════════════════════════════════════════════════════════
  // CHECK-IN REMINDER BANNER
  // ═══════════════════════════════════════════════════════════════

  function hqGetActiveReminderWindow() {
    var windows = HQ.DEFAULT_REMINDER_WINDOWS;
    var config  = hqGet(HQ.REMINDER_KEY, {});
    if (config.checkinWindows && Array.isArray(config.checkinWindows)) {
      windows = HQ.DEFAULT_REMINDER_WINDOWS.filter(function(w) {
        return config.checkinWindows.includes(w.id);
      });
    }
    var h = new Date().getHours();
    return windows.find(function(w) { return h >= w.start && h < w.end; }) || null;
  }
  window.hqGetActiveReminderWindow = hqGetActiveReminderWindow;

  function hqUpdateReminderBanner() {
    // Don't show on the check-in page itself
    if (window.HQ_CURRENT_PAGE === 'checkin') return;

    var win    = hqGetActiveReminderWindow();
    var banner = document.getElementById('hq-reminder-banner');

    if (!win) {
      if (banner) banner.style.display = 'none';
      return;
    }

    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'hq-reminder-banner';
      // Compute bottom offset from live bottom-nav height (fallback 70px)
      var _bnav = document.getElementById('hq-bottom-nav');
      var _bnavH = (_bnav && !_bnav.hidden) ? (_bnav.offsetHeight || 60) + 10 : 10;
      Object.assign(banner.style, {
        position      : 'fixed',
        bottom        : _bnavH + 'px',
        left          : '50%',
        transform     : 'translateX(-50%)',
        background    : 'var(--purple)',
        color         : '#fff',
        borderRadius  : '22px',
        padding       : '7px 18px',
        fontSize      : '12px',
        fontWeight    : '800',
        fontFamily    : 'inherit',
        zIndex        : '400',
        cursor        : 'pointer',
        boxShadow     : '0 4px 18px rgba(0,0,0,.25)',
        animation     : 'hq-pulse 2s infinite',
        whiteSpace    : 'nowrap',
        textDecoration: 'none',
        display       : 'block',
      });
      banner.onclick = function() { window.location.href = 'checkin.html'; };
      document.body.appendChild(banner);

      if (!document.getElementById('hq-pulse-style')) {
        var s = document.createElement('style');
        s.id = 'hq-pulse-style';
        s.textContent = '@keyframes hq-pulse{0%,100%{opacity:1;transform:translateX(-50%) scale(1)}50%{opacity:.85;transform:translateX(-50%) scale(1.04)}}';
        document.head.appendChild(s);
      }
    }

    banner.style.display = 'block';
    banner.textContent = '🔔 ' + win.label + ' — open when ready';

    // Stage 4: emit so orchestrator can coordinate notification suppression
    if (window.HQBus) {
      window.HQBus.emit('reminder:window-active', { windowId: win.id, label: win.label });
    }
  }
  window.hqUpdateReminderBanner = hqUpdateReminderBanner;

  // ═══════════════════════════════════════════════════════════════
  // NUDGE SYSTEM — Browser Notification API
  // Asks permission once; fires a native notification up to 60 min
  // before a check-in window opens, at most once per 30 minutes,
  // and only if the user hasn't already checked in for that slot.
  // ═══════════════════════════════════════════════════════════════

  var NUDGE_KEY = HQKeys.NUDGE_LAST;

  function hqRequestNudgePermission() {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'default') Notification.requestPermission();
  }

  function hqFireNudge(title, body, href) {
    // Stage 4: route through Event Bus → Notification System instead of firing directly.
    // HQNotif listens for 'notification:queued' and handles delivery (service worker aware).
    // Direct Notification() call kept as fallback if HQBus/HQNotif not yet available.
    if (window.HQBus) {
      window.HQBus.emit('notification:queued', {
        title,
        body,
        url  : href || './index.html',
        tag  : 'hq-checkin-nudge',
        source: 'nudge'
      });
      return;
    }
    // Fallback: direct fire (pre-Stage 4 behaviour, zero regression)
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') return;
    try {
      var n = new Notification(title, {
        body  : body,
        icon  : './icon-192.png',
        badge : './icon-192.png',
        tag   : 'hq-checkin-nudge',
        silent: false,
      });
      n.onclick = function() { window.focus(); if (href) window.location.href = href; n.close(); };
    } catch(e) {}
  }

  function hqCheckNudge() {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'denied') return;
    if (window.HQ_CURRENT_PAGE === 'checkin') return;

    var now  = Date.now();
    var last = parseInt(localStorage.getItem(NUDGE_KEY) || '0', 10);
    if (now - last < 30 * 60 * 1000) return; // rate-limit: once per 30 min

    var windows  = HQ.DEFAULT_REMINDER_WINDOWS || [];
    var nowMins  = new Date().getHours() * 60 + new Date().getMinutes();
    var upcoming = null;

    windows.forEach(function(w) {
      var minsUntil = (w.start * 60) - nowMins;
      if (minsUntil >= 0 && minsUntil <= 60) upcoming = { win: w, minsUntil: minsUntil };
    });
    if (!upcoming) return;

    // Check if already checked in for this slot today — read through HQState gateway
    try {
      var today = new Date().toISOString().split('T')[0];
      var _checkinKey = (window.HQStore && window.HQStore.KEYS)
        ? window.HQStore.KEYS.CHECKIN_LOG
        : HQKeys.CHECKIN_LOG;
      var log = hqGet(_checkinKey, []);
      if (log.some(function(e) { return e.date === today && e.timeSlot === upcoming.win.id; })) return;
    } catch(e) {}

    var prefix = upcoming.minsUntil < 5  ? 'Thread is open now' :
                 upcoming.minsUntil < 15 ? 'Opening in ' + upcoming.minsUntil + ' min' :
                 'Opening in about ' + upcoming.minsUntil + ' min';
    hqFireNudge('🧠 AuDHD HQ — ' + upcoming.win.label, prefix + ' · Check-in thread is open', 'checkin.html');
    localStorage.setItem(NUDGE_KEY, String(now));
  }

  function hqInitNudge() {
    hqRequestNudgePermission();
    hqCheckNudge();
    if(!window._hqNudgeInterval){window._hqNudgeInterval=setInterval(hqCheckNudge, 10 * 60 * 1000);}
  }
  window.hqInitNudge = hqInitNudge;

  // 9. METRICS ENGINE
  // Storage key: audhd-hq-metrics
  // Schema: { snapshots: { "2026-W14": {...}, ... }, monthlySnapshots: { "2026-04": {...} } }
  // ═══════════════════════════════════════════════════════════════

  var METRICS_KEY         = HQKeys.METRICS;
  var WALKING_YEAR_GOAL   = 3100;   // miles in 2026
  var WALKING_YEAR        = 2026;
  var WALKING_PASS_WEEK   = 45;     // any week >= 45mi = pass regardless of target
  var WALKING_SUCCESS_WEEK = 60;    // any week >= 60mi = success
  var WALKING_PASS_MONTH  = 230;    // monthly floor (miles)
  var WALKING_JULY_AUG    = 200;    // adjusted floor for July/August

  // ── date helpers ──────────────────────────────────────────────
  function hqWeekKey(date) {
    // Returns "YYYY-Www" ISO week string
    var d = date ? new Date(date) : new Date();
    var day = d.getDay() || 7; // Mon=1 Sun=7
    d.setDate(d.getDate() + 4 - day);
    var year = d.getFullYear();
    var week = Math.ceil((((d - new Date(year, 0, 1)) / 86400000) + 1) / 7);
    return year + '-W' + String(week).padStart(2, '0');
  }

  function hqWeekStart(weekKey) {
    // Returns Monday date string for a given "YYYY-Www" key
    var parts = weekKey.split('-W');
    var year  = +parts[0], week = +parts[1];
    var jan4  = new Date(year, 0, 4);
    var dayOfWeek = jan4.getDay() || 7;
    var monday = new Date(jan4);
    monday.setDate(jan4.getDate() - (dayOfWeek - 1) + (week - 1) * 7);
    return monday.toISOString().split('T')[0];
  }

  function hqWeekEnd(weekKey) {
    var start = new Date(hqWeekStart(weekKey) + 'T00:00:00');
    start.setDate(start.getDate() + 6);
    return start.toISOString().split('T')[0];
  }

  function hqMonthKey(date) {
    var d = date ? new Date(date) : new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  // ── walking goal — fully dynamic ─────────────────────────────
  function hqWalkingTarget() {
    // Reads actual YTD walking data, calculates dynamic weekly target
    var walking = hqGet(HQKeys.WALKING, {});
    var entries = walking.entries || walking.logs || [];
    var today   = new Date();
    var yearStart = new Date(WALKING_YEAR, 0, 1);
    var yearEnd   = new Date(WALKING_YEAR + 1, 0, 1);

    // Sum YTD miles for this year
    var ytdMiles = 0;
    entries.forEach(function(e) {
      var d = new Date((e.date || e.at || '').split('T')[0] + 'T12:00:00');
      if (d.getFullYear() === WALKING_YEAR && d <= today) {
        ytdMiles += parseFloat(e.miles || e.distance || 0);
      }
    });

    // Weeks remaining (partial weeks count as full)
    var msRemaining = yearEnd - today;
    var weeksRemaining = Math.max(1, Math.ceil(msRemaining / (7 * 86400000)));

    // Miles remaining to hit goal
    var milesRemaining = Math.max(0, WALKING_YEAR_GOAL - ytdMiles);
    var weeklyTarget   = milesRemaining / weeksRemaining;

    // Monthly target — dynamic: remaining miles / remaining months
    var monthsRemaining = Math.max(1, (12 - today.getMonth()));
    var currentMonth    = today.getMonth(); // 0-indexed
    var monthlyFloor    = (currentMonth === 6 || currentMonth === 7) ? WALKING_JULY_AUG : WALKING_PASS_MONTH;
    var monthlyTarget   = milesRemaining / monthsRemaining;

    return {
      yearGoal:       WALKING_YEAR_GOAL,
      ytdMiles:       Math.round(ytdMiles * 10) / 10,
      milesRemaining: Math.round(milesRemaining * 10) / 10,
      weeksRemaining: weeksRemaining,
      weeklyTarget:   Math.round(weeklyTarget * 10) / 10,
      weeklyPass:     WALKING_PASS_WEEK,
      weeklySuccess:  WALKING_SUCCESS_WEEK,
      monthlyTarget:  Math.round(monthlyTarget * 10) / 10,
      monthlyFloor:   monthlyFloor,
      onTrack:        ytdMiles >= (WALKING_YEAR_GOAL * ((today - yearStart) / (yearEnd - yearStart))),
    };
  }
  window.hqWalkingTarget = hqWalkingTarget;

  // ── Sunday end-of-week window ─────────────────────────────────
  function hqCheckSundayWindow() {
    var now = new Date();
    var isSunday = now.getDay() === 0;
    var hour     = now.getHours();
    return isSunday && hour >= 10 && hour < 24;
  }
  window.hqCheckSundayWindow = hqCheckSundayWindow;

  // ── last day of month window ──────────────────────────────────
  function hqCheckMonthEndWindow() {
    var now       = new Date();
    var lastDay   = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    var hour      = now.getHours();
    return now.getDate() === lastDay && hour >= 10;
  }
  window.hqCheckMonthEndWindow = hqCheckMonthEndWindow;

  // ── metrics store helpers ─────────────────────────────────────
  function hqGetMetrics() {
    return hqGet(METRICS_KEY, { snapshots: {}, monthlySnapshots: {} });
  }
  window.hqGetMetrics  = hqGetMetrics;
  // Expose date-key helpers so page scripts can call them without IIFE-scope workarounds
  window.hqWeekKey   = hqWeekKey;
  window.hqMonthKey  = hqMonthKey;
  window.hqWeekStart = hqWeekStart;

  function hqSaveMetrics(m) {
    hqSet(METRICS_KEY, m);
  }

  // ── streak calculator ─────────────────────────────────────────
  function hqGetCurrentStreak(type) {
    // type: 'goodDay' | 'wakeOnTime' | 'workOnTime' | 'walkingPass' | 'walkingSuccess'
    var metrics = hqGetMetrics();
    var snaps   = metrics.snapshots;
    var keys    = Object.keys(snaps).sort().reverse(); // newest first
    var streak  = 0;
    var today   = new Date();

    for (var i = 0; i < keys.length; i++) {
      var k   = keys[i];
      var s   = snaps[k];
      var val = false;
      if (type === 'goodDay')        val = (s.calc && s.calc.goodDays >= 3);
      if (type === 'wakeOnTime')     val = (s.calc && s.calc.wakeOnTimeRate >= 0.7);
      if (type === 'workOnTime')     val = (s.calc && s.calc.workOnTimeRate >= 0.7);
      if (type === 'walkingPass')    val = (s.calc && s.calc.walkingWeekMiles >= WALKING_PASS_WEEK);
      if (type === 'walkingSuccess') val = (s.calc && s.calc.walkingWeekMiles >= WALKING_SUCCESS_WEEK);
      if (!val) break;
      streak++;
    }
    return streak;
  }
  window.hqGetCurrentStreak = hqGetCurrentStreak;

  // ── main snapshot calculator ──────────────────────────────────
  function hqComputeWeekSnapshot(weekKey) {
    if (!weekKey) weekKey = hqWeekKey();
    var weekStart = hqWeekStart(weekKey);
    var weekEnd   = hqWeekEnd(weekKey);

    // Helper: filter entries to this week
    function inWeek(dateStr) {
      return dateStr >= weekStart && dateStr <= weekEnd;
    }
    function toDate(e) {
      return (e.date || (e.at || '').split('T')[0] || '');
    }

    var calc = {};

    // ── 1. CHECK-IN RATE ──────────────────────────────────────────
    try {
      var checkins = hqGet(HQ.CHECKIN_KEY, []);
      var weekCI   = checkins.filter(function(c) { return inWeek(toDate(c)); });
      var SLOTS    = ['morning', 'midday', 'evening', 'eod'];
      var slotsDone = new Set(weekCI.map(function(c) { return c.timeSlot; })).size;
      calc.checkinRate     = slotsDone / (SLOTS.length * 7); // % of all possible slots
      calc.checkinCount    = weekCI.length;
      calc.goodDays        = weekCI.filter(function(c) { return (c.mood >= 4 || c.energy >= 4); }).length;
      calc.energyAvg       = weekCI.filter(function(c){return c.energy;}).reduce(function(a,c,_,ar){return a+c.energy/ar.length;},0) || 0;
      calc.moodAvg         = weekCI.filter(function(c){return c.mood;}).reduce(function(a,c,_,ar){return a+c.mood/ar.length;},0) || 0;
      calc.anxietyAvg      = weekCI.filter(function(c){return c.anxiety;}).reduce(function(a,c,_,ar){return a+c.anxiety/ar.length;},0) || 0;
      calc.wakeOnTimeRate  = weekCI.filter(function(c){return c.wokeOnTime;}).length / Math.max(1, weekCI.filter(function(c){return c.timeSlot==='morning';}).length);
      calc.workOnTimeRate  = weekCI.filter(function(c){return c.workOnTime;}).length / Math.max(1, weekCI.filter(function(c){return c.workDay;}).length);
      calc.crashCount      = weekCI.filter(function(c){return (c.bodyTags||[]).some(function(t){return t.toLowerCase().includes('shutdown');}) || (c.energy||0)<=1;}).length;
      // Energy variance (stability)
      var energies = weekCI.filter(function(c){return c.energy;}).map(function(c){return c.energy;});
      if (energies.length > 1) {
        var eMean = energies.reduce(function(a,b){return a+b;},0) / energies.length;
        calc.energyVariance = energies.reduce(function(a,b){return a+Math.pow(b-eMean,2);},0) / energies.length;
      } else { calc.energyVariance = 0; }
    } catch(e) {}

    // ── 2. SLEEP ─────────────────────────────────────────────────
    try {
      var health   = hqGet(HQ.HEALTH_KEY, {});
      var sleepLog = (health.sleep || []).filter(function(s){ return inWeek(s.date||''); });
      calc.sleepAvgHrs  = sleepLog.length ? sleepLog.reduce(function(a,s){return a+(s.hours||0);},0)/sleepLog.length : 0;
      calc.sleepAvgQual = sleepLog.length ? sleepLog.reduce(function(a,s){return a+(s.quality||0);},0)/sleepLog.length : 0;
      // Headaches
      var haLog = (health.headaches || []).filter(function(h){ return inWeek(h.date||''); });
      calc.headacheCount    = haLog.length;
      calc.headacheAvgInt   = haLog.length ? haLog.reduce(function(a,h){return a+(h.intensity||0);},0)/haLog.length : 0;
      // Crash/shutdown from health too (supplementary)
      calc.crashCount = (calc.crashCount||0) + (health.shutdowns||[]).filter(function(s){return inWeek(s.date||'');}).length;
    } catch(e) {}

    // ── 3. HABITS ────────────────────────────────────────────────
    try {
      var habits = hqGet(HQKeys.HABITS, []);
      var totalLogged = 0, totalExpected = 0;
      habits.forEach(function(h) {
        if (!h.log) return;
        var weekLogs = h.log.filter(function(d){ return inWeek(d); }).length;
        // Expected: depends on frequency — daily=7, weekly=1
        var expected = h.freq === 'daily' ? 7 : h.freq === '3x' ? 3 : h.freq === 'weekly' ? 1 : 7;
        totalLogged   += Math.min(weekLogs, expected);
        totalExpected += expected;
      });
      calc.habitRate = totalExpected > 0 ? totalLogged / totalExpected : null;
    } catch(e) {}

    // ── 4. TASKS ─────────────────────────────────────────────────
    try {
      var taskData = hqGet(HQKeys.TASKBOARD, { lists:{} }); // [P14-fix] use canonical KEYS.TASKBOARD
      var allTasks = [], doneTasks = 0;
      Object.values(taskData.lists || {}).forEach(function(list) {
        (list.items || []).forEach(function(item) {
          if (!inWeek(item.createdAt ? item.createdAt.split('T')[0] : '') &&
              !inWeek(item.doneAt ? item.doneAt.split('T')[0] : '')) return;
          allTasks.push(item);
          if (item.done || item.status === 'done') doneTasks++;
        });
      });
      calc.taskTotal      = allTasks.length;
      calc.taskDone       = doneTasks;
      calc.taskCompletion = allTasks.length > 0 ? doneTasks / allTasks.length : null;
    } catch(e) {}

    // ── 5. DEEP CLEAN ────────────────────────────────────────────
    try {
      var dc = hqGet(HQKeys.DEEPCLEAN, {});
      var rooms = dc.rooms || [];
      var totalDCTasks = 0, doneDCTasks = 0;
      rooms.forEach(function(r) {
        (r.tasks || []).forEach(function(t) {
          totalDCTasks++;
          if (t.done) doneDCTasks++;
        });
      });
      calc.deepCleanRate = totalDCTasks > 0 ? doneDCTasks / totalDCTasks : null;
    } catch(e) {}

    // ── 6. WALKING ───────────────────────────────────────────────
    try {
      var walkData = hqGet(HQKeys.WALKING, {});
      var walkEntries = (walkData.entries || walkData.logs || []);
      var weekMiles = walkEntries.filter(function(e){ return inWeek(toDate(e)); })
        .reduce(function(a,e){ return a + parseFloat(e.miles || e.distance || 0); }, 0);
      var target = hqWalkingTarget();
      calc.walkingWeekMiles  = Math.round(weekMiles * 10) / 10;
      calc.walkingWeekTarget = target.weeklyTarget;
      calc.walkingYtd        = target.ytdMiles;
      calc.walkingOnTrack    = target.onTrack;
      calc.walkingWeekPass   = weekMiles >= WALKING_PASS_WEEK;
      calc.walkingWeekSuccess= weekMiles >= WALKING_SUCCESS_WEEK;
    } catch(e) {}

    // ── 7. WINS ──────────────────────────────────────────────────
    try {
      var wins = hqGet(HQKeys.WINS, []);
      var bdWins = (hqGet(HQKeys.BRAINDUMP, [])||[]).filter(function(e){ return e.route==='win'; });
      calc.winsCount = wins.filter(function(w){return inWeek((w.at||w.date||'').split('T')[0]);}).length
                     + bdWins.filter(function(w){return inWeek(w.date||'');}).length;
    } catch(e) {}

    // ── 8. COMPOSITE SCORE (0-100, hidden by default) ─────────────
    try {
      var score = 0, total = 0;
      function addScore(val, weight, min, max) {
        if (val == null) return;
        var norm = Math.max(0, Math.min(1, (val - min) / (max - min)));
        score += norm * weight; total += weight;
      }
      addScore(calc.checkinRate,      15, 0, 1);
      addScore(calc.taskCompletion,   15, 0, 1);
      addScore(calc.habitRate,        10, 0, 1);
      addScore(1 - Math.min(1, (calc.energyVariance||0) / 4), 15, 0, 1); // stability: low variance = good
      addScore((calc.goodDays||0) / 7, 15, 0, 1);
      addScore(calc.sleepAvgQual,     10, 0, 5);
      addScore(Math.min(calc.winsCount||0, 10) / 10, 10, 0, 1);
      addScore(1 - Math.min(1, (calc.headacheCount||0) / 5), 10, 0, 1);
      calc.score = total > 0 ? Math.round((score / total) * 100) : null;
    } catch(e) {}

    // ── WRITE SNAPSHOT ──────────────────────────────────────────
    var metrics = hqGetMetrics();
    if (!metrics.snapshots[weekKey]) metrics.snapshots[weekKey] = {};
    metrics.snapshots[weekKey].calc = calc;
    metrics.snapshots[weekKey].weekStart = weekStart;
    metrics.snapshots[weekKey].weekEnd   = weekEnd;
    metrics.snapshots[weekKey].computed  = new Date().toISOString();

    // Trim to last 52 weeks
    var snapKeys = Object.keys(metrics.snapshots).sort();
    if (snapKeys.length > 52) {
      snapKeys.slice(0, snapKeys.length - 52).forEach(function(k){ delete metrics.snapshots[k]; });
    }
    hqSaveMetrics(metrics);
    return metrics.snapshots[weekKey];
  }
  window.hqComputeWeekSnapshot = hqComputeWeekSnapshot;
  // [M1] duplicate exports removed — all five already assigned at their definition sites above

  // ── monthly snapshot ─────────────────────────────────────────
  function hqComputeMonthSnapshot(monthKey) {
    if (!monthKey) monthKey = hqMonthKey();
    var year  = +monthKey.split('-')[0];
    var month = +monthKey.split('-')[1]; // 1-indexed
    var monthStart = year + '-' + String(month).padStart(2,'0') + '-01';
    var nextMonth  = month === 12 ? (year+1) + '-01-01' : year + '-' + String(month+1).padStart(2,'0') + '-01';
    var monthEnd   = new Date(new Date(nextMonth) - 86400000).toISOString().split('T')[0];

    function inMonth(d) { return d >= monthStart && d <= monthEnd; }
    function toDate(e)  { return (e.date || (e.at||'').split('T')[0] || ''); }

    var calc = {};

    // Aggregate weekly snapshots that fall in this month
    var metrics   = hqGetMetrics();
    var weekSnaps = Object.entries(metrics.snapshots).filter(function(kv){
      return kv[1].weekStart >= monthStart && kv[1].weekStart <= monthEnd;
    }).map(function(kv){ return kv[1].calc || {}; });

    function avgField(field) {
      var vals = weekSnaps.map(function(s){return s[field];}).filter(function(v){return v!=null;});
      return vals.length ? vals.reduce(function(a,b){return a+b;},0)/vals.length : null;
    }
    function sumField(field) {
      return weekSnaps.reduce(function(a,s){ return a + (s[field]||0); }, 0);
    }

    calc.checkinRate     = avgField('checkinRate');
    calc.taskCompletion  = avgField('taskCompletion');
    calc.habitRate       = avgField('habitRate');
    calc.energyAvg       = avgField('energyAvg');
    calc.energyVariance  = avgField('energyVariance');
    calc.moodAvg         = avgField('moodAvg');
    calc.sleepAvgHrs     = avgField('sleepAvgHrs');
    calc.sleepAvgQual    = avgField('sleepAvgQual');
    calc.headacheCount   = sumField('headacheCount');
    calc.crashCount      = sumField('crashCount');
    calc.winsCount       = sumField('winsCount');
    calc.goodDays        = sumField('goodDays');
    calc.walkingMonthMiles = sumField('walkingWeekMiles');

    // Monthly walking floor — dynamic, based on remaining goal
    var monthInt  = month - 1; // 0-indexed for Date
    var monthFloor = (monthInt === 6 || monthInt === 7) ? WALKING_JULY_AUG : WALKING_PASS_MONTH;
    var wTarget   = hqWalkingTarget();
    calc.walkingMonthTarget = wTarget.monthlyTarget;
    calc.walkingMonthFloor  = monthFloor;
    calc.walkingMonthPass   = calc.walkingMonthMiles >= monthFloor;
    calc.score = avgField('score');

    // Write
    if (!metrics.monthlySnapshots) metrics.monthlySnapshots = {};
    if (!metrics.monthlySnapshots[monthKey]) metrics.monthlySnapshots[monthKey] = {};
    metrics.monthlySnapshots[monthKey].calc      = calc;
    metrics.monthlySnapshots[monthKey].monthStart = monthStart;
    metrics.monthlySnapshots[monthKey].monthEnd   = monthEnd;
    metrics.monthlySnapshots[monthKey].computed   = new Date().toISOString();

    // Trim to 24 months
    var mKeys = Object.keys(metrics.monthlySnapshots).sort();
    if (mKeys.length > 24) {
      mKeys.slice(0, mKeys.length - 24).forEach(function(k){ delete metrics.monthlySnapshots[k]; });
    }
    hqSaveMetrics(metrics);
    return metrics.monthlySnapshots[monthKey];
  }
  window.hqComputeMonthSnapshot = hqComputeMonthSnapshot;

  // ── auto-trigger in inject() ─────────────────────────────────
  function hqAutoComputeMetrics() {
    try {
      var wk = hqWeekKey();
      var metrics = hqGetMetrics();
      // Always recompute current week on load (data may have changed)
      hqComputeWeekSnapshot(wk);
      // Compute current month
      hqComputeMonthSnapshot(hqMonthKey());
      window.dispatchEvent(new CustomEvent('hq-metrics-ready'));
    } catch(e) {}
  }
  window.hqAutoComputeMetrics = hqAutoComputeMetrics;

  // ── report generator ─────────────────────────────────────────
  function hqGenerateWeekReport(weekKey, userNotes, confidenceRatings) {
    if (!weekKey) weekKey = hqWeekKey();
    var metrics = hqGetMetrics();
    var snap    = metrics.snapshots[weekKey] || {};
    var calc    = snap.calc || {};
    var conf    = confidenceRatings || snap.confidence || {};
    var notes   = userNotes || snap.notes || '';
    var wStart  = snap.weekStart || hqWeekStart(weekKey);
    var wEnd    = snap.weekEnd   || hqWeekEnd(weekKey);

    function pct(v) { return v != null ? Math.round(v * 100) + '%' : '—'; }
    function num(v, dp) { return v != null ? (+v).toFixed(dp||1) : '—'; }

    var CONF_LABELS = {1:'1 – Very low',2:'2 – Low',3:'3 – Moderate',4:'4 – Good',5:'5 – Strong',null:'N/A'};
    var AREAS = ['work','health','home','social','finance','self','creativity'];
    var AREA_LABELS = {work:'Work',health:'Health',home:'Home',social:'Social',finance:'Finance',self:'Self-Care',creativity:'Creativity'};

    var lines = [
      '═══════════════════════════════════════════════════════',
      '  WEEKLY REVIEW — ' + weekKey.replace('W','Week '),
      '  ' + wStart + ' → ' + wEnd,
      '  AuDHD HQ · Generated ' + new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'}),
      '═══════════════════════════════════════════════════════',
      '',
      '📊 METRICS',
      '──────────────────────────────────────────────────────',
      '  Check-in rate:        ' + pct(calc.checkinRate) + '  (' + (calc.checkinCount||0) + ' check-ins)',
      '  Task completion:      ' + pct(calc.taskCompletion) + '  (' + (calc.taskDone||0) + '/' + (calc.taskTotal||0) + ' tasks)',
      '  Habit consistency:    ' + pct(calc.habitRate),
      '  Good days:            ' + (calc.goodDays||0) + ' / 7',
      '  Average mood:         ' + num(calc.moodAvg) + ' / 5',
      '  Average energy:       ' + num(calc.energyAvg) + ' / 5',
      '  Energy stability:     ' + (calc.energyVariance != null ? (calc.energyVariance < 0.5 ? 'Stable' : calc.energyVariance < 1.5 ? 'Moderate' : 'Variable') : '—'),
      '  Average sleep:        ' + num(calc.sleepAvgHrs) + ' hrs  (quality ' + num(calc.sleepAvgQual) + '/5)',
      '  Anxiety avg:          ' + num(calc.anxietyAvg) + ' / 5',
      '  Headaches:            ' + (calc.headacheCount||0),
      '  Crash / shutdowns:    ' + (calc.crashCount||0),
      '  Wins logged:          ' + (calc.winsCount||0),
      '  Walking this week:    ' + num(calc.walkingWeekMiles,1) + ' mi  (target ' + num(calc.walkingWeekTarget,1) + ' mi)',
      '  Walking YTD:          ' + num(calc.walkingYtd,1) + ' mi  (goal 3,100 mi)',
      '  Wake on time:         ' + pct(calc.wakeOnTimeRate),
      '  Work on time:         ' + pct(calc.workOnTimeRate),
      '',
    ];

    if (conf && Object.keys(conf).length) {
      lines.push('💜 CONFIDENCE BY LIFE AREA');
      lines.push('──────────────────────────────────────────────────────');
      AREAS.forEach(function(a) {
        var v = conf[a];
        if (v === 'na' || v === null || v === undefined) return;
        lines.push('  ' + (AREA_LABELS[a]||a).padEnd(14) + (CONF_LABELS[v]||v));
      });
      lines.push('');
    }

    if (snap.reflection) {
      lines.push('💬 REFLECTION');
      lines.push('──────────────────────────────────────────────────────');
      if (snap.reflection.wentWell)  { lines.push('  What worked:');       lines.push('  ' + snap.reflection.wentWell); lines.push(''); }
      if (snap.reflection.hard)      { lines.push('  What was hard:');     lines.push('  ' + snap.reflection.hard);     lines.push(''); }
      if (snap.reflection.carryFwd)  { lines.push('  Carrying forward:');  lines.push('  ' + snap.reflection.carryFwd); lines.push(''); }
      if (snap.intention) {
        if (snap.intention.focus)   { lines.push('  Focus next week:');      lines.push('  ' + snap.intention.focus);   lines.push(''); }
        if (snap.intention.oneThng) { lines.push('  One concrete thing:');   lines.push('  ' + snap.intention.oneThng); lines.push(''); }
      }
    }

    if (notes) {
      lines.push('📝 ADDITIONAL NOTES');
      lines.push('──────────────────────────────────────────────────────');
      lines.push('  ' + notes.replace(/\n/g, '\n  '));
      lines.push('');
    }

    lines.push('──────────────────────────────────────────────────────');
    lines.push('  Patterns and capacity, not productivity.');
    lines.push('═══════════════════════════════════════════════════════');

    return lines.join('\n');
  }
  window.hqGenerateWeekReport = hqGenerateWeekReport;

  // ═══════════════════════════════════════════════════════════════
  // 10. INJECTION & INITIALIZATION
  // ═══════════════════════════════════════════════════════════════

  function inject() {
    buildHQConfig();
    buildHQWorkday();

    // P3: Apply global display preferences from HQConfig (no redundant localStorage read)
    try {
      var dp = window.HQConfig.displayPrefs || {};
      document.documentElement.setAttribute('data-reduce-motion', dp.reduceMotion ? '1' : '0');
      document.documentElement.setAttribute('data-high-contrast',  dp.highContrast  ? '1' : '0');
      // P3b: Apply density class — must run on every page, not just customize.html
      var _dens = dp.density || window.HQConfig.density || 'comfortable';
      document.documentElement.classList.remove('density-compact', 'density-comfortable', 'density-accessible');
      document.documentElement.classList.add('density-' + _dens);
    } catch(e) {}

    // Inject DOM components
    document.body.insertAdjacentHTML('afterbegin', '<div id="hq-toast" class="hq-toast"></div>');
    document.body.insertAdjacentHTML('afterbegin', _buildSidenavHTML());
    document.body.insertAdjacentHTML('afterbegin', _buildTopbarHTML());
    document.body.insertAdjacentHTML('beforeend',  _buildShortcutsHTML());
    document.body.insertAdjacentHTML('beforeend',  _buildBottomNavHTML());

    // ── Setup nudge bar: shown on all pages when wizard not yet done ────────
    // Skip on the wizard page itself and on login/create-account pages
    var _skipNudgePages = ['setup-wizard', 'login', 'create-account', 'admin-setup', 'admin-invite'];
    var _isNudgePage    = _skipNudgePages.some(function(p) { return window.HQ_CURRENT_PAGE === p; });
    var _wizDone        = localStorage.getItem(HQKeys.WIZARD_DONE) === '1';
    var _nudgeDismissed = localStorage.getItem(HQKeys.NUDGE_BAR_DISMISSED) === '1';

    if (!_wizDone && !_isNudgePage && !_nudgeDismissed) {
      // Inject nudge bar CSS once
      if (!document.getElementById('hq-nudge-bar-style')) {
        var _ns = document.createElement('style');
        _ns.id  = 'hq-nudge-bar-style';
        _ns.textContent = [
          '#hq-setup-nudge{display:flex;align-items:center;justify-content:center;gap:10px',
          'padding:7px 14px;background:var(--purple,#6d5fbc);color:#fff;font-size:12px',
          'font-weight:700;font-family:inherit;position:relative;z-index:200',
          'animation:hq-nudge-pulse 2.4s ease-in-out infinite}',
          '@keyframes hq-nudge-pulse{0%,100%{opacity:1}50%{opacity:.82}}',
          '#hq-setup-nudge a{color:#fff;text-decoration:none;flex:1;text-align:center}',
          '#hq-setup-nudge a:hover{text-decoration:underline}',
          '#hq-nudge-dismiss{background:none;border:none;color:rgba(255,255,255,.75)',
          'font-size:16px;line-height:1;cursor:pointer;padding:0 2px;flex-shrink:0}',
          '#hq-nudge-dismiss:hover{color:#fff}'
        ].join(';');
        document.head.appendChild(_ns);
      }

      var _nudgeBar = document.createElement('div');
      _nudgeBar.id  = 'hq-setup-nudge';
      _nudgeBar.innerHTML =
        '<a href="setup-wizard.html">✨ First time here? Run the Setup Wizard to get started</a>' +
        '<button id="hq-nudge-dismiss" aria-label="Dismiss setup reminder" ' +
        'onclick="this.closest(\'#hq-setup-nudge\').remove();' +
        // WARN-02: key below matches HQKeys.NUDGE_BAR_DISMISSED — update both if renamed
        'localStorage.setItem(\'audhd-hq-nudge-bar-dismissed\',\'1\')">✕</button>';

      var _topbar = document.querySelector('.hq-topbar');
      if (_topbar && _topbar.parentNode) {
        _topbar.parentNode.insertBefore(_nudgeBar, _topbar.nextSibling);
      } else {
        document.body.insertAdjacentElement('afterbegin', _nudgeBar);
      }
    }

    // ── Separator and link style for display-menu guide links ──────────────
    if (!document.getElementById('hq-dmenu-ext-style')) {
      var _ds = document.createElement('style');
      _ds.id  = 'hq-dmenu-ext-style';
      _ds.textContent = [
        '.hq-display-menu-sep{height:1px;background:rgba(255,255,255,.12);margin:4px 8px}',
        '.hq-dmenu-link{text-decoration:none;display:block}'
      ].join('');
      document.head.appendChild(_ds);
    }

    // Populate date display (index hero and any page with #hq-date)
    var dateEl = document.getElementById('hq-date');
    if (dateEl) {
      dateEl.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    }

    // UI State Init
    // Apply stored theme+mode if manual, otherwise fall back to stored theme (no auto-schedule)
    var _storedTheme = hqGet(HQ.THEME_KEY, {});
    var _initTheme = (_storedTheme && _storedTheme.theme && HQ.VALID_THEMES.includes(_storedTheme.theme))
      ? _storedTheme.theme : 'lilac';
    var _initMode  = (_storedTheme && _storedTheme.mode  && HQ.VALID_MODES.includes(_storedTheme.mode))
      ? _storedTheme.mode  : 'dark';
    // Pass manual=true to preserve: don't overwrite a manually chosen theme on next page load
    hqSetTheme(_initTheme, _storedTheme.manual !== false, _initMode);
    applyEnergyContext();
    markActive();
    hqApplyView((window.HQState ? window.HQState.get(HQKeys.VIEW_MODE, 'auto') : (localStorage.getItem(HQKeys.VIEW_MODE) || 'auto')));

    // Compute metrics snapshot on every page load
    hqAutoComputeMetrics();

    // Reminder banner — check on load, then every 5 minutes
    hqUpdateReminderBanner();
    if(!window._hqReminderInterval){window._hqReminderInterval=setInterval(hqUpdateReminderBanner, 5 * 60 * 1000);}

    // Stage 4: notification startup goes through the orchestrator.
    // Emit notification:init on the bus — HQNotifOrchestrator handles sequencing.
    // Direct hqInitNudge() call kept as fallback if bus not yet available.
    if (window.HQBus) {
      window.HQBus.emit('notification:init', { page: window.HQ_CURRENT_PAGE || 'unknown' });
    } else {
      hqInitNudge();
    }

    // Start clock ticker
    hqTickClock();
    if(!window._hqClockInterval){window._hqClockInterval=setInterval(hqTickClock, 30000);}
// FIX-04/FIX-08: Clear intervals and abort listeners on page unload
// FIX-08: Register hq-core teardown via HQLifecycle (runs alongside page-level cleanups)
// HQLifecycle itself listens for pagehide — no extra listener needed here.
if (window.HQLifecycle) {
  HQLifecycle.register(function() {
    if (window._hqNudgeInterval) { clearInterval(window._hqNudgeInterval); window._hqNudgeInterval = null; }
    if (window._hqReminderInterval) { clearInterval(window._hqReminderInterval); window._hqReminderInterval = null; }
    if (window._hqClockInterval) { clearInterval(window._hqClockInterval); window._hqClockInterval = null; }
  });
} else {
  // Fallback if HQLifecycle not yet available (shouldn't happen — hq-core defines it above)
  window.addEventListener('pagehide', function() {
    if (window._hqNudgeInterval) { clearInterval(window._hqNudgeInterval); window._hqNudgeInterval = null; }
    if (window._hqReminderInterval) { clearInterval(window._hqReminderInterval); window._hqReminderInterval = null; }
    if (window._hqClockInterval) { clearInterval(window._hqClockInterval); window._hqClockInterval = null; }
  }, {once: true});
}


    // Re-render bottom nav (shared by storage event fallback + HQBus 'bottom-nav-updated')
    // C1: patch slot content in-place instead of full innerHTML rebuild
    function _rebuildBottomNavDOM() {
      var nav = document.getElementById('hq-bottom-nav');
      if (!nav) return;

      var raw, slots;
      try {
        var rawStr = localStorage.getItem(HQKeys.BOTTOM_NAV_SLOTS);
        if (rawStr) {
          var arr = JSON.parse(rawStr);
          if (Array.isArray(arr) && arr.length === 3) slots = arr;
        }
      } catch(e) {}
      if (!slots) slots = _BOTTOM_NAV_DEFAULTS.slice();

      // Patch slots 1-3 (index 0 is always Home, index 4 is always More)
      var links = nav.querySelectorAll('a.navbtn');
      slots.forEach(function(slot, i) {
        var el = links[i + 1]; // offset by 1 (Home is links[0])
        if (!el) return;
        el.href = slot.href;
        el.dataset.page = slot.page || slot.id;
        var ico = el.querySelector('.navbtn-ico');
        var lbl = el.querySelector('.navbtn-lbl');
        if (ico) ico.textContent = slot.emoji;
        if (lbl) lbl.textContent = slot.label;
      });
      markActive();
    }

    // Re-render shortcuts drawer in place (used by HQBus 'shortcuts-updated')
    // Shortcuts are an arbitrary-length user list — replaceWith is acceptable here
    function _rebuildShortcutsDOM() {
      var old = document.getElementById('hq-shortcuts-drawer');
      if (old) {
        var tmp = document.createElement('div');
        tmp.innerHTML = _buildShortcutsHTML();
        old.replaceWith(tmp.firstElementChild);
      }
    }

    // Re-render bottom nav when slots customized from another tab/page
    // [P6-M5] Storage event kept as cross-tab fallback; HQBus 'bottom-nav-updated' is the primary path
    window.addEventListener('storage', function(e) {
      if (e.key === HQKeys.BOTTOM_NAV_SLOTS) {
        _rebuildBottomNavDOM();
      }
    });

    // [P14-fix] Wire HQBus live-update events here so they have closure access
    // to _rebuildBottomNavDOM and _rebuildShortcutsDOM defined above.
    if (window.HQBus) {
      window.HQBus.on('bottom-nav-updated', function() { _rebuildBottomNavDOM(); });
      window.HQBus.on('shortcuts-updated',  function() { _rebuildShortcutsDOM(); });
    }

    window.HQ_CORE_LOADED = true;
    window.dispatchEvent(new CustomEvent('hq-core-ready'));
    // FIX-09: Resolve HQReady promise so pages can await window.HQReady
    if (window._HQReadyResolve) { window._HQReadyResolve(); window._HQReadyResolve = null; }
    _initTabScrollShadows();
  }


  // ═══════════════════════════════════════════════════════════════
  // H-01: Tab scroll shadow — remove fade when scrolled to end;
  //        auto-scroll active tab into view on load.
  // ═══════════════════════════════════════════════════════════════
  function _initTabScrollShadows() {
    var sel = '.nav, .htab-nav, .tab-nav, .tv-nav, .la-nav, .time-brain-strip';
    var navs = document.querySelectorAll(sel);
    navs.forEach(function(nav) {
      function update() {
        var atEnd = nav.scrollLeft + nav.clientWidth >= nav.scrollWidth - 4;
        nav.classList.toggle('scrolled-end', atEnd);
      }
      nav.addEventListener('scroll', update, { passive: true });
      // Initial state check + scroll active tab into view after layout
      setTimeout(function() {
        update();
        var active = nav.querySelector('.ntab.on, .ntab.active, .nav-tab.active');
        if (active) {
          // Centre the active tab in the scroll container
          var navW = nav.clientWidth;
          var tabL = active.offsetLeft;
          var tabW = active.offsetWidth;
          nav.scrollLeft = Math.max(0, tabL - (navW / 2) + (tabW / 2));
          update();
        }
      }, 120);
    });
  }

  // Run on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }

  // ═══════════════════════════════════════════════════════════════
  // 11. GLOBAL EXPORTS
  // ═══════════════════════════════════════════════════════════════
  window.hqSetTheme = hqSetTheme;
  window.hqSetMode = hqSetMode;
  window.hqShowToast = hqShowToast;
  window.showToast = hqShowToast; // Legacy alias
  window.hqFlag = hqFlag;
  window.hqUnflag = hqUnflag;
  window.hqGet = hqGet;
  window.hqSet = hqSet;
  window.hqRemove = hqRemove;
  window.hqApplyFlagBehaviors = hqApplyFlagBehaviors;
  window.HQ = HQ; // expose constants object for pages that use HQ.CHECKIN_KEY etc.
  window.hqSetView = function(mode) { if (window.HQState) { window.HQState.set(HQKeys.VIEW_MODE, mode); } else if (window.HQStore) { window.HQStore.set(HQKeys.VIEW_MODE, mode); } else { try { localStorage.setItem(HQKeys.VIEW_MODE, mode); } catch(e) {} } hqApplyView(mode); };

  // ── P5: expose store helpers for behavior handler data ────────────────────
  window.hqGetCheckinSurface = () => hqGet(HQKeys.CHECKIN_SURFACE, []);
  window.hqDismissCheckinSurface = (id) => {
    let items = hqGet(HQKeys.CHECKIN_SURFACE, []);
    items = items.filter(i => i.id !== id);
    hqSet(HQKeys.CHECKIN_SURFACE, items);
    window.dispatchEvent(new CustomEvent('hq-checkin-surface-updated'));
  };
  window.hqGetDaybuilderPins = (date) => {
    const pins = hqGet(HQKeys.DAYBUILDER_PINS, []);
    return date ? pins.filter(p => !p.date || p.date === date) : pins;
  };
  window.hqDismissDaybuilderPin = (id) => {
    let pins = hqGet(HQKeys.DAYBUILDER_PINS, []);
    pins = pins.filter(p => p.id !== id);
    hqSet(HQKeys.DAYBUILDER_PINS, pins);
    window.dispatchEvent(new CustomEvent('hq-daybuilder-pins-updated'));
  };
  window.hqGetAutoDeferQueue = () => hqGet(HQKeys.AUTO_DEFER_QUEUE, []);
  window.hqGetSurvivalStore = () => hqGet(HQKeys.SURVIVAL_STORE, { items: [] });

  // ── Energy context — sets data-energy on body  [ENERGY-SUSPENDED — restore in Phase 15] ──
  function applyEnergyContext() { // [ENERGY-SUSPENDED]
    try {
      var es   = hqGet(HQ.ENERGY_KEY, null); // [ENERGY-SUSPENDED]
      var body = document.body;
      if (!es || !es.level) { body.removeAttribute('data-energy'); return; }
      // Only apply if logged within last 12 hours
      var age = es.ts ? Date.now() - es.ts : Infinity;
      if (age > 12 * 60 * 60 * 1000) { body.removeAttribute('data-energy'); return; }
      body.setAttribute('data-energy', es.level);
    } catch(e) {}
  }
  window.applyEnergyContext = applyEnergyContext;
  window.addEventListener('hq-energy-updated', applyEnergyContext); // [ENERGY-SUSPENDED]

  // Re-apply view mode on resize for auto mode
  var _resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(_resizeTimer);
    _resizeTimer = setTimeout(function() {
      if ((localStorage.getItem(HQKeys.VIEW_MODE) || 'auto') === 'auto') hqApplyView('auto');
    }, 250);
  });

  // ── Display menu toggle (⚙ button in topbar) ──
  function hqToggleDisplayMenu() {
    var menu = document.getElementById('hq-display-menu');
    if (!menu) return;
    var isOpen = menu.classList.contains('open');
    // Close shortcuts drawer if open
    var sc = document.getElementById('hq-shortcuts-drawer');
    if (sc) sc.classList.remove('open');
    menu.classList.toggle('open', !isOpen);
    if (!isOpen && !menu._closeListenerAttached) {
      menu._closeListenerAttached = true;
      document.addEventListener('click', function _close(e) {
        if (!menu.classList.contains('open')) {
          document.removeEventListener('click', _close);
          menu._closeListenerAttached = false;
          return;
        }
        if (!menu.contains(e.target) && e.target.id !== 'hq-display-btn') {
          menu.classList.remove('open');
          document.removeEventListener('click', _close);
          menu._closeListenerAttached = false;
        }
      });
    }
  }
  window.hqToggleDisplayMenu = hqToggleDisplayMenu;

  // ── Shortcuts drawer toggle (⚡ button in topbar) ──
  function hqToggleShortcuts() {
    var drawer = document.getElementById('hq-shortcuts-drawer');
    if (!drawer) return;
    var isOpen = drawer.classList.contains('open');
    // Close display menu if open
    var dm = document.getElementById('hq-display-menu');
    if (dm) dm.classList.remove('open');
    drawer.classList.toggle('open', !isOpen);
    if (!isOpen && !drawer._closeListenerAttached) {
      drawer._closeListenerAttached = true;
      document.addEventListener('click', function _close(e) {
        if (!drawer.classList.contains('open')) {
          document.removeEventListener('click', _close);
          drawer._closeListenerAttached = false;
          return;
        }
        if (!drawer.contains(e.target) && !e.target.classList.contains('hdr-shortcuts-btn')) {
          drawer.classList.remove('open');
          document.removeEventListener('click', _close);
          drawer._closeListenerAttached = false;
        }
      });
    }
  }
  window.hqToggleShortcuts = hqToggleShortcuts;

  // Sidenav Controls
  window.hqOpenSidenav = () => { 
    if (document.getElementById('hq-sidenav')?._tvPinned) return;
    document.getElementById('hq-sidenav')?.classList.add('open'); 
    document.getElementById('hq-sidenav-overlay')?.classList.add('show');
  };
  window.hqCloseSidenav = () => {
    if (document.getElementById('hq-sidenav')?._tvPinned) return;
    document.getElementById('hq-sidenav')?.classList.remove('open');
    document.getElementById('hq-sidenav-overlay')?.classList.remove('show');
  };

  // P9: Collapsible Time Brain nav subsection toggle
  window.hqToggleNavSubsection = function(id) {
    var body  = document.getElementById('snsb-' + id);
    var arrow = document.getElementById('snsa-' + id);
    if (!body) return;
    var collapsed = body.style.display === 'none';
    body.style.display = collapsed ? '' : 'none';
    if (arrow) arrow.textContent = collapsed ? '▼' : '▶';
    try {
      localStorage.setItem('hq-nav-collapse-' + id, collapsed ? '0' : '1');
    } catch(e) {}
  };

  // ── Wire HQBus: rebuild sidenav when module settings change ──
  // [M6] Single registration only — HQStore always loads before hq-core, so HQBus is always present
  if (window.HQBus) {
    window.HQBus.on('modules-updated', function() { hqRebuildSidenav(); });
    // [P6-M5] Named channel listeners — live nav updates without page reload
    // Note: bottom-nav-updated emitted by customize.js when slots change; shortcuts-updated on shortcut edit
    // bottom-nav-updated and shortcuts-updated are registered inside inject() where
    // _rebuildBottomNavDOM and _rebuildShortcutsDOM are defined (closure scope fix)
  }


// ── FIX-08: HQLifecycle Registry ────────────────────────────────────────────
// Centralised module teardown registry. Any page or core module can register
// a cleanup function; all are called on pagehide (navigation/tab close).
//
// Usage:
//   HQLifecycle.register(() => { clearInterval(myInterval); myAC.abort(); });
//
// hq-core itself registers its own cleanup below. Page modules that already
// have pagehide handlers can optionally migrate to this registry over time —
// both patterns coexist safely.
(function() {
  var _cleanups = [];
  var _torn = false;

  window.HQLifecycle = {
    /**
     * Register a cleanup function to run on page teardown.
     * Returns the function so callers can store and deregister if needed.
     */
    register: function(fn) {
      if (typeof fn !== 'function') return fn;
      _cleanups.push(fn);
      return fn;
    },

    /**
     * Deregister a previously registered cleanup function.
     */
    deregister: function(fn) {
      var idx = _cleanups.indexOf(fn);
      if (idx !== -1) _cleanups.splice(idx, 1);
    },

    /**
     * Run all registered cleanups immediately.
     * Called automatically on pagehide; can also be called manually.
     * Idempotent — safe to call multiple times.
     */
    teardown: function() {
      if (_torn) return;
      _torn = true;
      _cleanups.forEach(function(fn) {
        try { fn(); } catch(e) {
          if (window.console) console.warn('[HQLifecycle] cleanup error:', e);
        }
      });
      _cleanups = [];
    },

    /** How many cleanups are registered (useful for debugging). */
    count: function() { return _cleanups.length; }
  };

  window.addEventListener('pagehide', function() {
    window.HQLifecycle.teardown();
  }, { once: true });
})();

  // ── Bridge: mark HQStore core-ready ──
  if (window.HQStore) window.HQStore._coreReady = true;

})();