/* AuDHD HQ — Service Worker v20 */
/* Cache bump required whenever core/ files change.                   */
/* Bump CACHE string (e.g. v21) to force all clients to re-fetch.    */
/* v20 — Pass 2 audit: added all pages/*.css, hq-tokens.css,         */
/*        thought-jar.js, full symptom system, cleaned dead comment.  */
const CACHE = 'audhd-hq-v20';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',

  /* ── Index page assets ── */
  './pages/index.css',
  './pages/index.js',

  /* ── Page scripts ── */
  './pages/box-tracker.js',
  './pages/brain-dump.js',
  './pages/checkin.js',
  './pages/customize.js',
  './pages/data-sync.js',
  './pages/day-builder.js',
  './pages/day-view.js',
  './pages/deep-clean.compiled.js',
  './pages/dream-journal.js',
  './pages/firebird-protocol.js',
  './pages/global-tracker.js',
  './pages/health-tracker.js',
  './pages/idea-studio.js',
  './pages/kitchen-brain.js',
  './pages/life-admin.js',
  './pages/money-brain.js',
  './pages/monthly-planner.js',
  './pages/project-brain.js',
  './pages/recurring-events.js',
  './pages/routines-prepwork.js',
  './pages/social-brain.js',
  './pages/survival-mode.js',
  './pages/taskboard.js',
  './pages/thought-jar.js',   /* C-NEW-1: was orphaned from cache */
  './pages/timeline.js',
  './pages/tool-vault.js',
  './pages/walking-tracker.js',
  './pages/weekly-planner.js',

  /* ── Page CSS (C-NEW-3: all 37 page CSS files — required for offline styling) ── */
  './pages/404.css',
  './pages/audhdhq-feature-guide.css',
  './pages/audhdhq-setup-guide.css',
  './pages/box-tracker.css',
  './pages/brain-dump.css',
  './pages/checkin.css',
  './pages/create-account.css',
  './pages/customize.css',
  './pages/data-sync.css',
  './pages/day-builder.css',
  './pages/day-view.css',
  './pages/deep-clean.css',
  './pages/dream-journal.css',
  './pages/firebird-protocol.css',
  './pages/global-tracker.css',
  './pages/health-tracker.css',
  './pages/iconforge.css',
  './pages/idea-studio.css',
  './pages/invite.css',
  './pages/kitchen-brain.css',
  './pages/life-admin.css',
  './pages/login.css',
  './pages/money-brain.css',
  './pages/monthly-planner.css',
  './pages/notifications.css',
  './pages/project-brain.css',
  './pages/recurring-events.css',
  './pages/redirect.css',
  './pages/routines-prepwork.css',
  './pages/social-brain.css',
  './pages/survival-mode.css',
  './pages/taskboard.css',
  './pages/thought-jar.css',
  './pages/timeline.css',
  './pages/tool-vault.css',
  './pages/walking-tracker.css',
  './pages/weekly-planner.css',

  /* ── PWA icons ── */
  './icons/android/launchericon-192x192.png',
  './icons/android/launchericon-512x512.png',

  /* ── Core infrastructure ── */
  './core/hq-tokens.css',      /* M-NEW-6: was missing from cache — 252 design tokens */
  './core/hq-store.js',
  './core/hq-ready.js',
  './core/hq-shell.css',
  './core/hq-modal.css',
  './core/hq-modal.js',
  './core/hq-components.css',
  './core/hq-components.js',
  './core/hq-monthly-data.js',
  './core/hq-weekly-data.js',
  './core/hq-core.js',
  './core/_fab-cluster.js',
  './core/hq-notifications.js',
  './core/firebase-config.js',
  './core/hq-auth.js',
  './core/hq-module-registry.js',
  './core/hq-keys.js',
  './core/hq-migrate.js',
  './core/hq-renderer.js',
  './core/hq-deploy-gate.js',

  /* ── Symptom system (M-NEW-7: checkin + health-tracker offline broken without these) ── */
  './core/symptom-cache.js',
  './core/symptom-filters.js',
  './core/symptom-history-store.js',
  './core/symptom-index.js',
  './core/symptom-lazy.js',
  './core/symptom-search.js',
  './core/symptom-utils.js',
  './setup-symptoms.js',
  './data/symptoms/symptom-registry.js',
  './data/symptoms/condition-pools.js',
  './data/symptoms/category-registry.js',

  /* ── Runtime infrastructure ── */
  './core/runtime/runtime-state.js',
  './core/runtime/runtime-events.js',
  './core/runtime/runtime-bootstrap.js',
  './core/runtime/runtime-services.js',
  './core/runtime/runtime-observer.js',
  './core/runtime/runtime-validator.js',
  './core/runtime/runtime-schema-registry.js',
  './core/runtime/runtime-import-pipeline.js',
  './core/runtime/runtime-utils.js',
  './core/runtime/runtime-recurrence.js',
  './core/runtime/runtime-item-status.js',
  './core/runtime/runtime-notif-dedup.js',
  './core/runtime/runtime-cascade.js',
  './core/runtime/runtime-environment.js',

  /* ── Auth pages excluded — redirect logic changes by auth state ── */
  // './login.html'          — DO NOT CACHE
  // './create-account.html' — DO NOT CACHE
  // './invite.html'         — DO NOT CACHE

  /* ── Daily hubs ── */
  './checkin.html',
  './brain-dump.html',
  './thought-jar.html',
  './customize.html',

  /* ── Planning ── */
  './day-view.html',
  './timeline.html',
  './day-builder.html',
  './weekly-planner.html',
  './monthly-planner.html',
  './taskboard.html',

  /* ── Brains ── */
  './project-brain.html',
  './money-brain.html',
  './kitchen-brain.html',
  './life-admin.html',
  './social-brain.html',
  './idea-studio.html',

  /* ── Trackers ── */
  './global-tracker.html',
  './health-tracker.html',
  './walking-tracker.html',
  './dream-journal.html',
  './recurring-events.html',
  './routines-prepwork.html',
  './box-tracker.html',

  /* ── Settings ── */
  './data-sync.html',
  './notifications.html',
  './setup-wizard.html',

  /* ── Tools ── */
  './tool-vault.html',
  './iconforge.html',

  /* ── Support ── */
  './deep-clean.html',
  './firebird-protocol.html',
  './survival-mode.html',

  /* ── Docs / error pages ── */
  './404.html',
  './audhdhq-feature-guide.html',
  './audhdhq-setup-guide.html',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ includeUncontrolled: true }))
      .then(list => list.forEach(client =>
        client.postMessage({ type: 'SW_ACTIVATED', cache: CACHE })
      ))
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached || new Response('Offline – reconnect to use AuDHD HQ', {status:503}));
    })
  );
});

/* ── Notification click: open the right page ── */
self.addEventListener('notificationclick', evt => {
  evt.notification.close();

  const url = (evt.notification.data && evt.notification.data.url)
    ? evt.notification.data.url
    : './';

  evt.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(list => {
        for (const client of list) {
          if ('focus' in client) {
            client.focus();
            client.navigate(url);
            return;
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(url);
      })
  );
});

/* ── Notification close (optional tracking) ── */
self.addEventListener('notificationclose', evt => {
  // Dismissed without clicking — no action needed for local notifications
  // FCM: log to analytics here when FCM is activated
});

/*
  FCM PUSH STUB — leave this stub, activate when FCM is enabled:

  self.addEventListener('push', evt => {
    if (!evt.data) return;
    let payload;
    try { payload = evt.data.json(); }
    catch { payload = { title: 'AuDHD HQ', body: evt.data.text() }; }
    const title = payload.title || 'AuDHD HQ';
    const options = {
      body:    payload.body  || '',
      icon:    payload.icon  || './icons/android/launchericon-192x192.png',
      badge:                    './icons/android/launchericon-96x96.png',
      data:  { url: payload.url || './' },
      vibrate: [200, 100, 200]
    };
    evt.waitUntil(self.registration.showNotification(title, options));
  });
*/
