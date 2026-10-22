/* ============================================================
   Alexandria — Sidebar (navegação por papel de acesso)
   ============================================================ */

import { NavLink } from 'react-router-dom';
import { Icon } from '../ui/icons.jsx';
import { useApp } from '../AppContext.jsx';
import { useSession } from '../store/session.jsx';
import api from '../api/client.js';
import { useApi } from '../api/useApi.js';
import { cargoUsuario, corPara } from '../ui/labels.js';
import { initials } from '../ui/format.js';

const NAV_BIBLIOTECARIO = [
  { label: 'Principal', items: [{ route: 'dashboard', icon: 'dashboard', text: 'Dashboard' }] },
  {
    label: 'Gestão',
    items: [
      { route: 'acervo', icon: 'books', text: 'Acervo', badge: 'collection' },
      { route: 'usuarios', icon: 'users', text: 'Usuários', badge: 'users' },
      { route: 'emprestimos', icon: 'loans', text: 'Empréstimos', badge: 'overdue' }
    ]
  }
];

const NAV_LEITOR = [
  { label: 'Principal', items: [{ route: 'dashboard', icon: 'dashboard', text: 'Meu painel' }] },
  {
    label: 'Biblioteca',
    items: [
      { route: 'acervo', icon: 'books', text: 'Acervo', badge: 'collection' },
      { route: 'meus-emprestimos', icon: 'loans', text: 'Meus empréstimos', badge: 'mine' }
    ]
  }
];

export function Sidebar({ open, onClose }) {
  const { user, isBibliotecario, admId, userId, logout, exibirNome } = useSession();
  const { dataVersion } = useApp();

  const { data: painel } = useApi(
    async () => {
      if (isBibliotecario) return api.dashboardResumo(admId);
      return api.dashboardLeitor(userId);
    },
    [isBibliotecario, admId, userId, dataVersion]
  );

  const nav = isBibliotecario ? NAV_BIBLIOTECARIO : NAV_LEITOR;
  const badges = painel?.badges || {};

  const badgeFor = (key) => (badges[key] ?? null);

  return (
    <>
      <aside className={`sidebar${open ? ' open' : ''}`}>
        <div className="sidebar-brand">
          <img className="brand-banner" src="/assets/logo.svg" alt="Alexandria" />
        </div>

        <nav className="sidebar-nav">
          {nav.map((group) => (
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
                        className={`nav-badge${it.badge === 'overdue' && badge > 0 ? ' badge-warn' : ''}`}
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
            <div className="avatar" style={{ background: user ? corPara(user.name) : '#64748b' }}>
              {user ? initials(user.name) : '—'}
            </div>
            <div>
              <strong>{user ? exibirNome(user) : 'Visitante'}</strong>
              <span>{user ? cargoUsuario(user.userLevel) : 'Leitor'}</span>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={logout} style={{ width: '100%', justifyContent: 'center' }}>
            <Icon name="arrowBack" /> Sair da conta
          </button>
        </div>
      </aside>
      <div className={`sidebar-backdrop${open ? ' show' : ''}`} onClick={onClose} />
    </>
  );
}
