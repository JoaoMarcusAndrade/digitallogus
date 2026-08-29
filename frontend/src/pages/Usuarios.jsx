/* ============================================================
   BiblioGestor — Página: Usuários (CRUD)
   ============================================================ */

import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../ui/icons.jsx';
import { useModal, useToast, ModalHead, Field, Dl, StatusBadge } from '../ui/Modal.jsx';
import { useApp } from '../AppContext.jsx';
import { useStore, usuarios, usuario, addUsuario, updateUsuario, removeUsuario, emprestimos, livro } from '../store/store.js';
import { Pagination, EmptyRow } from '../ui/common.jsx';
import { initials, fmtDate, fmtMoney } from '../ui/format.js';

const TIPOS = ['Aluno', 'Professor', 'Funcionário', 'Externo'];
const CORES = ['#334155', '#475569', '#64748b', '#5b6472', '#75849a', '#94a3b8'];

function colorOf(u) {
  if (u.color) return u.color;
  return CORES[u.matricula.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % CORES.length];
}

export function Usuarios() {
  useStore();
  const { openModal, confirmBox } = useModal();
  const toast = useToast();

  const [q, setQ] = useState('');
  const [tipo, setTipo] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 8;

  const all = usuarios();

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return all.filter((u) => {
      const texto = (u.nome + ' ' + u.email + ' ' + u.matricula + ' ' + u.vinculo).toLowerCase();
      if (query && !texto.includes(query)) return false;
      if (tipo && u.tipo !== tipo) return false;
      if (status && u.status !== status) return false;
      return true;
    });
  }, [all, q, tipo, status]);

  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, pages);
  const ini = (safePage - 1) * perPage;
  const slice = filtered.slice(ini, ini + perPage);

  const { detailRequest } = useApp();
  useEffect(() => {
    if (detailRequest && detailRequest.page === 'usuarios' && detailRequest.id) {
      openDetail(detailRequest.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailRequest]);

  const openForm = (id) => {
    const u = id ? usuario(id) : null;
    openModal(<UsuarioForm id={id} u={u} />, 'md');
  };

  const openDetail = (id) => {
    const u = usuario(id);
    if (!u) return;
    openModal(<UsuarioDetail id={id} u={u} onEdit={() => openForm(id)} />, 'md');
  };

  const excluir = (id) => {
    const u = usuario(id);
    if (!u) return;
    confirmBox(
      'Deseja realmente excluir <b>' + u.nome + '</b>? O registro será removido permanentemente.',
      () => {
        const r = removeUsuario(id);
        toast(r.ok ? 'Usuário excluído.' : r.msg, r.ok ? 'success' : 'warn');
      },
      { title: 'Excluir usuário', okText: 'Excluir', danger: true }
    );
  };

  return (
    <div className="view-enter">
      <div className="page-head">
        <div>
          <span className="page-kicker">Pessoas</span>
          <h1 className="page-title">Usuários</h1>
          <p className="page-sub">{all.length} usuários cadastrados. Gerencie alunos, professores e externos.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => openForm(null)}>
            <Icon name="plus" /> Novo usuário
          </button>
        </div>
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="toolbar-search">
            <Icon name="search" />
            <input
              type="text"
              placeholder="Buscar por nome, e-mail, matrícula..."
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
            />
          </div>
          <select className="select" value={tipo} onChange={(e) => { setTipo(e.target.value); setPage(1); }}>
            <option value="">Todos os tipos</option>
            {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">Todos os status</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
          <span className="result-count">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Usuário</th><th>Matrícula</th><th>Tipo</th><th>Contato</th>
                <th style={{ textAlign: 'center' }}>Empr. abertos</th><th style={{ textAlign: 'right' }}>Multa</th>
                <th>Status</th><th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {slice.length ? slice.map((u) => <UsuarioRow key={u.id} u={u} onEditar={openForm} onExcluir={excluir} />)
                : <EmptyRow icon="users" text="Nenhum usuário encontrado para os filtros aplicados." colspan={8} />}
            </tbody>
          </table>
        </div>

        <Pagination ini={ini} total={filtered.length} perPage={perPage} page={safePage} onPage={setPage} />
      </div>
    </div>
  );
}

function UsuarioRow({ u, onEditar, onExcluir }) {
  const emAberto = emprestimos().filter((e) => e.usuarioId === u.id && e.status !== 'devolvido').length;
  const cor = colorOf(u);
  return (
    <tr>
      <td>
        <div className="cell-user">
          <div className="avatar-sm" style={{ background: cor }}>{initials(u.nome)}</div>
          <div className="cell-title"><b>{u.nome}</b><span>{u.vinculo || u.tipo}</span></div>
        </div>
      </td>
      <td>{u.matricula}</td>
      <td><span className="badge badge-gray">{u.tipo}</span></td>
      <td>
        {u.email}
        <span style={{ display: 'block', color: 'var(--text-3)', fontSize: 12 }}>{u.telefone || ''}</span>
      </td>
      <td style={{ textAlign: 'center' }}>{emAberto}</td>
      <td style={{ textAlign: 'right' }}>{fmtMoney(u.multa)}</td>
      <td><StatusBadge status={u.status} /></td>
      <td>
        <div className="row-actions">
          <button className="row-action edit" onClick={() => onEditar(u.id)} title="Editar"><Icon name="edit" /></button>
          <button className="row-action danger" onClick={() => onExcluir(u.id)} title="Excluir"><Icon name="trash" /></button>
        </div>
      </td>
    </tr>
  );
}

function UsuarioForm({ id, u }) {
  const { closeModal } = useModal();
  const toast = useToast();
  const isEdit = !!u;
  const [dados, setDados] = useState(() => ({
    nome: u ? u.nome : '',
    email: u ? u.email : '',
    telefone: u ? u.telefone : '',
    matricula: u ? u.matricula : '',
    tipo: u ? u.tipo : 'Aluno',
    vinculo: u ? u.vinculo : '',
    status: u ? u.status : 'ativo',
    multa: u ? (u.multa || 0) : 0
  }));

  const set = (k) => (e) => setDados((d) => ({ ...d, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!dados.nome.trim() || !dados.email.trim() || !dados.matricula.trim()) { toast('Preencha os campos obrigatórios.', 'warn'); return; }
    const cor = CORES[Math.floor(Math.random() * CORES.length)];
    const payload = { ...dados, multa: Number(dados.multa) || 0 };
    if (isEdit) {
      updateUsuario(id, { ...payload, color: u.color || cor });
      toast('Usuário atualizado com sucesso.', 'success');
    } else {
      addUsuario({ ...payload, color: cor });
      toast('Usuário cadastrado com sucesso.', 'success');
    }
    closeModal();
  };

  return (
    <>
      <ModalHead title={isEdit ? 'Editar usuário' : 'Novo usuário'}
        sub={isEdit ? 'Atualize os dados cadastrais.' : 'Cadastre um novo usuário da biblioteca.'} />
      <form id="form-usuario" onSubmit={submit}>
        <div className="modal-body">
          <div className="form-grid">
            <Field label="Nome completo *" full>
              <input className="input" value={dados.nome} onChange={set('nome')} placeholder="Nome do usuário" required />
            </Field>
            <Field label="E-mail *">
              <input className="input" type="email" value={dados.email} onChange={set('email')} placeholder="email@dominio.com" required />
            </Field>
            <Field label="Telefone">
              <input className="input" value={dados.telefone} onChange={set('telefone')} placeholder="(00) 00000-0000" />
            </Field>
            <Field label="Matrícula *">
              <input className="input" value={dados.matricula} onChange={set('matricula')} placeholder="Ex.: 2024001234" required />
            </Field>
            <Field label="Tipo *">
              <select className="select" style={{ width: '100%' }} value={dados.tipo} onChange={set('tipo')}>
                {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select className="select" style={{ width: '100%' }} value={dados.status} onChange={set('status')}>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </Field>
            <Field label="Vínculo / Curso" full>
              <input className="input" value={dados.vinculo} onChange={set('vinculo')} placeholder="Ex.: Administração — 4º sem." />
            </Field>
            <Field label="Multa (R$)" full>
              <input className="input" type="number" min="0" step="0.01" value={dados.multa} onChange={set('multa')} />
            </Field>
          </div>
          <div className="form-actions">
            <button type="button" className="btn" onClick={closeModal}>Cancelar</button>
            <button type="submit" className="btn btn-primary">{isEdit ? 'Salvar alterações' : 'Cadastrar usuário'}</button>
          </div>
        </div>
      </form>
    </>
  );
}

function UsuarioDetail({ id, u, onEdit }) {
  const { closeModal } = useModal();
  const cor = colorOf(u);
  const historico = emprestimos().filter((e) => e.usuarioId === id).slice(0, 5);
  const abertos = emprestimos().filter((e) => e.usuarioId === id && e.status !== 'devolvido').length;

  return (
    <>
      <ModalHead title="Detalhes do usuário" sub="Registro cadastral e movimentações." />
      <div className="modal-body">
        <div className="detail-hero">
          <div className="avatar" style={{ width: 56, height: 56, fontSize: 18, borderRadius: 14, background: cor }}>{initials(u.nome)}</div>
          <div>
            <h3>{u.nome}</h3>
            <p>{u.vinculo || u.tipo}</p>
            <div style={{ marginTop: 8 }}>
              <StatusBadge status={u.status} /> <span className="badge badge-gray">{u.tipo}</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16 }} className="detail-list">
          <Dl label="Matrícula" value={u.matricula} />
          <Dl label="E-mail" value={u.email || '—'} />
          <Dl label="Telefone" value={u.telefone || '—'} />
          <Dl label="Multa pendente" value={<b style={{ color: u.multa > 0 ? 'var(--red)' : 'var(--green)' }}>{fmtMoney(u.multa)}</b>} />
          <Dl label="Cadastrado em" value={fmtDate(u.cadastradoEm)} />
          <Dl label="Empréstimos abertos" value={abertos} />
        </div>

        <h4 style={{ margin: '18px 0 6px', fontSize: 13, fontWeight: 700 }}>Histórico de empréstimos</h4>
        {historico.length ? (
          <ul className="mini-list">
            {historico.map((e) => {
              const l = livro(e.livroId);
              return (
                <li key={e.id} style={{ padding: '10px 0' }}>
                  <div className="m-main"><b>{l ? l.titulo : '—'}</b><span>Emprestado em {fmtDate(e.dataEmprestimo)}</span></div>
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
