/* ============================================================
   BiblioGestor — Utilitários de formatação
   ============================================================ */

export function fmtDate(d) {
  if (!d) return '—';
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt)) return '—';
  return dt.toLocaleDateString('pt-BR');
}

export function fmtDateTime(d) {
  if (!d) return '—';
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt)) return '—';
  return dt.toLocaleDateString('pt-BR') + ' ' + dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function diffDias(prevista) {
  const p = new Date(prevista);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  p.setHours(0, 0, 0, 0);
  return Math.round((p - hoje) / 86400000);
}

export function initials(nome) {
  return nome.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
}

export function escapeHtml(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

export function paginationInfo(ini, total, perPage) {
  return 'Exibindo ' + (ini + 1) + '–' + Math.min(ini + perPage, total) + ' de ' + total;
}
