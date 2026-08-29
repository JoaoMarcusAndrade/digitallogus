/* ============================================================
   BiblioGestor — Utilitários de UI (ícones, toast, modal, fmt)
   ============================================================ */

const constUI = {
  ICONS: {
    dashboard: '<path d="M3 3h8v8H3V3zm10 0h8v5h-8V3zM3 13h8v8H3v-8zm10 3h8v5h-8v-5z"/>',
    books: '<path d="M4 3h11v2H4V3zm0 9h11v2H4v-2zm0-6h11v2H4V6zm13-3h3v14h-3V3zM4 15h11v2H4v-2z"/><path d="M4 3v16M15 3v16"/>',
    users: '<path d="M16 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-8 2a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-3.3 0-8 1.7-8 4v2h11v-2c0-2.3-2-4-3-4zm8 0c-.6 0-1.4.1-2.2.3 2.3 1.4 2.2 3.7 2.2 3.7v1h6v-2c0-2.3-2-4-6-4z"/>',
    loans: '<path d="M3 4h18v2H3V4zm2 4h14v2H5V8zm2 4h10v2H7v-2zm2 4h6v2H9v-2zm2 4h2v2h-2v-2z"/><path d="M5 4v16M19 4v16"/>',
    reports: '<path d="M5 3h14a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm2 5h10v2H7V8zm0 4h6v2H7v-2zm0 4h10v2H7v-2z"/>',
    search: '<path d="M10 2a8 8 0 1 0 4.9 14.3l5 5L21.3 20l-5-5A8 8 0 0 0 10 2zm0 2a6 6 0 1 1 0 12 6 6 0 0 1 0-12z"/>',
    bell: '<path d="M12 2a1 1 0 0 1 1 1v1a5 5 0 0 1 4 4.9V14l2 3v1H5v-1l2-3V8.9A5 5 0 0 1 11 4V3a1 1 0 0 1 1-1zm-2 17h4a2 2 0 0 1-4 0z"/>',
    settings: '<path d="M9.4 3h5.2l.6 2.4a7 7 0 0 1 1.9 1.1l2.4-.6 2.6 4.5-1.9 1.7c.1.6.1 1.2 0 1.8l1.9 1.7-2.6 4.5-2.4-.6a7 7 0 0 1-1.9 1.1l-.6 2.4H9.4l-.6-2.4a7 7 0 0 1-1.9-1.1l-2.4.6-2.6-4.5 1.9-1.7a7 7 0 0 1 0-1.8L1.9 9.4l2.6-4.5 2.4.6a7 7 0 0 1 1.9-1.1L9.4 3zm2.6 7a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>',
    plus: '<path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5z"/>',
    edit: '<path d="M3 17.3V21h3.7L19.4 8.3a2.1 2.1 0 0 0-3-3L3 17.3zM18.7 4l1.3 1.3a2.1 2.1 0 0 1 0 3l-1 1-3-3 1-1a2.1 2.1 0 0 1 1.7-.3z"/>',
    trash: '<path d="M6 7h12l-1 14H7L6 7zm3-3h6l1 2H8l1-2z"/>',
    check: '<path d="M9 16.2l-3.5-3.5L4 14.2 9 19.2 20 8.2l-1.5-1.5z"/>',
    close: '<path d="M6.4 5L5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12 19 6.4 17.6 5 12 10.6z"/>',
    menu: '<path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z"/>',
    arrowBack: '<path d="M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20v-2z"/>',
    eye: '<path d="M12 5c-5 0-9 3.1-9 7s4 7 9 7 9-3.1 9-7-4-7-9-7zm0 2.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 7.5zm0 2a2.5 2.5 0 1 0 2.5 2.5A2.5 2.5 0 0 0 12 9.5z"/>',
    download: '<path d="M11 3h2v9l3-3 1.4 1.4L12 16l-5.4-5.6L8 9l3 3V3zM5 17h14v2H5v-2z"/>',
    calendar: '<path d="M6 2v2h12V2h2v20h-2V22H6v2H4V2h2zm0 4v14h12V6H6zm2 2h2v2h-2V8zm6 0h2v2h-2V8zM8 12h2v2H8v-2zm6 0h2v2h-2v-2zM8 16h2v2H8v-2zm6 0h2v2h-2v-2z"/>'
  }
};

function icon(name, cls) {
  const p = (window.constUI && constUI.ICONS[name]) || '';
  return '<svg class="' + (cls || 'icon') + '" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' + p + '</svg>';
}

/* ---------- Formatação ---------- */

function fmtDate(d) {
  if (!d) return '—';
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt)) return '—';
  return dt.toLocaleDateString('pt-BR');
}

function fmtDateTime(d) {
  if (!d) return '—';
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt)) return '—';
  return dt.toLocaleDateString('pt-BR') + ' ' + dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function fmtMoney(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function diffDias(prevista) {
  const p = new Date(prevista);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  p.setHours(0, 0, 0, 0);
  return Math.round((p - hoje) / 86400000);
}

function initials(nome) {
  return nome.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
}

function escapeHtml(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

/* ---------- Paginação ---------- */

function paginationHTML(ini, total, perPage, pages, pg) {
  if (total <= perPage) return '';
  let btns = '';
  for (let i = 1; i <= pages; i++)
    btns += '<button class="page-btn' + (i === pg ? ' active' : '') + '" data-page="' + i + '">' + i + '</button>';
  return '<div class="pagination">' +
    '<span class="pagination-info">Exibindo ' + (ini + 1) + '–' + Math.min(ini + perPage, total) + ' de ' + total + '</span>' +
    '<div class="pagination-pages">' +
      '<button class="page-btn" data-page="prev" ' + (pg <= 1 ? 'disabled' : '') + '>‹</button>' +
      btns +
      '<button class="page-btn" data-page="next" ' + (pg >= pages ? 'disabled' : '') + '>›</button>' +
    '</div>' +
  '</div>';
}

function atualizarPaginacao(card, ini, total, perPage, pages, pg) {
  const html = paginationHTML(ini, total, perPage, pages, pg);
  const exist = card.querySelector('.pagination');
  if (!html) { if (exist) exist.remove(); return null; }
  if (exist) exist.outerHTML = html;
  else card.insertAdjacentHTML('beforeend', html);
  return card.querySelector('.pagination');
}

/* ---------- Toast ---------- */

function toast(msg, tipo) {
  const container = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = 'toast toast-' + (tipo || 'info');
  const ic = tipo === 'success' ? 'check' : tipo === 'danger' ? 'close' : tipo === 'warn' ? 'bell' : 'check';
  t.innerHTML = '<div class="toast-chip">' + icon(ic, 'icon') + '</div><span>' + msg + '</span>';
  container.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 300);
  }, 3500);
}

/* ---------- Modal ---------- */

function openModal(html, opts) {
  const root = document.getElementById('modal-root');
  const modal = root.querySelector('.modal');
  modal.className = 'modal' + (opts && opts.size ? ' modal-' + opts.size : '');
  modal.innerHTML = html;
  root.hidden = false;
  document.body.classList.add('modal-open');
  const f = modal.querySelector('input, select, textarea');
  if (f) setTimeout(() => f.focus(), 60);
  return modal;
}

function closeModal() {
  document.getElementById('modal-root').hidden = true;
  document.body.classList.remove('modal-open');
}

function confirmBox(mensagem, onOk, opts) {
  const root = document.getElementById('confirm-root');
  const box = root.querySelector('.modal');
  const danger = opts && opts.danger;
  box.innerHTML =
    '<div class="modal-body confirm-body">' +
      '<div class="confirm-icon ' + (danger ? 'danger' : 'warn') + '">' + icon(danger ? 'trash' : 'bell', 'icon') + '</div>' +
      '<h3 class="confirm-title">' + (opts && opts.title ? opts.title : 'Confirmar ação') + '</h3>' +
      '<p class="confirm-text">' + mensagem + '</p>' +
      '<div class="confirm-actions">' +
        '<button class="btn" data-confirm-cancel>Cancelar</button>' +
        '<button class="btn ' + (danger ? 'btn-danger' : 'btn-primary') + '" data-confirm-ok>' + (opts && opts.okText ? opts.okText : 'Confirmar') + '</button>' +
      '</div>' +
    '</div>';
  root.hidden = false;
  document.body.classList.add('modal-open');

  const close = () => { root.hidden = true; document.body.classList.remove('modal-open'); };
  box.querySelector('[data-confirm-cancel]').onclick = close;
  box.querySelector('[data-confirm-ok]').onclick = () => { close(); onOk && onOk(); };
  root.querySelector('.modal-backdrop').onclick = close;
}

/* ---------- Badge/status ---------- */

function dl(label, value) {
  return '<div class="dl-item"><div class="dl-label">' + label + '</div><div class="dl-value">' + value + '</div></div>';
}

function statusBadge(status) {
  const map = {
    disponivel:   { cls: 'badge badge-green',  txt: 'Disponível' },
    emprestado:   { cls: 'badge badge-amber',  txt: 'Emprestado' },
    esgotado:     { cls: 'badge badge-red',    txt: 'Esgotado' },
    ativo:        { cls: 'badge badge-green',  txt: 'Ativo' },
    inativo:      { cls: 'badge badge-gray',   txt: 'Inativo' },
    devolvido:    { cls: 'badge badge-blue',   txt: 'Devolvido' },
    atrasado:     { cls: 'badge badge-red',    txt: 'Atrasado' },
    renovado:     { cls: 'badge badge-amber',  txt: 'Renovado' }
  };
  const s = map[status] || { cls: 'badge badge-gray', txt: status };
  return '<span class="' + s.cls + '">' + s.txt + '</span>';
}

/* ---------- Inputs helpers ---------- */

function inputControl(label, inner, hint) {
  return '<label class="field"><span class="field-label">' + label + '</span>' + inner +
    (hint ? '<span class="field-hint">' + hint + '</span>' : '') + '</label>';
}

window.constUI = constUI;
window.icon = icon;
window.fmtDate = fmtDate;
window.fmtDateTime = fmtDateTime;
window.fmtMoney = fmtMoney;
window.diffDias = diffDias;
window.initials = initials;
window.escapeHtml = escapeHtml;
window.toast = toast;
window.openModal = openModal;
window.closeModal = closeModal;
window.confirmBox = confirmBox;
window.dl = dl;
window.statusBadge = statusBadge;
window.inputControl = inputControl;
window.paginationHTML = paginationHTML;
window.atualizarPaginacao = atualizarPaginacao;