/* ============================================================
   BiblioGestor — Aplicação (router, sidebar, busca global)
   ============================================================ */

const app = {
  current: 'dashboard',

  init() {
    window.Store.load();

    this.injectSvgIcons();
    this.bindNav();
    this.bindModalClose();
    this.bindGlobalSearch();
    this.bindNotifications();
    window.addEventListener('resize', () => { if (window.innerWidth > 900) this.closeSidebar(); });

    this.navigate('dashboard');
  },

  /* ---------- Ícones do sidebar/topbar via data-icon ---------- */

  injectSvgIcons() {
    document.querySelectorAll('[data-icon]').forEach(el => {
      el.innerHTML = icon(el.dataset.icon);
    });
  },

  /* ---------- Navegação ---------- */

  navigate(route) {
    if (route === window.location.hash.replace('#/', '')) { /* noop */ }
    if (!AppPages[route]) route = 'dashboard';
    this.current = route;

    document.querySelectorAll('.nav-item[data-route]').forEach(a =>
      a.classList.toggle('active', a.dataset.route === (route === 'dashboard' ? 'dashboard' : route)));

    const view = document.getElementById('view');
    const page = AppPages[route];
    view.innerHTML = page.render();
    if (page.mount) page.mount();
    view.querySelector('.view-enter') && view.classList.add('has-view');

    this.updateBadges();
    this.closeSidebar();
  },

  updateBadges() {
    const S = window.Store;
    const bAcervo = document.getElementById('badge-acervo');
    const bUsers = document.getElementById('badge-usuarios');
    const bAtr = document.getElementById('badge-atrasados');
    if (bAcervo) bAcervo.textContent = S.livros().length;
    if (bUsers) bUsers.textContent = S.usuarios().length;
    if (bAtr) {
      const n = S.emprestimosAtrasados().length;
      bAtr.textContent = n;
      bAtr.classList.toggle('badge-warn', n > 0);
    }
    const dot = document.getElementById('notify-dot');
    if (dot) dot.style.display = S.emprestimosAtrasados().length > 0 ? 'block' : 'none';
  },

  /* ---------- Sidebar (mobile) ---------- */

  openSidebar() {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('sidebar-backdrop').classList.add('show');
  },
  closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-backdrop').classList.remove('show');
  },

  bindNav() {
    document.getElementById('menu-btn').onclick = () => this.openSidebar();
    document.getElementById('sidebar-backdrop').onclick = () => this.closeSidebar();

    document.querySelectorAll('.nav-item[data-route]').forEach(a => {
      a.onclick = e => {
        e.preventDefault();
        this.navigate(a.dataset.route);
      };
    });

    document.addEventListener('click', e => {
      const g = e.target.closest('[data-goto]');
      if (g) {
        e.preventDefault();
        this.navigate(g.dataset.goto);
      }
    });
  },

  bindModalClose() {
    document.querySelectorAll('[data-close-modal]').forEach(el => {
      el.onclick = e => {
        const root = e.target.closest('.modal-root');
        if (root) root.hidden = true;
        document.body.classList.remove('modal-open');
      };
    });
    document.querySelectorAll('.modal-root .modal-backdrop').forEach(bd => {
      bd.onclick = e => {
        e.target.parentElement.hidden = true;
        document.body.classList.remove('modal-open');
      };
    });
    // fechar modais que são abertos depois (event delegation)
    document.addEventListener('click', e => {
      const btn = e.target.closest('[data-close-modal]');
      if (!btn) return;
      const root = btn.closest('.modal-root');
      if (root) { root.hidden = true; }
      document.body.classList.remove('modal-open');
    });
  },

  /* ---------- Busca global ---------- */

  bindGlobalSearch() {
    const input = document.getElementById('global-search-input');
    const results = document.getElementById('search-results');
    const box = document.getElementById('global-search');

    input.addEventListener('input', () => this.doGlobalSearch(input.value, results));
    input.addEventListener('focus', () => { if (input.value) this.doGlobalSearch(input.value, results); });
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && input.value) this.doGlobalSearch(input.value, results);
    });

    document.addEventListener('click', e => {
      if (!box.contains(e.target)) results.classList.remove('show');
    });
  },

  doGlobalSearch(q, results) {
    const term = q.trim().toLowerCase();
    if (term.length < 2) { results.classList.remove('show'); results.innerHTML = ''; return; }

    const S = window.Store;
    const livros = S.livros().filter(l =>
      (l.titulo + ' ' + l.autor + ' ' + l.isbn).toLowerCase().includes(term)).slice(0, 4);
    const usrs = S.usuarios().filter(u =>
      (u.nome + ' ' + u.matricula + ' ' + u.email).toLowerCase().includes(term)).slice(0, 4);

    let html = '';
    if (livros.length) {
      html += livros.map(l => {
        const st = l.exemplaresDisp === 0 ? 'Esgotado' : (l.exemplares - l.exemplaresDisp > 0 ? 'Emprestado' : 'Disponível');
        return (
          '<div class="search-result" data-goto-livro="' + l.id + '">' +
            '<div class="sr-icon" style="background:' + l.capa + '">' + escapeHtml(l.titulo.charAt(0)) + '</div>' +
            '<div style="min-width:0"><b>' + escapeHtml(l.titulo) + '</b><span>' + escapeHtml(l.autor) + '</span></div>' +
            '<div class="sr-meta">' + st + '</div>' +
          '</div>'
        );
      }).join('');
    }
    if (usrs.length) {
      html += usrs.map(u => (
        '<div class="search-result" data-goto-usuario="' + u.id + '">' +
          '<div class="sr-icon" style="background:' + (u.color || '#64748b') + '">' + initials(u.nome) + '</div>' +
          '<div style="min-width:0"><b>' + escapeHtml(u.nome) + '</b><span>' + (u.tipo) + ' · ' + escapeHtml(u.matricula) + '</span></div>' +
          '<div class="sr-meta">' + statusBadge(u.status) + '</div>' +
        '</div>'
      )).join('');
    }

    if (!html) {
      html = '<div class="search-empty">Nenhum resultado para "' + escapeHtml(q) + '"</div>';
    }

    results.innerHTML = html;
    results.classList.add('show');

    // cliques
    results.querySelectorAll('[data-goto-livro]').forEach(el => {
      el.onclick = () => {
        const id = el.dataset.gotoLivro;
        results.classList.remove('show');
        document.getElementById('global-search-input').value = '';
        if (this.current !== 'acervo') this.navigate('acervo');
        window.AcervoPage.abrirDetalhe(id);
      };
    });
    results.querySelectorAll('[data-goto-usuario]').forEach(el => {
      el.onclick = () => {
        const id = el.dataset.gotoUsuario;
        results.classList.remove('show');
        document.getElementById('global-search-input').value = '';
        if (this.current !== 'usuarios') this.navigate('usuarios');
        window.UsuariosPage.abrirDetalhe(id);
      };
    });
  },

  /* ---------- Notificações ---------- */

  bindNotifications() {
    document.getElementById('btn-notify').onclick = () => {
      const S = window.Store;
      const atrasados = S.emprestimosAtrasados();
      const esgotados = S.livros().filter(l => l.exemplaresDisp === 0);

      let html = '<div class="modal-head"><div><h2>Notificações</h2><p>Alertas do sistema</p></div>' +
        '<button class="icon-btn" data-close-modal>' + icon('close') + '</button></div>';
      html += '<div class="modal-body">';

      if (!atrasados.length && !esgotados.length) {
        html += '<div class="alert alert-info">' + icon('check') + '<div><b>Tudo em dia</b><span>Não há pendências no momento.</span></div></div>';
      } else {
        if (atrasados.length) {
          html += '<div class="alert alert-danger" style="margin-bottom:12px">' + icon('bell') +
            '<div><b>' + atrasados.length + ' empréstimo' + (atrasados.length > 1 ? 's' : '') + ' atrasado' + (atrasados.length > 1 ? 's' : '') + '</b>' +
            '<span>' + atrasados.slice(0, 3).map(e => {
              const u = S.usuario(e.usuarioId);
              return escapeHtml(u ? u.nome : '—');
            }).join(', ') + (atrasados.length > 3 ? '…' : '') + '</span></div></div>';
        }
        if (esgotados.length) {
          html += '<div class="alert alert-warn">' + icon('bell') +
            '<div><b>' + esgotados.length + ' título' + (esgotados.length > 1 ? 's' : '') + ' esgotado' + (esgotados.length > 1 ? 's' : '') + '</b>' +
            '<span>' + esgotados.slice(0, 4).map(l => escapeHtml(l.titulo)).join(', ') + '</span></div></div>';
        }
      }

      html += '<div class="form-actions"><button class="btn btn-soft" data-close-modal>Fechar</button></div></div>';

      openModal(html, { size: 'sm' });
    };
  }
};

const AppPages = {
  dashboard: window.DashboardPage,
  acervo: window.AcervoPage,
  usuarios: window.UsuariosPage,
  emprestimos: window.EmprestimosPage,
  relatorios: window.RelatoriosPage
};

window.app = app;

document.addEventListener('DOMContentLoaded', () => app.init());