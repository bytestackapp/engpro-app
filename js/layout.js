// ============================================================
// LAYOUT — Fixed header + icon rail sidebar (hover expand)
// ============================================================
async function initLayout(pageTitle) {
  if (!document.querySelector('link[rel="manifest"]')) {
    const mf = document.createElement('link');
    mf.rel = 'manifest'; mf.href = '/manifest.json';
    document.head.appendChild(mf);
  }
  if (!document.querySelector('meta[name="theme-color"]')) {
    const tc = document.createElement('meta');
    tc.name = 'theme-color'; tc.content = document.documentElement.getAttribute('data-theme') === 'dark' ? '#111111' : '#ffffff';
    document.head.appendChild(tc);
  }
  
  if (!document.querySelector('link[rel="icon"]')) {
    const ic = document.createElement('link');
    ic.rel = 'icon'; ic.href = '/favicon.png'; ic.type = 'image/png';
    document.head.appendChild(ic);
  }  
  
  const session = await initAuth();
  if (!session) { window.location.href = '../index.html'; return; }

  const profile = getProfile();
  // Safe fallback — if DB profile missing, treat as admin locally so pages render
  // FIX [M6]: Changed fallback role from 'admin' to null.
  // Previously, a missing DB profile granted full admin nav access — a privilege escalation risk.
  const safeProfile = profile || { role: null, full_name: currentUser?.email?.split('@')[0] || 'User', disciplines: null };
  const role    = safeProfile.role;
  await loadPageGrants(safeProfile);
  if (!enforcePageAccess(safeProfile)) return;
  const name    = safeProfile.full_name || currentUser?.email || 'User';
  const email   = currentUser?.email || '';
  const disc    = safeProfile.disciplines?.name || '';
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) || 'U';
  const roleLabel = (role || '').replace(/_/g, ' ');
  const navItems = buildNavItems(role).filter(i => canOpenPage(i.href, role));

  document.body.innerHTML = `
    <div class="app-layout">

      <!-- FLOATING SIDEBAR -->
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-brand">
          <div class="header-brand-icon">
            <img src="/icons/logo.png" alt="Logo">
          </div>
          <div class="sidebar-brand-text">
            <span class="header-appname-title">EngPro App</span>
            <span class="header-appname-tag">Track. Manage. Deliver.</span>
          </div>
        </div>

        <nav class="sidebar-nav">
          ${navItems.map(item => `
          ${item.dividerBefore ? '<div style="height:1px;background:var(--border);margin:12px 10px;"></div>' : ''}
          <a href="${item.href}" class="nav-link ${isActivePage(item.href) ? 'active' : ''}" title="${item.label}">
            <span class="nav-icon" style="display:flex;align-items:center;justify-content:center;width:20px;height:20px;flex-shrink:0;">${item.icon}</span>
            <span class="nav-label">${item.label}</span>
          </a>
        `).join('')}
        </nav>

        <div class="sidebar-footer">
          <button class="signout-link" onclick="confirmSignOut()" title="Sign Out">
            <span class="nav-icon">${NAV_ICONS.signout}</span>
            <span class="signout-label">Sign Out</span>
          </button>
        </div>
      </aside>

      <!-- FLOATING TOP BAR -->
      <header class="app-header">
        <div class="header-title" id="header-title">${pageTitle || ''}</div>
        <div class="header-spacer"></div>

        <div class="header-user-badge">
          <div class="header-avatar">${initials}</div>
          <div class="header-user-text">
            <span class="header-uname">${name}</span>
            <span class="header-role">${roleLabel}</span>
          </div>
        </div>

        <div class="header-pill" id="header-actions">
          <button id="theme-btn" onclick="toggleTheme()" title="Switch light / dark mode" aria-label="Switch light or dark mode">
            <svg class="theme-icon-moon" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            <svg class="theme-icon-sun" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          </button>
          <button id="inbox-btn" onclick="openInbox()" title="Announcements" aria-label="Announcements" style="position:relative;">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <span id="inbox-badge" style="display:none;position:absolute;width:9px;height:9px;border-radius:50%;background:#ef4444;box-sizing:content-box;"></span>
          </button>
          <button id="refresh-data-btn" onclick="refreshMyCache()" title="Refresh data" aria-label="Refresh data">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          </button>
        </div>
      </header>

      <!-- BODY -->
      <div class="app-body">

        <!-- MAIN CONTENT -->
        <div class="main-area" id="main-area">
          <main class="page-content" id="page-content">
            <div class="loading-state"><div class="spinner"></div><span>Loading…</span></div>
          </main>
        </div>

      </div>
    </div>
	
	<div id="signout-modal" style="display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.6);backdrop-filter:blur(3px);align-items:center;justify-content:center;">
      <div style="background:var(--surface);border:1px solid var(--border-2);border-radius:var(--radius-lg);padding:28px;max-width:360px;width:90%;box-shadow:0 24px 64px rgba(0,0,0,0.5);">
        <h3 style="margin:0 0 8px;font-size:15px;font-weight:700;color:var(--text);display:flex;align-items:center;gap:6px;">
          ${NAV_ICONS.signout} Sign Out
        </h3>
        <p style="margin:0 0 24px;font-size:13px;color:var(--text-3);">Are you sure you want to sign out?</p>
        <div style="display:flex;gap:10px;justify-content:flex-end;">
          <button onclick="document.getElementById('signout-modal').style.display='none'" style="padding:7px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;background:transparent;color:var(--text-3);border:1px solid var(--border-2);">Cancel</button>
          <button onclick="signOut()" style="padding:7px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;background:#e74c3c;color:#fff;border:none;">Sign Out</button>
        </div>
      </div>
    </div>

    <div id="toast-container"></div>
    <style>
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes modal-in { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
    </style>

    <!-- CUSTOM CONFIRMATION MODAL -->
    <div id="confirm-modal" style="display:none;position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,0.6);backdrop-filter:blur(3px);align-items:center;justify-content:center;">
      <div style="background:var(--surface);border:1px solid var(--border-2);border-radius:var(--radius-lg);padding:28px;max-width:380px;width:90%;box-shadow:0 24px 64px rgba(0,0,0,0.5);animation:modal-in 0.18s ease;">
        <div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:18px;">
          <div id="confirm-modal-icon" style="flex-shrink:0;width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;"></div>
          <div>
            <h3 id="confirm-modal-title" style="margin:0 0 6px;font-size:15px;font-weight:700;color:var(--text);"></h3>
            <p id="confirm-modal-message" style="margin:0;font-size:13px;color:var(--text-3);line-height:1.5;"></p>
          </div>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;">
          <button id="confirm-modal-cancel" style="padding:7px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;background:transparent;color:var(--text-3);border:1px solid var(--border-2);">Cancel</button>
          <button id="confirm-modal-ok" style="padding:7px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:none;"></button>
        </div>
      </div>
    </div>

    <!-- LOADING OVERLAY -->
    <div id="loading-overlay" style="display:none;position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,0.55);backdrop-filter:blur(4px);align-items:center;justify-content:center;flex-direction:column;gap:16px;">
      <div style="width:48px;height:48px;border:3px solid rgba(255,255,255,0.15);border-top-color:#f07900;border-radius:50%;animation:spin 0.75s linear infinite;"></div>
      <span id="loading-overlay-text" style="color:#fff;font-size:14px;font-weight:600;letter-spacing:0.3px;opacity:0.9;">Sending…</span>
    </div>
  `;

  // Show a confirmation toast if we just reloaded because of the Refresh Data button
  if (sessionStorage.getItem('engpro_denied_toast')) {
    sessionStorage.removeItem('engpro_denied_toast');
    toast('You do not have access to that page. Ask an admin.', 'warning');
  }
  if (sessionStorage.getItem('engpro_show_refreshed_toast')) {
    sessionStorage.removeItem('engpro_show_refreshed_toast');
    toast('Page refreshed.', 'success');
  }

  if (typeof pageInit === 'function') await pageInit(safeProfile);
  {
    const h1 = document.querySelector('#page-content .page-header h1');
    const titleEl = document.getElementById('header-title');
    if (titleEl) titleEl.textContent = (h1 && h1.textContent.trim()) || pageTitle || 'EngPro';
  }
  if (typeof initMessaging === 'function') await initMessaging(safeProfile);
  initInbox(safeProfile);
  
  // PWA registration + push subscription saving
  const VAPID_PUBLIC_KEY = 'BCzQfJUwT7SR9SY3IgFOPSw06s1IpKI-SDgQH9cKnFVvbx3IZUOMoE47OswI7_10vOQKqvrdQKe1BD0zwF1Y4SY';

  function _urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw     = atob(base64);
    return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
  }

    if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {});

    if ('Notification' in window) {
      const startPush = async () => {
        try {
          const reg = await navigator.serviceWorker.register('/service-worker.js');
          if (Notification.permission === 'default') await Notification.requestPermission();
          if (Notification.permission !== 'granted') return;
          await navigator.serviceWorker.ready;

          if (reg.active) reg.active.postMessage({ type: 'SCHEDULE_REMINDER' });
          scheduleInPageReminder(reg);

          // Save the push subscription once per login session, not on every page
          if (sessionStorage.getItem('engpro_push_saved') === '1') return;
          const subscription = (await reg.pushManager.getSubscription()) ||
            await reg.pushManager.subscribe({
              userVisibleOnly:      true,
              applicationServerKey: _urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });
          const p = getProfile();
          if (p?.id) {
            const { error } = await db.from('push_subscriptions').upsert(
              { user_id: p.id, subscription: subscription.toJSON() },
              { onConflict: 'user_id' }
            );
            if (!error) sessionStorage.setItem('engpro_push_saved', '1');
          }
        } catch (err) {
          console.warn('[EngPro] Push setup failed:', err);
        }
      };

      // Browsers only allow the permission prompt after a user click
      if (Notification.permission === 'default') {
        document.addEventListener('click', startPush, { once: true });
      } else {
        startPush();
      }
    }
  }
}

// ── NAV ITEMS ─────────────────────────────────────────────
const NAV_ICONS = {
  dashboard:   `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
  structure:   `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 20.5V3.5h17v17"/><path d="M3.5 12h17M12 3.5v17"/></svg>`,
  input:       `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  reports:     `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  users:       `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  admin:       `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><line x1="2.5" y1="5.5" x2="21.5" y2="5.5"/><line x1="2.5" y1="12" x2="21.5" y2="12"/><line x1="2.5" y1="18.5" x2="21.5" y2="18.5"/><circle cx="8.5" cy="5.5" r="1.5"/><circle cx="15.5" cy="12" r="1.5"/><circle cx="11" cy="18.5" r="1.5"/></svg>`,
  settings:    `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
  targets:     `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8.5 12.2l2.2 2.2 4.8-5"/></svg>`,
  model3d:     `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>`,
  erection:    `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="16" x2="16" y2="16"/><line x1="12" y1="11" x2="12" y2="14"/><path d="M12 14c0 1 1 1 1 2s-1 1-1 1"/></svg>`,
  fabrication: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="17" x2="12" y2="14"/><line x1="12" y1="14" x2="15" y2="17"/><line x1="12" y1="14" x2="12" y2="11"/></svg>`,
  support:     `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="18" x2="15" y2="18"/><line x1="9" y1="18" x2="9" y2="13"/><line x1="9" y1="13" x2="14" y2="13"/></svg>`,
  weldmap:     `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2"/><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="17" x2="16" y2="17"/><path d="M9 15L10.5 17L12 15L13.5 17L15 15"/></svg>`,
  testpkg:     `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><circle cx="12" cy="16" r="3"/><line x1="12" y1="16" x2="13.5" y2="14.5"/></svg>`,
  material:    `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M2 7l10-5 10 5-10 5-10-5z"/><path d="M2 7v10l10 5 10-5V7"/><line x1="12" y1="12" x2="12" y2="22"/></svg>`,
  calcs:       `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/></svg>`,
  inquiry:     `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="6.5" width="19" height="14" rx="2"/><path d="M9 6.5V4.5a1.5 1.5 0 0 1 1.5-1.5h3a1.5 1.5 0 0 1 1.5 1.5v2"/><line x1="2.5" y1="12.5" x2="21.5" y2="12.5"/></svg>`,
  tq:          `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  issues:      `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  signout:     `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
};

function buildNavItems(role) {
  const ALL_ROLES = ['admin','manager','lead','engineer','checker','detailer','document_controller','material_control','material_engineer','tekla_detailer','tekla_modeller'];
  const LEAD_UP   = ['admin','manager','lead'];
  const all = [
    { href: 'dashboard.html',             icon: NAV_ICONS.dashboard,    label: 'Dashboard',            roles: ALL_ROLES },
    { href: '3d-model-manager.html',      icon: NAV_ICONS.model3d,      label: '3D Model Manager',     roles: ALL_ROLES, dividerBefore: true },
    { href: 'erection-drawings.html',     icon: NAV_ICONS.erection,     label: 'Erection Drawings',    roles: ALL_ROLES },
    { href: 'fabrication-drawings.html',  icon: NAV_ICONS.fabrication,  label: 'Fabrication Drawings', roles: ALL_ROLES },
    { href: 'support-drawings.html',   	  icon: NAV_ICONS.support,      label: 'Support Drawings',     roles: ALL_ROLES },
    { href: 'weld-map-drawings.html',  	  icon: NAV_ICONS.weldmap,      label: 'Weld Map Drawings',    roles: ALL_ROLES },
    { href: 'test-package.html',       	  icon: NAV_ICONS.testpkg,      label: 'Test Package',         roles: ALL_ROLES },
    { href: 'material-status.html',    	  icon: NAV_ICONS.material,     label: 'Material Status',      roles: ALL_ROLES },
    { href: 'eng-calculations.html',   	  icon: NAV_ICONS.calcs,        label: 'Construction Support', roles: ALL_ROLES },
    { href: 'technical-query.html',    	  icon: NAV_ICONS.tq,           label: 'Technical Query',      roles: ALL_ROLES },
    { href: 'issues-concerns.html',    	  icon: NAV_ICONS.issues,       label: 'Issues & Concerns',    roles: ALL_ROLES },
    { href: 'project-inquiry.html',       icon: NAV_ICONS.inquiry,      label: 'Project Inquiry',      roles: ALL_ROLES },
    { href: 'manhours-input.html',  	  icon: NAV_ICONS.input,        label: 'Manhours Input',       roles: ALL_ROLES, dividerBefore: true },
	{ href: 'structure.html', 			  icon: NAV_ICONS.structure, 	label: 'Structure', 		   roles: [...LEAD_UP, 'engineer'] },
    { href: 'targets.html',            	  icon: NAV_ICONS.targets,      label: 'Targets',              roles: [...LEAD_UP, 'engineer'] },
    { href: 'reports.html',            	  icon: NAV_ICONS.reports,      label: 'Reports',              roles: ALL_ROLES },
    { href: 'users.html',              	  icon: NAV_ICONS.users,        label: 'Users',                roles: ALL_ROLES },
    { href: 'admin.html',              	  icon: NAV_ICONS.admin,        label: 'Admin',                roles: [...LEAD_UP] },
  ];
  if (!role) return [];
  return all.filter(i => i.roles.includes(role));
}

function isActivePage(href) {
  const current = window.location.pathname.split('/').pop();
  return current === href;
}

function confirmSignOut() {
  const modal = document.getElementById('signout-modal');
  if (modal) { modal.style.display = 'flex'; }
}

function refreshMyCache() {
  invalidateAllCache();
  toast('Refreshing with the latest data…', 'info');
  sessionStorage.setItem('engpro_show_refreshed_toast', '1');
  setTimeout(() => window.location.reload(), 400);
}

// ── CUSTOM CONFIRMATION MODAL ────────────────────────────────────
/**
 * showConfirm({ title, message, confirmLabel, variant, onConfirm })
 * variant: 'danger' | 'warning' | 'info'  (default: 'danger')
 */
function showConfirm({ title = 'Are you sure?', message = '', confirmLabel = 'Confirm', variant = 'danger', onConfirm } = {}) {
  const modal   = document.getElementById('confirm-modal');
  const iconEl  = document.getElementById('confirm-modal-icon');
  const titleEl = document.getElementById('confirm-modal-title');
  const msgEl   = document.getElementById('confirm-modal-message');
  const okBtn   = document.getElementById('confirm-modal-ok');
  const cancelBtn = document.getElementById('confirm-modal-cancel');
  if (!modal) return;

  const VARIANTS = {
    danger:  { bg: 'rgba(231,76,60,0.12)', color: 'var(--red)', btnBg: 'var(--red)',
               icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>` },
    warning: { bg: 'rgba(243,156,18,0.12)', color: 'var(--amber)', btnBg: 'var(--amber)',
               icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f39c12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>` },
    info:    { bg: 'rgba(52,152,219,0.12)', color: 'var(--blue)', btnBg: 'var(--blue)',
               icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3498db" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>` },
  };
  const v = VARIANTS[variant] || VARIANTS.danger;

  iconEl.style.background = v.bg;
  iconEl.innerHTML = v.icon;
  titleEl.textContent = title;
  msgEl.textContent = message;
  okBtn.textContent = confirmLabel;
  okBtn.style.background = v.btnBg;
  okBtn.style.color = '#fff';

  const close = () => { modal.style.display = 'none'; };
  const newOk = okBtn.cloneNode(true);
  okBtn.parentNode.replaceChild(newOk, okBtn);
  const newCancel = cancelBtn.cloneNode(true);
  cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);

  document.getElementById('confirm-modal-ok').addEventListener('click', () => { close(); if (typeof onConfirm === 'function') onConfirm(); });
  document.getElementById('confirm-modal-cancel').addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); }, { once: true });

  modal.style.display = 'flex';
}

// ── LOADING OVERLAY ──────────────────────────────────────────────
/**
 * showLoadingOverlay(text)   — show the full-screen loading overlay
 * hideLoadingOverlay()       — hide it
 */
function showLoadingOverlay(text = 'Sending…') {
  if (!document.getElementById('_layout-anim-style')) {
    const s = document.createElement('style');
    s.id = '_layout-anim-style';
    s.textContent = `@keyframes spin{to{transform:rotate(360deg)}}@keyframes modal-in{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`;
    document.head.appendChild(s);
  }
  const el = document.getElementById('loading-overlay');
  const txt = document.getElementById('loading-overlay-text');
  if (!el) return;
  if (txt) txt.textContent = text;
  el.style.display = 'flex';
}
function hideLoadingOverlay() {
  const el = document.getElementById('loading-overlay');
  if (el) el.style.display = 'none';
}

// ── PAGE ACCESS GUARD ─────────────────────────────────────────
function enforcePageAccess(p) {
  const current = window.location.pathname.split('/').pop();
  if (!p?.role || p.is_active === false) {
    db.auth.signOut().finally(() => { window.location.href = '../index.html'; });
    return false;
  }
  const all     = buildNavItems('admin').map(i => i.href);
  const allowed = buildNavItems(p.role).map(i => i.href);
  if (current !== 'dashboard.html' && ((all.includes(current) && !allowed.includes(current)) || !canOpenPage(current, p.role))) {
    sessionStorage.setItem('engpro_denied_toast', '1');
    window.location.href = 'dashboard.html';
    return false;
  }
  return true;
}

// ── IN-PAGE DAILY REMINDER (3:30 PM PH, Mon–Sat, while app is open) ──
let _pageReminderTimer = null;
function scheduleInPageReminder(reg) {
  if (_pageReminderTimer) clearTimeout(_pageReminderTimer);
  const PH = 8 * 3600000;
  const ph = new Date(Date.now() + PH);
  let target = Date.UTC(ph.getUTCFullYear(), ph.getUTCMonth(), ph.getUTCDate(), 15, 30, 10) - PH;
  if (target <= Date.now()) target += 86400000;
  while (new Date(target + PH).getUTCDay() === 0) target += 86400000;

  _pageReminderTimer = setTimeout(async () => {
    try {
      const existing = await reg.getNotifications({ tag: 'daily-reminder' });
      if (!existing.length) {
        await reg.showNotification('EngPro Reminder', {
          body: "Don't forget to log your daily accomplishments! 📋",
          icon: '/icons/icon-192.png', badge: '/icons/icon-192.png',
          tag: 'daily-reminder', renotify: true, vibrate: [200, 100, 200],
          data: { url: '/pages/manhours-input.html', type: 'reminder' },
          actions: [{ action: 'open', title: 'Log Now' }]
        });
      }
    } catch (e) { /* ignore */ }
    scheduleInPageReminder(reg);
  }, target - Date.now());
}

// ── ANNOUNCEMENT INBOX ────────────────────────────────────────
let _inboxItems = [];

function _inboxSeenKey() { return 'engpro_inbox_seen_' + (getProfile()?.id || ''); }

function _inboxSeenTime() {
  const v = localStorage.getItem(_inboxSeenKey());
  return v ? new Date(v).getTime() : Date.now() - 7 * 86400000;
}

function _inboxIsForMe(a, p) {
  const ids = a.recipient_ids || [];
  switch (a.recipient_type) {
    case 'all':        return true;
    case 'group':      return ids.includes(p.discipline_id);
    case 'team':       return ids.includes(p.project_id);
    case 'individual': return ids.includes(p.id);
    default:           return false;
  }
}

async function initInbox(profile) {
  if (!profile?.id) return;
  try {
    const { data, error } = await db.from('announcements')
      .select('id, subject, body, created_at, recipient_type, recipient_ids, users:sender_id(full_name)')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    _inboxItems = (data || []).filter(a => _inboxIsForMe(a, profile));
    _inboxUpdateBadge();
  } catch (err) {
    console.warn('[EngPro] Inbox load failed:', err);
  }
}

function _inboxUpdateBadge() {
  const badge = document.getElementById('inbox-badge');
  if (!badge) return;
  const seen   = _inboxSeenTime();
  const unread = _inboxItems.filter(a => new Date(a.created_at).getTime() > seen).length;
  badge.style.display = unread ? 'block' : 'none';
  document.getElementById('inbox-btn')?.classList.toggle('has-unread', unread > 0);
}

function openInbox() {
  const old = document.getElementById('inbox-modal');
  if (old) old.remove();
  const seen = _inboxSeenTime();

  const rows = _inboxItems.length ? _inboxItems.map(a => {
    const isNew = new Date(a.created_at).getTime() > seen;
    const dt = new Date(a.created_at).toLocaleString('en-US', { month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit' });
    return `
      <div style="background:var(--surface-2);border:1px solid ${isNew ? '#f07900' : 'var(--border-2)'};border-radius:8px;padding:12px 14px;margin-bottom:8px;">
        <div style="display:flex;justify-content:space-between;gap:8px;">
          <div style="font-size:13px;font-weight:700;color:var(--text);">${esc(a.subject)}</div>
          <div style="font-size:10px;color:var(--text-4);white-space:nowrap;">${dt}</div>
        </div>
        <div style="font-size:12px;color:var(--text-3);margin:6px 0;white-space:pre-wrap;word-break:break-word;">${esc(a.body)}</div>
        <div style="font-size:10px;color:var(--text-4);">By: ${esc(a.users?.full_name) || '—'}</div>
      </div>`;
  }).join('') : `<div style="text-align:center;padding:32px;color:var(--text-3);font-size:13px;">No announcements.</div>`;

  const div = document.createElement('div');
  div.id = 'inbox-modal';
  div.style.cssText = 'position:fixed;inset:0;z-index:9990;background:rgba(0,0,0,0.65);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;';
  div.innerHTML = `
    <div style="background:var(--surface);border:1px solid var(--border-2);border-radius:14px;width:min(560px,94vw);max-height:80vh;display:flex;flex-direction:column;box-shadow:0 32px 80px rgba(0,0,0,0.6);overflow:hidden;">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--border-2);">
        <span style="font-size:14px;font-weight:700;color:var(--text);">Announcements</span>
        <button onclick="document.getElementById('inbox-modal').remove()" style="background:none;border:none;cursor:pointer;color:var(--text-3);font-size:18px;">✕</button>
      </div>
      <div style="padding:16px;overflow-y:auto;">${rows}</div>
    </div>`;
  div.addEventListener('click', e => { if (e.target === div) div.remove(); });
  document.body.appendChild(div);

  localStorage.setItem(_inboxSeenKey(), new Date().toISOString());
  _inboxUpdateBadge();
}

// ── THEME TOGGLE ──────────────────────────────────────────────
function toggleTheme() {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('engpro_theme', next); } catch (e) {}
  document.documentElement.setAttribute('data-theme', next);
  window.CHART_GRID   = next === 'dark' ? '#222' : '#e5e7eb';
  window.CHART_BORDER = next === 'dark' ? '#1c1c1c' : '#ffffff';

  const tc = document.querySelector('meta[name="theme-color"]');
  if (tc) tc.content = next === 'dark' ? '#111111' : '#ffffff';

  // Refresh any charts already on the page
  if (window.Chart && Chart.instances) {
    Object.values(Chart.instances).forEach(c => {
      Object.values(c.options.scales || {}).forEach(s => {
        if (s.grid && s.grid.display !== false) s.grid.color = window.CHART_GRID;
      });
      c.update();
    });
  }
}

// ── PAGE-SPECIFIC ACCESS (restricted pages need a grant from Admin) ──
const RESTRICTED_PAGES = ['material-status.html', 'eng-calculations.html', 'project-inquiry.html'];
let _pageGrants = new Set();

async function loadPageGrants(p) {
  _pageGrants = new Set();
  if (!p?.id || p.role === 'admin') return;
  try {
    const pages = await cachedQuery('page_grants_' + p.id, async () => {
      const { data, error } = await db.from('page_access').select('page').eq('user_id', p.id);
      if (error) throw error;
      return (data || []).map(r => r.page);
    }, 60 * 1000);
    (pages || []).forEach(k => _pageGrants.add(k));
  } catch (err) {
    console.warn('[EngPro] Could not load page access:', err);   // fails closed: no access
  }
}

function canOpenPage(href, role) {
  if (!RESTRICTED_PAGES.includes(href)) return true;
  if (role === 'admin') return true;
  return _pageGrants.has(href);
}