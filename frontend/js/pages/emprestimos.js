/* ============================================================
   BiblioGestor — Página: Empréstimos
   ============================================================ */

const EmprestimosPage = {
  state: { q: '', status: '', page: 1, perPage: 10 },

  filtrar() {
    const q = this.state.q.trim().toLowerCase();
    const S = window.Store;
    return S.emprestimos().map(e => {
      let atrasado = false;
      if (e.status !== 'devolvido') {
        atrasado = new Date(e.dataDevolucaoPrevista) < new Date();
      }
      return { e, atrasado };
    }).filter(({ e, atrasado }) => {
      const u = S.usuario(e.usuarioId);
      const l = S.livro(e.livroId);
      const texto = ((u ? u.nome : '') + ' ' + (l ? l.titulo : '')).toLowerCase();
      if (q && !texto.includes(q)) return false;
      const st = e.status === 'devolvido' ? 'devolvido' : (atrasado ? 'atrasado' : 'ativo');
      if (this.state.status && st !== this.state.status) return false;
      return true;
    });
  },

  render() {
    const S = window.Store;
    const lista = this.filtrar();
    const total = lista.length;
    const pages = Math.max(1, Math.ceil(total / this.state.perPage));
    if (this.state.page > pages) this.state.page = pages;
    const pg = this.state.page;
    const ini = (pg - 1) * this.state.perPage;
    const slice = lista.slice(ini, ini + this.state.perPage);

    const rows = slice.map(p => this.linhaEmprestimo(p)).join('');

    const stOps = [
      ['', 'Todos os status'],
      ['ativo', 'Ativos'],
      ['atrasado', 'Atrasados'],
      ['devolvido', 'Devolvidos']
    ].map(([v, t]) => '<option value="' + v + '"' + (this.state.status === v ? ' selected' : '') + '>' + t + '</option>').join('');

    return (
      '<div class="view-enter">' +
        '<div class="page-head">' +
          '<div>' +
            '<span class="page-kicker">Circulação</span>' +
            '<h1 class="page-title">Empréstimos</h1>' +
            '<p class="page-sub">Registre, renove e acompanhe as devoluções de exemplares.</p>' +
          '</div>' +
          '<div class="page-actions">' +
            '<button class="btn btn-primary" id="btn-novo-emprestimo">' + icon('plus') + ' Novo empréstimo</button>' +
          '</div>' +
        '</div>' +

        '<div class="card">' +
          '<div class="toolbar">' +
            '<div class="toolbar-search">' +
              '<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="' + constUI.ICONS.search + '"/></svg>' +
              '<input type="text" id="emp-busca" placeholder="Buscar por obra ou usuário..." value="' + escapeHtml(this.state.q) + '" />' +
            '</div>' +
            '<select class="select" id="emp-status">' + stOps + '</select>' +
            '<span class="result-count">' + total + ' registro' + (total !== 1 ? 's' : '') + '</span>' +
          '</div>' +

          '<div class="table-wrap">' +
            '<table class="table">' +
              '<thead><tr>' +
                '<th>Obra</th><th>Usuário</th><th>Emprestado em</th><th>Prevista</th><th>Prazo</th><th>Status</th><th style="text-align:right">Ações</th>' +
              '</tr></thead>' +
              '<tbody>' + (rows || emptyRowE('Nenhum empréstimo encontrado.')) + '</tbody>' +
            '</table>' +
          '</div>' +

          (total > this.state.perPage ? paginationHTML(ini, total, this.state.perPage, pages, pg) : '') +
        '</div>' +
      '</div>'
    );
  },

  linhaEmprestimo({ e, atrasado }) {
    const S = window.Store;
    const u = S.usuario(e.usuarioId);
    const l = S.livro(e.livroId);
    const st = e.status === 'devolvido' ? 'devolvido' : (atrasado ? 'atrasado' : 'ativo');
    const dias = diffDias(e.dataDevolucaoPrevista);
    const prazo =
      e.status === 'devolvido' ? '<span style="color:var(--text-3)">devolvido em ' + fmtDate(e.dataDevolucao) + '</span>' :
      atrasado ? '<b style="color:var(--red)">' + Math.abs(dias) + ' dia' + (Math.abs(dias) !== 1 ? 's' : '') + ' de atraso</b>' :
      dias <= 3 ? '<b style="color:var(--amber)">vence em ' + dias + 'd</b>' :
      '<span style="color:var(--text-3)">vence em ' + dias + 'd</span>';

    return (
      '<tr>' +
        '<td>' +
          '<div class="cell-book">' +
            '<div class="book-cover" style="background:' + (l ? l.capa : '#94a3b8') + '">' + escapeHtml((l ? l.titulo : '?').charAt(0)) + '</div>' +
            '<div class="cell-title"><b>' + escapeHtml(l ? l.titulo : 'Título removido') + '</b><span>' + escapeHtml(l ? l.autor : '') + '</span></div>' +
          '</div>' +
        '</td>' +
        '<td><div class="cell-user">' +
          '<div class="avatar-sm" style="background:' + (u ? (u.color || '#64748b') : '#94a3b8') + '">' + (u ? initials(u.nome) : '?') + '</div>' +
          '<div class="cell-title"><b>' + escapeHtml(u ? u.nome : '—') + '</b><span>' + escapeHtml(u ? u.matricula : '') + '</span></div>' +
        '</div></td>' +
        '<td>' + fmtDate(e.dataEmprestimo) + '</td>' +
        '<td>' + fmtDate(e.dataDevolucaoPrevista) + '<span style="display:block;font-size:11.5px;color:var(--text-3)">' + e.renovacoes + ' renov.</span></td>' +
        '<td>' + prazo + '</td>' +
        '<td>' + statusBadge(st) + '</td>' +
        '<td><div class="row-actions">' +
          (e.status !== 'devolvido' ?
            '<button class="row-action" data-act="renovar" data-id="' + e.id + '" title="Renovar (até 2x)">' + icon('calendar') + '</button>' +
            '<button class="row-action" data-act="devolver" data-id="' + e.id + '" title="Registrar devolução">' + icon('check') + '</button>'
            : '') +
        '</div></td>' +
      '</tr>'
    );
  },

  mount() {
    const self = this;
    document.getElementById('btn-novo-emprestimo').onclick = () => self.openModalEmprestar();
    document.getElementById('emp-busca').oninput = e => { self.state.q = e.target.value; self.state.page = 1; self.atualizarBusca(); };
    document.getElementById('emp-status').onchange = e => { self.state.status = e.target.value; self.state.page = 1; self.renderInto(); };

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
        if (b.dataset.act === 'renovar') self.renovar(b.dataset.id);
        if (b.dataset.act === 'devolver') self.devolver(b.dataset.id);
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

    const rc = view.querySelector('.result-count');
    if (rc) rc.textContent = total + ' registro' + (total !== 1 ? 's' : '');

    const tbody = view.querySelector('.table tbody');
    if (tbody) tbody.innerHTML = slice.map(p => this.linhaEmprestimo(p)).join('') ||
      emptyRowE('Nenhum empréstimo encontrado.');

    const card = view.querySelector('.card');
    atualizarPaginacao(card, ini, total, this.state.perPage, pages, pg);

    this.bindLista();
  },

  renderInto() {
    document.getElementById('view').innerHTML = this.render();
    this.mount();
  },

  /* ---------- Novo empréstimo ---------- */

  openModalEmprestar() {
    const S = window.Store;
    const userOps = S.usuarios().filter(u => u.status === 'ativo').map(u => {
      const cor = u.color || '#64748b';
      return '<option value="' + u.id + '">' + escapeHtml(u.nome) + ' (' + escapeHtml(u.matricula) + ')</option>';
    }).join('');

    const bookOps = S.livros().map(l => {
      const disp = l.exemplaresDisp;
      return '<option value="' + l.id + '"' + (disp <= 0 ? ' disabled' : '') + '>' +
        escapeHtml(l.titulo) + ' — ' + escapeHtml(l.autor) + (disp <= 0 ? ' (esgotado)' : ' (' + disp + ' disp.)') + '</option>';
    }).join('');

    const html =
      '<div class="modal-head">' +
        '<div><h2>Novo empréstimo</h2><p>Selecione o usuário, a obra e o prazo de devolução.</p></div>' +
        '<button class="icon-btn" data-close-modal>' + icon('close') + '</button>' +
      '</div>' +
      '<form id="form-emprestimo" novalidate>' +
        '<div class="modal-body">' +
          '<div class="form-grid">' +
            '<div class="field full"><span class="field-label">Usuário *</span>' +
              '<select class="select" name="usuario" required style="width:100%">' +
                '<option value="" disabled selected>Selecione o usuário...</option>' + userOps +
              '</select></div>' +
            '<div class="field full"><span class="field-label">Obra *</span>' +
              '<select class="select" name="livro" required style="width:100%">' +
                '<option value="" disabled selected>Selecione a obra...</option>' + bookOps +
              '</select></div>' +
            '<div class="field"><span class="field-label">Prazo de devolução (dias)</span>' +
              '<input class="input" name="dias" type="number" min="1" max="60" value="14" /></div>' +
          '</div>' +
          '<div class="form-actions">' +
            '<button type="button" class="btn" data-close-modal>Cancelar</button>' +
            '<button type="submit" class="btn btn-primary">' + icon('check') + ' Registrar empréstimo</button>' +
          '</div>' +
        '</div>' +
      '</form>';

    openModal(html, { size: 'md' });
    const f = document.getElementById('form-emprestimo');
    f.addEventListener('submit', ev => {
      ev.preventDefault();
      const d = Object.fromEntries(new FormData(f).entries());
      if (!d.usuario || !d.livro) { toast('Selecione o usuário e a obra.', 'warn'); return; }
      const r = S.emprestar(d.usuario, d.livro, Number(d.dias) || 14);
      if (r.ok) {
        toast('Empréstimo registrado com sucesso.', 'success');
        closeModal();
        this.renderInto();
      } else {
        toast(r.msg, 'warn');
      }
    });
  },

  devolver(id) {
    const S = window.Store;
    const e = S.emprestimo(id);
    const l = S.livro(e.livroId);
    const u = S.usuario(e.usuarioId);
    confirmBox(
      'Registrar devolução de <b>' + escapeHtml(l ? l.titulo : '') + '</b> (usuário: ' + escapeHtml(u ? u.nome : '') + ')?',
      () => {
        const r = S.devolver(id);
        if (r.ok) toast('Devolução registrada.', 'success');
        else toast(r.msg, 'warn');
        this.renderInto();
      },
      { title: 'Registrar devolução', okText: 'Confirmar' }
    );
  },

  renovar(id) {
    const r = window.Store.renovar(id);
    if (r.ok) toast('Empréstimo renovado por +7 dias.', 'success');
    else toast(r.msg, 'warn');
    this.renderInto();
  }
};

function emptyRowE(txt) {
  return '<tr class="empty-row"><td colspan="7"><div class="empty-state">' +
    '<svg class="icon" viewBox="0 0 24 24" fill="currentColor" width="40" height="40" style="opacity:.35"><path d="' + constUI.ICONS.loans + '"/></svg>' +
    '<p>' + txt + '</p></div></td></tr>';
}

window.EmprestimosPage = EmprestimosPage;