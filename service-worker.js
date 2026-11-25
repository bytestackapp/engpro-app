// ============================================================
// EngPro — Service Worker
// Handles: push notifications, notification clicks, best-effort daily reminder
// ============================================================

// ── INSTALL / ACTIVATE ──────────────────────────────────────
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim());
});

// NOTE: fetch is intentionally not intercepted (no offline caching).

// ── PUSH NOTIFICATIONS ──────────────────────────────────────
self.addEventListener('push', e => {
  let payload = { title: 'EngPro', body: '', sender: '', type: 'general', url: '/pages/dashboard.html' };
  try { if (e.data) payload = { ...payload, ...e.data.json() }; } catch {}

  const options = {
    body:     payload.body,
    icon:     '/icons/icon-192.png',
    badge:    '/icons/icon-192.png',
    tag:      payload.type,
    renotify: true,
    vibrate:  [200, 100, 200],
    data:     { url: payload.url, sender: payload.sender, body: payload.body, title: payload.title, type: payload.type },
    actions:  payload.type === 'reminder'
      ? [{ action: 'open', title: 'Log Now' }]
      : [{ action: 'open', title: 'View' }]
  };

  e.waitUntil(self.registration.showNotification(payload.title, options));
});

// ── NOTIFICATION CLICK ──────────────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const data = e.notification.data || {};
  const isReminder = data.type === 'reminder' || e.notification.tag === 'daily-reminder';

  e.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = clients.find(c => c.url.startsWith(self.location.origin));

    // Reminder → go straight to the page given in the notification
    if (isReminder) {
      const url = new URL(data.url || '/pages/manhours-input.html', self.location.origin).href;
      if (existing) {
        try { await existing.focus(); } catch {}
        if ('navigate' in existing) {
          try { await existing.navigate(url); return; } catch {}
        }
      }
      await self.clients.openWindow(url);
      return;
    }

    // Announcement → open the app and show the announcement popup
    let target = existing;
    if (!target) {
      target = await self.clients.openWindow(self.location.origin + '/pages/dashboard.html');
      await new Promise(r => setTimeout(r, 2000));
    } else {
      try { await target.focus(); } catch {}
    }

    if (target) {
      target.postMessage({
        type:   'SHOW_ANNOUNCEMENT',
        title:  data.title  || e.notification.title,
        body:   data.body   || e.notification.body,
        sender: data.sender || '',
      });
    }
  })());
});

// ── DAILY REMINDER (3:30 PM PH time, Mon–Sat) — best effort ──
// Browsers may stop an idle service worker, so this can be missed.
// layout.js also schedules the same reminder while the app is open.
let _reminderTimeout = null;

function msUntilNextReminder() {
  const PH_OFFSET = 8 * 3600000;
  const ph = new Date(Date.now() + PH_OFFSET);
  let target = Date.UTC(ph.getUTCFullYear(), ph.getUTCMonth(), ph.getUTCDate(), 15, 30, 0) - PH_OFFSET;
  if (target <= Date.now()) target += 86400000;
  while (new Date(target + PH_OFFSET).getUTCDay() === 0) target += 86400000; // skip Sunday
  return target - Date.now();
}

function scheduleReminder() {
  if (_reminderTimeout) clearTimeout(_reminderTimeout);

  _reminderTimeout = setTimeout(async () => {
    try {
      const existing = await self.registration.getNotifications({ tag: 'daily-reminder' });
      if (!existing.length) {
        await self.registration.showNotification('EngPro Reminder', {
          body:     "Don't forget to log your daily accomplishments! 📋",
          icon:     '/icons/icon-192.png',
          badge:    '/icons/icon-192.png',
          tag:      'daily-reminder',
          renotify: true,
          vibrate:  [200, 100, 200],
          data:     { url: '/pages/manhours-input.html', type: 'reminder' },
          actions:  [{ action: 'open', title: 'Log Now' }]
        });
      }
    } catch {}
    scheduleReminder();
  }, msUntilNextReminder());
}

// ── MESSAGE FROM CLIENT ──────────────────────────────────────
self.addEventListener('message', e => {
  if (e.data?.type === 'SCHEDULE_REMINDER') scheduleReminder();
  if (e.data?.type === 'CANCEL_REMINDER')  { if (_reminderTimeout) clearTimeout(_reminderTimeout); }
});

scheduleReminder();
