/* ============================================================
   BiblioGestor — Página: Acervo (CRUD de livros)
   ============================================================ */

const CATEGORIAS = ['Romance', 'Ficção', 'Infantojuvenil', 'Técnico', 'História', 'Filosofia', 'Biografia', 'Poesia', 'HQs & Mangás', 'Outros'];

const AcervoPage = {
  state: { q: '', cat: '', status: '', page: 1, perPage: 8 },

  filtrarLivros() {
    const q = this.state.q.trim().toLowerCase();
    return window.Store.livros().filter(l => {
      const texto = (l.titulo + ' ' + l.autor + ' ' + l.isbn + ' ' + l.editora).toLowerCase();
      if (q && !texto.includes(q)) return false;
      if (this.state.cat && l.categoria !== this.state.cat) return false;

      const emUso = l.exemplares - l.exemplaresDisp;
      const st = l.exemplaresDisp === 0 ? 'esgotado' : (emUso > 0 ? 'emprestado' : 'disponivel');
      if (this.state.status && st !== this.state.status) return false;
      return true;
    });
  },

  render() {
    const lista = this.filtrarLivros();
    const total = lista.length;
    const pages = Math.max(1, Math.ceil(total / this.state.perPage));
    let pg = this.state.page;
    if (pg > pages) { pg = pages; this.state.page = pg; }
    const ini = (pg - 1) * this.state.perPage;
    const slice = lista.slice(ini, ini + this.state.perPage);
    const totalTitulos = window.Store.livros().length;

    const rows = slice.map(l => this.linhaLivro(l)).join('');

    const catOptions = '<option value="">Todas as categorias</option>' + CATEGORIAS.map(c =>
      '<option value="' + c + '"' + (this.state.cat === c ? ' selected' : '') + '>' + c + '</option>').join('');
    const stOptions = [
      ['', 'Todos os status'],
      ['disponivel', 'Disponível'],
      ['emprestado', 'Emprestado'],
      ['esgotado', 'Esgotado']
    ].map(([v, t]) => '<option value="' + v + '"' + (this.state.status === v ? ' selected' : '') + '>' + t + '</option>').join('');

    return (
      '<div class="view-enter">' +
        '<div class="page-head">' +
          '<div>' +
            '<span class="page-kicker">Catálogo</span>' +
            '<h1 class="page-title">Acervo</h1>' +
            '<p class="page-sub">' + totalTitulos + ' títulos cadastrados no acervo da biblioteca.</p>' +
          '</div>' +
          '<div class="page-actions">' +
            '<button class="btn btn-ghost" data-route="relatorios">' + icon('reports') + ' Relatórios</button>' +
            '<button class="btn btn-primary" id="btn-novo-livro">' + icon('plus') + ' Novo título</button>' +
          '</div>' +
        '</div>' +

        '<div class="card">' +
          '<div class="toolbar">' +
            '<div class="toolbar-search">' +
              svgIcon('search') +
              '<input type="text" id="acervo-busca" placeholder="Buscar por título, autor, ISBN..." value="' + escapeHtml(this.state.q) + '" />' +
            '</div>' +
            '<select class="select" id="acervo-cat">' + catOptions + '</select>' +
            '<select class="select" id="acervo-status">' + stOptions + '</select>' +
            '<span class="result-count">' + total + ' resultado' + (total !== 1 ? 's' : '') + '</span>' +
          '</div>' +

          '<div class="table-wrap">' +
            '<table class="table">' +
              '<thead><tr>' +
                '<th>Título</th><th>Categoria</th><th>ISBN</th><th>Local.</th><th style="text-align:center">Disp.</th><th>Status</th><th style="text-align:right">Ações</th>' +
              '</tr></thead>' +
              '<tbody>' + (rows || emptyRow('Nenhum título encontrado para os filtros aplicados.')) + '</tbody>' +
            '</table>' +
          '</div>' +

          (total > this.state.perPage ? paginationHTML(ini, total, this.state.perPage, pages, pg) : '') +
        '</div>' +
      '</div>'
    );
  },

  linhaLivro(l) {
    const emUso = l.exemplares - l.exemplaresDisp;
    const st = l.exemplaresDisp === 0 ? 'esgotado' : (emUso > 0 ? 'emprestado' : 'disponivel');
    return (
      '<tr>' +
        '<td>' +
          '<div class="cell-book">' +
            '<div class="book-cover" style="background:' + l.capa + '">' + escapeHtml(l.titulo.charAt(0)) + '</div>' +
            '<div class="cell-title">' +
              '<b>' + escapeHtml(l.titulo) + '</b>' +
              '<span>' + escapeHtml(l.autor) + ' · ' + escapeHtml(l.editora) + ' (' + l.ano + ')</span>' +
            '</div>' +
          '</div>' +
        '</td>' +
        '<td><span class="badge badge-gray">' + escapeHtml(l.categoria) + '</span></td>' +
        '<td style="font-family:ui-monospace,monospace;font-size:12.5px">' + escapeHtml(l.isbn) + '</td>' +
        '<td>' + escapeHtml(l.localizacao) + '</td>' +
        '<td style="text-align:center">' + l.exemplaresDisp + '/' + l.exemplares + '</td>' +
        '<td>' + statusBadge(st) + '</td>' +
        '<td><div class="row-actions">' +
          '<button class="row-action" data-act="ver" data-id="' + l.id + '" title="Detalhes">' + icon('eye') + '</button>' +
          '<button class="row-action edit" data-act="editar" data-id="' + l.id + '" title="Editar">' + icon('edit') + '</button>' +
          '<button class="row-action danger" data-act="excluir" data-id="' + l.id + '" title="Excluir">' + icon('trash') + '</button>' +
        '</div></td>' +
      '</tr>'
    );
  },

  mount() {
    const self = this;

    document.getElementById('btn-novo-livro').onclick = () => self.abrirFormLivro();
    document.getElementById('acervo-busca').oninput = e => { self.state.q = e.target.value; self.state.page = 1; self.atualizarBusca(); };
    document.getElementById('acervo-cat').onchange = e => { self.state.cat = e.target.value; self.state.page = 1; self.renderInto(); };
    document.getElementById('acervo-status').onchange = e => { self.state.status = e.target.value; self.state.page = 1; self.renderInto(); };

    self.bindLista();
  },

  bindLista() {
    const self = this;
    document.querySelectorAll('#view .page-btn').forEach(b => {
      b.onclick = () => {
        const v = b.dataset.page;
        const pages = Math.max(1, Math.ceil(self.filtrarLivros().length / self.state.perPage));
        if (v === 'prev') self.state.page = Math.max(1, self.state.page - 1);
        else if (v === 'next') self.state.page = Math.min(pages, self.state.page + 1);
        else self.state.page = Number(v);
        self.atualizarBusca();
      };
    });

    document.querySelectorAll('#view [data-act]').forEach(b => {
      b.onclick = e => {
        e.stopPropagation();
        const id = b.dataset.id;
        if (b.dataset.act === 'ver') self.abrirDetalhe(id);
        if (b.dataset.act === 'editar') self.abrirFormLivro(id);
        if (b.dataset.act === 'excluir') self.excluirLivro(id);
      };
    });
  },

  atualizarBusca() {
    const view = document.getElementById('view');
    const lista = this.filtrarLivros();
    const total = lista.length;
    const pages = Math.max(1, Math.ceil(total / this.state.perPage));
    if (this.state.page > pages) this.state.page = pages;
    const pg = this.state.page;
    const ini = (pg - 1) * this.state.perPage;
    const slice = lista.slice(ini, ini + this.state.perPage);

    const rc = view.querySelector('.result-count');
    if (rc) rc.textContent = total + ' resultado' + (total !== 1 ? 's' : '');

    const tbody = view.querySelector('.table tbody');
    if (tbody) tbody.innerHTML = slice.map(l => this.linhaLivro(l)).join('') ||
      emptyRow('Nenhum título encontrado para os filtros aplicados.');

    const card = view.querySelector('.card');
    atualizarPaginacao(card, ini, total, this.state.perPage, pages, pg);

    this.bindLista();
  },

  renderInto() {
    const view = document.getElementById('view');
    view.innerHTML = this.render();
    this.mount();
  },

  /* ---------- Form (novo/editar) ---------- */

  abrirFormLivro(id) {
    const S = window.Store;
    const l = id ? S.livro(id) : null;
    const isEdit = !!l;

    const html =
      '<div class="modal-head">' +
        '<div><h2>' + (isEdit ? 'Editar título' : 'Novo título') + '</h2>' +
        '<p>' + (isEdit ? 'Atualize as informações do exemplar.' : 'Cadastre um novo título no acervo.') + '</p></div>' +
        '<button class="icon-btn" data-close-modal>' + icon('close') + '</button>' +
      '</div>' +
      '<form id="form-livro" novalidate>' +
        '<div class="modal-body">' +
          '<div class="form-grid">' +
            fieldHTML('Título *', '<input class="input" name="titulo" required value="' + (isEdit ? escapeHtml(l.titulo) : '') + '" placeholder="Nome da obra" />', true) +
            fieldHTML('Autor *', '<input class="input" name="autor" required value="' + (isEdit ? escapeHtml(l.autor) : '') + '" placeholder="Nome do autor" />') +
            fieldHTML('ISBN', '<input class="input" name="isbn" value="' + (isEdit ? escapeHtml(l.isbn) : '') + '" placeholder="978-..." />') +
            selHTML('Categoria', 'categoria', CATEGORIAS, isEdit ? l.categoria : '', true) +
            fieldHTML('Editora', '<input class="input" name="editora" value="' + (isEdit ? escapeHtml(l.editora) : '') + '" placeholder="Editora" />') +
            fieldHTML('Ano', '<input class="input" name="ano" type="number" min="1000" max="2100" value="' + (isEdit ? l.ano : new Date().getFullYear()) + '" />') +
            fieldHTML('Localização', '<input class="input" name="localizacao" value="' + (isEdit ? escapeHtml(l.localizacao) : '') + '" placeholder="Ex.: A1-03" />') +
            fieldHTML('Nº de exemplares', '<input class="input" name="exemplares" type="number" min="1" value="' + (isEdit ? l.exemplares : 1) + '" />') +
          '</div>' +
          '<div class="form-actions">' +
            '<button type="button" class="btn" data-close-modal>Cancelar</button>' +
            '<button type="submit" class="btn btn-primary">' + (isEdit ? 'Salvar alterações' : 'Cadastrar título') + '</button>' +
          '</div>' +
        '</div>' +
      '</form>';

    openModal(html, { size: 'md' });
    const f = document.getElementById('form-livro');

    f.addEventListener('submit', ev => {
      ev.preventDefault();
      const dados = Object.fromEntries(new FormData(f).entries());
      const ok = validarForm(f);
      if (!ok) return;

      const cor = ['#dc2626', '#2563eb', '#059669', '#d97706', '#7c3aed', '#0891b2', '#b45309', '#dc2626'][Math.floor(Math.random() * 8)];

      if (isEdit) {
        S.updateLivro(id, {
          titulo: dados.titulo, autor: dados.autor, isbn: dados.isbn, categoria: dados.categoria,
          editora: dados.editora, ano: Number(dados.ano), localizacao: dados.localizacao,
          exemplares: Number(dados.exemplares), capa: l.capa || cor
        });
        toast('Título atualizado com sucesso.', 'success');
      } else {
        S.addLivro({
          titulo: dados.titulo, autor: dados.autor, isbn: dados.isbn, categoria: dados.categoria,
          editora: dados.editora, ano: Number(dados.ano), localizacao: dados.localizacao,
          exemplares: Number(dados.exemplares), capa: cor
        });
        toast('Título cadastrado com sucesso.', 'success');
      }
      closeModal();
      this.renderInto();
    });
  },

  /* ---------- Detalhe ---------- */

  abrirDetalhe(id) {
    const S = window.Store;
    const l = S.livro(id);
    if (!l) return;
    const emUso = l.exemplares - l.exemplaresDisp;
    const historico = S.emprestimos().filter(e => e.livroId === id).slice(0, 5).map(e => {
      const u = S.usuario(e.usuarioId);
      return (
        '<div class="mini-list"><li style="padding:10px 0">' +
          '<div class="m-main"><b>' + escapeHtml(u ? u.nome : '—') + '</b><span>Emprestado em ' + fmtDate(e.dataEmprestimo) + '</span></div>' +
          '<div class="m-side">' + statusBadge(e.status) + '</div>' +
        '</li></div>'
      );
    }).join('');

    const html =
      '<div class="modal-head">' +
        '<div><h2>Detalhes do título</h2><p>Registro completo do exemplar no acervo.</p></div>' +
        '<button class="icon-btn" data-close-modal>' + icon('close') + '</button>' +
      '</div>' +
      '<div class="modal-body">' +
        '<div class="detail-hero">' +
          '<div class="book-cover" style="background:' + l.capa + ';width:64px;height:88px;font-size:22px">' + escapeHtml(l.titulo.charAt(0)) + '</div>' +
          '<div>' +
            '<h3>' + escapeHtml(l.titulo) + '</h3>' +
            '<p>' + escapeHtml(l.autor) + '</p>' +
            '<div style="margin-top:8px">' +
              statusBadge(l.exemplaresDisp === 0 ? 'esgotado' : (emUso > 0 ? 'emprestado' : 'disponivel')) +
              ' <span class="badge badge-gray">' + escapeHtml(l.categoria) + '</span>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div style="margin-top:16px" class="detail-list">' +
          dl('ISBN', l.isbn || '—') +
          dl('Editora', l.editora || '—') +
          dl('Ano', l.ano) +
          dl('Localização', l.localizacao || '—') +
          dl('Exemplares', l.exemplares) +
          dl('Disponíveis', '<b style="color:' + (l.exemplaresDisp > 0 ? 'var(--green)' : 'var(--red)') + '">' + l.exemplaresDisp + '</b>') +
          dl('Cadastrado em', fmtDate(l.adicionadoEm)) +
          dl('Em uso', emUso) +
        '</div>' +

        '<h4 style="margin:18px 0 6px;font-size:13px;font-weight:700">Histórico de empréstimos</h4>' +
        (historico || '<p style="color:var(--text-3);font-size:13px">Sem registro de empréstimos.</p>') +

        '<div class="form-actions">' +
          '<button class="btn" data-close-modal>Fechar</button>' +
          '<button class="btn btn-soft" id="dlg-editar">' + icon('edit') + ' Editar</button>' +
        '</div>' +
      '</div>';

    openModal(html, { size: 'md' });
    document.getElementById('dlg-editar').onclick = () => { closeModal(); this.abrirFormLivro(id); };
  },

  /* ---------- Excluir ---------- */

  excluirLivro(id) {
    const l = window.Store.livro(id);
    if (!l) return;
    confirmBox(
      'Deseja realmente excluir <b>' + escapeHtml(l.titulo) + '</b> do acervo? Esta ação não poderá ser desfeita.',
      () => {
        const r = window.Store.removeLivro(id);
        if (r.ok) { toast('Título removido do acervo.', 'success'); }
        else { toast(r.msg, 'warn'); }
        this.renderInto();
      },
      { title: 'Excluir título', okText: 'Excluir', danger: true }
    );
  }
};

/* ---------- helpers de formulário ---------- */

function fieldHTML(label, inner, full) {
  return '<div class="field' + (full ? ' full' : '') + '"><span class="field-label">' + label + '</span>' + inner + '</div>';
}

function selHTML(label, name, options, value, full) {
  const opts = options.map(o =>
    '<option value="' + escapeHtml(o) + '"' + (value === o ? ' selected' : '') + '>' + escapeHtml(o) + '</option>').join('');
  return '<div class="field' + (full ? ' full' : '') + '"><span class="field-label">' + label + '</span>' +
    '<select class="select" name="' + name + '" style="width:100%">' + opts + '</select></div>';
}

function svgIcon(name) {
  return '<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="' + (constUI.ICONS[name] || '') + '"/></svg>';
}

function emptyRow(txt) {
  return '<tr class="empty-row"><td colspan="7"><div class="empty-state">' + svgIcon('books') + '<p>' + txt + '</p></div></td></tr>';
}

function validarForm(form) {
  let ok = true;
  form.querySelectorAll('input[required]').forEach(i => {
    const field = i.closest('.field');
    field.classList.remove('invalid');
    if (!i.value.trim()) { field.classList.add('invalid'); ok = false; }
  });
  if (!ok) toast('Preencha os campos obrigatórios.', 'warn');
  return ok;
}

window.AcervoPage = AcervoPage;
window.CATEGORIAS = CATEGORIAS;