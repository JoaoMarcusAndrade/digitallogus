/* ============================================================
   Alexandria — Página: Acervo (CRUD de títulos)
   ============================================================ */

import { useEffect, useState } from 'react';
import { Icon } from '../ui/icons.jsx';
import { useModal, useToast, ModalHead, Field, Dl, StatusBadge } from '../ui/Modal.jsx';
import { useApp } from '../AppContext.jsx';
import { useSession } from '../store/session.jsx';
import api from '../api/client.js';
import { useApi } from '../api/useApi.js';
import { useDebounce } from '../api/useDebounce.js';
import { corPara, statusLivro } from '../ui/labels.js';
import { Pagination, EmptyRow } from '../ui/common.jsx';
import { fmtDate } from '../ui/format.js';

const CATEGORIAS = ['Romance', 'Ficção', 'Infantojuvenil', 'Técnico', 'História', 'Filosofia', 'Biografia', 'Poesia', 'HQs & Mangás', 'Outros'];

const STATUS_OPTIONS = [
  ['', 'Todos os status'],
  ['available', 'Disponível'],
  ['loaned', 'Emprestado'],
  ['out', 'Esgotado']
];

const PER_PAGE = 8;

export function Acervo() {
  const { isBibliotecario, admId } = useSession();
  const { openModal, confirmBox } = useModal();
  const toast = useToast();
  const { detailRequest, dataVersion, reloadData } = useApp();

  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const qBusca = useDebounce(q, 300);

  const { data: pagina, loading, erro } = useApi(
    async () => api.listBooks({ q: qBusca, category: cat, status, page, perPage: PER_PAGE }),
    [qBusca, cat, status, page, dataVersion]
  );

  const { data: categoriasApi } = useApi(async () => api.listCategories(), []);
  const categorias = [...new Set([...CATEGORIAS, ...(categoriasApi || []).map((c) => c.category)])];

  const itens = pagina?.items || [];
  const total = pagina?.total ?? 0;
  const pages = pagina?.pages || 1;
  const ini = (Math.min(page, pages) - 1) * PER_PAGE;

  useEffect(() => {
    if (detailRequest && detailRequest.page === 'acervo' && detailRequest.id) {
      openDetail(detailRequest.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailRequest]);

  const openForm = (id, livro) => {
    openModal(<LivroForm id={id} l={livro} onSaved={reloadData} />, 'md');
  };

  const openDetail = (id) => {
    openModal(<LivroDetail id={id} onEdit={(l) => openForm(l.id, l)} />, 'md');
  };

  const excluir = (l) => {
    confirmBox(
      'Deseja realmente excluir <b>' + l.title + '</b> do acervo? Esta ação não poderá ser desfeita.',
      async () => {
        try {
          await api.deleteBook(admId, l.id);
          toast('Título removido do acervo.', 'success');
          reloadData();
        } catch (e) {
          toast(e.message || 'Não foi possível remover o título.', 'warn');
        }
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
          <p className="page-sub">{total} título{total !== 1 ? 's' : ''} no acervo da biblioteca.</p>
        </div>
        <div className="page-actions">
          {isBibliotecario && (
            <button className="btn btn-primary" onClick={() => openForm(null, null)}>
              <Icon name="plus" /> Novo título
            </button>
          )}
        </div>
      </div>

      {erro && (
        <div className="alert alert-danger" style={{ marginBottom: 16 }}>
          <Icon name="close" />
          <div><b>Não foi possível carregar o acervo</b><span>{erro}</span></div>
        </div>
      )}

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
            {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            {STATUS_OPTIONS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
          </select>
          <span className="result-count">{total} resultado{total !== 1 ? 's' : ''}</span>
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
              {loading && !itens.length
                ? <EmptyRow icon="books" text="Carregando..." colspan={7} />
                : itens.length
                  ? itens.map((l) => (
                    <LivroRow
                      key={l.id}
                      l={l}
                      podeEditar={isBibliotecario}
                      onVer={() => openDetail(l.id)}
                      onEditar={() => openForm(l.id, l)}
                      onExcluir={() => excluir(l)}
                    />
                  ))
                  : <EmptyRow icon="books" text="Nenhum título encontrado para os filtros aplicados." colspan={7} />}
            </tbody>
          </table>
        </div>

        <Pagination ini={ini} total={total} perPage={PER_PAGE} page={Math.min(page, pages)} onPage={setPage} />
      </div>
    </div>
  );
}

function LivroRow({ l, podeEditar, onVer, onEditar, onExcluir }) {
  return (
    <tr>
      <td>
        <div className="cell-book">
          <div className="book-cover" style={{ background: l.coverColor || corPara(l.title) }}>{l.title.charAt(0)}</div>
          <div className="cell-title">
            <b>{l.title}</b>
            <span>{l.author} · {l.publisher} ({l.year})</span>
          </div>
        </div>
      </td>
      <td><span className="badge badge-gray">{l.category}</span></td>
      <td style={{ fontFamily: 'ui-monospace,monospace', fontSize: '12.5px' }}>{l.ISBN}</td>
      <td>{l.location || '—'}</td>
      <td style={{ textAlign: 'center' }}>{l.quantityAvailable}/{l.quantity}</td>
      <td><StatusBadge status={statusLivro(l)} /></td>
      <td>
        <div className="row-actions">
          <button className="row-action" onClick={onVer} title="Detalhes"><Icon name="eye" /></button>
          {podeEditar && (
            <>
              <button className="row-action edit" onClick={onEditar} title="Editar"><Icon name="edit" /></button>
              <button className="row-action danger" onClick={onExcluir} title="Excluir"><Icon name="trash" /></button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

function LivroForm({ id, l, onSaved }) {
  const { closeModal } = useModal();
  const toast = useToast();
  const { admId } = useSession();
  const isEdit = !!id;

  const [dados, setDados] = useState(() => ({
    title: l ? l.title : '',
    author: l ? l.author : '',
    ISBN: l ? l.ISBN : '',
    category: l ? l.category : '',
    publisher: l ? l.publisher : '',
    year: l ? l.year : new Date().getFullYear(),
    location: l ? l.location : '',
    quantity: l ? l.quantity : 1
  }));
  const [salvando, setSalvando] = useState(false);

  const set = (k) => (e) => setDados((d) => ({ ...d, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!dados.title.trim() || !dados.author.trim() || !dados.ISBN.trim()) {
      toast('Preencha os campos obrigatórios.', 'warn');
      return;
    }

    const payload = {
      title: dados.title.trim(),
      author: dados.author.trim(),
      ISBN: dados.ISBN.trim(),
      publisher: dados.publisher.trim(),
      category: dados.category || 'Outros',
      year: Number(dados.year) || new Date().getFullYear(),
      location: dados.location.trim(),
      quantity: Number(dados.quantity) || 1
    };

    setSalvando(true);
    try {
      if (isEdit) {
        await api.updateBook(admId, id, payload);
        toast('Título atualizado com sucesso.', 'success');
      } else {
        await api.createBook(admId, payload);
        toast('Título cadastrado com sucesso.', 'success');
      }
      onSaved?.();
      closeModal();
    } catch (err) {
      toast(err.message || 'Não foi possível salvar o título.', 'warn');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <>
      <ModalHead title={isEdit ? 'Editar título' : 'Novo título'}
        sub={isEdit ? 'Atualize as informações do título no acervo.' : 'Cadastre um novo título no acervo.'} />
      <form id="form-livro" onSubmit={submit}>
        <div className="modal-body">
          <div className="form-grid">
            <Field label="Título *" full>
              <input className="input" value={dados.title} onChange={set('title')} placeholder="Nome da obra" required />
            </Field>
            <Field label="Autor *">
              <input className="input" value={dados.author} onChange={set('author')} placeholder="Nome do autor" required />
            </Field>
            <Field label="ISBN *">
              <input className="input" value={dados.ISBN} onChange={set('ISBN')} placeholder="978-..." required />
            </Field>
            <Field label="Categoria" full>
              <select className="select" style={{ width: '100%' }} value={dados.category} onChange={set('category')} required>
                <option value="" disabled>Selecione a categoria...</option>
                {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Editora">
              <input className="input" value={dados.publisher} onChange={set('publisher')} placeholder="Editora" />
            </Field>
            <Field label="Ano">
              <input className="input" type="number" min="1000" max="2100" value={dados.year} onChange={set('year')} />
            </Field>
            <Field label="Localização">
              <input className="input" value={dados.location} onChange={set('location')} placeholder="Ex.: A1-03" />
            </Field>
            <Field label="Nº de exemplares" full>
              <input className="input" type="number" min="1" value={dados.quantity} onChange={set('quantity')} />
            </Field>
          </div>
          <div className="form-actions">
            <button type="button" className="btn" onClick={closeModal}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={salvando}>
              {salvando ? 'Salvando...' : (isEdit ? 'Salvar alterações' : 'Cadastrar título')}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}

function LivroDetail({ id, onEdit }) {
  const { closeModal } = useModal();
  const { isBibliotecario, admId } = useSession();

  const { data: livro, loading } = useApi(async () => api.getBook(id), [id]);
  // O histórico de quem pegou o livro é restrito ao bibliotecário (a API exige `admId`).
  const { data: historico } = useApi(
    async () => (isBibliotecario ? api.bookHistory(admId, id) : []),
    [id, admId, isBibliotecario]
  );

  const emUso = livro ? livro.quantity - livro.quantityAvailable : 0;

  return (
    <>
      <ModalHead title="Detalhes do título" sub="Registro completo do título no acervo." />
      <div className="modal-body">
        {loading || !livro ? (
          <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Carregando...</p>
        ) : (
          <>
            <div className="detail-hero">
              <div className="book-cover" style={{ background: livro.coverColor || corPara(livro.title), width: 64, height: 88, fontSize: 22 }}>
                {livro.title.charAt(0)}
              </div>
              <div>
                <h3>{livro.title}</h3>
                <p>{livro.author}</p>
                <div style={{ marginTop: 8 }}>
                  <StatusBadge status={statusLivro(livro)} /> <span className="badge badge-gray">{livro.category}</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 16 }} className="detail-list">
              <Dl label="ISBN" value={livro.ISBN || '—'} />
              <Dl label="Editora" value={livro.publisher || '—'} />
              <Dl label="Ano" value={livro.year ?? '—'} />
              <Dl label="Localização" value={livro.location || '—'} />
              <Dl label="Exemplares" value={livro.quantity} />
              <Dl label="Disponíveis" value={<b style={{ color: livro.quantityAvailable > 0 ? 'var(--green)' : 'var(--red)' }}>{livro.quantityAvailable}</b>} />
              <Dl label="Cadastrado em" value={fmtDate(livro.createdAt)} />
              <Dl label="Em uso" value={emUso} />
            </div>
          </>
        )}

        <h4 style={{ margin: '18px 0 6px', fontSize: 13, fontWeight: 700 }}>Histórico de empréstimos</h4>
        {!isBibliotecario ? (
          <p style={{ color: 'var(--text-3)', fontSize: 13 }}>O histórico de empréstimos é visível apenas para a equipe da biblioteca.</p>
        ) : historico && historico.length ? (
          <ul className="mini-list">
            {historico.map((e) => (
              <li key={e.id} style={{ padding: '10px 0' }}>
                <div className="m-main">
                  <b>{e.reader ? e.reader.name : '—'}</b>
                  <span>Emprestado em {fmtDate(e.dataEmprestimo)}</span>
                </div>
                <div className="m-side"><StatusBadge status={e.status} /></div>
              </li>
            ))}
          </ul>
        ) : <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Sem registro de empréstimos.</p>}

        <div className="form-actions">
          <button className="btn" onClick={closeModal}>Fechar</button>
          {isBibliotecario && (
            <button className="btn btn-soft" onClick={() => { closeModal(); onEdit(livro); }} disabled={!livro}>
              <Icon name="edit" /> Editar
            </button>
          )}
        </div>
      </div>
    </>
  );
}
