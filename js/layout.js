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
    tc.name = 'theme-color'; tc.content = '#f07900';
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
  const name    = safeProfile.full_name || currentUser?.email || 'User';
  const email   = currentUser?.email || '';
  const disc    = safeProfile.disciplines?.name || '';
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) || 'U';
  const navItems = buildNavItems(role);

  document.body.innerHTML = `
    <div class="app-layout">

      <!-- FIXED TOP HEADER -->
      <header class="app-header">
        <!-- Icon slot (aligns with rail) -->
        <div class="header-brand">
          <div class="header-brand-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93A10 10 0 0 0 4.93 19.07M4.93 4.93a10 10 0 0 0 14.14 14.14M12 2v2m0 18v-2m10-8h-2M4 12H2m15.66-6.34-1.42 1.42M7.76 16.24l-1.42 1.42m11.32 0-1.42-1.42M7.76 7.76 6.34 6.34"/></svg>
          </div>
        </div>

        <!-- App name + tagline -->
        <div class="header-appname">
          <span class="header-appname-title">EngPro App</span>
          <span class="header-appname-tag">Track. Manage. Deliver.</span>
        </div>
        <div class="header-user-badge" style="margin-left:16px;">
          <div class="header-avatar">${initials}</div>
          <div class="header-uname">${name}</div>
        </div>
        
        <div class="header-spacer"></div>
        
        <div class="header-right" style="margin-right:12px;">
          <span class="header-clock" id="topbar-clock"></span>
        </div>
      </header>

      <!-- BODY (below header) -->
      <div class="app-body">

        <!-- SIDEBAR RAIL -->
        <aside class="sidebar" id="sidebar">
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
        <h3 style="margin:0 0 8px;font-size:15px;font-weight:700;color:var(--text);">Sign Out</h3>
        <p style="margin:0 0 24px;font-size:13px;color:var(--text-3);">Are you sure you want to sign out?</p>
        <div style="display:flex;gap:10px;justify-content:flex-end;">
          <button onclick="document.getElementById('signout-modal').style.display='none'" style="padding:7px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;background:transparent;color:var(--text-3);border:1px solid var(--border-2);">Cancel</button>
          <button onclick="signOut()" style="padding:7px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;background:#e74c3c;color:#fff;border:none;">Sign Out</button>
        </div>
      </div>
    </div>

    <div id="toast-container"></div>
  `;

  // Clock
  const tick = () => {
    const el = document.getElementById('topbar-clock');
    if (el) el.textContent = new Date().toLocaleString('en-US', {
      weekday:'short', month:'short', day:'numeric', year:'numeric',
      hour:'2-digit', minute:'2-digit'
    });
  };
  // FIX [M5]: Store interval ID and clear any existing one before starting.
  // Previously accumulated intervals on every initLayout() call with no cleanup.
  if (window._clockInterval) clearInterval(window._clockInterval);
  tick(); window._clockInterval = setInterval(tick, 30000);

  if (typeof pageInit === 'function') await pageInit(safeProfile);
  if (typeof initMessaging === 'function') await initMessaging(safeProfile);
  
  // PWA registration + push subscription saving
  const VAPID_PUBLIC_KEY = 'BCzQfJUwT7SR9SY3IgFOPSw06s1IpKI-SDgQH9cKnFVvbx3IZUOMoE47OswI7_10vOQKqvrdQKe1BD0zwF1Y4SY';

  function _urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw     = atob(base64);
    return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js').then(async reg => {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') return;

      // Schedule daily reminder
      const sw = reg.active || reg.waiting || reg.installing;
      if (sw) {
        if (sw.state === 'activated') {
          sw.postMessage({ type: 'SCHEDULE_REMINDER' });
        } else {
          sw.addEventListener('statechange', function handler(e) {
            if (e.target.state === 'activated') {
              e.target.postMessage({ type: 'SCHEDULE_REMINDER' });
              e.target.removeEventListener('statechange', handler);
            }
          });
        }
      }

      // Subscribe to push and save to Supabase
      try {
        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly:      true,
          applicationServerKey: _urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
        const profile = getProfile();
        if (profile?.id) {
          await db.from('push_subscriptions').upsert({
            user_id:      profile.id,
            subscription: subscription.toJSON(),
          }, { onConflict: 'user_id' });
          console.log('[EngPro] Push subscription saved.');
        }
      } catch (err) {
        console.warn('[EngPro] Push subscription failed:', err);
      }
    });
  }
}

// ── NAV ITEMS ─────────────────────────────────────────────
const NAV_ICONS = {
  dashboard:   `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
  structure:   `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19V5h14v14"/><path d="M5 10h14M12 5v14"/></svg>`,
  input:       `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`,
  reports:     `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  users:       `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  admin:       `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93A10 10 0 0 0 4.93 19.07M4.93 4.93a10 10 0 0 0 14.14 14.14M12 2v2m0 18v-2m10-8h-2M4 12H2m15.66-6.34-1.42 1.42M7.76 16.24l-1.42 1.42m11.32 0-1.42-1.42M7.76 7.76 6.34 6.34"/></svg>`,
  settings:    `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
  targets:     `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
  model3d:     `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>`,
  erection:    `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>`,
  fabrication: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><line x1="8" y1="9" x2="10" y2="9"/></svg>`,
  support:     `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15l2 2 4-4"/></svg>`,
  weldmap:     `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2"/><path d="M12 2a10 10 0 0 1 0 20A10 10 0 0 1 12 2"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>`,
  testpkg:     `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"/></svg>`,
  material:    `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`,
  calcs:       `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/></svg>`,
  inquiry:     `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>`,
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
    { href: 'eng-calculations.html',   	  icon: NAV_ICONS.calcs,        label: 'Eng. Calculations',    roles: ALL_ROLES },
    { href: 'technical-query.html',    	  icon: NAV_ICONS.tq,           label: 'Technical Query',      roles: ALL_ROLES },
    { href: 'issues-concerns.html',    	  icon: NAV_ICONS.issues,       label: 'Issues & Concerns',    roles: ALL_ROLES },
    { href: 'project-inquiry.html',       icon: NAV_ICONS.inquiry,      label: 'Project Inquiry',      roles: ALL_ROLES },
    { href: 'manhours-input.html',  	  icon: NAV_ICONS.input,        label: 'Manhours Input',       roles: ALL_ROLES, dividerBefore: true },
	{ href: 'structure.html', 			  icon: NAV_ICONS.structure, 	label: 'Structure', 		   roles: [...LEAD_UP, 'engineer'] },
    { href: 'targets.html',            	  icon: NAV_ICONS.targets,      label: 'Targets',              roles: [...LEAD_UP, 'engineer'] },
    { href: 'reports.html',            	  icon: NAV_ICONS.reports,      label: 'Reports',              roles: [...LEAD_UP, 'document_controller'] },
    // FIX [M7]: Restricted users.html to LEAD_UP only — engineers should not manage user accounts.
    { href: 'users.html',              	  icon: NAV_ICONS.users,        label: 'Users',                roles: LEAD_UP },
    { href: 'admin.html',              	  icon: NAV_ICONS.admin,        label: 'Admin',                roles: ['admin'] },
  ];
  if (!role) return all;
  return all.filter(i => i.roles.includes(role));
}

function isActivePage(href) {
  const current = window.location.pathname.split('/').pop();
  return current === href;
}

function formatRole(role) {
  return { admin: 'Admin', lead_engineer: 'Lead Engineer', engineer: 'Engineer' }[role] || role;
}

function confirmSignOut() {
  const modal = document.getElementById('signout-modal');
  if (modal) { modal.style.display = 'flex'; }
}
