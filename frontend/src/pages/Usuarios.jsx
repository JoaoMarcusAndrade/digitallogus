/* ============================================================
   Alexandria — Página: Usuários (CRUD, apenas bibliotecário)
   ============================================================ */

import { useEffect, useState } from 'react';
import { Icon } from '../ui/icons.jsx';
import { useModal, useToast, ModalHead, Field, Dl, StatusBadge } from '../ui/Modal.jsx';
import { useApp } from '../AppContext.jsx';
import { useSession } from '../store/session.jsx';
import api from '../api/client.js';
import { useApi } from '../api/useApi.js';
import { useDebounce } from '../api/useDebounce.js';
import { corPara, tipoUsuario } from '../ui/labels.js';
import { Pagination, EmptyRow } from '../ui/common.jsx';
import { initials, fmtDate } from '../ui/format.js';

const TIPOS = [
  ['bibliotecario', 'Administrador'],
  ['leitor', 'Leitor']
];

const STATUS_OPTIONS = [
  ['', 'Todos os status'],
  ['ativo', 'Ativo'],
  ['inativo', 'Inativo']
];

const PER_PAGE = 8;

export function Usuarios() {
  const { admId } = useSession();
  const { openModal, confirmBox } = useModal();
  const toast = useToast();
  const { detailRequest, dataVersion, reloadData } = useApp();

  const [q, setQ] = useState('');
  const [tipo, setTipo] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const qBusca = useDebounce(q, 300);

  const { data: pagina, loading, erro } = useApi(
    async () => api.listUsers({ admId, q: qBusca, tipo, status, page, perPage: PER_PAGE }),
    [admId, qBusca, tipo, status, page, dataVersion]
  );

  // Empréstimos em aberto (contagem na coluna da tabela).
  const { data: emprestimos } = useApi(
    async () => api.listLoans({ admId, perPage: 100 }),
    [admId, dataVersion]
  );

  const itens = pagina?.items || [];
  const total = pagina?.total ?? 0;
  const pages = pagina?.pages || 1;
  const ini = (Math.min(page, pages) - 1) * PER_PAGE;

  const emAberto = (userId) =>
    (emprestimos?.items || []).filter((e) => e.userId === userId && e.status !== 'returned').length;

  useEffect(() => {
    if (detailRequest && detailRequest.page === 'usuarios' && detailRequest.id) {
      openDetail(detailRequest.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailRequest]);

  const openForm = (id, usuario) => {
    openModal(<UsuarioForm id={id} u={usuario} onSaved={reloadData} />, 'md');
  };

  const openDetail = (id) => {
    openModal(<UsuarioDetail id={id} onEdit={(u) => openForm(u.id, u)} />, 'md');
  };

  const excluir = (u) => {
    confirmBox(
      'Deseja realmente excluir <b>' + u.name + '</b>? O registro será removido permanentemente.',
      async () => {
        try {
          await api.deleteUser(admId, u.id);
          toast('Usuário excluído.', 'success');
          reloadData();
        } catch (e) {
          toast(e.message || 'Não foi possível excluir o usuário.', 'warn');
        }
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
          <p className="page-sub">{total} usuário{total !== 1 ? 's' : ''} cadastrado{total !== 1 ? 's' : ''}. Gerencie leitores e administradores.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => openForm(null, null)}>
            <Icon name="plus" /> Novo usuário
          </button>
        </div>
      </div>

      {erro && (
        <div className="alert alert-danger" style={{ marginBottom: 16 }}>
          <Icon name="close" />
          <div><b>Não foi possível carregar os usuários</b><span>{erro}</span></div>
        </div>
      )}

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
            {TIPOS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
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
                <th>Nome</th><th>Matrícula</th><th>Tipo</th><th>Contato</th>
                <th style={{ textAlign: 'center' }}>Empr. abertos</th>
                <th>Status</th><th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading && !itens.length
                ? <EmptyRow icon="users" text="Carregando..." colspan={7} />
                : itens.length
                  ? itens.map((u) => (
                    <UsuarioRow
                      key={u.id}
                      u={u}
                      emAberto={emAberto(u.id)}
                      onVer={() => openDetail(u.id)}
                      onEditar={() => openForm(u.id, u)}
                      onExcluir={() => excluir(u)}
                    />
                  ))
                  : <EmptyRow icon="users" text="Nenhum usuário encontrado para os filtros aplicados." colspan={7} />}
            </tbody>
          </table>
        </div>

        <Pagination ini={ini} total={total} perPage={PER_PAGE} page={Math.min(page, pages)} onPage={setPage} />
      </div>
    </div>
  );
}

function UsuarioRow({ u, emAberto, onVer, onEditar, onExcluir }) {
  return (
    <tr>
      <td>
        <div className="cell-user">
          <div className="avatar-sm" style={{ background: corPara(u.name) }}>{initials(u.name)}</div>
          <div className="cell-title"><b>{u.name}</b><span>{tipoUsuario(u.userLevel)}</span></div>
        </div>
      </td>
      <td>{u.matricula || '—'}</td>
      <td><span className="badge badge-gray">{tipoUsuario(u.userLevel)}</span></td>
      <td>
        {u.email}
        <span style={{ display: 'block', color: 'var(--text-3)', fontSize: 12 }}>{u.telefone || ''}</span>
      </td>
      <td style={{ textAlign: 'center' }}>{emAberto}</td>
      <td><StatusBadge status={u.status} /></td>
      <td>
        <div className="row-actions">
          <button className="row-action" onClick={onVer} title="Detalhes"><Icon name="eye" /></button>
          <button className="row-action edit" onClick={onEditar} title="Editar"><Icon name="edit" /></button>
          <button className="row-action danger" onClick={onExcluir} title="Excluir"><Icon name="trash" /></button>
        </div>
      </td>
    </tr>
  );
}

function UsuarioForm({ id, u, onSaved }) {
  const { closeModal } = useModal();
  const toast = useToast();
  const { admId } = useSession();
  const isEdit = !!id;

  const [dados, setDados] = useState(() => ({
    name: u ? u.name : '',
    email: u ? u.email : '',
    telefone: u ? u.telefone : '',
    userLevel: u ? u.userLevel : 'leitor',
    status: u ? u.status : 'ativo',
    cep: u?.endereco?.cep || u?.CEP || '',
    numero: u?.endereco?.numero || '',
    complemento: u?.endereco?.complemento || ''
  }));
  const [endereco, setEndereco] = useState(u?.endereco || null);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const set = (k) => (e) => setDados((d) => ({ ...d, [k]: e.target.value }));

  // Consulta o CEP e preenche o endereço (somente leitura).
  const buscarCep = async (valor) => {
    const digitos = String(valor || '').replace(/\D/g, '');
    if (digitos.length !== 8) {
      setEndereco(null);
      return;
    }
    setBuscandoCep(true);
    try {
      const dadosEndereco = await api.lookupCep(digitos);
      setEndereco(dadosEndereco);
      setDados((d) => ({ ...d, cep: digitos }));
    } catch (e) {
      setEndereco(null);
      toast(e.message || 'Não foi possível consultar o CEP.', 'warn');
    } finally {
      setBuscandoCep(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!dados.name.trim() || !dados.email.trim()) {
      toast('Preencha os campos obrigatórios.', 'warn');
      return;
    }
    if (!dados.cep.trim()) {
      toast('Informe o CEP.', 'warn');
      return;
    }
    if (!dados.numero.trim()) {
      toast('Informe o número do endereço.', 'warn');
      return;
    }

    const payload = {
      name: dados.name.trim(),
      email: dados.email.trim(),
      telefone: dados.telefone.trim(),
      userLevel: dados.userLevel,
      status: dados.status,
      cep: dados.cep.trim(),
      numero: dados.numero.trim(),
      complemento: dados.complemento.trim()
    };

    setSalvando(true);
    try {
      if (isEdit) {
        await api.updateUser(admId, id, payload);
        toast('Usuário atualizado com sucesso.', 'success');
      } else {
        const criado = await api.createUser(admId, payload);
        toast(
          `Usuário cadastrado (matrícula ${criado.matricula}). A senha provisória foi enviada para o e-mail.`,
          'success'
        );
      }
      onSaved?.();
      closeModal();
    } catch (err) {
      toast(err.message || 'Não foi possível salvar o usuário.', 'warn');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <>
      <ModalHead title={isEdit ? 'Editar usuário' : 'Novo usuário'}
        sub={isEdit ? 'Atualize os dados cadastrais.' : 'Cadastre um novo usuário da biblioteca.'} />
      <form id="form-usuario" onSubmit={submit}>
        <div className="modal-body">
          <div className="form-grid">
            <Field label="Nome completo *" full>
              <input className="input" value={dados.name} onChange={set('name')} placeholder="Nome do usuário" required />
            </Field>
            <Field label="E-mail *">
              <input className="input" type="email" value={dados.email} onChange={set('email')} placeholder="email@dominio.com" required />
            </Field>
            <Field label="Telefone">
              <input className="input" value={dados.telefone} onChange={set('telefone')} placeholder="(00) 00000-0000" />
            </Field>
            <Field label="CEP *">
              <input
                className="input"
                value={dados.cep}
                onChange={(e) => { setDados((d) => ({ ...d, cep: e.target.value })); buscarCep(e.target.value); }}
                onBlur={(e) => buscarCep(e.target.value)}
                placeholder="00000-000"
                inputMode="numeric"
                maxLength={9}
                required
              />
            </Field>
            <Field label="Número *">
              <input className="input" value={dados.numero} onChange={set('numero')} placeholder="Ex.: 250" required />
            </Field>
            <Field label="Complemento">
              <input className="input" value={dados.complemento} onChange={set('complemento')} placeholder="Apto, sala..." />
            </Field>
            <Field label="Rua" full>
              <input className="input" value={endereco?.rua || ''} readOnly placeholder={buscandoCep ? 'Consultando...' : 'Preenchido pelo CEP'} />
            </Field>
            <Field label="Bairro">
              <input className="input" value={endereco?.bairro || ''} readOnly placeholder="Preenchido pelo CEP" />
            </Field>
            <Field label="Cidade">
              <input className="input" value={endereco?.cidade || ''} readOnly placeholder="Preenchido pelo CEP" />
            </Field>
            <Field label="UF">
              <input className="input" value={endereco?.estado || ''} readOnly placeholder="UF" />
            </Field>
            <Field label="Tipo *">
              <select className="select" style={{ width: '100%' }} value={dados.userLevel} onChange={set('userLevel')}>
                {TIPOS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select className="select" style={{ width: '100%' }} value={dados.status} onChange={set('status')}>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </Field>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 4px' }}>
            A matrícula é gerada automaticamente pelo sistema (ano + número sequencial).
            {!isEdit && ' Sem senha informada, o sistema gera uma senha provisória e a envia para o e-mail cadastrado.'}
          </p>
          <div className="form-actions">
            <button type="button" className="btn" onClick={closeModal}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={salvando || buscandoCep}>
              {salvando ? 'Salvando...' : (isEdit ? 'Salvar alterações' : 'Cadastrar usuário')}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}

function UsuarioDetail({ id, onEdit }) {
  const { closeModal } = useModal();
  const { admId } = useSession();

  const { data: u, loading } = useApi(async () => api.getUser(id), [id]);
  const { data: emprestimos } = useApi(
    async () => api.listLoans({ admId, userId: id, perPage: 50 }),
    [admId, id]
  );

  const lista = emprestimos?.items || [];
  const historico = lista.slice(0, 5);
  const abertos = lista.filter((e) => e.status !== 'returned').length;

  return (
    <>
      <ModalHead title="Detalhes do usuário" sub="Registro cadastral e movimentações." />
      <div className="modal-body">
        {loading || !u ? (
          <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Carregando...</p>
        ) : (
          <>
            <div className="detail-hero">
              <div className="avatar" style={{ width: 56, height: 56, fontSize: 18, borderRadius: 14, background: corPara(u.name) }}>
                {initials(u.name)}
              </div>
              <div>
                <h3>{u.name}</h3>
                <p>{tipoUsuario(u.userLevel)}</p>
                <div style={{ marginTop: 8 }}>
                  <StatusBadge status={u.status} /> <span className="badge badge-gray">{tipoUsuario(u.userLevel)}</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 16 }} className="detail-list">
              <Dl label="Matrícula" value={u.matricula || '—'} />
              <Dl label="E-mail" value={u.email || '—'} />
              <Dl label="Telefone" value={u.telefone || '—'} />
              <Dl label="Endereço" value={u.endereco ? (
                <>
                  {u.endereco.rua}, {u.endereco.numero}
                  {u.endereco.complemento ? ` — ${u.endereco.complemento}` : ''}
                  <br />
                  {u.endereco.bairro} — {u.endereco.cidade}/{u.endereco.estado}
                  <br />
                  CEP {u.endereco.cep}
                </>
              ) : '—'} />
              <Dl label="Cadastrado em" value={fmtDate(u.createdAt)} />
              <Dl label="Empréstimos abertos" value={abertos} />
            </div>
          </>
        )}

        <h4 style={{ margin: '18px 0 6px', fontSize: 13, fontWeight: 700 }}>Histórico de empréstimos</h4>
        {historico.length ? (
          <ul className="mini-list">
            {historico.map((e) => (
              <li key={e.id} style={{ padding: '10px 0' }}>
                <div className="m-main">
                  <b>{e.book ? e.book.title : '—'}</b>
                  <span>Emprestado em {fmtDate(e.dataEmprestimo)}</span>
                </div>
                <div className="m-side"><StatusBadge status={e.status} /></div>
              </li>
            ))}
          </ul>
        ) : <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Sem registro de empréstimos.</p>}

        <div className="form-actions">
          <button className="btn" onClick={closeModal}>Fechar</button>
          <button className="btn btn-soft" onClick={() => { closeModal(); onEdit(u); }} disabled={!u}>
            <Icon name="edit" /> Editar
          </button>
        </div>
      </div>
    </>
  );
}
