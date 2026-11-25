// ============================================================
// TOAST NOTIFICATIONS
// ============================================================
function toast(message, type = 'success') {
  const container = document.getElementById('toast-container') || createToastContainer();
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
  const iconEl = document.createElement('span');
  iconEl.className = 'toast-icon';
  iconEl.textContent = icons[type] || '•';
  const msgEl = document.createElement('span');
  msgEl.textContent = message;
  t.append(iconEl, msgEl);
  container.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3500);
}

function createToastContainer() {
  const c = document.createElement('div');
  c.id = 'toast-container';
  document.body.appendChild(c);
  return c;
}

// ============================================================
// MODAL SYSTEM
// ============================================================
function openModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.add('active'); document.body.style.overflow = 'hidden'; }
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.remove('active'); document.body.style.overflow = ''; }
}

function confirmDialog(message, onConfirm) {
  const existing = document.getElementById('confirm-modal-dynamic');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'confirm-modal-dynamic';
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="modal-box modal-sm">
      <div class="modal-header"><h3>Confirm Action</h3></div>
      <div class="modal-body"><p>${esc(message)}</p></div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="document.getElementById('confirm-modal-dynamic').remove(); document.body.style.overflow=''">Cancel</button>
        <button class="btn btn-danger" id="confirm-ok">Confirm</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  document.getElementById('confirm-ok').onclick = () => {
    modal.remove();
    document.body.style.overflow = '';
    onConfirm();
  };
}

// ============================================================
// FORMATTING HELPERS
// ============================================================
function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatHours(h) {
  if (h === null || h === undefined) return '0.00';
  return parseFloat(h).toFixed(2);
}

// ============================================================
// PAGINATION HELPER
// ============================================================
// FIX [M9]: Replaced fragile function.toString() serialisation in onclick handlers.
// Previously used (${onPageChange})(n) which breaks for non-global or closure functions.
// Now uses data-page attributes + a single delegated listener on the container.
function renderPagination(containerId, total, page, perPage, onPageChange) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) { container.innerHTML = ''; return; }

  let html = `<div class="pagination">`;
  html += `<button class="page-btn" data-page="${page - 1}" ${page === 1 ? 'disabled' : ''}>‹ Prev</button>`;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) {
      html += `<button class="page-btn ${i === page ? 'active' : ''}" data-page="${i}" ${i === page ? 'disabled' : ''}>${i}</button>`;
    } else if (i === page - 3 || i === page + 3) {
      html += `<span class="page-ellipsis">…</span>`;
    }
  }
  html += `<button class="page-btn" data-page="${page + 1}" ${page === totalPages ? 'disabled' : ''}>Next ›</button>`;
  html += `</div>`;
  container.innerHTML = html;

  // Single delegated listener — works with any named global function
  container.querySelector('.pagination').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-page]');
    if (!btn || btn.disabled) return;
    const p = parseInt(btn.dataset.page, 10);
    if (!isNaN(p) && typeof window[onPageChange] === 'function') window[onPageChange](p);
  });
}


// ============================================================
// EXCEL EXPORT (SheetJS via CDN)
// ============================================================
function exportToExcel(data, filename = 'export') {
  if (typeof XLSX === 'undefined') { toast('Excel library not loaded', 'error'); return; }
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().slice(0,10)}.xlsx`);
}

// ============================================================
// DEBOUNCE
// ============================================================
function debounce(fn, delay = 300) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

// ============================================================
// HTML Escaping
// ============================================================
function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ============================================================
// LOCAL CACHE FOR REFERENCE/LOOKUP DATA (sessionStorage, per-tab)
// ============================================================
const CACHE_PREFIX   = 'engpro_cache_';
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes — adjust per table if needed

async function cachedQuery(key, queryFn, ttlMs = DEFAULT_TTL_MS) {
  const cacheKey = CACHE_PREFIX + key;
  try {
    const raw = sessionStorage.getItem(cacheKey);
    if (raw) {
      const { data, ts } = JSON.parse(raw);
      if (Date.now() - ts < ttlMs) return data;
    }
  } catch (e) { /* corrupted entry — fall through and refetch */ }

  const data = await queryFn();
  try {
    sessionStorage.setItem(cacheKey, JSON.stringify({ data, ts: Date.now() }));
  } catch (e) { /* storage full/unavailable — non-fatal, skip caching */ }
  return data;
}

function invalidateCache(key) {
  sessionStorage.removeItem(CACHE_PREFIX + key);
}

function invalidateAllCache() {
  Object.keys(sessionStorage)
    .filter(k => k.startsWith(CACHE_PREFIX))
    .forEach(k => sessionStorage.removeItem(k));
}

