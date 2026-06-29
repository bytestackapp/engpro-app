// ============================================================
// TOAST NOTIFICATIONS
// ============================================================
function toast(message, type = 'success') {
  const container = document.getElementById('toast-container') || createToastContainer();
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
  t.innerHTML = `<span class="toast-icon">${icons[type] || '•'}</span><span>${message}</span>`;
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
  const existing = document.getElementById('confirm-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'confirm-modal';
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="modal-box modal-sm">
      <div class="modal-header"><h3>Confirm Action</h3></div>
      <div class="modal-body"><p>${message}</p></div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="document.getElementById('confirm-modal').remove(); document.body.style.overflow=''">Cancel</button>
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
// SEARCHABLE DROPDOWN
// ============================================================
function initSearchableDropdown(inputId, hiddenId, items, labelKey = 'label', valueKey = 'value') {
  const input = document.getElementById(inputId);
  const hidden = document.getElementById(hiddenId);
  if (!input || !hidden) return;

  let dropdown = null;
  let filtered = [...items];

  function showDropdown() {
    if (dropdown) dropdown.remove();
    dropdown = document.createElement('div');
    dropdown.className = 'search-dropdown';
    filtered.forEach(item => {
      const opt = document.createElement('div');
      opt.className = 'search-option';
      opt.textContent = item[labelKey];
      opt.onclick = () => {
        input.value = item[labelKey];
        hidden.value = item[valueKey];
        dropdown.remove(); dropdown = null;
        input.dispatchEvent(new Event('change'));
      };
      dropdown.appendChild(opt);
    });
    if (filtered.length === 0) {
      dropdown.innerHTML = '<div class="search-option no-results">No results found</div>';
    }
    input.parentElement.style.position = 'relative';
    input.parentElement.appendChild(dropdown);
  }

  input.addEventListener('input', () => {
    const q = input.value.toLowerCase();
    filtered = items.filter(i => i[labelKey].toLowerCase().includes(q));
    hidden.value = '';
    showDropdown();
  });

  input.addEventListener('focus', () => { filtered = [...items]; showDropdown(); });

  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && dropdown && !dropdown.contains(e.target)) {
      dropdown.remove(); dropdown = null;
    }
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
// SIDEBAR ACTIVE STATE
// ============================================================
function setActiveSidebarLink() {
  const path = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') && path.includes(link.getAttribute('href').replace('.html', ''))) {
      link.classList.add('active');
    }
  });
}
