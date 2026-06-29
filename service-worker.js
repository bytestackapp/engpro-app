// ============================================================
// EngPro — Service Worker
// Handles: PWA caching, push notifications, daily 3:30 PM PH reminder
// ============================================================

const CACHE_NAME = 'engpro-v1';

// ── INSTALL ─────────────────────────────────────────────────
self.addEventListener('install', e => {
  self.skipWaiting();
});

// ── ACTIVATE ────────────────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── FETCH (network-first, cache fallback) ───────────────────
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});

// ── PUSH NOTIFICATIONS ──────────────────────────────────────
self.addEventListener('push', e => {
  let payload = { title: 'EngPro', body: '', type: 'general', url: '/pages/dashboard.html' };
  try { if (e.data) payload = { ...payload, ...e.data.json() }; } catch {}

  const options = {
    body:    payload.body,
    icon:    '/icons/icon-192.png',
    badge:   '/icons/icon-192.png',
    tag:     payload.type,          // groups same-type notifications (replaces old one)
    renotify: true,
    vibrate: [200, 100, 200],
    data:    { url: payload.url },
    actions: payload.type === 'reminder'
      ? [{ action: 'open', title: 'Log Now' }]
      : [{ action: 'open', title: 'View' }]
  };

  e.waitUntil(self.registration.showNotification(payload.title, options));
});

// ── NOTIFICATION CLICK ──────────────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = self.location.origin + '/pages/dashboard.html';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      // Focus existing open tab if found
      for (const client of clients) {
        if (client.url.startsWith(self.location.origin)) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      // Otherwise open a new window
      return self.clients.openWindow(url);
    })
  );
});

// ── DAILY REMINDER SCHEDULER (3:30 PM PH time, Mon–Sat) ─────
// The client pings the SW via postMessage to schedule.
// SW uses setTimeout chained to the next 3:30 PM PH occurrence.

let _reminderTimeout = null;

function msUntilNextReminder() {
  // PH time = UTC+8
  const now     = new Date();
  const nowUTC  = now.getTime() + now.getTimezoneOffset() * 60000;
  const nowPH   = new Date(nowUTC + 8 * 3600000);

  // Target: 15:30 PH today
  const target  = new Date(nowPH);
  target.setHours(15, 30, 0, 0);

  // If already past 3:30 PM today, move to tomorrow
  if (nowPH >= target) target.setDate(target.getDate() + 1);

  // Skip Sunday (0) — advance to Monday
  while (target.getDay() === 0) target.setDate(target.getDate() + 1);

  return target.getTime() - nowPH.getTime();
}

function scheduleReminder() {
  if (_reminderTimeout) clearTimeout(_reminderTimeout);

  const ms = msUntilNextReminder();

  _reminderTimeout = setTimeout(async () => {
    // Double-check it's Mon–Sat in PH time before firing
    const now    = new Date();
    const nowUTC = now.getTime() + now.getTimezoneOffset() * 60000;
    const nowPH  = new Date(nowUTC + 8 * 3600000);
    const dow    = nowPH.getDay(); // 0=Sun

    if (dow !== 0) {
      await self.registration.showNotification('EngPro Reminder', {
        body:    "Don't forget to log your daily accomplishments! 📋",
        icon:    '/icons/icon-192.png',
        badge:   '/icons/icon-192.png',
        tag:     'daily-reminder',
        renotify: true,
        vibrate: [200, 100, 200],
        data:    { url: '/pages/manhours-input.html' },
        actions: [{ action: 'open', title: 'Log Now' }]
      });
    }

    // Schedule next day
    scheduleReminder();
  }, ms);
}

// ── MESSAGE FROM CLIENT ──────────────────────────────────────
self.addEventListener('message', e => {
  if (e.data?.type === 'SCHEDULE_REMINDER') scheduleReminder();
  if (e.data?.type === 'CANCEL_REMINDER')  { if (_reminderTimeout) clearTimeout(_reminderTimeout); }
});

// Auto-start reminder schedule on SW activation
scheduleReminder();
