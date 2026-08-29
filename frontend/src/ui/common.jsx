/* ============================================================
   BiblioGestor — Componentes de apoio (paginação, vazio)
   ============================================================ */

import { Icon } from './icons.jsx';
import { paginationInfo } from './format.js';

export function Pagination({ ini, total, perPage, page, onPage }) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  if (total <= perPage) return null;

  const btns = [];
  for (let i = 1; i <= pages; i++) {
    btns.push(
      <button key={i} className={`page-btn${i === page ? ' active' : ''}`} onClick={() => onPage(i)}>
        {i}
      </button>
    );
  }

  return (
    <div className="pagination">
      <span className="pagination-info">{paginationInfo(ini, total, perPage)}</span>
      <div className="pagination-pages">
          <button className="page-btn" disabled={page <= 1} onClick={() => onPage(page - 1)}>‹</button>
        {btns}
        <button className="page-btn" onClick={() => onPage(page + 1)} disabled={page >= pages}>›</button>
      </div>
    </div>
  );
}

export function EmptyState({ icon, text }) {
  return (
    <div className="empty-state">
      <Icon name={icon || 'books'} />
      <p>{text}</p>
    </div>
  );
}

export function EmptyRow({ icon, text, colspan }) {
  return (
    <tr className="empty-row">
      <td colSpan={colspan}>
        <EmptyState icon={icon} text={text} />
      </td>
    </tr>
  );
}

/* Ícone dentro de tabela (sem JSX duplicado) */
export { Icon };
