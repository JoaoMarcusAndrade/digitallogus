/* ============================================================
   Alexandria — Topbar (busca global + notificações + conta)
   ============================================================ */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../ui/icons.jsx';
import { useModal, StatusBadge, Dl } from '../ui/Modal.jsx';
import { useApp } from '../AppContext.jsx';
import { useSession } from '../store/session.jsx';
import api from '../api/client.js';
import { useApi } from '../api/useApi.js';
import { useDebounce } from '../api/useDebounce.js';
import { cargoUsuario, corPara, tipoUsuario } from '../ui/labels.js';
import { initials, fmtDate } from '../ui/format.js';

export function Topbar({ onMenu }) {
  const navigate = useNavigate();
  const { openModal } = useModal();
  const { openDetail, dataVersion } = useApp();
  const { user, isBibliotecario, admId, userId, logout, exibirNome } = useSession();

  const [termo, setTermo] = useState('');
  const [focado, setFocado] = useState(false);
  const termoBusca = useDebounce(termo, 350);
  const buscaAtiva = termoBusca.trim().length >= 2;

  const { data: livros } = useApi(
    async () => (buscaAtiva ? (await api.listBooks({ q: termoBusca, perPage: 5 })).items : []),
    [termoBusca, buscaAtiva]
  );

  const { data: usuarios } = useApi(
    async () => {
      if (!isBibliotecario || !buscaAtiva) return [];
      return (await api.listUsers({ admId, q: termoBusca, perPage: 5 })).items;
    },
    [termoBusca, buscaAtiva, admId, isBibliotecario]
  );

  const { data: painel } = useApi(
    async () => {
      if (isBibliotecario) return api.dashboardResumo(admId);
      return api.dashboardLeitor(userId);
    },
    [isBibliotecario, admId, userId, dataVersion]
  );

  const atrasados = painel?.notifications?.overdue || [];
  const vencendo = painel?.notifications?.dueSoon || [];
  const mostrarResultados = focado && buscaAtiva && (livros?.length || usuarios?.length);

  const irPara = (rota, tipo, id) => {
    setTermo('');
    setFocado(false);
    navigate(rota);
    openDetail(tipo, id);
  };

  const abrirNotificacoes = () => {
    openModal(
      <div className="modal-body" style={{ paddingBottom: 26 }}>
        {atrasados.length ? (
          <div className="alert alert-danger" style={{ marginBottom: 12 }}>
            <Icon name="bell" />
            <div>
              <b>{atrasados.length} empréstimo{atrasados.length > 1 ? 's' : ''} atrasado{atrasados.length > 1 ? 's' : ''}</b>
              <span>
                {atrasados.slice(0, 3).map((e) => (e.reader ? exibirNome(e.reader) : '—')).join(', ')}
                {atrasados.length > 3 ? '…' : ''}
              </span>
            </div>
          </div>
        ) : null}

        {vencendo.length ? (
          <div className="alert alert-warn">
            <Icon name="calendar" />
            <div>
              <b>{vencendo.length} devolução{vencendo.length > 1 ? 'ões' : ''} em breve</b>
              <span>
                {vencendo.slice(0, 4).map((e) => (e.book ? e.book.title : '—')).join(', ')}
                {vencendo.length > 4 ? '…' : ''}
              </span>
            </div>
          </div>
        ) : null}

        {!atrasados.length && !vencendo.length && (
          <div className="alert alert-info" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <Icon name="check" />
            <div><b>Tudo em dia</b><span>Não há pendências no momento.</span></div>
          </div>
        )}
      </div>,
      'sm'
    );
  };

  const abrirConta = () => {
    openModal(
      <div className="modal-body" style={{ paddingBottom: 26 }}>
        <div className="detail-hero">
          <div className="avatar" style={{ width: 56, height: 56, fontSize: 18, borderRadius: 14, background: user ? corPara(user.name) : '#64748b' }}>
            {user ? initials(user.name) : '?'}
          </div>
          <div>
            <h3>{user ? exibirNome(user) : ''}</h3>
            <p>{user ? cargoUsuario(user.userLevel) : ''}</p>
          </div>
        </div>

        <div style={{ marginTop: 16 }} className="detail-list">
          <Dl label="Perfil" value={user ? tipoUsuario(user.userLevel) : '—'} />
          <Dl label="E-mail" value={user?.email || '—'} />
          <Dl label="Matrícula" value={user?.matricula || '—'} />
          <Dl label="Status" value={user ? <StatusBadge status={user.status} /> : '—'} />
          <Dl label="Cadastro" value={fmtDate(user?.createdAt)} />
        </div>

        <div className="form-actions">
          <button className="btn" onClick={logout}>Sair da conta</button>
        </div>
      </div>,
      'sm'
    );
  };

  return (
    <header className="topbar">
      <button className="icon-btn menu-btn" onClick={onMenu} aria-label="Menu">
        <Icon name="menu" />
      </button>

      <div className="global-search">
        <span className="search-icon"><Icon name="search" /></span>
        <input
          type="text"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          onFocus={() => setFocado(true)}
          onBlur={() => setTimeout(() => setFocado(false), 150)}
          placeholder="Buscar livros, usuários, ISBN..."
          autoComplete="off"
        />
        {mostrarResultados && (
          <div className="search-results show" onMouseDown={(e) => e.preventDefault()}>
            {(livros || []).map((l) => (
              <div key={l.id} className="search-result" onClick={() => irPara('/acervo', 'acervo', l.id)}>
                <div className="sr-icon" style={{ background: l.coverColor || corPara(l.title) }}>{l.title.charAt(0)}</div>
                <div style={{ minWidth: 0 }}>
                  <b>{l.title}</b>
                  <span>{l.author}</span>
                </div>
                <div className="sr-meta">
                  {l.quantityAvailable > 0 ? `${l.quantityAvailable} disp.` : 'Esgotado'}
                </div>
              </div>
            ))}
            {(usuarios || []).map((u) => (
              <div key={u.id} className="search-result" onClick={() => irPara('/usuarios', 'usuarios', u.id)}>
                <div className="sr-icon" style={{ background: corPara(u.name) }}>{initials(u.name)}</div>
                <div style={{ minWidth: 0 }}>
                  <b>{u.name}</b>
                  <span>{tipoUsuario(u.userLevel)} · {u.matricula}</span>
                </div>
                <div className="sr-meta"><StatusBadge status={u.status} /></div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="topbar-actions">
        <button className="icon-btn" onClick={abrirNotificacoes} aria-label="Notificações" title="Notificações">
          <Icon name="bell" />
          {atrasados.length > 0 && <span className="dot" />}
        </button>
        <div className="topbar-user" onClick={abrirConta} role="button" tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') abrirConta(); }}>
          <div className="avatar" style={{ background: user ? corPara(user.name) : '#64748b' }}>
            {user ? initials(user.name) : '—'}
          </div>
        </div>
      </div>
    </header>
  );
}
