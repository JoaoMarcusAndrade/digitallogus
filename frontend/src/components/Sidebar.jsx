/* ============================================================
   BiblioGestor — Sidebar (React)
   ============================================================ */

import { NavLink } from 'react-router-dom';
import { Icon } from '../ui/icons.jsx';
import { livros, usuarios, emprestimosAtrasados } from '../store/store.js';
import { useStore } from '../store/store.js';

const NAV = [
  { label: 'Principal', items: [{ route: 'dashboard', icon: 'dashboard', text: 'Dashboard' }] },
  {
    label: 'Gestão',
    items: [
      { route: 'acervo', icon: 'books', text: 'Acervo', badge: 'acervo' },
      { route: 'usuarios', icon: 'users', text: 'Usuários', badge: 'usuarios' },
      { route: 'emprestimos', icon: 'loans', text: 'Empréstimos', badge: 'atrasados' }
    ]
  },
  {
    label: 'Consultas',
    items: [{ route: 'relatorios', icon: 'reports', text: 'Relatórios' }]
  }
];

export function Sidebar({ open, onClose }) {
  useStore();
  const badgeAcervo = livros().length;
  const badgeUser = usuarios().length;
  const atrasados = emprestimosAtrasados().length;

  const badgeFor = (key) => {
    if (key === 'acervo') return badgeAcervo;
    if (key === 'usuarios') return badgeUser;
    if (key === 'atrasados') return atrasados;
    return null;
  };

  return (
    <>
      <aside className={`sidebar${open ? ' open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-logo">B</div>
          <div className="brand-text">
            <strong>BiblioGestor</strong>
            <span>Acervo &amp; Usuários</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map((group) => (
            <div key={group.label}>
              <p className="nav-label">{group.label}</p>
              {group.items.map((it) => {
                const badge = badgeFor(it.badge);
                return (
                  <NavLink
                    key={it.route}
                    to={`/${it.route}`}
                    className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                    onClick={onClose}
                  >
                    <span className="nav-icon"><Icon name={it.icon} /></span>
                    <span>{it.text}</span>
                    {badge != null && (
                      <span
                        className={`nav-badge${it.badge === 'atrasados' && badge > 0 ? ' badge-warn' : ''}`}
                      >
                        {badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="avatar">AD</div>
            <div>
              <strong>Ana Dias</strong>
              <span>Bibliotecária</span>
            </div>
          </div>
        </div>
      </aside>
      <div className={`sidebar-backdrop${open ? ' show' : ''}`} onClick={onClose} />
    </>
  );
}
