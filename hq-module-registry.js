// AUDHD HQ — Module Registry (Phase 7 — repurposed from Phase 6 setup registry)
// Backbone of the setup wizard. Each entry describes a module's setup contract.
// Loaded by setup-wizard.html only.
// NOTE DEAD-06: index.html does NOT currently load this file. If index.html needs this
// registry, add <script src="core/hq-module-registry.js"></script> before pages/index.js.

window.AUDHD_MODULE_REGISTRY = {

  // ── Core modules ──────────────────────────────────────────────────────────

  health: {
    id: 'health',
    displayName: '🩺 Health Tracker',
    href: 'health-tracker.html',
    setupKey: HQKeys.HEALTH_SETUP,
    setupTab: 'setup',            // id of the tab to open in-page
    defaultConfig: {
      conditions: [],
      providers: [],
      medications: [],
      symptoms: [],
      checkinPresets: []
    },
    setupSteps: [
      { id: 'conditions',  label: 'Conditions & diagnoses',  hint: 'List any conditions, disabilities, or chronic symptoms you track.' },
      { id: 'providers',   label: 'Providers & contacts',    hint: 'Add your doctors, therapists, pharmacists, or clinics.' },
      { id: 'medications', label: 'Medications & supplements', hint: 'Everything you take regularly — prescriptions, OTC, supplements.' },
      { id: 'symptoms',    label: 'Symptom watchlist',       hint: 'Custom symptoms to track beyond the built-in categories.' }
    ],
    // importable fields and their accepted formats
    imports: {
      conditions:  { label: 'Conditions',   formats: ['text', 'csv', 'xls'] },
      providers:   { label: 'Providers',    formats: ['text', 'csv', 'xls'] },
      medications: { label: 'Medications',  formats: ['text', 'csv', 'xls'] },
      symptoms:    { label: 'Symptoms',     formats: ['text', 'csv', 'xls'] }
    }
  },

  taskboard: {
    id: 'taskboard',
    displayName: '📌 TaskBoard',
    href: 'taskboard.html',
    setupKey: HQKeys.TASKBOARD_SETUP,
    setupTab: 'setup',
    defaultConfig: {
      priorityLabels: { urgent: '🔥 Urgent', high: '⬆ High', normal: 'Normal', low: '⬇ Low' },
      energyDefaults: { high: [], medium: [], low: [] },
      crossModuleLinks: { pushToMonthly: false, pushToWeekly: false },
      presetLists: []
    },
    setupSteps: [
      { id: 'priority',     label: 'Priority label names',    hint: 'Rename the four priority levels to suit your vocabulary.' },
      { id: 'energy',       label: 'Energy tier defaults',    hint: 'Set which task types default to which energy tier.' },
      { id: 'links',        label: 'Cross-module links',      hint: 'Auto-push completed tasks to Monthly/Weekly planner.' },
      { id: 'presets',      label: 'Starter preset lists',    hint: 'Create pre-built list templates you can deploy in one tap.' }
    ],
    imports: {}
  },

  routines: {
    id: 'routines',
    displayName: '🔁 Routines + Prepwork',
    href: 'routines-prepwork.html',
    setupKey: HQKeys.ROUTINES_SETUP,
    setupTab: 'setup',
    defaultConfig: {
      routineItems: [],
      prepItems: [],
      flags: [],
      categories: [],
      energyEstimates: {},
      autoArchiveOneTime: false
    },
    setupSteps: [
      { id: 'morning',    label: 'Morning routine steps',   hint: 'Add every step you want to remember each morning.' },
      { id: 'evening',    label: 'Evening routine steps',   hint: 'Wind-down and night-before prep steps.' },
      { id: 'prepwork',   label: 'Prepwork items',          hint: 'Night-before and EOD tasks that set the next day up.' },
      { id: 'options',    label: 'Options & flags',         hint: 'Energy estimates, auto-archive one-time items, categories.' }
    ],
    imports: {}
  },

  money: {
    id: 'money',
    displayName: '💰 Money Brain',
    href: 'money-brain.html',
    setupKey: HQKeys.MONEY_SETUP,
    setupTab: 'setup',
    defaultConfig: {
      incomeSources: [],
      fixedExpenses: [],
      debts: [],
      subscriptions: [],
      budgetCategories: []
    },
    setupSteps: [
      { id: 'income',     label: 'Income sources',          hint: 'Regular income — paychecks, freelance, benefits, etc.' },
      { id: 'expenses',   label: 'Fixed expenses',          hint: 'Rent, utilities, insurance — anything due every month.' },
      { id: 'debts',      label: 'Debts',                   hint: 'Loans, credit cards, payment plans.' },
      { id: 'subs',       label: 'Subscriptions',           hint: 'Monthly or annual recurring charges.' },
      { id: 'categories', label: 'Budget categories',       hint: 'Spending buckets — food, transport, fun, etc.' }
    ],
    imports: {}
  },

  admin: {
    id: 'admin',
    displayName: '📂 Life Admin',
    href: 'life-admin.html',
    setupKey: HQKeys.LIFE_ADMIN_SETUP,
    setupTab: 'setup',
    defaultConfig: {
      contacts: [],
      documentTypes: [],
      deadlineTemplates: []
    },
    setupSteps: [
      { id: 'contacts',   label: 'Important contacts',      hint: 'Landlord, utility companies, HR — anyone you might need.' },
      { id: 'documents',  label: 'Document types',          hint: 'Lease, passport, insurance cards — track what you own.' },
      { id: 'deadlines',  label: 'Recurring deadlines',     hint: 'Rent, taxes, renewals — template the recurrences here.' }
    ],
    imports: {}
  },

  social: {
    id: 'social',
    displayName: '💬 Social Brain',
    href: 'social-brain.html',
    setupKey: HQKeys.SOCIAL_SETUP,
    setupTab: 'setup',
    defaultConfig: {
      contacts: [],
      importedAt: null
    },
    setupSteps: [
      { id: 'import',     label: 'Import contacts',         hint: 'Paste a list or upload CSV/XLS — all fields editable after import.' },
      { id: 'manual',     label: 'Add contacts manually',   hint: 'Add people one at a time with full detail.' }
    ],
    imports: {
      contacts: { label: 'Contacts', formats: ['text', 'csv', 'xls'] }
    }
  },

  kitchen: {
    id: 'kitchen',
    displayName: '🍳 Kitchen Brain',
    href: 'kitchen-brain.html',
    setupKey: HQKeys.KITCHEN_SETUP,
    setupTab: 'setup',
    defaultConfig: {
      pantryStaples: [],
      dietaryRestrictions: [],
      householdSize: 1,
      inventory: [],
      importedAt: null
    },
    setupSteps: [
      { id: 'household',  label: 'Household basics',        hint: 'Household size and dietary restrictions / allergies.' },
      { id: 'staples',    label: 'Pantry staples',          hint: 'Things you always want stocked.' },
      { id: 'inventory',  label: 'Inventory import',        hint: 'Paste a list or upload CSV/XLS — categories editable after import.' }
    ],
    imports: {
      inventory: { label: 'Inventory', formats: ['text', 'csv', 'xls'] }
    }
  },

  walking: {
    id: 'walking',
    displayName: '🚶 Walking Tracker',
    href: 'walking-tracker.html',
    setupKey: HQKeys.WALKING,
    setupTab: null,             // no setup tab — config inline
    defaultConfig: {},
    setupSteps: [],
    imports: {}
  }
};

// ── Backward-compat alias (old key name still works) ──────────────────────
window.AUDHD_PHASE6_REGISTRY = (function () {
  const out = {};
  Object.values(window.AUDHD_MODULE_REGISTRY).forEach(function (m) {
    out[m.id] = { enabled: true, setupKey: m.setupKey };
  });
  return out;
}());

// ── Helper: which modules have an incomplete setup? ───────────────────────
window.AUDHD_REGISTRY_HELPERS = {

  /**
   * Returns an array of module ids whose setupKey is not yet in localStorage.
   * Used by index.html to decide whether to surface the wizard banner.
   */
  getMissingSetups: function () {
    return Object.values(window.AUDHD_MODULE_REGISTRY)
      .filter(function (m) { return m.setupKey && !localStorage.getItem(m.setupKey); })
      .map(function (m) { return m.id; });
  },

  /**
   * Returns the registry entry for a given module id.
   */
  get: function (id) {
    return window.AUDHD_MODULE_REGISTRY[id] || null;
  },

  /**
   * Returns all module entries as an array, preserving declaration order.
   */
  all: function () {
    return Object.values(window.AUDHD_MODULE_REGISTRY);
  },

  /**
   * Mark a module's setup as complete by writing its defaultConfig
   * only if nothing has been saved yet (never overwrites real data).
   */
  ensureDefaults: function (id) {
    var m = window.AUDHD_MODULE_REGISTRY[id];
    if (!m || !m.setupKey) return;
    if (!localStorage.getItem(m.setupKey)) {
      try {
        localStorage.setItem(m.setupKey, JSON.stringify(m.defaultConfig || {}));
      } catch (e) {}
    }
  }
};
