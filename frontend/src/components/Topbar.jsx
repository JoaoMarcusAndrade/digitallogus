/* ============================================================
   BiblioGestor — Topbar (busca global + ações) (React)
   ============================================================ */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../ui/icons.jsx';
import { useModal } from '../ui/Modal.jsx';
import { useApp } from '../AppContext.jsx';
import { useStore, livros, usuarios, emprestimosAtrasados } from '../store/store.js';
import { escapeHtml, initials } from '../ui/format.js';
import { StatusBadge } from '../ui/Modal.jsx';

export function Topbar({ onMenu }) {
  const navigate = useNavigate();
  const { openModal, closeModal } = useModal();
  const { openDetail } = useApp();
  const [term, setTerm] = useState('');
  const [focused, setFocused] = useState(false);
  useStore();

  const results = useMemo(() => {
    const q = term.trim().toLowerCase();
    if (q.length < 2) return null;
    const liv = livros()
      .filter((l) => (l.titulo + ' ' + l.autor + ' ' + l.isbn).toLowerCase().includes(q))
      .slice(0, 4)
      .map((l) => ({
        type: 'livro',
        id: l.id,
        titulo: l.titulo,
        autor: l.autor,
        capa: l.capa,
        status: l.exemplaresDisp === 0 ? 'Esgotado' : (l.exemplares - l.exemplaresDisp > 0 ? 'Emprestado' : 'Disponível')
      }));
    const usr = usuarios()
      .filter((u) => (u.nome + ' ' + u.matricula + ' ' + u.email).toLowerCase().includes(q))
      .slice(0, 4)
      .map((u) => ({
        type: 'usuario',
        id: u.id,
        nome: u.nome,
        matricula: u.matricula,
        tipo: u.tipo,
        color: u.color || '#64748b',
        status: u.status
      }));
    return { liv, usr };
  }, [term]);

  const atrasados = emprestimosAtrasados();
  const esgotados = livros().filter((l) => l.exemplaresDisp === 0);

  const showResults = focused && results && (results.liv.length || results.usr.length);

  const goDetail = (type, id) => {
    setTerm('');
    setFocused(false);
    if (type === 'livro') {
      navigate('/acervo');
      openDetail('acervo', id);
    } else {
      navigate('/usuarios');
      openDetail('usuarios', id);
    }
  };

  const openNotifications = () => {
    const S = { atrasados, esgotados };
    let body;
    if (!atrasados.length && !esgotados.length) {
      body = (
        <div className="alert alert-info" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <Icon name="check" />
          <div><b>Tudo em dia</b><span>Não há pendências no momento.</span></div>
        </div>
      );
    } else {
      body = (
        <>
          {atrasados.length > 0 && (
            <div className="alert alert-danger" style={{ marginBottom: 12 }}>
              <Icon name="bell" />
              <div>
                <b>{atrasados.length} empréstimo{atrasados.length > 1 ? 's' : ''} atrasado{atrasados.length > 1 ? 's' : ''}</b>
                <span>{atrasados.slice(0, 3).map((e) => {
                  const u = usuarios().find((x) => x.id === e.usuarioId);
                  return u ? u.nome : '—';
                }).join(', ')}{atrasados.length > 3 ? '…' : ''}</span>
              </div>
            </div>
          )}
          {esgotados.length > 0 && (
            <div className="alert alert-warn">
              <Icon name="bell" />
              <div>
                <b>{esgotados.length} título{esgotados.length > 1 ? 's' : ''} esgotado{esgotados.length > 1 ? 's' : ''}</b>
                <span>{esgotados.slice(0, 4).map((l) => l.titulo).join(', ')}</span>
              </div>
            </div>
          )}
        </>
      );
    }
    openModal(
      <div className="modal-body" style={{ paddingBottom: 26 }}>
        {body}
      </div>,
      'sm'
    );
    void closeModal;
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
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="Buscar livros, usuários, ISBN..."
          autoComplete="off"
        />
        {showResults && (
          <div className="search-results show" onMouseDown={(e) => e.preventDefault()}>
            {results.liv.map((l) => (
              <div key={l.id} className="search-result" onClick={() => goDetail('livro', l.id)}>
                <div className="sr-icon" style={{ background: l.capa }}>{escapeHtml(l.titulo.charAt(0))}</div>
                <div style={{ minWidth: 0 }}>
                  <b>{l.titulo}</b>
                  <span>{l.autor}</span>
                </div>
                <div className="sr-meta">{l.status}</div>
              </div>
            ))}
            {results.usr.map((u) => (
              <div key={u.id} className="search-result" onClick={() => goDetail('usuario', u.id)}>
                <div className="sr-icon" style={{ background: u.color }}>{initials(u.nome)}</div>
                <div style={{ minWidth: 0 }}>
                  <b>{u.nome}</b>
                  <span>{u.tipo} · {u.matricula}</span>
                </div>
                <div className="sr-meta"><StatusBadge status={u.status} /></div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="topbar-actions">
        <button className="icon-btn" onClick={openNotifications} aria-label="Notificações" title="Notificações">
          <Icon name="bell" />
          {atrasados.length > 0 && <span className="dot" />}
        </button>
        <button className="icon-btn" aria-label="Configurações" title="Configurações">
          <Icon name="settings" />
        </button>
        <div className="topbar-user">
          <div className="avatar">AD</div>
        </div>
      </div>
    </header>
  );
}
