// core/hq-keys.js — Single source of truth for all localStorage keys (FIX-02)
// Generated from live codebase audit of audhdhq-phaseC-sprint7.zip
// All page scripts should reference HQKeys.* instead of raw string literals.
// Never read keys in the _LEGACY array for data — only for migration cleanup.

(function() {
  window.HQKeys = {
    // ── Profile & Setup ───────────────────────────────────────────────────
    PROFILE:              'audhd-hq-profile',
    USER_UID:             'audhd-hq-user-uid',
    WIZARD_DONE:          'audhd-hq-wizard-done',
    WIZARD_STEP:          'audhd-hq-wizard-step',
    SELECTED_CONDITIONS:  'audhd-hq-selected-conditions',
    SETUP_GUIDE_CHECKS:   'audhd-hq-setup-guide-checks',
    ACTIVE_MODULES:       'audhd-hq-active-modules',
    MODULE_SETTINGS:      'audhd-hq-module-settings',

    // ── Theme & Display ───────────────────────────────────────────────────
    THEME:                'audhd-hq-theme',
    THEME_SCHEDULE:       'audhd-hq-theme-schedule',
    VIEW_MODE:            'audhd-hq-view-mode',
    DISPLAY_PREFS:        'audhd-hq-display-prefs',
    BOTTOM_NAV_SLOTS:     'audhd-hq-bottom-nav-slots',
    SHORTCUTS:            'audhd-hq-shortcuts',
    INDEX_LAYOUT:         'audhd-hq-index-layout',

    // ── Health ────────────────────────────────────────────────────────────
    HEALTH:               'audhd-hq-health',
    HEALTH_SETUP:         'audhd-hq-health-setup',
    SYMPTOM_HISTORY:      'audhd-hq-symptom-history',
    SYMPTOM_WATCHLIST:    'audhd-hq-symptom-watchlist',
    FAVORITE_SYMPTOMS:    'audhd-hq-favorite-symptoms',
    MEDS:                 'audhd-hq-meds',
    MED_LOG:              'audhd-hq-med-log',
    MIGRAINE:             'audhd-hq-migraine',
    ENERGY_STATE:         'audhd-hq-energy-state',
    EMOTIONAL_LOAD:       'audhd-hq-emotional-load',

    // ── Check-In ──────────────────────────────────────────────────────────
    CHECKIN:              'audhd-hq-checkin',
    CHECKIN_LOG:          'audhd-hq-checkin-log',
    CHECKIN_PRESETS:      'audhd-hq-checkin-presets',
    CHECKIN_VISIBILITY:   'audhd-hq-checkin-visibility',
    CHECKIN_SURFACE:      'audhd-hq-checkin-surface',
    MISSED_CHECKINS:      'audhd-hq-missed-checkins',
    CHECKIN_MIG_V3:       'audhd-hq-checkin-mig-v3',

    // ── Tasks & Planning ──────────────────────────────────────────────────
    TASKBOARD:            'audhd-hq-taskboard',
    TASKBOARD_V3:         'audhd-hq-taskboard-v3',
    TASKBOARD_SETUP:      'audhd-hq-taskboard-setup',
    MONTHLY:              'audhd-hq-monthly',
    WEEKLY:               'audhd-hq-weekly',
    WEEKLY_PLANNER:       'audhd-hq-weekly-planner',
    ROUTINES:             'audhd-hq-routines',
    ROUTINES_SETUP:       'audhd-hq-routines-setup',
    RECURRING:            'audhd-hq-recurring',
    RECURRING_EVENTS:     'audhd-hq-recurring-events',
    RECUR_PENDING:        'audhd-hq-recur-pending',
    RECUR_EDIT_PENDING:   'audhd-hq-recur-edit-pending',
    DAYBUILDER:           'audhd-hq-daybuilder',
    DAYBUILDER_V2:        'audhd-hq-daybuilder-v2',
    DAYBUILDER_PINS:      'audhd-hq-daybuilder-pins',
    TIMELINE:             'audhd-hq-timeline',
    TL_MIGRATED:          'audhd-hq-tl-migrated',
    AUTO_DEFER_QUEUE:     'audhd-hq-auto-defer-queue',
    AUTO_DEFER_PENDING:   'audhd-hq-auto-defer-pending',
    AUTO_DEFER_LAST:      'audhd-hq-auto-defer-last-sweep',
    ENERGY_GATED:         'audhd-hq-energy-gated-items',
    DISMISSED_PRIORITY:   'audhd-hq-dismissed-priority',
    PROJECTS:             'audhd-hq-projects',
    PROJECTS_CONCEPTS:    'audhd-hq-concepts',          // BUG-02 fix — was missing; data-sync now exports this
    ROUTE_TO_PROJECTS:    'audhd-hq-route-to-projects',

    // ── Home & Kitchen ────────────────────────────────────────────────────
    KITCHEN:              'audhd-hq-kitchen',
    KITCHEN_SETUP:        'audhd-hq-kitchen-setup',
    FRIDGE:               'audhd-hq-fridge',
    GLOBAL_ROOMS:         'audhd-hq-global-rooms',
    CUSTOM_ROOM_TASKS:    'audhd-hq-custom-room-tasks',
    ROOMS_CONFIG:         'audhd-hq-rooms-config',
    BOXES:                'audhd-hq-boxes',
    DEEPCLEAN:            'audhd-hq-deepclean',
    DEEPCLEAN_STATS:      'audhd-hq-deepclean-stats',

    // ── Finance ───────────────────────────────────────────────────────────
    FINANCE:              'audhd-hq-finance',
    MONEY_SETUP:          'audhd-hq-money-setup',
    DEBTS:                'audhd-hq-debts',
    INCOME_SMOOTH:        'audhd-hq-income-smooth',
    NONNEG:               'audhd-hq-nonneg',
    DOCTOR_PREP:          'audhd-hq-doctor-prep',

    // ── Social & Life Admin ───────────────────────────────────────────────
    SOCIAL:               'audhd-hq-social',
    SOCIAL_BRAIN:         'audhd-hq-social-brain',
    SOCIAL_SETUP:         'audhd-hq-social-setup',
    LIFE_ADMIN:           'audhd-hq-life-admin',
    LIFE_ADMIN_SETUP:     'audhd-hq-life-admin-setup',
    LIFE_AREAS:           'audhd-hq-life-areas',
    WORRY_TIME:           'audhd-hq-worry-time',

    // ── Brain Tools ───────────────────────────────────────────────────────
    BRAINDUMP:            'audhd-hq-braindump',
    IDEA_STUDIO:          'audhd-hq-idea-studio',
    DREAMS:               'audhd-hq-dreams',
    TOOL_VAULT:           'audhd-hq-tool-vault',
    SURVIVAL:             'audhd-hq-survival',
    SURVIVAL_STORE:       'audhd-hq-survival-store',
    SURV_MIG_V1:          'audhd-hq-surv-mig-v1',
    WINS:                 'audhd-hq-wins',

    // ── Firebird Protocol ─────────────────────────────────────────────────
    FB_CRISIS:            'audhd-hq-fb-crisis',
    FB_MISSION:           'audhd-hq-fb-mission',
    FB_DEBRIEF:           'audhd-hq-fb-debrief',
    FB_STARS:             'audhd-hq-fb-stars',
    FB_TRUSTED:           'audhd-hq-fb-trusted',
    FB_WARNINGS:          'audhd-hq-fb-warnings',
    FB_CUSTOM_QUOTES:     'audhd-hq-fb-custom-quotes',
    FB_STRESSOR:          'audhd-hq-firebird-stressor',
    SQ_MODE:              'audhd-hq-sq-mode',
    SUB_STATUS:           'audhd-hq-sub-status',

    // ── Tags & Categories ─────────────────────────────────────────────────
    TAGS:                 'audhd-hq-tags',
    CATEGORIES:           'audhd-hq-categories',
    FLAGS:                'audhd-hq-flags',
    HABITS:               'audhd-hq-habits',

    // ── Notifications ─────────────────────────────────────────────────────
    NOTIF_EVENTS:         'audhd-hq-notif-events',
    NOTIF_CONFIG:         'audhd-hq-notif-config',
    NOTIF_CUSTOM:         'audhd-hq-notif-custom',
    REMINDER_CONFIG:      'audhd-hq-reminder-config',
    REMINDER_WINDOWS:     'audhd-hq-reminder-windows',
    NUDGE_LAST:           'audhd-hq-nudge-last',
    NUDGE_BAR_DISMISSED:  'audhd-hq-nudge-bar-dismissed',

    // ── Misc / System ─────────────────────────────────────────────────────
    ICONFORGE:            'audhd-hq-iconforge',
    METRICS:              'audhd-hq-metrics',
    DEPLOY_VERSION:       'audhd-hq-deploy-version',
    ENVIRONMENT:          'audhd-hq-environment',
    FLOW_CONFIG:          'audhd-hq-flow-config',
    AUDIT_CHECKS:         'audhd-hq-audit-checks',
    WALKING:              'audhd-hq-walking',
    WALKING_HISTORY:      'audhd-hq-walking-history',
    WALKING_UNIT:         'audhd-hq-walking-unit',

    // ── Migration sentinels ───────────────────────────────────────────────
    TAGS_MIGRATED_V2:     'audhd-hq-tags-migrated-v2',
    TAGS_MIGRATED_V3:     'audhd-hq-tags-migrated-v3',
    KITCHEN_MIGRATED_V1:  'audhd-hq-kitchen-migrated-v1',
    FRIDGE_MIGRATED_V1:   'audhd-hq-fridge-migrated-v1',
    LAYOUT_MIGRATED_V1:   'hq-layout-migrated-v1',     /* M-NEW-2 fix: matches value actually written by customize.js */
    MONEY_MIGRATED_V2:    'audhd-hq-money-migrated-v2',
    P11_MIGRATION_DONE:   'audhd-hq-p11-migration-done',


    // ── Routines & Prepwork ───────────────────────────────────────────────────
    PREPWORK:             'audhd-hq-prepwork',
    RP_LOG:               'audhd-hq-rp-log',
    RP_LASTTAB:           'audhd-hq-rp-lasttab',

    // ── Internal signals & bus ────────────────────────────────────────────────
    DB_SIGNAL:            'audhd-hq-db-signal',
    CASCADE_SIGNAL:       'audhd-hq-cascade-signal',
    BLOCKED_CASCADE:      'audhd-hq-blocked-cascade',
    AUTOBACKUP_PREFS:     'audhd-hq-autobackup-prefs',
    DOPAMINE_MENU:        'audhd-hq-dopamine-menu',

    // ── Legacy keys — for migration cleanup ONLY, never read for data ──────
    _LEGACY: [
      'hq-notif-events',           // → audhd-hq-notif-events (done in hq-notifications.js)
      'hq-tags-migrated-v2',       // → audhd-hq-tags-migrated-v2 (done in customize.js)
      'hq-tags-migrated-v3',       // → audhd-hq-tags-migrated-v3 (done in customize.js)
      'hq-setup-guide-checks',     // → audhd-hq-setup-guide-checks (done in setup-guide.html)
      'iconforge_v5',              // → audhd-hq-iconforge (done in iconforge.html)
      'hq-migrated-checkin-v2',    // cleaned up in customize.js
      'hq-migrated-checkin-v3',    // active sentinel in checkin.js
      'hq-monthly-migrated',       // cleaned up in hq-store.js
      'hq-recurring-migrated',     // cleaned up in hq-store.js
    ]
  };
})();
