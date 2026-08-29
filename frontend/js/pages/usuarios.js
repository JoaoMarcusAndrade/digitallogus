/* ============================================================
   BiblioGestor — Página: Usuários (CRUD)
   ============================================================ */

const TIPOS = ['Aluno', 'Professor', 'Funcionário', 'Externo'];

const UsuariosPage = {
  state: { q: '', tipo: '', status: '', page: 1, perPage: 8 },

  filtrar() {
    const q = this.state.q.trim().toLowerCase();
    return window.Store.usuarios().filter(u => {
      const texto = (u.nome + ' ' + u.email + ' ' + u.matricula + ' ' + u.vinculo).toLowerCase();
      if (q && !texto.includes(q)) return false;
      if (this.state.tipo && u.tipo !== this.state.tipo) return false;
      if (this.state.status && u.status !== this.state.status) return false;
      return true;
    });
  },

  cores() {
    return ['#334155', '#475569', '#64748b', '#5b6472', '#75849a', '#94a3b8'];
  },

  render() {
    const lista = this.filtrar();
    const total = lista.length;
    const pages = Math.max(1, Math.ceil(total / this.state.perPage));
    if (this.state.page > pages) this.state.page = pages;
    const pg = this.state.page;
    const ini = (pg - 1) * this.state.perPage;
    const slice = lista.slice(ini, ini + this.state.perPage);
    const cores = this.cores();

    const rows = slice.map((u, idx) => this.linhaUsuario(u, idx, cores)).join('');

    const tipoOps = '<option value="">Todos os tipos</option>' + TIPOS.map(t =>
      '<option value="' + t + '"' + (this.state.tipo === t ? ' selected' : '') + '>' + t + '</option>').join('');
    const stOps = [
      ['', 'Todos os status'],
      ['ativo', 'Ativo'],
      ['inativo', 'Inativo']
    ].map(([v, t]) => '<option value="' + v + '"' + (this.state.status === v ? ' selected' : '') + '>' + t + '</option>').join('');

    return (
      '<div class="view-enter">' +
        '<div class="page-head">' +
          '<div>' +
            '<span class="page-kicker">Pessoas</span>' +
            '<h1 class="page-title">Usuários</h1>' +
            '<p class="page-sub">' + window.Store.usuarios().length + ' usuários cadastrados. Gerencie alunos, professores e externos.</p>' +
          '</div>' +
          '<div class="page-actions">' +
            '<button class="btn btn-primary" id="btn-novo-usuario">' + icon('plus') + ' Novo usuário</button>' +
          '</div>' +
        '</div>' +

        '<div class="card">' +
          '<div class="toolbar">' +
            '<div class="toolbar-search">' +
              '<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="' + constUI.ICONS.search + '"/></svg>' +
              '<input type="text" id="usr-busca" placeholder="Buscar por nome, e-mail, matrícula..." value="' + escapeHtml(this.state.q) + '" />' +
            '</div>' +
            '<select class="select" id="usr-tipo">' + tipoOps + '</select>' +
            '<select class="select" id="usr-status">' + stOps + '</select>' +
            '<span class="result-count">' + total + ' resultado' + (total !== 1 ? 's' : '') + '</span>' +
          '</div>' +

          '<div class="table-wrap">' +
            '<table class="table">' +
              '<thead><tr>' +
                '<th>Usuário</th><th>Matrícula</th><th>Tipo</th><th>Contato</th><th style="text-align:center">Empr. abertos</th><th style="text-align:right">Multa</th><th>Status</th><th style="text-align:right">Ações</th>' +
              '</tr></thead>' +
              '<tbody>' + (rows || emptyRowU('Nenhum usuário encontrado para os filtros aplicados.')) + '</tbody>' +
            '</table>' +
          '</div>' +

          (total > this.state.perPage ? paginationHTML(ini, total, this.state.perPage, pages, pg) : '') +
        '</div>' +
      '</div>'
    );
  },

  linhaUsuario(u, idx, cores) {
    const emAberto = window.Store.emprestimos().filter(e => e.usuarioId === u.id && e.status !== 'devolvido').length;
    const cor = u.color || cores[u.matricula.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % cores.length];
    return (
      '<tr>' +
        '<td><div class="cell-user">' +
          '<div class="avatar-sm" style="background:' + cor + '">' + initials(u.nome) + '</div>' +
          '<div class="cell-title"><b>' + escapeHtml(u.nome) + '</b><span>' + escapeHtml(u.vinculo || u.tipo) + '</span></div>' +
        '</div></td>' +
        '<td>' + escapeHtml(u.matricula) + '</td>' +
        '<td><span class="badge badge-gray">' + escapeHtml(u.tipo) + '</span></td>' +
        '<td>' + escapeHtml(u.email) + '<span style="display:block;color:var(--text-3);font-size:12px">' + escapeHtml(u.telefone || '') + '</span></td>' +
        '<td style="text-align:center">' + emAberto + '</td>' +
        '<td style="text-align:right">' + fmtMoney(u.multa) + '</td>' +
        '<td>' + statusBadge(u.status) + '</td>' +
        '<td><div class="row-actions">' +
          '<button class="row-action edit" data-act="editar" data-id="' + u.id + '" title="Editar">' + icon('edit') + '</button>' +
          '<button class="row-action danger" data-act="excluir" data-id="' + u.id + '" title="Excluir">' + icon('trash') + '</button>' +
        '</div></td>' +
      '</tr>'
    );
  },

  mount() {
    const self = this;
    document.getElementById('btn-novo-usuario').onclick = () => self.abrirForm();
    document.getElementById('usr-busca').oninput = e => { self.state.q = e.target.value; self.state.page = 1; self.atualizarBusca(); };
    document.getElementById('usr-tipo').onchange = e => { self.state.tipo = e.target.value; self.state.page = 1; self.renderInto(); };
    document.getElementById('usr-status').onchange = e => { self.state.status = e.target.value; self.state.page = 1; self.renderInto(); };
    self.bindLista();
  },

  bindLista() {
    const self = this;
    document.querySelectorAll('#view .page-btn').forEach(b => {
      b.onclick = () => {
        const v = b.dataset.page;
        const pages = Math.max(1, Math.ceil(self.filtrar().length / self.state.perPage));
        if (v === 'prev') self.state.page = Math.max(1, self.state.page - 1);
        else if (v === 'next') self.state.page = Math.min(pages, self.state.page + 1);
        else self.state.page = Number(v);
        self.atualizarBusca();
      };
    });

    document.querySelectorAll('#view [data-act]').forEach(b => {
      b.onclick = () => {
        if (b.dataset.act === 'editar') self.abrirForm(b.dataset.id);
        if (b.dataset.act === 'excluir') self.excluir(b.dataset.id);
      };
    });
  },

  atualizarBusca() {
    const view = document.getElementById('view');
    const lista = this.filtrar();
    const total = lista.length;
    const pages = Math.max(1, Math.ceil(total / this.state.perPage));
    if (this.state.page > pages) this.state.page = pages;
    const pg = this.state.page;
    const ini = (pg - 1) * this.state.perPage;
    const slice = lista.slice(ini, ini + this.state.perPage);
    const cores = this.cores();

    const rc = view.querySelector('.result-count');
    if (rc) rc.textContent = total + ' resultado' + (total !== 1 ? 's' : '');

    const tbody = view.querySelector('.table tbody');
    if (tbody) tbody.innerHTML = slice.map((u, idx) => this.linhaUsuario(u, idx, cores)).join('') ||
      emptyRowU('Nenhum usuário encontrado para os filtros aplicados.');

    const card = view.querySelector('.card');
    atualizarPaginacao(card, ini, total, this.state.perPage, pages, pg);

    this.bindLista();
  },

  renderInto() {
    document.getElementById('view').innerHTML = this.render();
    this.mount();
  },

  abrirDetalhe(id) {
    const S = window.Store;
    const u = S.usuario(id);
    if (!u) return;
    const cor = u.color || '#64748b';
    const historico = S.emprestimos().filter(e => e.usuarioId === id).slice(0, 5).map(e => {
      const l = S.livro(e.livroId);
      return (
        '<div class="mini-list"><li style="padding:10px 0">' +
          '<div class="m-main"><b>' + escapeHtml(l ? l.titulo : '—') + '</b><span>Emprestado em ' + fmtDate(e.dataEmprestimo) + '</span></div>' +
          '<div class="m-side">' + statusBadge(e.status) + '</div>' +
        '</li></div>'
      );
    }).join('');

    const html =
      '<div class="modal-head">' +
        '<div><h2>Detalhes do usuário</h2><p>Registro cadastral e movimentações.</p></div>' +
        '<button class="icon-btn" data-close-modal>' + icon('close') + '</button>' +
      '</div>' +
      '<div class="modal-body">' +
        '<div class="detail-hero">' +
          '<div class="avatar" style="width:56px;height:56px;font-size:18px;border-radius:14px;background:' + cor + '">' + initials(u.nome) + '</div>' +
          '<div>' +
            '<h3>' + escapeHtml(u.nome) + '</h3>' +
            '<p>' + escapeHtml(u.vinculo || u.tipo) + '</p>' +
            '<div style="margin-top:8px">' + statusBadge(u.status) + ' <span class="badge badge-gray">' + escapeHtml(u.tipo) + '</span></div>' +
          '</div>' +
        '</div>' +

        '<div style="margin-top:16px" class="detail-list">' +
          dl('Matrícula', u.matricula) +
          dl('E-mail', u.email || '—') +
          dl('Telefone', u.telefone || '—') +
          dl('Multa pendente', '<b style="color:' + (u.multa > 0 ? 'var(--red)' : 'var(--green)') + '">' + fmtMoney(u.multa) + '</b>') +
          dl('Cadastrado em', fmtDate(u.cadastradoEm)) +
          dl('Empréstimos abertos', S.emprestimos().filter(e => e.usuarioId === id && e.status !== 'devolvido').length) +
        '</div>' +

        '<h4 style="margin:18px 0 6px;font-size:13px;font-weight:700">Histórico de empréstimos</h4>' +
        (historico || '<p style="color:var(--text-3);font-size:13px">Sem registro de empréstimos.</p>') +

        '<div class="form-actions">' +
          '<button class="btn" data-close-modal>Fechar</button>' +
          '<button class="btn btn-soft" id="dlg-editar-usuario">' + icon('edit') + ' Editar</button>' +
        '</div>' +
      '</div>';

    openModal(html, { size: 'md' });
    document.getElementById('dlg-editar-usuario').onclick = () => { closeModal(); this.abrirForm(id); };
  },

  abrirForm(id) {
    const S = window.Store;
    const u = id ? S.usuario(id) : null;
    const isEdit = !!u;

    const html =
      '<div class="modal-head">' +
        '<div><h2>' + (isEdit ? 'Editar usuário' : 'Novo usuário') + '</h2>' +
        '<p>' + (isEdit ? 'Atualize os dados cadastrais.' : 'Cadastre um novo usuário da biblioteca.') + '</p></div>' +
        '<button class="icon-btn" data-close-modal>' + icon('close') + '</button>' +
      '</div>' +
      '<form id="form-usuario" novalidate>' +
        '<div class="modal-body">' +
          '<div class="form-grid">' +
            fieldHTML('Nome completo *', '<input class="input" name="nome" required value="' + (isEdit ? escapeHtml(u.nome) : '') + '" placeholder="Nome do usuário" />', true) +
            fieldHTML('E-mail *', '<input class="input" name="email" type="email" required value="' + (isEdit ? escapeHtml(u.email) : '') + '" placeholder="email@dominio.com" />') +
            fieldHTML('Telefone', '<input class="input" name="telefone" value="' + (isEdit ? escapeHtml(u.telefone) : '') + '" placeholder="(00) 00000-0000" />') +
            fieldHTML('Matrícula *', '<input class="input" name="matricula" required value="' + (isEdit ? escapeHtml(u.matricula) : '') + '" placeholder="Ex.: 2024001234" />') +
            selHTML('Tipo *', 'tipo', TIPOS, isEdit ? u.tipo : 'Aluno') +
            fieldHTML('Vínculo / Curso', '<input class="input" name="vinculo" value="' + (isEdit ? escapeHtml(u.vinculo) : '') + '" placeholder="Ex.: Administração — 4º sem." />', true) +
            selHTML('Status', 'status', ['ativo', 'inativo'], isEdit ? u.status : 'ativo') +
            fieldHTML('Multa (R$)', '<input class="input" name="multa" type="number" min="0" step="0.01" value="' + (isEdit ? (u.multa || 0) : 0) + '" />') +
          '</div>' +
          '<div class="form-actions">' +
            '<button type="button" class="btn" data-close-modal>Cancelar</button>' +
            '<button type="submit" class="btn btn-primary">' + (isEdit ? 'Salvar alterações' : 'Cadastrar usuário') + '</button>' +
          '</div>' +
        '</div>' +
      '</form>';

    openModal(html, { size: 'md' });
    const f = document.getElementById('form-usuario');

    f.addEventListener('submit', ev => {
      ev.preventDefault();
      if (!validarForm(f)) return;
      const dados = Object.fromEntries(new FormData(f).entries());
      const cores = this.cores();
      const cor = cores[Math.floor(Math.random() * cores.length)];

      if (isEdit) {
        S.updateUsuario(id, { ...dados, multa: Number(dados.multa) || 0, color: u.color || cor });
        toast('Usuário atualizado com sucesso.', 'success');
      } else {
        S.addUsuario({ ...dados, multa: Number(dados.multa) || 0, color: cor });
        toast('Usuário cadastrado com sucesso.', 'success');
      }
      closeModal();
      this.renderInto();
    });
  },

  excluir(id) {
    const u = window.Store.usuario(id);
    if (!u) return;
    confirmBox(
      'Deseja realmente excluir <b>' + escapeHtml(u.nome) + '</b>? O registro será removido permanentemente.',
      () => {
        const r = window.Store.removeUsuario(id);
        if (r.ok) toast('Usuário excluído.', 'success');
        else toast(r.msg, 'warn');
        this.renderInto();
      },
      { title: 'Excluir usuário', okText: 'Excluir', danger: true }
    );
  }
};

function emptyRowU(txt) {
  return '<tr class="empty-row"><td colspan="8"><div class="empty-state">' +
    '<svg class="icon" viewBox="0 0 24 24" fill="currentColor" width="40" height="40" style="opacity:.35"><path d="' + constUI.ICONS.users + '"/></svg>' +
    '<p>' + txt + '</p></div></td></tr>';
}

window.UsuariosPage = UsuariosPage;
window.TIPOS = TIPOS;