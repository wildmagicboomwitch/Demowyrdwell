/* ══════════════════════════════════════════════════════════════════════
   hq-notifications.js  —  AuDHD HQ Notification Engine
   Phase 4: registerSource API + C2 fix (getUpcomingEvents → source registry)

   CHANGELOG (P4):
   • Added HQNotif.registerSource(moduleId, callbackFn) — replaces dead
     HQStore.getUpcomingEvents() call (C2). Modules register callbacks on
     their page init; the notification checker iterates registered sources.
   • Source callback contract: () => Array<{title, time, type, moduleId}>
     where time is ISO string (or null for non-time-based entries).
   • HQNotif.getUpcomingFromSources() — iterates all registered callbacks
     and returns merged + time-sorted event array for the next N hours.
   • HQNotif.rescheduleAll() now calls getUpcomingFromSources() instead of
     the never-implemented HQStore.getUpcomingEvents().
   • All prior functionality preserved.
══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────────────
     CONSTANTS
  ───────────────────────────────────────────────────────────────── */
  const STORE_KEY    = HQKeys.NOTIF_CONFIG;
  const CUSTOM_KEY   = HQKeys.NOTIF_CUSTOM;
  const EVENTS_KEY   = HQKeys.NOTIF_EVENTS;
  const LOOKAHEAD_MS = 24 * 60 * 60 * 1000; // 24 hours
  const PRE_FIRE_MS  = 15 * 60 * 1000;       // fire 15 min before event

  /* ─────────────────────────────────────────────────────────────────
     SOURCE REGISTRY  (P4 — fixes C2)
     ───────────────────────────────────────────────────────────────
     Modules call HQNotif.registerSource(moduleId, callbackFn) on init.
     callbackFn: () => [{ title, time, type, moduleId }, ...]
       • time: ISO 8601 string, or null for non-time-based items
       • type: 'appointment' | 'deadline' | 'medication' | 'routine' |
               'recurring' | 'event' (module-defined string)
       • moduleId: should match the registering module string
  ───────────────────────────────────────────────────────────────── */
  const _sources = {};

  function registerSource (moduleId, callbackFn) {
    if (typeof moduleId !== 'string' || typeof callbackFn !== 'function') {
      console.warn('[HQNotif] registerSource: invalid args', moduleId);
      return;
    }
    _sources[moduleId] = callbackFn;
  }

  /**
   * Collect upcoming events from all registered sources.
   * Returns items whose `time` is within the next LOOKAHEAD_MS,
   * sorted ascending by time.  Items with null time are excluded.
   */
  function getUpcomingFromSources (windowMs) {
    const win  = windowMs || LOOKAHEAD_MS;
    const now  = Date.now();
    const cutoff = now + win;
    const results = [];

    for (const [moduleId, fn] of Object.entries(_sources)) {
      try {
        const items = fn();
        if (!Array.isArray(items)) continue;
        for (const item of items) {
          if (!item || !item.time) continue;
          const t = new Date(item.time).getTime();
          if (isNaN(t)) continue;
          if (t >= now && t <= cutoff) {
            results.push({
              title:    item.title    || 'Upcoming event',
              time:     item.time,
              type:     item.type     || 'event',
              moduleId: item.moduleId || moduleId,
              _ts:      t
            });
          }
        }
      } catch (e) {
        console.warn('[HQNotif] source error for', moduleId, e);
      }
    }

    results.sort((a, b) => a._ts - b._ts);
    return results;
  }

  /* ─────────────────────────────────────────────────────────────────
     DEFAULT SCHEDULED REMINDERS  (seeded on first run)
  ───────────────────────────────────────────────────────────────── */
  const DEFAULTS = [
    {
      id:      'checkin-morning',
      type:    'scheduled',
      title:   '✅ Morning Check-In',
      body:    'A moment to reconnect — mood, energy & body state',
      url:     './index.html',
      enabled: false,
      time:    '09:00',
      days:    [0, 1, 2, 3, 4, 5, 6]
    },
    {
      id:      'checkin-evening',
      type:    'scheduled',
      title:   '🌙 Evening Wind-Down',
      body:    'Thread closing — whenever you\'re ready',
      url:     './index.html',
      enabled: false,
      time:    '20:00',
      days:    [0, 1, 2, 3, 4, 5, 6]
    },
    {
      id:      'daybuilder-morning',
      type:    'scheduled',
      title:   '🗓 Day View',
      body:    'A thread worth opening — your day is waiting to take shape',
      url:     './day-view.html',
      enabled: false,
      time:    '08:00',
      days:    [1, 2, 3, 4, 5]
    },
    {
      id:      'braindump-nudge',
      type:    'scheduled',
      title:   '🧠 Thought Jar',
      body:    'Anything rattling around? Worth catching before it drifts',
      url:     './brain-dump.html',
      enabled: false,
      time:    '14:00',
      days:    [0, 1, 2, 3, 4, 5, 6]
    }
  ];

  /* ─────────────────────────────────────────────────────────────────
     STORAGE HELPERS
     Stage 2: route through HQState gateway (runtime-state.js) so all
     notification persistence flows through the central chokepoint.
     Falls back to direct localStorage — zero regression risk.
  ───────────────────────────────────────────────────────────────── */
  function _load () {
    if (window.HQState) return window.HQState.get(STORE_KEY, null);
    try {
      const raw = localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function _save (data) {
    if (window.HQState) { window.HQState.set(STORE_KEY, data); return; }
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('[HQNotif] _save failed:', e);
    }
  }

  function _init () {
    // Migrate old key → audhd-hq-notif-events
    const oldEvt = localStorage.getItem('hq-notif-events');
    if (oldEvt !== null && localStorage.getItem(HQKeys.NOTIF_EVENTS) === null) {
      localStorage.setItem(HQKeys.NOTIF_EVENTS, oldEvt);
      localStorage.removeItem('hq-notif-events');
    }
    const existing = _load();
    if (!existing) {
      _save(DEFAULTS.map(d => ({ ...d })));
    } else {
      // Merge any new defaults that aren't in store
      const ids = existing.map(e => e.id);
      let changed = false;
      for (const d of DEFAULTS) {
        if (!ids.includes(d.id)) {
          existing.push({ ...d });
          changed = true;
        }
      }
      if (changed) _save(existing);
    }
  }

  /* ─────────────────────────────────────────────────────────────────
     PUBLIC API — SCHEDULED REMINDERS
  ───────────────────────────────────────────────────────────────── */

  function getAll () {
    return _load() || [];
  }

  function upsert (entry) {
    if (!entry || !entry.id) return;
    const all = getAll();
    const idx = all.findIndex(e => e.id === entry.id);
    if (idx >= 0) all[idx] = { ...all[idx], ...entry };
    else          all.push(entry);
    _save(all);
  }

  function remove (id) {
    _save(getAll().filter(e => e.id !== id));
  }

  function setEnabled (id, enabled) {
    upsert({ id, enabled });
  }

  function setTime (id, time) {
    upsert({ id, time });
  }

  /* ─────────────────────────────────────────────────────────────────
     REMINDER CONFIG (for per-item reminder toggles — P4 Customize tab)
  ───────────────────────────────────────────────────────────────── */
  const REMINDER_CONFIG_KEY = HQKeys.REMINDER_CONFIG;

  function getReminderConfig () {
    if (window.HQState) return window.HQState.get(REMINDER_CONFIG_KEY, {});
    try {
      const raw = localStorage.getItem(REMINDER_CONFIG_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  }

  function setReminderConfig (moduleId, itemKey, config) {
    const all = getReminderConfig();
    if (!all[moduleId]) all[moduleId] = {};
    all[moduleId][itemKey] = { ...all[moduleId][itemKey], ...config };
    if (window.HQState) { window.HQState.set(REMINDER_CONFIG_KEY, all); return; }
    try {
      localStorage.setItem(REMINDER_CONFIG_KEY, JSON.stringify(all));
    } catch (e) {
      console.warn('[HQNotif] setReminderConfig failed:', e);
    }
  }

  function getReminderConfigFor (moduleId, itemKey) {
    const all = getReminderConfig();
    return (all[moduleId] && all[moduleId][itemKey]) || null;
  }

  /* ─────────────────────────────────────────────────────────────────
     PERMISSION
  ───────────────────────────────────────────────────────────────── */
  function getPermission () {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission; // 'default' | 'granted' | 'denied'
  }

  async function requestPermission () {
    if (!('Notification' in window)) return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied')  return 'denied';
    const result = await Notification.requestPermission();
    return result;
  }

  /* ─────────────────────────────────────────────────────────────────
     FIRE / TEST NOTIFICATIONS
  ───────────────────────────────────────────────────────────────── */
  function _fireNotif (title, body, url, icon) {
    if (getPermission() !== 'granted') return;
    // Stage 2: emit on HQBus so runtime-events layer can observe notification traffic
    // Stage 4: _fromNotif flag prevents the bus listener above from re-firing this
    if (window.HQBus) {
      window.HQBus.emit('notification:queued', { title, body, url, _fromNotif: true });
    }
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then(reg => {
          reg.showNotification(title, {
            body:  body  || '',
            icon:  icon  || './icons/android/launchericon-96x96.png',
            badge: './icons/android/launchericon-72x72.png',
            data:  { url: url || './index.html' }
          });
        });
      } else {
        const n = new Notification(title, {
          body: body || '',
          icon: icon || './icons/android/launchericon-96x96.png'
        });
        if (url) n.onclick = () => { window.focus(); window.location.href = url; };
      }
    } catch (e) {
      console.warn('[HQNotif] _fireNotif error:', e);
    }
  }

  async function test (id) {
    const all   = getAll();
    const entry = all.find(e => e.id === id);
    if (!entry) return;
    _fireNotif(entry.title, entry.body || 'Test notification', entry.url);
  }

  async function testUpcoming (item) {
    _fireNotif(
      `📅 ${item.title}`,
      `Coming up — thread starting soon`,
      item.url || './index.html'
    );
  }

  /* ─────────────────────────────────────────────────────────────────
     SCHEDULER
     ─────────────────────────────────────────────────────────────────
     Uses a 60-second polling interval. On each tick:
     1. Fires any enabled scheduled reminders whose time matches now
        (within ±30 seconds of the scheduled minute).
     2. If event alerts are enabled, queries all registered sources
        for items starting within PRE_FIRE_MS and fires alerts for them.

     NOTE: True background push (when app is closed) requires FCM
     and is already noted in notifications.html as SOON. This scheduler
     handles foreground / background-tab delivery.
  ───────────────────────────────────────────────────────────────── */
  let _timerHandle = null;
  const _fired = new Set(); // tracks fired event IDs this session

  function _tick () {
    const now  = new Date();
    const hhmm = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const dow  = now.getDay();

    // 1. Scheduled reminders
    for (const entry of getAll()) {
      if (!entry.enabled) continue;
      if (entry.type === 'custom') {
        if (entry.time !== hhmm) continue;
        if (entry.days && !entry.days.includes(dow)) continue;
        _fireNotif(entry.title, entry.body, entry.url);
      } else if (entry.type === 'scheduled') {
        if (entry.time !== hhmm) continue;
        if (entry.days && !entry.days.includes(dow)) continue;
        _fireNotif(entry.title, entry.body, entry.url);
      }
    }

    // 2. Source-registered upcoming events (C2 fix)
    if (localStorage.getItem(EVENTS_KEY) === '1') {
      const upcoming = getUpcomingFromSources(PRE_FIRE_MS + 90000); // 15m + 1.5m buffer
      for (const item of upcoming) {
        const t   = new Date(item.time).getTime();
        const ms  = t - Date.now();
        const key = item.moduleId + '|' + item.title + '|' + item.time;
        if (ms > 0 && ms <= PRE_FIRE_MS && !_fired.has(key)) {
          _fired.add(key);
          _fireNotif(
            `📅 ${item.title}`,
            `Thread starting soon — whenever you're ready`,
            './index.html'
          );
        }
      }
    }
  }

  function rescheduleAll () {
    if (_timerHandle) clearInterval(_timerHandle);
    _timerHandle = setInterval(_tick, 60 * 1000);
    _tick(); // immediate tick on (re)schedule
  }

  function stopAll () {
    if (_timerHandle) { clearInterval(_timerHandle); _timerHandle = null; }
  }

  /* ─────────────────────────────────────────────────────────────────
     AUTO-START
  ───────────────────────────────────────────────────────────────── */
  _init();
  rescheduleAll();

  /* ─────────────────────────────────────────────────────────────────
     STAGE 4: BUS LISTENER — Notification Orchestration
     ─────────────────────────────────────────────────────────────────
     HQNotif now listens on HQBus for:
       'notification:queued'  — fire a notification from any source
       'notification:init'    — trigger nudge permission + scheduler init

     This completes the target flow:
       Feature → Runtime State → Event Bus → Notification System

     Features no longer need a direct reference to HQNotif.
     They emit on the bus; HQNotif handles delivery.
  ───────────────────────────────────────────────────────────────── */
  function _wireBus () {
    const bus = window.HQBus;
    if (!bus) return;

    // Handle notification:queued — any module can request a notification
    // by emitting this channel rather than calling HQNotif directly.
    bus.on('notification:queued', function (payload) {
      if (!payload || !payload.title) return;
      // Deduplicate: don't re-fire if HQNotif itself is the emitter
      // (Stage 2 added the emit inside _fireNotif — we guard with a flag)
      if (payload._fromNotif) return;
      _fireNotif(payload.title, payload.body || '', payload.url || './index.html');
    });

    // Handle notification:init — replaces direct hqInitNudge() call in inject()
    bus.on('notification:init', function () {
      if (typeof window.hqInitNudge === 'function') window.hqInitNudge();
    });
  }

  // Wire immediately if HQBus already present, else wait for store ready
  if (window.HQBus) {
    _wireBus();
  } else {
    window.addEventListener('hq-store-ready', _wireBus, { once: true });
  }

  /* ─────────────────────────────────────────────────────────────────
     PUBLIC NAMESPACE
  ───────────────────────────────────────────────────────────────── */
  window.HQNotif = {
    /* Source registry (P4) */
    registerSource,
    getUpcomingFromSources,

    /* Scheduled reminders */
    getAll,
    upsert,
    remove,
    setEnabled,
    setTime,

    /* Reminder config (Customize tab) */
    getReminderConfig,
    setReminderConfig,
    getReminderConfigFor,

    /* Permission */
    getPermission,
    requestPermission,

    /* Fire / test */
    test,
    testUpcoming,

    /* Scheduler */
    rescheduleAll,
    stopAll
  };

})();
