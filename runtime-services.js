/**
 * runtime-services.js — AuDHD HQ Service Registry
 *
 * Phase 2: Central registry for shared services.
 *
 * Purpose:
 *   - Reduces circular imports between feature modules
 *   - Prevents service duplication (e.g. two notification schedulers)
 *   - Provides a safe lazy-registration pattern so modules can register
 *     themselves without caring about load order
 *
 * Services registered here (Phase 2):
 *   - notifications  → HQNotif
 *   - store          → HQStore
 *   - state          → HQState
 *   - bus            → HQBus
 *   - bootstrap      → HQBootstrap
 *   - moduleRegistry → AUDHD_MODULE_REGISTRY helpers
 *
 * Additional services (theme, accessibility, shell, sync) are placeholders
 * for future registration — they are NOT wired here yet.
 *
 * Loading order:
 *   hq-store.js → runtime-state.js → runtime-events.js
 *   → runtime-bootstrap.js → runtime-services.js → hq-core.js
 */

(function () {
  'use strict';

  const _registry = {};
  const _pending  = {}; // deferred callbacks waiting for a service

  /**
   * Register a named service.
   * @param {string} name    Canonical service name (e.g. 'notifications')
   * @param {*}      service The service object / function
   */
  function register(name, service) {
    if (!name || service === undefined) {
      console.warn('[HQServices] register: invalid args', name);
      return;
    }
    _registry[name] = service;

    // Resolve any callbacks waiting for this service
    if (_pending[name]) {
      _pending[name].forEach(fn => { try { fn(service); } catch (e) { console.warn('[HQServices] pending callback error', name, e); } });
      delete _pending[name];
    }
  }

  /**
   * Retrieve a registered service synchronously.
   * Returns null if not yet registered.
   * @param {string} name
   * @returns {*|null}
   */
  function get(name) {
    return _registry[name] !== undefined ? _registry[name] : null;
  }

  /**
   * Retrieve a service, calling back once it's available.
   * Resolves immediately if already registered.
   * @param {string}   name
   * @param {Function} callback  fn(service)
   */
  function require(name, callback) {
    if (_registry[name] !== undefined) {
      try { callback(_registry[name]); } catch (e) { console.warn('[HQServices] require callback error', name, e); }
      return;
    }
    if (!_pending[name]) _pending[name] = [];
    _pending[name].push(callback);
  }

  /**
   * List all registered service names.
   * @returns {string[]}
   */
  function list() {
    return Object.keys(_registry);
  }

  // ── Auto-register services that are already available ────────────────────

  function _autoRegister() {
    if (window.HQStore)     register('store',     window.HQStore);
    if (window.HQState)     register('state',     window.HQState);
    if (window.HQBus)       register('bus',       window.HQBus);
    if (window.HQBootstrap) register('bootstrap', window.HQBootstrap);
    if (window.HQNotif)     register('notifications', window.HQNotif);
    if (window.AUDHD_REGISTRY_HELPERS) register('moduleRegistry', window.AUDHD_REGISTRY_HELPERS);
    if (window.HQEnvironment) register('environment', window.HQEnvironment);
  }

  // Run immediately for anything already on window, then listen for late arrivals
  _autoRegister();

  [
    ['hq-store-ready',     () => { if (window.HQStore)  register('store',  window.HQStore);  if (window.HQBus) register('bus', window.HQBus); }],
    ['hq-state-ready',     () => { if (window.HQState)  register('state',  window.HQState);  }],
    ['hq-bootstrap-ready', () => { if (window.HQBootstrap) register('bootstrap', window.HQBootstrap); }],
    ['hq-core-ready',      () => { if (window.HQNotif)  register('notifications', window.HQNotif); }],
    ['hq-environment-ready', () => { if (window.HQEnvironment) register('environment', window.HQEnvironment); }],
  ].forEach(([evt, fn]) => window.addEventListener(evt, fn, { once: true }));

  // ── Public API ─────────────────────────────────────────────────────────────
  window.HQServices = { register, get, require, list };

  window.dispatchEvent(new CustomEvent('hq-services-ready'));

})();
