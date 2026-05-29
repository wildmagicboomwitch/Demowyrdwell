/**
 * hq-store.js — AuDHD HQ Storage & Bus Layer v1
 */
(function () {
    'use strict';

    // ─── 1. CANONICAL KEY REGISTRY ────────────────────────────────────────────
    const KEYS = {
        THEME: HQKeys.THEME,
        FLAGS: HQKeys.FLAGS,
        ENERGY_STATE: HQKeys.ENERGY_STATE,
        PROFILE: HQKeys.PROFILE,
        TAGS: HQKeys.TAGS,
        REMINDER_CONFIG: HQKeys.REMINDER_CONFIG,
        THEME_SCHEDULE: HQKeys.THEME_SCHEDULE,
        INDEX_LAYOUT: HQKeys.INDEX_LAYOUT,
        MONTHLY: HQKeys.MONTHLY,
        WEEKLY: HQKeys.WEEKLY,
        RECURRING: HQKeys.RECURRING,
        CHECKIN_LOG: HQKeys.CHECKIN_LOG,
        HEALTH: HQKeys.HEALTH,
        METRICS: HQKeys.METRICS,
        WINS: HQKeys.WINS,
        BRAINDUMP: HQKeys.BRAINDUMP,
        TASKBOARD: HQKeys.TASKBOARD,
        WALKING: HQKeys.WALKING,
        WALKING_UNIT: HQKeys.WALKING_UNIT,
        MEDS: HQKeys.MEDS,
        MED_LOG: HQKeys.MED_LOG,
        DREAMS: HQKeys.DREAMS,
        WORRY_TIME: HQKeys.WORRY_TIME,
        EMOTIONAL_LOAD: HQKeys.EMOTIONAL_LOAD,
        FINANCE: HQKeys.FINANCE,
        INCOME_SMOOTH: HQKeys.INCOME_SMOOTH,
        SUB_STATUS: HQKeys.SUB_STATUS,
        KITCHEN: HQKeys.KITCHEN,
        LIFE_ADMIN: HQKeys.LIFE_ADMIN,
        LIFE_AREAS: HQKeys.LIFE_AREAS,
        FRIDGE: HQKeys.FRIDGE,
        SURVIVAL: HQKeys.SURVIVAL,
        FB_MISSION: HQKeys.FB_MISSION,
        FB_STARS: HQKeys.FB_STARS,
        FB_STRESSOR: HQKeys.FB_STRESSOR,
        AUDIT_CHECKS: HQKeys.AUDIT_CHECKS,
        SQ_MODE: HQKeys.SQ_MODE,
        DB_SIGNAL: HQKeys.DB_SIGNAL,
        CASCADE_SIGNAL: HQKeys.CASCADE_SIGNAL,
        RECUR_PENDING: HQKeys.RECUR_PENDING,
        ROUTE_TO_PROJECTS: HQKeys.ROUTE_TO_PROJECTS,
        CATEGORIES: HQKeys.CATEGORIES, // [P14-fix] was duplicate of TAGS key
        RECURRING_EVENTS: HQKeys.RECURRING_EVENTS,
        HEALTH_SETUP: HQKeys.HEALTH_SETUP,
        MONEY_SETUP: HQKeys.MONEY_SETUP,

        // ── P7a: setup keys for all module setup tabs ──────────────────────
        TASKBOARD_SETUP:   HQKeys.TASKBOARD_SETUP,
        ROUTINES_SETUP:    HQKeys.ROUTINES_SETUP,
        LIFE_ADMIN_SETUP:  HQKeys.LIFE_ADMIN_SETUP,

        // ── P7b: setup keys (declared here so quota/eviction sees them) ───
        SOCIAL_SETUP:      HQKeys.SOCIAL_SETUP,
        KITCHEN_SETUP:     HQKeys.KITCHEN_SETUP,

        // ── P7 wizard state ───────────────────────────────────────────────
        WIZARD_DONE:       HQKeys.WIZARD_DONE,     // '1' once wizard completed
        WIZARD_STEP:       HQKeys.WIZARD_STEP,     // last step index (resume)
        ACTIVE_MODULES:    HQKeys.ACTIVE_MODULES,  // [] of enabled module ids

        MODULE_SETTINGS: HQKeys.MODULE_SETTINGS,
        CHECKIN_PRESETS: HQKeys.CHECKIN_PRESETS,
        BOTTOM_NAV_SLOTS: HQKeys.BOTTOM_NAV_SLOTS,
        DISPLAY_PREFS: HQKeys.DISPLAY_PREFS,
        SHORTCUTS: HQKeys.SHORTCUTS,
        CHECKIN_VISIBILITY: HQKeys.CHECKIN_VISIBILITY,
        STORE_MIGRATED: 'hq-store-migrated-v1',

        // ── [m1+] Orphan keys — previously used by pages but invisible to quota/migration/eviction ──
        TOOL_VAULT:          HQKeys.TOOL_VAULT,
        SOCIAL_BRAIN:        HQKeys.SOCIAL_BRAIN,
        PROJECTS:            HQKeys.PROJECTS,            // BUG-01 fix — was 'hq_projects', mismatched data-sync
        PROJECTS_CONCEPTS:   HQKeys.PROJECTS_CONCEPTS,  // BUG-02 fix — was 'hq_concepts', now matches data-sync
        IDEA_STUDIO:         HQKeys.IDEA_STUDIO,
        DOCTOR_PREP:         HQKeys.DOCTOR_PREP,
        WALKING_HISTORY:     HQKeys.WALKING_HISTORY,
        DEBTS:               HQKeys.DEBTS,
        PREPWORK:            HQKeys.PREPWORK,
        ROUTINES:            HQKeys.ROUTINES,
        RP_LOG:              HQKeys.RP_LOG,
        HABITS:              HQKeys.HABITS,
        DEEPCLEAN:           HQKeys.DEEPCLEAN,
        DEEPCLEAN_STATS:     HQKeys.DEEPCLEAN_STATS,
        NONNEG:              HQKeys.NONNEG,
        ICONFORGE:           HQKeys.ICONFORGE,
        BOXES:               HQKeys.BOXES,
        DAYBUILDER_V2:       HQKeys.DAYBUILDER_V2,
        RECUR_EDIT_PENDING:  HQKeys.RECUR_EDIT_PENDING, // legacy migration source → RECUR_PENDING
        ENERGY_GATED_ITEMS:  HQKeys.ENERGY_GATED, // [ENERGY-SUSPENDED]
        VIEW_MODE:           HQKeys.VIEW_MODE,
    };

    const LEGACY_KEYS = [
        'hq-migrated-checkin-v3', 'hq-monthly-migrated', 'hq-recurring-migrated',
        HQKeys.TL_MIGRATED, HQKeys.MONEY_MIGRATED_V2, HQKeys.SURV_MIG_V1,
        'hq-recurring', 'hq-kitchen-data', 'hq-tags', 'hq-theme', 'hq-monthly',
        'taskboard_hq_v2', HQKeys.TASKBOARD_V3, 'audhd-hq-checkin-log-old',
    ];

    const MERGE_PAIRS = [
        ['hq-recurring', KEYS.RECURRING],
        ['hq-kitchen-data', KEYS.KITCHEN],
        ['hq-tags', KEYS.TAGS],
        ['hq-theme', KEYS.THEME],
        ['hq-monthly', KEYS.MONTHLY],
        ['taskboard_hq_v2', KEYS.TASKBOARD],
        [HQKeys.TASKBOARD_V3, KEYS.TASKBOARD],
    ];

    // ─── 2. SAFE STORAGE PRIMITIVES ───────────────────────────────────────────
    function _rawGet(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
    function _rawSet(key, str) { try { localStorage.setItem(key, str); return true; } catch (e) { return e; } }
    function _rawDel(key) { try { localStorage.removeItem(key); } catch (e) { } }

    // ── Stage 2: HQState gateway hook ────────────────────────────────────────
    // If runtime-state.js has loaded and installed window.HQState, delegate to
    // it so all persistence flows through the central gateway.  HQState itself
    // calls back into _rawGet/_rawSet/_rawDel below, so there is no recursion.
    // The flag _hqStateActive prevents re-entrant loops during HQState init.
    let _hqStateActive = false;

    function get(key, fallback) {
        if (fallback === undefined) fallback = null;
        if (window.HQState && !_hqStateActive) {
            _hqStateActive = true;
            try { return window.HQState.get(key, fallback); }
            finally { _hqStateActive = false; }
        }
        try {
            const raw = localStorage.getItem(key);
            return raw !== null ? JSON.parse(raw) : fallback;
        } catch (e) { return fallback; }
    }

    function set(key, value) {
        if (window.HQState && !_hqStateActive) {
            _hqStateActive = true;
            try { return window.HQState.set(key, value); }
            finally { _hqStateActive = false; }
        }
        const str = JSON.stringify(value);
        const result = _rawSet(key, str);
        if (result === true) {
            _trackUsage(key, str.length);
            return true;
        }
        if (result && result.name === 'QuotaExceededError') {
            _evict();
            const retry = _rawSet(key, str);
            if (retry === true) {
                _showQuotaToast('⚠️ Storage cleared to make room');
                return true;
            }
            _showQuotaToast('❌ Storage full');
            return false;
        }
        return false;
    }

    function remove(key) {
        if (window.HQState && !_hqStateActive) {
            _hqStateActive = true;
            try { window.HQState.remove(key); return; }
            finally { _hqStateActive = false; }
        }
        _rawDel(key);
    }

    // ─── 3. QUOTA MANAGEMENT ──────────────────────────────────────────────────
    const QUOTA_WARN_BYTES = 4 * 1024 * 1024;
    const QUOTA_EVICT_BYTES = 4.5 * 1024 * 1024;

    function _trackUsage(key, byteLen) {
        const total = _estimateUsage();
        if (total > QUOTA_EVICT_BYTES) _evict();
        else if (total > QUOTA_WARN_BYTES) _showQuotaToast('⚠️ Storage almost full');
    }

    function _estimateUsage() {
        let total = 0;
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && (k.startsWith('audhd-hq-') || k.startsWith('hq-'))) {
                    const v = localStorage.getItem(k);
                    if (v) total += k.length + v.length;
                }
            }
        } catch (e) { }
        return total * 2;
    }

    function _evict() {
        const now = Date.now();
        const SIXTY_DAYS = 60 * 24 * 60 * 60 * 1000;
        // Step 1: Delete daily checkin keys older than 60 days
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.startsWith('audhd-hq-checkin-2')) {
                    const datePart = k.slice('audhd-hq-checkin-'.length);
                    const ts = new Date(datePart).getTime();
                    if (!isNaN(ts) && now - ts > SIXTY_DAYS) _rawDel(k);
                }
            }
        } catch (e) { }
        // Step 2: Trim checkin-log array to last 90 entries
        try {
            const log = get(KEYS.CHECKIN_LOG, []);
            if (Array.isArray(log) && log.length > 90) {
                set(KEYS.CHECKIN_LOG, log.slice(-90));
            }
        } catch (e) { }
        // Step 3: Trim med-log to last 60 days
        try {
            const medLog = get(KEYS.MED_LOG, []);
            if (Array.isArray(medLog) && medLog.length > 0) {
                const cutoff = now - SIXTY_DAYS;
                const trimmed = medLog.filter(e => (e.ts || 0) > cutoff);
                if (trimmed.length < medLog.length) set(KEYS.MED_LOG, trimmed);
            }
        } catch (e) { }
        // Step 4: Remove transient bus signal keys
        try {
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const k = localStorage.key(i);
                if (k && k.startsWith('audhd-hq-bus-')) _rawDel(k);
            }
        } catch (e) { }
    }

    let _quotaToastTimer = null;
    function _showQuotaToast(msg) {
        if (_quotaToastTimer) return;
        _quotaToastTimer = setTimeout(() => {
            _quotaToastTimer = null;
            if (typeof window.hqShowToast === 'function') window.hqShowToast(msg, 5000);
        }, 500);
    }

    // ─── 4. MIGRATION ────────────────────────────────────────────────────────
    function _migrate() {
        if (_rawGet(KEYS.STORE_MIGRATED)) return;
        MERGE_PAIRS.forEach(([legacyKey, canonicalKey]) => {
            try {
                const legacyVal = localStorage.getItem(legacyKey);
                if (legacyVal && !localStorage.getItem(canonicalKey)) {
                    localStorage.setItem(canonicalKey, legacyVal);
                }
                localStorage.removeItem(legacyKey);
            } catch (e) { }
        });
        LEGACY_KEYS.forEach(k => _rawDel(k));
        _rawSet(KEYS.STORE_MIGRATED, '"1"');
        // Stage 6: write schema stamp so HQSchemaRegistry can detect migration history
        _rawSet('hq-store-schema-stamp', JSON.stringify({
            migratedAt: new Date().toISOString(),
            schemaVersion: 1,
        }));
    }

    // ─── 5. HQBus ────────────────────────────────────────────────────────────
    const _listeners = {};
    let _bc = null;
    try {
        _bc = new BroadcastChannel('audhd-hq-bus');
        _bc.onmessage = (e) => { if (e.data && e.data.channel) _deliver(e.data.channel, e.data.payload, false); };
    } catch (e) { _bc = null; }

    window.addEventListener('storage', (e) => {
        if (!e.key || !e.key.startsWith('audhd-hq-bus-')) return;
        try {
            const msg = JSON.parse(e.newValue);
            if (msg && msg.channel) _deliver(msg.channel, msg.payload, false);
        } catch (err) { }
    });

    function _deliver(channel, payload, isSameTab) {
        const handlers = _listeners[channel];
        if (!handlers) return;
        handlers.slice().forEach(fn => { try { fn(payload, { channel, isSameTab }); } catch (e) { } });
    }

    function emit(channel, payload) {
        const msg = { channel, payload, ts: Date.now() };
        _deliver(channel, payload, true);
        if (_bc) _bc.postMessage(msg);
        else {
            const key = 'audhd-hq-bus-' + channel;
            localStorage.setItem(key, JSON.stringify(msg));
            setTimeout(() => _rawDel(key), 50);
        }
        // Stage 2: mirror every bus emit as a window CustomEvent so the
        // runtime-events layer can passively observe all traffic.
        try {
            window.dispatchEvent(new CustomEvent('hqbus:' + channel, { detail: { channel, payload } }));
        } catch (_) {}
    }

    // ─── 6. SIGNAL EMITTERS ──────────────────────────────────────────────────
    function emitDBSignal() {
        emit('db-signal', { ts: Date.now() });
        // Also write legacy key so pages using storage-event listeners (timeline, day-view) still fire
        try { localStorage.setItem(KEYS.DB_SIGNAL, Date.now().toString()); } catch(e) {}
    }
    function emitCascadeSignal(source) {
        emit('cascade-signal', { ts: Date.now(), source: source || 'unknown' });
        try { localStorage.setItem(KEYS.CASCADE_SIGNAL, Date.now().toString()); } catch(e) {}
    }
    function emitRecurPending(id) { emit('recur-pending', { id }); }
    function emitRoute(page, payload) { emit('route', { page, payload: payload || null }); }

    // ─── 7. RECURRING & CATEGORIES ───────────────────────────────────────────
    function getRecurringEvents() { return get(KEYS.RECURRING_EVENTS, []); }
    function saveRecurringEvents(arr) { return set(KEYS.RECURRING_EVENTS, arr); }

    function addRecurringEvent(obj) {
        const arr = getRecurringEvents();
        const now = Date.now();
        const event = Object.assign({ id: _uid(), createdAt: now, updatedAt: now }, obj);
        arr.push(event);
        saveRecurringEvents(arr);
        return arr;
    }

    function removeRecurringEvent(id) {
        const arr = getRecurringEvents().filter(e => e.id !== id);
        saveRecurringEvents(arr);
        return arr;
    }

    function updateRecurringEvent(id, changes) {
        const arr = getRecurringEvents();
        const idx = arr.findIndex(e => e.id === id);
        if (idx === -1) return arr;
        arr[idx] = Object.assign({}, arr[idx], changes, { id, updatedAt: Date.now() });
        saveRecurringEvents(arr);
        return arr;
    }

    // ─── P2: Full TagEngine API promoted into HQStore ─────────────────────────
    // getCategories() no longer defers to window.TagEngine — HQStore is the source of truth.
    // customize.js still assigns window.TagEngine for backward compat during transition overlap
    // (marked deprecated there — remove after P2 verified).

    function getTagDB() {
        return get(KEYS.CATEGORIES, { categories: [], flags: {} });
    }

    function getCategories() {
        const raw = getTagDB();
        return raw.categories || [];
    }

    function getFlags() {
        const raw = getTagDB();
        return raw.flags || {};
    }

    function getAllFlags() {
        const flags = getFlags();
        const groups = ['priority', 'energy', 'time', 'context', 'status', 'wellbeing', 'system', 'custom'];
        return groups.flatMap(g => flags[g] || []);
    }

    function getFlagById(id) {
        const flags = getFlags();
        const groups = ['priority', 'energy', 'time', 'context', 'status', 'wellbeing', 'system', 'custom'];
        for (const g of groups) {
            const f = (flags[g] || []).find(f => f.id === id);
            if (f) return f;
        }
        return null;
    }

    function getCategoryById(id) { return getCategories().find(c => c.id === id) || null; }

    function getSubcategoryById(catId, subId) {
        const cat = getCategoryById(catId);
        return cat ? (cat.subcategories || []).find(s => s.id === subId) || null : null;
    }

    // Returns categories whose appliesTo includes 'all' or the given moduleId
    function getCategoriesForModule(mId) {
        return getCategories().filter(c => {
            const at = c.appliesTo || ['all'];
            return at.includes('all') || at.includes(mId);
        });
    }

    // Returns subcategories for a module filtered by itemType
    // itemType examples: 'task', 'note', 'expense', 'log-entry', 'appointment', 'event', 'project'
    function getCategoriesForItemType(mId, itemType) {
        return getCategoriesForModule(mId).map(cat => {
            const subs = (cat.subcategories || []).filter(sub => {
                const types = sub.itemTypes || ['all'];
                return types.includes('all') || types.includes(itemType);
            });
            return Object.assign({}, cat, { subcategories: subs });
        }).filter(cat => cat.subcategories.length > 0 || !(cat.subcategories));
    }

    // Returns all subcategories that have pushToCheckin:true (preserves existing checkin behavior)
    function getCheckinSubcategories() {
        const result = [];
        getCategories().forEach(cat => {
            (cat.subcategories || []).forEach(sub => {
                if (sub.pushToCheckin) {
                    result.push(Object.assign({ catId: cat.id, catName: cat.name, catEmoji: cat.emoji, catColor: cat.color }, sub));
                }
            });
        });
        return result;
    }

    // Returns all subcategories with pushToIndex:true
    function getIndexSubcategories() {
        const result = [];
        getCategories().forEach(cat => {
            (cat.subcategories || []).forEach(sub => {
                if (sub.pushToIndex) {
                    result.push(Object.assign({ catId: cat.id, catName: cat.name, catEmoji: cat.emoji, catColor: cat.color }, sub));
                }
            });
        });
        return result;
    }

    // Returns all subcategories with pushToWeeklyReview:true
    function getWeeklyReviewSubcategories() {
        const result = [];
        getCategories().forEach(cat => {
            (cat.subcategories || []).forEach(sub => {
                if (sub.pushToWeeklyReview) {
                    result.push(Object.assign({ catId: cat.id, catName: cat.name, catEmoji: cat.emoji, catColor: cat.color }, sub));
                }
            });
        });
        return result;
    }

    function getModuleSettings() { return get(KEYS.MODULE_SETTINGS, { enabled: {}, order: {} }); }
    function saveModuleSettings(s) { const ok = set(KEYS.MODULE_SETTINGS, s); emit('modules-updated', {}); return ok; }
    function setModuleEnabled(id, b) { const s = getModuleSettings(); s.enabled[id] = b; return saveModuleSettings(s); }
    function setModuleSectionOrder(sId, ids) { const s = getModuleSettings(); s.order[sId] = ids; return saveModuleSettings(s); }

    function getUsageReport() {
        let total = 0;
        const byKey = {};
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            const v = localStorage.getItem(k) || '';
            const b = (k.length + v.length) * 2;
            byKey[k] = b;
            total += b;
        }
        return { totalBytes: total, pct: Math.round(total / (5 * 1024 * 1024) * 100), byKey };
    }

    function _uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

    // ─── P12: BEHAVIORS — canonical registry (was duplicated in iconforge + customize) ───────
    // Source of truth for all pages. hq-core.js derives its BEHAVIOR_HANDLERS IDs from here.
    const BEHAVIORS = [
        { id: 'surface-index',   emoji: '🏠', name: 'Surface on Index',    desc: 'Appears in hero alert panel' },
        { id: 'surface-checkin', emoji: '✅', name: 'Surface in Check-In',  desc: 'Prompts during relevant check-in stage' },
        { id: 'energy-gate',     emoji: '🔋', name: 'Energy Gate',          desc: 'Hidden on survival-mode days' },
        { id: 'block-cascade',   emoji: '🛑', name: 'Block Cascade',        desc: 'Marks as blocking in Project Brain, surfaces as urgent' },
        { id: 'auto-defer',      emoji: '🔄', name: 'Auto-Defer',           desc: 'Pushed to tomorrow in DayBuilder if unresolved' },
        { id: 'notify-save',     emoji: '🔔', name: 'Notify on Save',       desc: 'Toast shown when this flag is applied' },
        { id: 'cascade-signal',  emoji: '📡', name: 'Cascade Signal',       desc: 'Notifies weekly planner + brain dump of change' },
        { id: 'pin-daybuilder',  emoji: '📌', name: 'Pin in DayBuilder',    desc: "Pinned to top of today's schedule, can't be displaced" },
        { id: 'weekly-review',   emoji: '📆', name: 'Add to Weekly Review', desc: 'Appears in end-of-week review even if unscheduled' },
        { id: 'survival-safe',   emoji: '🛡', name: 'Survival Safe',        desc: 'Always shown, even on crash days — opposite of Energy Gate' },
    ];

    // ─── 8. EXPORTS ──────────────────────────────────────────────────────────
    _migrate();

    window.renderEmoji = function (val) {
        if (!val) return '';
        if (typeof val === 'string' && val.startsWith('bi-')) {
            return '<i class="bi ' + val + '" style="font-size:1em;vertical-align:-.1em"></i>';
        }
        return val;
    };

    window.HQStore = {
        BEHAVIORS,  // P12: canonical behaviors registry — replaces per-page copies
        KEYS, get, set, remove, evict: _evict, usage: getUsageReport,
        getModuleSettings, saveModuleSettings, setModuleEnabled, setModuleSectionOrder,
        // P2: Full TagEngine API — always available, no page dependency on customize.js
        getTagDB, getCategories, getFlags, getAllFlags, getFlagById,
        getCategoryById, getSubcategoryById,
        getCategoriesForModule, getCategoriesForItemType,
        getCheckinSubcategories, getIndexSubcategories, getWeeklyReviewSubcategories,
        getRecurringEvents, saveRecurringEvents, addRecurringEvent, removeRecurringEvent, updateRecurringEvent,

        // Stage 6: schema-stamped export — use this as the base for any data export
        // Passes through HQSchemaRegistry.stamp() if available, otherwise adds bare schemaVersion.
        getExport() {
            const data = {};
            Object.entries(KEYS).forEach(([, key]) => {
                const val = get(key, null);
                if (val !== null) data[key] = val;
            });
            if (window.HQSchemaRegistry && typeof window.HQSchemaRegistry.stamp === 'function') {
                return window.HQSchemaRegistry.stamp(data);
            }
            return Object.assign({ schemaVersion: 1, _exportedAt: new Date().toISOString() }, data);
        },
    };

    window.HQBus = {
        emit, on: (c, h) => { if (!_listeners[c]) _listeners[c] = []; _listeners[c].push(h); },
        off: (c, h) => { if (_listeners[c]) _listeners[c] = _listeners[c].filter(fn => fn !== h); },
        once: (c, h) => { const w = (p, m) => { window.HQBus.off(c, w); h(p, m); }; window.HQBus.on(c, w); },
        emitDBSignal, emitCascadeSignal, emitRecurPending, emitRoute
    };

    window.dispatchEvent(new CustomEvent('hq-store-ready'));
})()