/* ============================================================
   Alexandria — Página: Empréstimos (circulação)
   ============================================================ */

import { useEffect, useState } from 'react';
import { Icon } from '../ui/icons.jsx';
import { useModal, useToast, ModalHead, Field, StatusBadge } from '../ui/Modal.jsx';
import { useApp } from '../AppContext.jsx';
import { useSession } from '../store/session.jsx';
import api from '../api/client.js';
import { useApi } from '../api/useApi.js';
import { useDebounce } from '../api/useDebounce.js';
import { corPara } from '../ui/labels.js';
import { Pagination, EmptyRow } from '../ui/common.jsx';
import { initials, fmtDate, diffDias } from '../ui/format.js';

const STATUS_OPTIONS = [
  ['', 'Todos os status'],
  ['active', 'Ativos'],
  ['overdue', 'Atrasados'],
  ['returned', 'Devolvidos']
];

const PER_PAGE = 10;

export function Emprestimos() {
  const { admId } = useSession();
  const { openModal, confirmBox } = useModal();
  const toast = useToast();
  const { loanRequest, dataVersion, reloadData } = useApp();

  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const qBusca = useDebounce(q, 300);

  const { data: pagina, loading, erro } = useApi(
    async () => api.listLoans({ admId, q: qBusca, status, page, perPage: PER_PAGE }),
    [admId, qBusca, status, page, dataVersion]
  );

  const itens = pagina?.items || [];
  const total = pagina?.total ?? 0;
  const pages = pagina?.pages || 1;
  const ini = (Math.min(page, pages) - 1) * PER_PAGE;

  useEffect(() => {
    if (loanRequest) openModalEmprestar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loanRequest]);

  const openModalEmprestar = () => {
    openModal(<EmprestarForm onSaved={reloadData} />, 'md');
  };

  const devolverEmp = (e) => {
    confirmBox(
      'Registrar devolução de <b>' + (e.book ? e.book.title : '') + '</b> (usuário: ' + (e.reader ? e.reader.name : '') + ')?',
      async () => {
        try {
          await api.returnLoan(admId, e.id);
          toast('Devolução registrada.', 'success');
          reloadData();
        } catch (err) {
          toast(err.message || 'Não foi possível registrar a devolução.', 'warn');
        }
      },
      { title: 'Registrar devolução', okText: 'Confirmar' }
    );
  };

  const renovarEmp = async (e) => {
    try {
      await api.renewLoan(admId, e.id);
      toast('Empréstimo renovado por +7 dias.', 'success');
      reloadData();
    } catch (err) {
      toast(err.message || 'Não foi possível renovar o empréstimo.', 'warn');
    }
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

      {erro && (
        <div className="alert alert-danger" style={{ marginBottom: 16 }}>
          <Icon name="close" />
          <div><b>Não foi possível carregar os empréstimos</b><span>{erro}</span></div>
        </div>
      )}

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
          <span className="result-count">{total} registro{total !== 1 ? 's' : ''}</span>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Obra</th><th>Leitor</th><th>Emprestado em</th><th>Prevista</th>
                <th>Prazo</th><th>Status</th><th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading && !itens.length
                ? <EmptyRow icon="loans" text="Carregando..." colspan={7} />
                : itens.length
                  ? itens.map((e) => (
                    <EmprestimoRow
                      key={e.id}
                      e={e}
                      onDevolver={() => devolverEmp(e)}
                      onRenovar={() => renovarEmp(e)}
                    />
                  ))
                  : <EmptyRow icon="loans" text="Nenhum empréstimo encontrado." colspan={7} />}
            </tbody>
          </table>
        </div>

        <Pagination ini={ini} total={total} perPage={PER_PAGE} page={Math.min(page, pages)} onPage={setPage} />
      </div>
    </div>
  );
}

function EmprestimoRow({ e, onDevolver, onRenovar }) {
  const u = e.reader;
  const b = e.book;
  const dias = diffDias(e.dataDevolucaoPrevista);

  let prazo;
  if (e.status === 'returned') prazo = <span style={{ color: 'var(--text-3)' }}>devolvido em {fmtDate(e.dataDevolucao)}</span>;
  else if (e.status === 'overdue') prazo = <b style={{ color: 'var(--red)' }}>{Math.abs(dias)} dia{Math.abs(dias) !== 1 ? 's' : ''} de atraso</b>;
  else if (dias <= 3) prazo = <b style={{ color: 'var(--amber)' }}>vence em {dias}d</b>;
  else prazo = <span style={{ color: 'var(--text-3)' }}>vence em {dias}d</span>;

  return (
    <tr>
      <td>
        <div className="cell-book">
          <div className="book-cover" style={{ background: b ? (b.coverColor || corPara(b.title)) : '#94a3b8' }}>
            {b ? b.title.charAt(0) : '?'}
          </div>
          <div className="cell-title">
            <b>{b ? b.title : 'Título removido'}</b>
            <span>{b ? b.author : ''}</span>
          </div>
        </div>
      </td>
      <td>
        <div className="cell-user">
          <div className="avatar-sm" style={{ background: u ? corPara(u.name) : '#94a3b8' }}>{u ? initials(u.name) : '?'}</div>
          <div className="cell-title"><b>{u ? u.name : '—'}</b><span>{u ? u.matricula : ''}</span></div>
        </div>
      </td>
      <td>{fmtDate(e.dataEmprestimo)}</td>
      <td>
        {fmtDate(e.dataDevolucaoPrevista)}
        <span style={{ display: 'block', fontSize: '11.5px', color: 'var(--text-3)' }}>{e.renovacoes} renov.</span>
      </td>
      <td>{prazo}</td>
      <td><StatusBadge status={e.status} /></td>
      <td>
        <div className="row-actions">
          {e.status !== 'returned' && (
            <>
              <button className="row-action" onClick={onRenovar} title="Renovar (até 2x)"><Icon name="calendar" /></button>
              <button className="row-action" onClick={onDevolver} title="Registrar devolução"><Icon name="check" /></button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

function EmprestarForm({ onSaved }) {
  const { closeModal } = useModal();
  const toast = useToast();
  const { admId } = useSession();

  const [usuarioId, setUsuarioId] = useState('');
  const [livroId, setLivroId] = useState('');
  const [dias, setDias] = useState(14);
  const [salvando, setSalvando] = useState(false);

  const { data: usuarios } = useApi(async () => {
    const pagina = await api.listUsers({ admId, perPage: 100 });
    return pagina.items.filter((u) => u.status === 'ativo');
  }, [admId]);

  const { data: livros } = useApi(async () => {
    const pagina = await api.listBooks({ perPage: 100 });
    return pagina.items;
  }, []);

  const userOps = usuarios || [];
  const bookOps = livros || [];

  const submit = async (e) => {
    e.preventDefault();
    if (!usuarioId || !livroId) {
      toast('Selecione o usuário e a obra.', 'warn');
      return;
    }

    setSalvando(true);
    try {
      await api.createLoan(admId, { bookId: Number(livroId), userId: Number(usuarioId), dias: Number(dias) || 14 });
      toast('Empréstimo registrado com sucesso.', 'success');
      onSaved?.();
      closeModal();
    } catch (err) {
      toast(err.message || 'Não foi possível registrar o empréstimo.', 'warn');
    } finally {
      setSalvando(false);
    }
  };

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
                  <option key={u.id} value={u.id}>{u.name} ({u.matricula || u.email})</option>
                ))}
              </select>
            </Field>
            <Field label="Obra *" full>
              <select className="select" style={{ width: '100%' }} value={livroId} onChange={(e) => setLivroId(e.target.value)} required>
                <option value="" disabled>Selecione a obra...</option>
                {bookOps.map((l) => (
                  <option key={l.id} value={l.id} disabled={l.quantityAvailable <= 0}>
                    {l.title} — {l.author}{l.quantityAvailable <= 0 ? ' (esgotado)' : ` (${l.quantityAvailable} disp.)`}
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
            <button type="submit" className="btn btn-primary" disabled={salvando}>
              {salvando ? 'Registrando...' : <><Icon name="check" /> Registrar empréstimo</>}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
