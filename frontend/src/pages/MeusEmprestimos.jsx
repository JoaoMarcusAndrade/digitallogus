/* ============================================================
   Alexandria — Página: Meus Empréstimos (leitor, somente leitura)
   ============================================================ */

import { useState } from 'react';
import { Icon } from '../ui/icons.jsx';
import { StatusBadge } from '../ui/Modal.jsx';
import { useApp } from '../AppContext.jsx';
import { useSession } from '../store/session.jsx';
import api from '../api/client.js';
import { useApi } from '../api/useApi.js';
import { corPara } from '../ui/labels.js';
import { Pagination, EmptyRow } from '../ui/common.jsx';
import { fmtDate, diffDias } from '../ui/format.js';

const STATUS_OPTIONS = [
  ['', 'Todos os status'],
  ['active', 'Ativos'],
  ['overdue', 'Atrasados'],
  ['returned', 'Devolvidos']
];

const PER_PAGE = 8;

export function MeusEmprestimos() {
  const { userId } = useSession();
  const { dataVersion } = useApp();

  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data: pagina, loading, erro } = useApi(
    async () => api.myLoans({ userId, q, status, page, perPage: PER_PAGE }),
    [userId, q, status, page, dataVersion]
  );

  const itens = pagina?.items || [];
  const total = pagina?.total ?? 0;
  const pages = pagina?.pages || 1;
  const ini = (Math.min(page, pages) - 1) * PER_PAGE;

  return (
    <div className="view-enter">
      <div className="page-head">
        <div>
          <span className="page-kicker">Minha atividade</span>
          <h1 className="page-title">Meus empréstimos</h1>
          <p className="page-sub">Acompanhe a situação dos seus empréstimos. Prazos, renovações e devoluções são geridos pela biblioteca.</p>
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
              placeholder="Buscar por obra..."
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
                <th>Obra</th><th>Emprestado em</th><th>Prevista</th>
                <th>Prazo</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && !itens.length
                ? <EmptyRow icon="loans" text="Carregando..." colspan={5} />
                : itens.length
                  ? itens.map((e) => <EmprestimoRow key={e.id} e={e} />)
                  : <EmptyRow icon="loans" text="Nenhum empréstimo encontrado." colspan={5} />}
            </tbody>
          </table>
        </div>

        <Pagination ini={ini} total={total} perPage={PER_PAGE} page={Math.min(page, pages)} onPage={setPage} />
      </div>
    </div>
  );
}

function EmprestimoRow({ e }) {
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
          <div className="book-cover" style={{ background: b ? (b.coverColor || corPara(b.title)) : '#3a5f9e' }}>
            {b ? b.title.charAt(0) : '?'}
          </div>
          <div className="cell-title">
            <b>{b ? b.title : 'Título removido'}</b>
            <span>{b ? b.author : ''}</span>
          </div>
        </div>
      </td>
      <td>{fmtDate(e.dataEmprestimo)}</td>
      <td>
        {fmtDate(e.dataDevolucaoPrevista)}
        <span style={{ display: 'block', fontSize: '11.5px', color: 'var(--text-3)' }}>{e.renovacoes} renov.</span>
      </td>
      <td>{prazo}</td>
      <td><StatusBadge status={e.status} /></td>
    </tr>
  );
}
