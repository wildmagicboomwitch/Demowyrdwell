/* ══════════════════════════════════════════════════════════════════════
   core/hq-ready.js — AuDHD HQ Boot Readiness & Null-Guard Adapter
   ────────────────────────────────────────────────────────────────────
   FIX-09: 20 shared globals on window.* with no adapter layer.
   Any load-order change or failed script silently breaks every
   dependent page.

   THIS FILE PROVIDES:

   1. window.HQReady — Promise that resolves when hq-core-ready fires.
      Pages can await it before using any HQ global:
        await window.HQReady;
        window.HQBus.emit('my:event', data);

   2. window.HQGuard — safe accessor with warn-on-miss.
      Use instead of bare globals where load order is uncertain:
        HQGuard('HQBus')?.emit('my:event', data);
        HQGuard('HQStore')?.getCategories();

   3. window.HQSafe — pre-built null-safe wrappers for the most
      commonly called methods. These never throw even if the underlying
      global isn't loaded yet; they warn to the console and return a
      safe fallback instead.

      HQSafe.bus.emit(channel, payload)      // silent drop + warn if missing
      HQSafe.bus.on(channel, handler)        // silent no-op + warn if missing
      HQSafe.bus.once(channel, handler)      // silent no-op + warn if missing
      HQSafe.store.get(key, fallback)        // returns fallback if missing
      HQSafe.store.getCategories()           // returns [] if missing
      HQSafe.store.getFlags()                // returns {} if missing
      HQSafe.store.getRecurringEvents()      // returns [] if missing
      HQSafe.toast.show(msg, type)           // silent no-op if missing

   LOAD ORDER
   ──────────
   Load this file EARLY — before any page script that uses HQ globals.
   The promise is created synchronously; it resolves when hq-core.js
   fires hq-core-ready (which happens after hq-store.js + runtime are
   all loaded).

   Add to HTML pages immediately after hq-store.js:
     <script src="core/hq-store.js"></script>
     <script src="core/hq-core.js"></script>
     <script src="core/hq-ready.js"></script>    ← add here

   USAGE PATTERNS
   ──────────────

   A) Optional chaining — for calls that are fine to drop if not ready:
      window.HQBus?.emit('checkin:saved', data);

   B) HQGuard — for calls that should warn if the global is missing:
      HQGuard('HQBus')?.emit('checkin:saved', data);

   C) HQSafe — for critical paths that must always run (with fallback):
      HQSafe.bus.emit('checkin:saved', data);   // warns but doesn't throw

   D) await HQReady — for init functions that need all globals loaded:
      async function init() {
        await window.HQReady;
        window.HQBus.on('route', handleRoute);
        window.HQStore.getCategories().forEach(renderCat);
      }

   WHAT NOT TO DO
   ──────────────
   Don't replace every bare global call with HQSafe — that hides real
   bugs. Use HQSafe/HQGuard only where load-order race is a known risk
   (e.g. a script that runs before hq-core-ready fires). Use ?.  for
   genuinely optional calls. Use await HQReady for init blocks.
══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── 1. HQReady — boot promise ────────────────────────────────────────
  // Resolves when hq-core.js fires hq-core-ready.
  // hq-core.js is patched (FIX-09) to call window._HQReadyResolve() at
  // that moment.

  if (!window.HQReady) {
    var _resolve;
    window.HQReady = new Promise(function (resolve) {
      _resolve = resolve;
    });
    window._HQReadyResolve = _resolve;

    // If hq-core-ready already fired before this script loaded, resolve now.
    if (window.HQ_CORE_LOADED) {
      _resolve();
      window._HQReadyResolve = null;
    } else {
      window.addEventListener('hq-core-ready', function onCoreReady() {
        window.removeEventListener('hq-core-ready', onCoreReady);
        if (window._HQReadyResolve) {
          window._HQReadyResolve();
          window._HQReadyResolve = null;
        }
      }, { once: true });
    }
  }

  // ── 2. HQGuard — warn-on-miss accessor ───────────────────────────────
  // Returns the global if present, otherwise logs a warning and returns null.
  // Callers chain with ?. so absent globals are a no-op rather than a throw.
  //
  // Example:
  //   HQGuard('HQBus')?.emit('my:event', data);

  window.HQGuard = function HQGuard(name) {
    var g = window[name];
    if (g) return g;
    console.warn(
      '[HQGuard] "' + name + '" is not loaded yet — call dropped.',
      'Ensure ' + name + ' is available before this call, or await window.HQReady first.'
    );
    return null;
  };

  // ── 3. HQSafe — pre-built safe wrappers ──────────────────────────────
  // These wrappers absorb missing-global errors with a console.warn
  // and a safe return value. Use for calls that must never throw.

  window.HQSafe = {

    // HQBus safe wrappers
    bus: {
      emit: function (channel, payload) {
        if (window.HQBus && typeof window.HQBus.emit === 'function') {
          return window.HQBus.emit(channel, payload);
        }
        console.warn('[HQSafe.bus] HQBus not ready — emit dropped:', channel, payload);
      },
      on: function (channel, handler) {
        if (window.HQBus && typeof window.HQBus.on === 'function') {
          return window.HQBus.on(channel, handler);
        }
        console.warn('[HQSafe.bus] HQBus not ready — on() dropped:', channel);
      },
      once: function (channel, handler) {
        if (window.HQBus && typeof window.HQBus.once === 'function') {
          return window.HQBus.once(channel, handler);
        }
        console.warn('[HQSafe.bus] HQBus not ready — once() dropped:', channel);
      },
      off: function (channel, handler) {
        if (window.HQBus && typeof window.HQBus.off === 'function') {
          return window.HQBus.off(channel, handler);
        }
      },
    },

    // HQStore safe wrappers
    store: {
      get: function (key, fallback) {
        if (window.HQStore && typeof window.HQStore.get === 'function') {
          return window.HQStore.get(key, fallback !== undefined ? fallback : null);
        }
        console.warn('[HQSafe.store] HQStore not ready — get() fallback:', key);
        return fallback !== undefined ? fallback : null;
      },
      set: function (key, value) {
        if (window.HQStore && typeof window.HQStore.set === 'function') {
          return window.HQStore.set(key, value);
        }
        console.warn('[HQSafe.store] HQStore not ready — set() dropped:', key);
      },
      remove: function (key) {
        if (window.HQStore && typeof window.HQStore.remove === 'function') {
          return window.HQStore.remove(key);
        }
        console.warn('[HQSafe.store] HQStore not ready — remove() dropped:', key);
      },
      getCategories: function () {
        if (window.HQStore && typeof window.HQStore.getCategories === 'function') {
          return window.HQStore.getCategories();
        }
        console.warn('[HQSafe.store] HQStore not ready — getCategories() → []');
        return [];
      },
      getCategoriesForModule: function (module) {
        if (window.HQStore && typeof window.HQStore.getCategoriesForModule === 'function') {
          return window.HQStore.getCategoriesForModule(module);
        }
        console.warn('[HQSafe.store] HQStore not ready — getCategoriesForModule() → []:', module);
        return [];
      },
      getCategoryById: function (id) {
        if (window.HQStore && typeof window.HQStore.getCategoryById === 'function') {
          return window.HQStore.getCategoryById(id);
        }
        return null;
      },
      getFlags: function () {
        if (window.HQStore && typeof window.HQStore.getFlags === 'function') {
          return window.HQStore.getFlags();
        }
        console.warn('[HQSafe.store] HQStore not ready — getFlags() → {}');
        return {};
      },
      getAllFlags: function () {
        if (window.HQStore && typeof window.HQStore.getAllFlags === 'function') {
          return window.HQStore.getAllFlags();
        }
        console.warn('[HQSafe.store] HQStore not ready — getAllFlags() → []');
        return [];
      },
      getRecurringEvents: function () {
        if (window.HQStore && typeof window.HQStore.getRecurringEvents === 'function') {
          return window.HQStore.getRecurringEvents();
        }
        console.warn('[HQSafe.store] HQStore not ready — getRecurringEvents() → []');
        return [];
      },
      getTagDB: function () {
        if (window.HQStore && typeof window.HQStore.getTagDB === 'function') {
          return window.HQStore.getTagDB();
        }
        return {};
      },
    },

    // HQToast safe wrapper
    toast: {
      show: function (msg, type, duration) {
        if (window.HQToast && typeof window.HQToast.show === 'function') {
          return window.HQToast.show(msg, type, duration);
        }
        // Fallback: log to console so the message isn't silently lost
        console.info('[HQSafe.toast] HQToast not ready — message:', msg, '(' + (type || 'info') + ')');
      },
    },

  };

})();
