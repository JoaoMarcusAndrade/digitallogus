/* ============================================================
   BiblioGestor — Página: Acervo (CRUD de livros)
   ============================================================ */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../ui/icons.jsx';
import { useModal, useToast, ModalHead, Field, Dl, StatusBadge } from '../ui/Modal.jsx';
import { useApp } from '../AppContext.jsx';
import { useStore, livros, livro, addLivro, updateLivro, removeLivro, emprestimos, usuario } from '../store/store.js';
import { Pagination, EmptyRow } from '../ui/common.jsx';
import { fmtDate } from '../ui/format.js';

const CATEGORIAS = ['Romance', 'Ficção', 'Infantojuvenil', 'Técnico', 'História', 'Filosofia', 'Biografia', 'Poesia', 'HQs & Mangás', 'Outros'];

const STATUS_OPTIONS = [
  ['', 'Todos os status'],
  ['disponivel', 'Disponível'],
  ['emprestado', 'Emprestado'],
  ['esgotado', 'Esgotado']
];

export function Acervo() {
  useStore();
  const navigate = useNavigate();
  const { openModal, confirmBox } = useModal();
  const toast = useToast();

  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 8;

  const all = livros();

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return all.filter((l) => {
      const texto = (l.titulo + ' ' + l.autor + ' ' + l.isbn + ' ' + l.editora).toLowerCase();
      if (query && !texto.includes(query)) return false;
      if (cat && l.categoria !== cat) return false;
      const emUso = l.exemplares - l.exemplaresDisp;
      const st = l.exemplaresDisp === 0 ? 'esgotado' : (emUso > 0 ? 'emprestado' : 'disponivel');
      if (status && st !== status) return false;
      return true;
    });
  }, [all, q, cat, status]);

  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, pages);
  const ini = (safePage - 1) * perPage;
  const slice = filtered.slice(ini, ini + perPage);

  const { detailRequest } = useApp();
  useEffect(() => {
    if (detailRequest && detailRequest.page === 'acervo' && detailRequest.id) {
      openDetail(detailRequest.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailRequest]);

  const openForm = (id) => {
    const l = id ? livro(id) : null;
    openModal(<LivroForm id={id} l={l} />, 'md');
  };

  const openDetail = (id) => {
    const l = livro(id);
    if (!l) return;
    openModal(<LivroDetail id={id} l={l} onEdit={() => openForm(id)} />, 'md');
  };

  const excluir = (id) => {
    const l = livro(id);
    if (!l) return;
    confirmBox(
      'Deseja realmente excluir <b>' + l.titulo + '</b> do acervo? Esta ação não poderá ser desfeita.',
      () => {
        const r = removeLivro(id);
        toast(r.ok ? 'Título removido do acervo.' : r.msg, r.ok ? 'success' : 'warn');
      },
      { title: 'Excluir título', okText: 'Excluir', danger: true }
    );
  };

  return (
    <div className="view-enter">
      <div className="page-head">
        <div>
          <span className="page-kicker">Catálogo</span>
          <h1 className="page-title">Acervo</h1>
          <p className="page-sub">{all.length} títulos cadastrados no acervo da biblioteca.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-ghost" onClick={() => navigate('/relatorios')}>
            <Icon name="reports" /> Relatórios
          </button>
          <button className="btn btn-primary" onClick={() => openForm(null)}>
            <Icon name="plus" /> Novo título
          </button>
        </div>
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="toolbar-search">
            <Icon name="search" />
            <input
              type="text"
              placeholder="Buscar por título, autor, ISBN..."
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
            />
          </div>
          <select className="select" value={cat} onChange={(e) => { setCat(e.target.value); setPage(1); }}>
            <option value="">Todas as categorias</option>
            {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            {STATUS_OPTIONS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
          </select>
          <span className="result-count">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Título</th><th>Categoria</th><th>ISBN</th><th>Local.</th>
                <th style={{ textAlign: 'center' }}>Disp.</th><th>Status</th><th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {slice.length ? slice.map((l) => <LivroRow key={l.id} l={l} onVer={openDetail} onEditar={openForm} onExcluir={excluir} />)
                : <EmptyRow icon="books" text="Nenhum título encontrado para os filtros aplicados." colspan={7} />}
            </tbody>
          </table>
        </div>

        <Pagination ini={ini} total={filtered.length} perPage={perPage} page={safePage} onPage={setPage} />
      </div>
    </div>
  );
}

function livroStatus(l) {
  const emUso = l.exemplares - l.exemplaresDisp;
  return l.exemplaresDisp === 0 ? 'esgotado' : (emUso > 0 ? 'emprestado' : 'disponivel');
}

function LivroRow({ l, onVer, onEditar, onExcluir }) {
  const st = livroStatus(l);
  return (
    <tr>
      <td>
        <div className="cell-book">
          <div className="book-cover" style={{ background: l.capa }}>{l.titulo.charAt(0)}</div>
          <div className="cell-title">
            <b>{l.titulo}</b>
            <span>{l.autor} · {l.editora} ({l.ano})</span>
          </div>
        </div>
      </td>
      <td><span className="badge badge-gray">{l.categoria}</span></td>
      <td style={{ fontFamily: 'ui-monospace,monospace', fontSize: '12.5px' }}>{l.isbn}</td>
      <td>{l.localizacao}</td>
      <td style={{ textAlign: 'center' }}>{l.exemplaresDisp}/{l.exemplares}</td>
      <td><StatusBadge status={st} /></td>
      <td>
        <div className="row-actions">
          <button className="row-action" onClick={() => onVer(l.id)} title="Detalhes"><Icon name="eye" /></button>
          <button className="row-action edit" onClick={() => onEditar(l.id)} title="Editar"><Icon name="edit" /></button>
          <button className="row-action danger" onClick={() => onExcluir(l.id)} title="Excluir"><Icon name="trash" /></button>
        </div>
      </td>
    </tr>
  );
}

function LivroForm({ id, l }) {
  const { closeModal } = useModal();
  const toast = useToast();
  const isEdit = !!l;
  const [dados, setDados] = useState(() => ({
    titulo: l ? l.titulo : '',
    autor: l ? l.autor : '',
    isbn: l ? l.isbn : '',
    categoria: l ? l.categoria : '',
    editora: l ? l.editora : '',
    ano: l ? l.ano : new Date().getFullYear(),
    localizacao: l ? l.localizacao : '',
    exemplares: l ? l.exemplares : 1
  }));

  const set = (k) => (e) => setDados((d) => ({ ...d, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!dados.titulo.trim() || !dados.autor.trim()) { toast('Preencha os campos obrigatórios.', 'warn'); return; }
    const cor = ['#dc2626', '#2563eb', '#059669', '#d97706', '#7c3aed', '#0891b2', '#b45309'][Math.floor(Math.random() * 7)];
    if (isEdit) {
      updateLivro(id, { ...dados, ano: Number(dados.ano), exemplares: Number(dados.exemplares), capa: l.capa || cor });
      toast('Título atualizado com sucesso.', 'success');
    } else {
      addLivro({ ...dados, ano: Number(dados.ano), exemplares: Number(dados.exemplares), capa: cor });
      toast('Título cadastrado com sucesso.', 'success');
    }
    closeModal();
  };

  return (
    <>
      <ModalHead title={isEdit ? 'Editar título' : 'Novo título'}
        sub={isEdit ? 'Atualize as informações do exemplar.' : 'Cadastre um novo título no acervo.'} />
      <form id="form-livro" onSubmit={submit}>
        <div className="modal-body">
          <div className="form-grid">
            <Field label="Título *" full>
              <input className="input" value={dados.titulo} onChange={set('titulo')} placeholder="Nome da obra" required />
            </Field>
            <Field label="Autor *">
              <input className="input" value={dados.autor} onChange={set('autor')} placeholder="Nome do autor" required />
            </Field>
            <Field label="ISBN">
              <input className="input" value={dados.isbn} onChange={set('isbn')} placeholder="978-..." />
            </Field>
            <Field label="Categoria" full>
              <select className="select" style={{ width: '100%' }} value={dados.categoria} onChange={set('categoria')} required>
                <option value="" disabled>Selecione a categoria...</option>
                {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Editora">
              <input className="input" value={dados.editora} onChange={set('editora')} placeholder="Editora" />
            </Field>
            <Field label="Ano">
              <input className="input" type="number" min="1000" max="2100" value={dados.ano} onChange={set('ano')} />
            </Field>
            <Field label="Localização">
              <input className="input" value={dados.localizacao} onChange={set('localizacao')} placeholder="Ex.: A1-03" />
            </Field>
            <Field label="Nº de exemplares" full>
              <input className="input" type="number" min="1" value={dados.exemplares} onChange={set('exemplares')} />
            </Field>
          </div>
          <div className="form-actions">
            <button type="button" className="btn" onClick={closeModal}>Cancelar</button>
            <button type="submit" className="btn btn-primary">{isEdit ? 'Salvar alterações' : 'Cadastrar título'}</button>
          </div>
        </div>
      </form>
    </>
  );
}

function LivroDetail({ id, l, onEdit }) {
  const { closeModal } = useModal();
  const emUso = l.exemplares - l.exemplaresDisp;
  const st = livroStatus(l);
  const historico = emprestimos().filter((e) => e.livroId === id).slice(0, 5);

  return (
    <>
      <ModalHead title="Detalhes do título" sub="Registro completo do exemplar no acervo." />
      <div className="modal-body">
        <div className="detail-hero">
          <div className="book-cover" style={{ background: l.capa, width: 64, height: 88, fontSize: 22 }}>{l.titulo.charAt(0)}</div>
          <div>
            <h3>{l.titulo}</h3>
            <p>{l.autor}</p>
            <div style={{ marginTop: 8 }}>
              <StatusBadge status={st} /> <span className="badge badge-gray">{l.categoria}</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16 }} className="detail-list">
          <Dl label="ISBN" value={l.isbn || '—'} />
          <Dl label="Editora" value={l.editora || '—'} />
          <Dl label="Ano" value={l.ano} />
          <Dl label="Localização" value={l.localizacao || '—'} />
          <Dl label="Exemplares" value={l.exemplares} />
          <Dl label="Disponíveis" value={<b style={{ color: l.exemplaresDisp > 0 ? 'var(--green)' : 'var(--red)' }}>{l.exemplaresDisp}</b>} />
          <Dl label="Cadastrado em" value={fmtDate(l.adicionadoEm)} />
          <Dl label="Em uso" value={emUso} />
        </div>

        <h4 style={{ margin: '18px 0 6px', fontSize: 13, fontWeight: 700 }}>Histórico de empréstimos</h4>
        {historico.length ? (
          <ul className="mini-list">
            {historico.map((e) => {
              const u = usuario(e.usuarioId);
              return (
                <li key={e.id} style={{ padding: '10px 0' }}>
                  <div className="m-main"><b>{u ? u.nome : '—'}</b><span>Emprestado em {fmtDate(e.dataEmprestimo)}</span></div>
                  <div className="m-side"><StatusBadge status={e.status} /></div>
                </li>
              );
            })}
          </ul>
        ) : <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Sem registro de empréstimos.</p>}

        <div className="form-actions">
          <button className="btn" onClick={closeModal}>Fechar</button>
          <button className="btn btn-soft" onClick={() => { closeModal(); onEdit(); }}>
            <Icon name="edit" /> Editar
          </button>
        </div>
      </div>
    </>
  );
}
