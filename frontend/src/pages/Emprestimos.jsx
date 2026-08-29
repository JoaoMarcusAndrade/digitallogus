/* ============================================================
   BiblioGestor — Página: Empréstimos
   ============================================================ */

import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../ui/icons.jsx';
import { useModal, useToast, ModalHead, Field, StatusBadge } from '../ui/Modal.jsx';
import { useApp } from '../AppContext.jsx';
import {
  useStore, emprestimos, emprestar, devolver, renovar,
  usuario, livro, usuarios, livros
} from '../store/store.js';
import { Pagination, EmptyRow } from '../ui/common.jsx';
import { initials, fmtDate, diffDias } from '../ui/format.js';

const STATUS_OPTIONS = [
  ['', 'Todos os status'],
  ['ativo', 'Ativos'],
  ['atrasado', 'Atrasados'],
  ['devolvido', 'Devolvidos']
];

export function Emprestimos() {
  useStore();
  const { openModal, confirmBox } = useModal();
  const toast = useToast();

  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  const lista = useMemo(() => {
    const query = q.trim().toLowerCase();
    return emprestimos().map((e) => {
      let atrasado = false;
      if (e.status !== 'devolvido') atrasado = new Date(e.dataDevolucaoPrevista) < new Date();
      return { e, atrasado };
    }).filter(({ e, atrasado }) => {
      const u = usuario(e.usuarioId);
      const l = livro(e.livroId);
      const texto = ((u ? u.nome : '') + ' ' + (l ? l.titulo : '')).toLowerCase();
      if (query && !texto.includes(query)) return false;
      const st = e.status === 'devolvido' ? 'devolvido' : (atrasado ? 'atrasado' : 'ativo');
      if (status && st !== status) return false;
      return true;
    });
  }, [q, status]);

  const pages = Math.max(1, Math.ceil(lista.length / perPage));
  const safePage = Math.min(page, pages);
  const ini = (safePage - 1) * perPage;
  const slice = lista.slice(ini, ini + perPage);

  const { loanRequest } = useApp();
  useEffect(() => {
    if (loanRequest) openModalEmprestar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loanRequest]);

  const openModalEmprestar = () => {
    openModal(<EmprestarForm />, 'md');
  };

  const devolverEmp = (id) => {
    const e = emprestimos().find((x) => x.id === id);
    const l = livro(e.livroId);
    const u = usuario(e.usuarioId);
    confirmBox(
      'Registrar devolução de <b>' + (l ? l.titulo : '') + '</b> (usuário: ' + (u ? u.nome : '') + ')?',
      () => {
        const r = devolver(id);
        toast(r.ok ? 'Devolução registrada.' : r.msg, r.ok ? 'success' : 'warn');
      },
      { title: 'Registrar devolução', okText: 'Confirmar' }
    );
  };

  const renovarEmp = (id) => {
    const r = renovar(id);
    toast(r.ok ? 'Empréstimo renovado por +7 dias.' : r.msg, r.ok ? 'success' : 'warn');
  };

  return (
    <div className="view-enter">
      <div className="page-head">
        <div>
          <span className="page-kicker">Circulação</span>
          <h1 className="page-title">Empréstimos</h1>
          <p className="page-sub">Registre, renove e acompanhe as devoluções de exemplares.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={openModalEmprestar}>
            <Icon name="plus" /> Novo empréstimo
          </button>
        </div>
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="toolbar-search">
            <Icon name="search" />
            <input
              type="text"
              placeholder="Buscar por obra ou usuário..."
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
            />
          </div>
          <select className="select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            {STATUS_OPTIONS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
          </select>
          <span className="result-count">{lista.length} registro{lista.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Obra</th><th>Usuário</th><th>Emprestado em</th><th>Prevista</th>
                <th>Prazo</th><th>Status</th><th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {slice.length ? slice.map((p) => <EmprestimoRow key={p.e.id} {...p} onDevolver={devolverEmp} onRenovar={renovarEmp} />)
                : <EmptyRow icon="loans" text="Nenhum empréstimo encontrado." colspan={7} />}
            </tbody>
          </table>
        </div>

        <Pagination ini={ini} total={lista.length} perPage={perPage} page={safePage} onPage={setPage} />
      </div>
    </div>
  );
}

function EmprestimoRow({ e, atrasado, onDevolver, onRenovar }) {
  const u = usuario(e.usuarioId);
  const l = livro(e.livroId);
  const st = e.status === 'devolvido' ? 'devolvido' : (atrasado ? 'atrasado' : 'ativo');
  const dias = diffDias(e.dataDevolucaoPrevista);

  let prazo;
  if (e.status === 'devolvido') prazo = <span style={{ color: 'var(--text-3)' }}>devolvido em {fmtDate(e.dataDevolucao)}</span>;
  else if (atrasado) prazo = <b style={{ color: 'var(--red)' }}>{Math.abs(dias)} dia{Math.abs(dias) !== 1 ? 's' : ''} de atraso</b>;
  else if (dias <= 3) prazo = <b style={{ color: 'var(--amber)' }}>vence em {dias}d</b>;
  else prazo = <span style={{ color: 'var(--text-3)' }}>vence em {dias}d</span>;

  return (
    <tr>
      <td>
        <div className="cell-book">
          <div className="book-cover" style={{ background: l ? l.capa : '#94a3b8' }}>{(l ? l.titulo : '?').charAt(0)}</div>
          <div className="cell-title">
            <b>{l ? l.titulo : 'Título removido'}</b>
            <span>{l ? l.autor : ''}</span>
          </div>
        </div>
      </td>
      <td>
        <div className="cell-user">
          <div className="avatar-sm" style={{ background: u ? (u.color || '#64748b') : '#94a3b8' }}>{u ? initials(u.nome) : '?'}</div>
          <div className="cell-title"><b>{u ? u.nome : '—'}</b><span>{u ? u.matricula : ''}</span></div>
        </div>
      </td>
      <td>{fmtDate(e.dataEmprestimo)}</td>
      <td>
        {fmtDate(e.dataDevolucaoPrevista)}
        <span style={{ display: 'block', fontSize: '11.5px', color: 'var(--text-3)' }}>{e.renovacoes} renov.</span>
      </td>
      <td>{prazo}</td>
      <td><StatusBadge status={st} /></td>
      <td>
        <div className="row-actions">
          {e.status !== 'devolvido' && (
            <>
              <button className="row-action" onClick={() => onRenovar(e.id)} title="Renovar (até 2x)"><Icon name="calendar" /></button>
              <button className="row-action" onClick={() => onDevolver(e.id)} title="Registrar devolução"><Icon name="check" /></button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

function EmprestarForm() {
  const { closeModal } = useModal();
  const toast = useToast();
  const [usuarioId, setUsuarioId] = useState('');
  const [livroId, setLivroId] = useState('');
  const [dias, setDias] = useState(14);

  const submit = (e) => {
    e.preventDefault();
    if (!usuarioId || !livroId) { toast('Selecione o usuário e a obra.', 'warn'); return; }
    const r = emprestar(usuarioId, livroId, Number(dias) || 14);
    if (r.ok) { toast('Empréstimo registrado com sucesso.', 'success'); closeModal(); }
    else toast(r.msg, 'warn');
  };

  const userOps = usuarios().filter((u) => u.status === 'ativo');
  const bookOps = livros();

  return (
    <>
      <ModalHead title="Novo empréstimo" sub="Selecione o usuário, a obra e o prazo de devolução." />
      <form id="form-emprestimo" onSubmit={submit}>
        <div className="modal-body">
          <div className="form-grid">
            <Field label="Usuário *" full>
              <select className="select" style={{ width: '100%' }} value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)} required>
                <option value="" disabled>Selecione o usuário...</option>
                {userOps.map((u) => (
                  <option key={u.id} value={u.id}>{u.nome} ({u.matricula})</option>
                ))}
              </select>
            </Field>
            <Field label="Obra *" full>
              <select className="select" style={{ width: '100%' }} value={livroId} onChange={(e) => setLivroId(e.target.value)} required>
                <option value="" disabled>Selecione a obra...</option>
                {bookOps.map((l) => (
                  <option key={l.id} value={l.id} disabled={l.exemplaresDisp <= 0}>
                    {l.titulo} — {l.autor}{l.exemplaresDisp <= 0 ? ' (esgotado)' : ` (${l.exemplaresDisp} disp.)`}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Prazo de devolução (dias)">
              <input className="input" type="number" min="1" max="60" value={dias} onChange={(e) => setDias(e.target.value)} />
            </Field>
          </div>
          <div className="form-actions">
            <button type="button" className="btn" onClick={closeModal}>Cancelar</button>
            <button type="submit" className="btn btn-primary"><Icon name="check" /> Registrar empréstimo</button>
          </div>
        </div>
      </form>
    </>
  );
}
