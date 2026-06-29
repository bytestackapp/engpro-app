// ============================================================
// EngPro — Messaging / Announcement System
// Injected globally by layout.js for admin, manager, lead only
// ============================================================

const CAN_MESSAGE_ROLES = ['admin', 'manager', 'lead'];

// ── SVG ICONS ────────────────────────────────────────────────
const _MI = {
  send:      `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
  compose:   `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`,
  templates: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/></svg>`,
  logs:      `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>`,
  close:     `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  edit:      `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  trash:     `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
  use:       `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
  globe:     `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  group:     `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  folder:    `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
  user:      `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  list:      `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
};

// ── PUBLIC ENTRY POINT ──────────────────────────────────────
async function initMessaging(profile) {
  if (!CAN_MESSAGE_ROLES.includes(profile?.role)) return;
  _msgProfile = profile;
  await new Promise(r => setTimeout(r, 0));
  _injectMessageButton(profile);
  _injectMessageModal();
  await _loadMsgMeta();
}

// ── STATE ───────────────────────────────────────────────────
let _msgProfile     = null;
let _msgTemplates   = [];
let _msgUsers       = [];
let _msgDisciplines = [];
let _msgProjects    = [];
let _msgActiveTab   = 'compose';
let _selectedRtype  = 'all';
let _selectedRids   = [];
let _editingTplId   = null;

// ── INJECT BUTTON INTO HEADER ────────────────────────────────
function _injectMessageButton(profile) {
  const clockEl = document.getElementById('topbar-clock');
  if (!clockEl) {
    console.warn('[EngPro] topbar-clock not found — Message button not injected');
    return;
  }
  console.log('[EngPro] Injecting Message button for role:', profile?.role);

  const btn = document.createElement('button');
  btn.id        = 'msg-open-btn';
  btn.title     = 'Send Announcement';
  btn.innerHTML = `
    <span style="color:#f07900;line-height:0;">${_MI.send}</span>
    <span>Message</span>
  `;
  btn.style.cssText = `
    display:flex;align-items:center;gap:6px;padding:5px 14px;
    border-radius:8px;border:1px solid #f07900;
    background:rgba(240,121,0,0.1);color:#f07900;
    font-size:12px;font-weight:600;cursor:pointer;
    margin-left:12px;position:relative;
    transition:background .15s;
  `;
  btn.onmouseover = () => btn.style.background = 'rgba(240,121,0,0.2)';
  btn.onmouseout  = () => btn.style.background = 'rgba(240,121,0,0.1)';
  btn.onclick     = () => openMessageModal('compose');
  clockEl.parentElement.insertBefore(btn, clockEl.nextSibling);
}

// ── INJECT MODAL HTML ────────────────────────────────────────
function _injectMessageModal() {
  const div = document.createElement('div');
  div.id = 'msg-modal-wrap';
  div.innerHTML = `
    <!-- Main modal -->
    <div id="msg-modal" style="display:none;position:fixed;inset:0;z-index:9998;
         background:rgba(0,0,0,0.65);backdrop-filter:blur(4px);
         align-items:center;justify-content:center;">
      <div style="background:var(--surface);border:1px solid var(--border-2);
           border-radius:14px;width:min(660px,95vw);max-height:88vh;
           display:flex;flex-direction:column;box-shadow:0 32px 80px rgba(0,0,0,0.6);overflow:hidden;">

        <!-- Header -->
        <div style="display:flex;align-items:center;justify-content:space-between;
             padding:16px 20px;border-bottom:1px solid var(--border-2);flex-shrink:0;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="color:#f07900;line-height:0;">${_MI.send}</span>
            <span style="font-size:15px;font-weight:700;color:var(--text);">Announcements</span>
          </div>
          <button onclick="closeMessageModal()" style="background:none;border:none;cursor:pointer;
               color:var(--text-3);padding:4px;border-radius:6px;line-height:0;">
            ${_MI.close}
          </button>
        </div>

        <!-- Tabs -->
        <div style="display:flex;border-bottom:1px solid var(--border-2);flex-shrink:0;">
          <button id="msg-tab-compose" onclick="switchMsgTab('compose')" class="msg-tab-btn"
            style="flex:1;padding:11px 8px;background:none;border:none;border-bottom:2px solid transparent;
                   font-size:12px;font-weight:600;cursor:pointer;color:var(--text-3);
                   display:flex;align-items:center;justify-content:center;gap:5px;
                   transition:color .15s,border-color .15s;">
            ${_MI.compose} Compose
          </button>
          <button id="msg-tab-templates" onclick="switchMsgTab('templates')" class="msg-tab-btn"
            style="flex:1;padding:11px 8px;background:none;border:none;border-bottom:2px solid transparent;
                   font-size:12px;font-weight:600;cursor:pointer;color:var(--text-3);
                   display:flex;align-items:center;justify-content:center;gap:5px;
                   transition:color .15s,border-color .15s;">
            ${_MI.templates} Templates
          </button>
          <button id="msg-tab-logs" onclick="switchMsgTab('logs')" class="msg-tab-btn"
            style="flex:1;padding:11px 8px;background:none;border:none;border-bottom:2px solid transparent;
                   font-size:12px;font-weight:600;cursor:pointer;color:var(--text-3);
                   display:flex;align-items:center;justify-content:center;gap:5px;
                   transition:color .15s,border-color .15s;">
            ${_MI.logs} Logs
          </button>
        </div>

        <!-- Body -->
        <div id="msg-modal-body" style="flex:1;overflow-y:auto;padding:20px;">
          <div class="loading-state"><div class="spinner"></div><span>Loading…</span></div>
        </div>
      </div>
    </div>

    <!-- Saved Templates sub-modal -->
    <div id="msg-tpl-modal" style="display:none;position:fixed;inset:0;z-index:9999;
         background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);
         align-items:center;justify-content:center;">
      <div style="background:var(--surface);border:1px solid var(--border-2);
           border-radius:14px;width:min(580px,95vw);max-height:80vh;
           display:flex;flex-direction:column;box-shadow:0 32px 80px rgba(0,0,0,0.6);overflow:hidden;">

        <!-- Sub-modal header -->
        <div style="display:flex;align-items:center;justify-content:space-between;
             padding:14px 18px;border-bottom:1px solid var(--border-2);flex-shrink:0;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="color:#f07900;line-height:0;">${_MI.list}</span>
            <span style="font-size:14px;font-weight:700;color:var(--text);">Saved Templates</span>
          </div>
          <button onclick="_closeTplModal()" style="background:none;border:none;cursor:pointer;
               color:var(--text-3);padding:4px;border-radius:6px;line-height:0;">
            ${_MI.close}
          </button>
        </div>

        <!-- Sub-modal body -->
        <div id="msg-tpl-modal-body" style="flex:1;overflow-y:auto;padding:16px;">
        </div>
      </div>
    </div>

    <!-- Edit Template sub-modal -->
    <div id="msg-tpl-edit-modal" style="display:none;position:fixed;inset:0;z-index:10000;
         background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);
         align-items:center;justify-content:center;">
      <div style="background:var(--surface);border:1px solid var(--border-2);
           border-radius:14px;width:min(500px,95vw);
           display:flex;flex-direction:column;box-shadow:0 32px 80px rgba(0,0,0,0.6);overflow:hidden;">
        <div style="display:flex;align-items:center;justify-content:space-between;
             padding:14px 18px;border-bottom:1px solid var(--border-2);">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="color:#f07900;line-height:0;">${_MI.edit}</span>
            <span style="font-size:14px;font-weight:700;color:var(--text);">Edit Template</span>
          </div>
          <button onclick="_closeTplEditModal()" style="background:none;border:none;cursor:pointer;
               color:var(--text-3);padding:4px;border-radius:6px;line-height:0;">
            ${_MI.close}
          </button>
        </div>
        <div style="padding:18px;display:flex;flex-direction:column;gap:10px;">
          <input id="tpl-edit-name" type="text" placeholder="Template name *"
            style="padding:8px 10px;border-radius:8px;border:1px solid var(--border-2);
                   background:var(--surface-2);color:var(--text);font-size:13px;width:100%;box-sizing:border-box;" />
          <input id="tpl-edit-subject" type="text" placeholder="Subject *"
            style="padding:8px 10px;border-radius:8px;border:1px solid var(--border-2);
                   background:var(--surface-2);color:var(--text);font-size:13px;width:100%;box-sizing:border-box;" />
          <textarea id="tpl-edit-body" rows="5" placeholder="Message body *"
            style="padding:8px 10px;border-radius:8px;border:1px solid var(--border-2);
                   background:var(--surface-2);color:var(--text);font-size:13px;
                   resize:vertical;font-family:inherit;width:100%;box-sizing:border-box;"></textarea>
          <div style="display:flex;justify-content:flex-end;gap:8px;">
            <button onclick="_closeTplEditModal()"
              style="padding:8px 16px;border-radius:8px;border:1px solid var(--border-2);
                     background:transparent;color:var(--text-3);font-size:12px;font-weight:600;cursor:pointer;">
              Cancel
            </button>
            <button onclick="_updateTemplate()"
              style="padding:8px 20px;border-radius:8px;background:#f07900;color:#fff;
                     border:none;font-size:12px;font-weight:700;cursor:pointer;">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(div);
}

// ── OPEN / CLOSE ─────────────────────────────────────────────
function openMessageModal(tab = 'compose') {
  const modal = document.getElementById('msg-modal');
  if (modal) modal.style.display = 'flex';
  switchMsgTab(tab);
}

function closeMessageModal() {
  const modal = document.getElementById('msg-modal');
  if (modal) modal.style.display = 'none';
}

// NO backdrop click close — intentionally removed per request

function _closeTplModal() {
  const m = document.getElementById('msg-tpl-modal');
  if (m) m.style.display = 'none';
}

function _closeTplEditModal() {
  const m = document.getElementById('msg-tpl-edit-modal');
  if (m) m.style.display = 'none';
  _editingTplId = null;
}

// ── TAB SWITCHER ─────────────────────────────────────────────
function switchMsgTab(tab) {
  _msgActiveTab = tab;
  document.querySelectorAll('.msg-tab-btn').forEach(b => {
    const t = b.id.replace('msg-tab-', '');
    b.style.color       = t === tab ? '#f07900' : 'var(--text-3)';
    b.style.borderColor = t === tab ? '#f07900' : 'transparent';
  });
  const body = document.getElementById('msg-modal-body');
  if (!body) return;
  if (tab === 'compose')   _renderCompose(body);
  if (tab === 'templates') _renderTemplates(body);
  if (tab === 'logs')      _renderLogs(body);
}

// ── LOAD META ────────────────────────────────────────────────
async function _loadMsgMeta() {
  const [u, d, p, t] = await Promise.all([
    db.from('users').select('id, full_name, role, discipline_id, project_id').eq('is_active', true),
    db.from('disciplines').select('id, name').order('name'),
    db.from('projects').select('id, name, code').order('name'),
    db.from('message_templates').select('*').order('name'),
  ]);
  _msgUsers       = u.data || [];
  _msgDisciplines = d.data || [];
  _msgProjects    = p.data || [];
  _msgTemplates   = t.data || [];
}

// ── COMPOSE TAB ──────────────────────────────────────────────
function _renderCompose(body) {
  const tplOpts = _msgTemplates.map(t =>
    `<option value="${t.id}">${t.name}</option>`).join('');

  body.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:14px;">

      <!-- Template picker -->
      <div>
        <label style="font-size:11px;font-weight:600;color:var(--text-3);text-transform:uppercase;
               letter-spacing:.06em;display:block;margin-bottom:5px;color:#f07900;">Load Template (optional)</label>
        <div style="display:flex;gap:8px;">
          <select id="msg-tpl-select" style="flex:1;padding:8px 10px;border-radius:8px;
               border:1px solid var(--border-2);background:var(--surface-2);
               color:var(--text);font-size:13px;">
            <option value="">— None —</option>
            ${tplOpts}
          </select>
          <button onclick="_applyMsgTemplate()" style="padding:8px 14px;border-radius:8px;
               border:1px solid var(--border-2);background:var(--surface-2);
               color:var(--text);font-size:12px;font-weight:600;cursor:pointer;">Apply</button>
        </div>
      </div>

      <!-- Subject -->
      <div>
        <label style="font-size:11px;font-weight:600;color:var(--text-3);text-transform:uppercase;
               letter-spacing:.06em;display:block;margin-bottom:5px;color:#f07900;">Subject *</label>
        <input id="msg-subject" type="text" placeholder="Enter subject…"
          style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--border-2);
                 background:var(--surface-2);color:var(--text);font-size:13px;box-sizing:border-box;" />
      </div>

      <!-- Recipients -->
      <div>
        <label style="font-size:11px;font-weight:600;color:var(--text-3);text-transform:uppercase;
               letter-spacing:.06em;display:block;margin-bottom:5px;color:#f07900;">Recipients *</label>
        <div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap;">
          <button class="msg-rtype-btn" data-rtype="all" onclick="_setRecipientType('all')"
            style="display:flex;align-items:center;gap:5px;padding:5px 14px;border-radius:8px;
                   font-size:12px;font-weight:600;cursor:pointer;
                   border:1px solid var(--border-2);background:var(--surface-2);color:var(--text-3);">
            ${_MI.globe} All
          </button>
          <button class="msg-rtype-btn" data-rtype="group" onclick="_setRecipientType('group')"
            style="display:flex;align-items:center;gap:5px;padding:5px 14px;border-radius:8px;
                   font-size:12px;font-weight:600;cursor:pointer;
                   border:1px solid var(--border-2);background:var(--surface-2);color:var(--text-3);">
            ${_MI.group} Group (Discipline)
          </button>
          <button class="msg-rtype-btn" data-rtype="team" onclick="_setRecipientType('team')"
            style="display:flex;align-items:center;gap:5px;padding:5px 14px;border-radius:8px;
                   font-size:12px;font-weight:600;cursor:pointer;
                   border:1px solid var(--border-2);background:var(--surface-2);color:var(--text-3);">
            ${_MI.folder} Team (Project)
          </button>
          <button class="msg-rtype-btn" data-rtype="individual" onclick="_setRecipientType('individual')"
            style="display:flex;align-items:center;gap:5px;padding:5px 14px;border-radius:8px;
                   font-size:12px;font-weight:600;cursor:pointer;
                   border:1px solid var(--border-2);background:var(--surface-2);color:var(--text-3);">
            ${_MI.user} Individual
          </button>
        </div>
        <div id="msg-recipient-detail" style="display:none;"></div>
      </div>

      <!-- Body -->
      <div>
        <label style="font-size:11px;font-weight:600;color:var(--text-3);text-transform:uppercase;
               letter-spacing:.06em;display:block;margin-bottom:5px;color:#f07900;">Message *</label>
        <textarea id="msg-body" rows="6" placeholder="Type your message…"
          style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--border-2);
                 background:var(--surface-2);color:var(--text);font-size:13px;
                 resize:vertical;box-sizing:border-box;font-family:inherit;"></textarea>
      </div>

      <!-- Send -->
      <div style="display:flex;justify-content:flex-end;">
        <button onclick="_sendAnnouncement()"
          style="display:flex;align-items:center;gap:6px;padding:9px 24px;border-radius:8px;
                 background:#f07900;color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer;">
          ${_MI.send} Send Announcement
        </button>
      </div>
    </div>
  `;
  _setRecipientType('all');
}

function _setRecipientType(type) {
  _selectedRtype = type;
  _selectedRids  = [];

  document.querySelectorAll('.msg-rtype-btn').forEach(b => {
    const active = b.dataset.rtype === type;
    b.style.background  = active ? '#f07900'        : 'var(--surface-2)';
    b.style.color       = active ? '#fff'            : 'var(--text-3)';
    b.style.borderColor = active ? '#f07900'         : 'var(--border-2)';
  });

  const detail = document.getElementById('msg-recipient-detail');
  if (!detail) return;

  if (type === 'all') {
    detail.style.display = 'none';
    detail.innerHTML = '';
    return;
  }

  detail.style.display = 'block';

  if (type === 'group') {
    detail.innerHTML = `
      <div style="font-size:11px;color:var(--text-3);margin-bottom:6px;">Select discipline(s):</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;">
        ${_msgDisciplines.map(d => `
        <label style="display:flex;align-items:center;gap:5px;padding:5px 10px;border-radius:8px;
               border:1px solid var(--border-2);background:var(--surface-2);cursor:pointer;font-size:12px;color:var(--text);">
          <input type="checkbox" value="${d.id}" onchange="_toggleRid(this)"
                 style="accent-color:#f07900;" /> ${d.name}
        </label>`).join('')}
      </div>`;
  } else if (type === 'team') {
    detail.innerHTML = `
      <div style="font-size:11px;color:var(--text-3);margin-bottom:6px;">Select project(s):</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;">
        ${_msgProjects.map(p => `
        <label style="display:flex;align-items:center;gap:5px;padding:5px 10px;border-radius:8px;
               border:1px solid var(--border-2);background:var(--surface-2);cursor:pointer;font-size:12px;color:var(--text);">
          <input type="checkbox" value="${p.id}" onchange="_toggleRid(this)"
                 style="accent-color:#f07900;" />
          <span style="font-family:monospace;color:#f07900;">${p.code}</span>&nbsp;${p.name}
        </label>`).join('')}
      </div>`;
  } else if (type === 'individual') {
    detail.innerHTML = `
      <div style="font-size:11px;color:var(--text-3);margin-bottom:6px;">Search and select user(s):</div>
      <input type="text" id="msg-user-search" placeholder="Type a name to search…"
             oninput="_filterMsgUsers(this.value)"
             style="width:100%;padding:7px 10px;border-radius:8px;border:1px solid var(--border-2);
                    background:var(--surface-2);color:var(--text);font-size:12px;
                    box-sizing:border-box;margin-bottom:6px;" />
      <div id="msg-user-list" style="max-height:200px;overflow-y:auto;display:flex;
           flex-direction:column;gap:3px;border:1px solid var(--border-2);
           border-radius:8px;padding:6px;background:var(--surface-2);
           scrollbar-width:thin;scrollbar-color:#f07900 transparent;">
        ${_msgUsers.length
          ? _renderUserCheckboxes(_msgUsers)
          : '<div style="padding:12px;text-align:center;color:var(--text-3);font-size:12px;">No users found</div>'
        }
      </div>`;
  }
}

function _renderUserCheckboxes(users) {
  if (!users.length) return `<div style="padding:12px;text-align:center;color:var(--text-3);font-size:12px;">No matching users</div>`;
  return users.map(u => `
    <label style="display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:6px;
           cursor:pointer;font-size:12px;color:var(--text);transition:background .1s;"
           onmouseover="this.style.background='rgba(255,255,255,0.04)'"
           onmouseout="this.style.background='transparent'">
      <input type="checkbox" value="${u.id}" onchange="_toggleRid(this)"
             style="accent-color:#f07900;flex-shrink:0;"
             ${_selectedRids.includes(u.id) ? 'checked' : ''} />
      <span style="flex:1;">${u.full_name || '—'}</span>
      <span style="color:var(--text-3);font-size:10px;background:var(--surface);
            padding:2px 6px;border-radius:4px;">${u.role || ''}</span>
    </label>`).join('');
}

function _filterMsgUsers(q) {
  const list = document.getElementById('msg-user-list');
  if (!list) return;
  const filtered = q.trim()
    ? _msgUsers.filter(u => u.full_name?.toLowerCase().includes(q.toLowerCase()))
    : _msgUsers;
  list.innerHTML = _renderUserCheckboxes(filtered);
}

function _toggleRid(checkbox) {
  const val = checkbox.value;
  if (checkbox.checked) { if (!_selectedRids.includes(val)) _selectedRids.push(val); }
  else { _selectedRids = _selectedRids.filter(id => id !== val); }
}

function _applyMsgTemplate() {
  const sel = document.getElementById('msg-tpl-select');
  if (!sel?.value) return;
  const tpl = _msgTemplates.find(t => t.id === sel.value);
  if (!tpl) return;
  const subj = document.getElementById('msg-subject');
  const body = document.getElementById('msg-body');
  if (subj) subj.value = tpl.subject || '';
  if (body) body.value = tpl.body    || '';
}

async function _sendAnnouncement() {
  const subject = document.getElementById('msg-subject')?.value?.trim();
  const body    = document.getElementById('msg-body')?.value?.trim();
  if (!subject) { toast('Subject is required.', 'error'); return; }
  if (!body)    { toast('Message body is required.', 'error'); return; }
  if (_selectedRtype !== 'all' && !_selectedRids.length) {
    toast('Please select at least one recipient.', 'error'); return;
  }
  const tplId = document.getElementById('msg-tpl-select')?.value || null;
  const { data: insertedData, error } = await db.from('announcements').insert({
    subject, body,
    template_id:    tplId || null,
    sender_id:      _msgProfile.id,
    recipient_type: _selectedRtype,
    recipient_ids:  _selectedRids.length ? _selectedRids : null,
  }).select('id').single();
  if (error) { toast('Failed to send: ' + error.message, 'error'); return; }

  // Trigger push notifications via Edge Function
  try {
    const FN_BASE = window.__SUPABASE_URL__
      ? `${window.__SUPABASE_URL__}/functions/v1`
      : 'https://dtjsgvajdgqjlindbhxw.supabase.co/functions/v1';

    const { data: { session } } = await db.auth.getSession();
    const res = await fetch(`${FN_BASE}/send-announcement`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ announcement_id: insertedData.id }),
    });
    const result = await res.json();
    if (result.sent > 0) {
      toast(`Announcement sent! Notified ${result.sent} user(s).`, 'success');
    } else {
      toast('Announcement saved. No active push subscriptions found.', 'success');
    }
  } catch (pushErr) {
    console.warn('[EngPro] Push notification failed:', pushErr);
    toast('Announcement saved, but push notification failed.', 'success');
  }

  closeMessageModal();
}

// ── TEMPLATES TAB ────────────────────────────────────────────
function _renderTemplates(body) {
  body.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:14px;">
      <div style="background:var(--surface-2);border:1px solid var(--border-2);
           border-radius:10px;padding:14px;">
        <div style="font-size:11px;font-weight:600;color:#f07900;text-transform:uppercase;
             letter-spacing:.06em;margin-bottom:12px;">New Template</div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <input id="tpl-name" type="text" placeholder="Template name *"
            style="padding:8px 10px;border-radius:8px;border:1px solid var(--border-2);
                   background:var(--surface);color:var(--text);font-size:13px;
                   width:100%;box-sizing:border-box;" />
          <input id="tpl-subject" type="text" placeholder="Subject *"
            style="padding:8px 10px;border-radius:8px;border:1px solid var(--border-2);
                   background:var(--surface);color:var(--text);font-size:13px;
                   width:100%;box-sizing:border-box;" />
          <textarea id="tpl-body" rows="5" placeholder="Message body *"
            style="padding:8px 10px;border-radius:8px;border:1px solid var(--border-2);
                   background:var(--surface);color:var(--text);font-size:13px;
                   resize:vertical;font-family:inherit;width:100%;box-sizing:border-box;"></textarea>
          <div style="display:flex;justify-content:flex-end;gap:8px;">
            <button onclick="_openTplModal()"
              style="display:flex;align-items:center;gap:5px;padding:8px 16px;border-radius:8px;
                     border:1px solid var(--border-2);background:var(--surface);
                     color:var(--text);font-size:12px;font-weight:600;cursor:pointer;">
              ${_MI.list} Saved Templates
            </button>
            <button onclick="_saveTemplate()"
              style="display:flex;align-items:center;gap:5px;padding:8px 20px;border-radius:8px;
                     background:#f07900;color:#fff;border:none;font-size:12px;font-weight:700;cursor:pointer;">
              ${_MI.use} Save Template
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ── SAVED TEMPLATES SUB-MODAL ────────────────────────────────
function _openTplModal() {
  const modal = document.getElementById('msg-tpl-modal');
  if (modal) modal.style.display = 'flex';
  _refreshTplModalList();
}

function _refreshTplModalList() {
  const body = document.getElementById('msg-tpl-modal-body');
  if (!body) return;
  if (!_msgTemplates.length) {
    body.innerHTML = `<div style="text-align:center;padding:32px;color:var(--text-3);font-size:13px;">No saved templates yet.</div>`;
    return;
  }
  body.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:8px;">
      ${_msgTemplates.map(t => `
      <div style="background:var(--surface-2);border:1px solid var(--border-2);
           border-radius:8px;padding:12px 14px;display:flex;
           align-items:flex-start;justify-content:space-between;gap:10px;">
        <div style="flex:1;min-width:0;">
          <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:2px;">${t.name}</div>
          <div style="font-size:12px;color:var(--text-3);margin-bottom:3px;">${t.subject}</div>
          <div style="font-size:11px;color:var(--text-4);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            ${t.body?.slice(0, 90)}${(t.body?.length || 0) > 90 ? '…' : ''}
          </div>
        </div>
        <div style="display:flex;gap:5px;flex-shrink:0;">
          <button onclick="_useTemplate('${t.id}')" title="Use in Compose"
            style="display:flex;align-items:center;gap:4px;padding:5px 10px;border-radius:6px;
                   font-size:11px;font-weight:600;border:1px solid var(--border-2);
                   background:transparent;color:var(--text-3);cursor:pointer;">
            ${_MI.use} Use
          </button>
          <button onclick="_openEditTemplate('${t.id}')" title="Edit"
            style="display:flex;align-items:center;gap:4px;padding:5px 10px;border-radius:6px;
                   font-size:11px;font-weight:600;border:1px solid var(--border-2);
                   background:transparent;color:var(--text-3);cursor:pointer;">
            ${_MI.edit} Edit
          </button>
          <button onclick="_deleteTemplate('${t.id}')" title="Delete"
            style="display:flex;align-items:center;gap:4px;padding:5px 8px;border-radius:6px;
                   font-size:11px;font-weight:600;border:1px solid #c0392b44;
                   background:transparent;color:#e74c3c;cursor:pointer;">
            ${_MI.trash}
          </button>
        </div>
      </div>`).join('')}
    </div>
  `;
}

function _openEditTemplate(id) {
  const tpl = _msgTemplates.find(t => t.id === id);
  if (!tpl) return;
  _editingTplId = id;
  document.getElementById('tpl-edit-name').value    = tpl.name    || '';
  document.getElementById('tpl-edit-subject').value = tpl.subject || '';
  document.getElementById('tpl-edit-body').value    = tpl.body    || '';
  const modal = document.getElementById('msg-tpl-edit-modal');
  if (modal) modal.style.display = 'flex';
}

async function _updateTemplate() {
  if (!_editingTplId) return;
  const name    = document.getElementById('tpl-edit-name')?.value?.trim();
  const subject = document.getElementById('tpl-edit-subject')?.value?.trim();
  const body    = document.getElementById('tpl-edit-body')?.value?.trim();
  if (!name || !subject || !body) { toast('All fields are required.', 'error'); return; }

  const { data, error } = await db.from('message_templates')
    .update({ name, subject, body })
    .eq('id', _editingTplId)
    .select().single();

  if (error) { toast('Failed to update template.', 'error'); return; }

  _msgTemplates = _msgTemplates.map(t => t.id === _editingTplId ? data : t);
  _closeTplEditModal();
  _refreshTplModalList();
  toast('Template updated!', 'success');
}

async function _saveTemplate() {
  const name    = document.getElementById('tpl-name')?.value?.trim();
  const subject = document.getElementById('tpl-subject')?.value?.trim();
  const body    = document.getElementById('tpl-body')?.value?.trim();
  if (!name || !subject || !body) { toast('All fields are required.', 'error'); return; }

  const { data, error } = await db.from('message_templates').insert({
    name, subject, body, created_by: _msgProfile.id
  }).select().single();

  if (error) { toast('Failed to save template.', 'error'); return; }

  _msgTemplates.push(data);
  document.getElementById('tpl-name').value    = '';
  document.getElementById('tpl-subject').value = '';
  document.getElementById('tpl-body').value    = '';
  toast('Template saved!', 'success');
}

async function _deleteTemplate(id) {
  if (!confirm('Delete this template?')) return;
  const { error } = await db.from('message_templates').delete().eq('id', id);
  if (error) { toast('Failed to delete.', 'error'); return; }
  _msgTemplates = _msgTemplates.filter(t => t.id !== id);
  _refreshTplModalList();
  toast('Template deleted.', 'success');
}

function _useTemplate(id) {
  const tpl = _msgTemplates.find(t => t.id === id);
  if (!tpl) return;
  _closeTplModal();
  switchMsgTab('compose');
  setTimeout(() => {
    const sel  = document.getElementById('msg-tpl-select');
    const subj = document.getElementById('msg-subject');
    const body = document.getElementById('msg-body');
    if (sel)  sel.value  = id;
    if (subj) subj.value = tpl.subject || '';
    if (body) body.value = tpl.body    || '';
  }, 80);
}

// ── LOGS TAB ─────────────────────────────────────────────────
async function _renderLogs(body) {
  body.innerHTML = `<div class="loading-state"><div class="spinner"></div><span>Loading…</span></div>`;

  const { data: logs } = await db.from('announcements')
    .select('*, users:sender_id(full_name)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (!logs?.length) {
    body.innerHTML = `
      <div style="text-align:center;padding:40px;color:var(--text-3);font-size:13px;">
        No announcements sent yet.
      </div>`;
    return;
  }

  body.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <div style="font-size:12px;color:var(--text-3);">${logs.length} announcement(s)</div>
      <button onclick="_clearLogs()"
        style="display:flex;align-items:center;gap:5px;padding:5px 14px;border-radius:8px;
               font-size:12px;font-weight:600;border:1px solid #c0392b44;
               background:transparent;color:#e74c3c;cursor:pointer;">
        ${_MI.trash} Clear All
      </button>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px;">
      ${logs.map(l => {
        const dt = new Date(l.created_at).toLocaleString('en-PH', {
          month:'short', day:'numeric', year:'numeric',
          hour:'2-digit', minute:'2-digit'
        });
        const rtype = l.recipient_type === 'all'
          ? 'All users'
          : l.recipient_type === 'group' ? `Group (${(l.recipient_ids||[]).length} discipline(s))`
          : l.recipient_type === 'team'  ? `Team (${(l.recipient_ids||[]).length} project(s))`
          : `${(l.recipient_ids||[]).length} individual(s)`;
        return `
        <div style="background:var(--surface-2);border:1px solid var(--border-2);
             border-radius:8px;padding:12px 14px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
            <div style="font-size:13px;font-weight:600;color:var(--text);">${l.subject}</div>
            <div style="font-size:10px;color:var(--text-4);white-space:nowrap;">${dt}</div>
          </div>
          <div style="font-size:12px;color:var(--text-3);margin:4px 0;">
            ${l.body?.slice(0,120)}${(l.body?.length||0) > 120 ? '…' : ''}
          </div>
          <div style="display:flex;gap:12px;margin-top:6px;">
            <span style="font-size:10px;color:var(--text-4);">By: ${l.users?.full_name || '—'}</span>
            <span style="font-size:10px;color:var(--text-4);">To: ${rtype}</span>
          </div>
        </div>`;
      }).join('')}
    </div>
  `;
}

async function _clearLogs() {
  if (!confirm('Delete all announcement logs? This cannot be undone.')) return;
  const { error } = await db.from('announcements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) { toast('Failed to clear logs.', 'error'); return; }
  toast('Logs cleared.', 'success');
  _renderLogs(document.getElementById('msg-modal-body'));
}
