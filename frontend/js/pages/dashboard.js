/* ============================================================
   BiblioGestor — Página: Dashboard
   ============================================================ */

const DashboardPage = {
  render() {
    const S = window.Store;
    const livros = S.livros();
    const totalExemplares = S.totalExemplares();
    const disp = S.totalDisponiveis();
    const ativos = S.emprestimosAtivos();
    const atrasados = S.emprestimosAtrasados();
    const userAtivos = S.usuariosAtivos();
    const multas = S.receitaMultas();

    const pct = totalExemplares ? Math.round((disp / totalExemplares) * 100) : 0;

    const recentes = S.emprestimos().slice(0, 6).map(e => {
      const u = S.usuario(e.usuarioId);
      const l = S.livro(e.livroId);
      const atrasado = e.status !== 'devolvido' && (new Date(e.dataDevolucaoPrevista) < new Date());
      return (
        '<li>' +
          '<div class="avatar-sm" style="background:' + (u ? u.color || '#64748b' : '#64748b') + '">' + (u ? initials(u.nome) : '?') + '</div>' +
          '<div class="m-main">' +
            '<b>' + (l ? escapeHtml(l.titulo) : '—') + '</b>' +
            '<span>' + (u ? escapeHtml(u.nome) : '—') + '</span>' +
          '</div>' +
          '<div class="m-side">' +
            (e.status === 'devolvido' ? statusBadge('devolvido') : atrasado ? statusBadge('atrasado') : statusBadge('ativo')) +
            '<br><span style="font-size:11px">dev. ' + fmtDate(e.dataDevolucaoPrevista) + '</span>' +
          '</div>' +
        '</li>'
      );
    }).join('');

    const baixaDisp = livros.filter(l => l.exemplaresDisp === 0).slice(0, 4).map(l => {
      const emUso = l.exemplares - l.exemplaresDisp;
      return (
        '<li>' +
          '<div class="book-cover" style="background:' + l.capa + '">' + escapeHtml(l.titulo.charAt(0)) + '</div>' +
          '<div class="m-main">' +
            '<b>' + escapeHtml(l.titulo) + '</b>' +
            '<span>Localização: ' + escapeHtml(l.localizacao) + '</span>' +
          '</div>' +
          '<div class="m-side">' +
            '<b style="color:var(--red)">' + emUso + '/' + l.exemplares + '</b><br>' +
            '<span style="font-size:11px">exemplares em uso</span>' +
          '</div>' +
        '</li>'
      );
    }).join('');

    // Acervo por categoria (barra horizontal)
    const cats = {};
    livros.forEach(l => { cats[l.categoria] = (cats[l.categoria] || 0) + l.exemplares; });
    const catMax = Math.max(1, ...Object.values(cats));
    const catRows = Object.entries(cats)
      .sort((a, b) => b[1] - a[1])
      .map(([c, n]) =>
        '<div class="bookbar">' +
          '<div style="width:130px;font-size:13px;font-weight:600">' + escapeHtml(c) + '</div>' +
          '<div class="bar-track" style="height:10px"><div class="solid-bar" style="width:' + Math.round((n / catMax) * 100) + '%;height:100%"></div></div>' +
          '<div style="width:34px;text-align:right;font-weight:700;font-size:13px">' + n + '</div>' +
        '</div>'
      ).join('');

    const hoje = new Date();
    const saud = hoje.getHours() < 12 ? 'Bom dia' : hoje.getHours() < 18 ? 'Boa tarde' : 'Boa noite';
    const dt = hoje.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    return (
      '<div class="view-enter">' +
        '<div class="hero">' +
          '<div class="hero-glow hero-glow-a"></div>' +
          '<div class="hero-glow hero-glow-b"></div>' +
          '<div class="hero-main">' +
            '<span class="hero-kicker">Painel de controle</span>' +
            '<h1 class="hero-title">' + saud + ', Ana</h1>' +
            '<p class="hero-sub">' + dt.charAt(0).toUpperCase() + dt.slice(1) + ' — resumo geral da biblioteca.</p>' +
            '<div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap">' +
              '<span class="hero-pill">' + icon('loans') + ' <b>' + ativos.length + '</b> empréstimos ativos</span>' +
              '<span class="hero-pill">' + icon('bell') + ' <b>' + atrasados.length + '</b> atrasados</span>' +
              '<span class="hero-pill">' + icon('check') + ' <b>' + disp + '</b> exemplares livres</span>' +
            '</div>' +
          '</div>' +
          '<div class="hero-side">' +
            '<button class="btn btn-light" id="dash-btn-emprestar">' + icon('plus') + ' Novo empréstimo</button>' +
            '<button class="btn btn-glass" id="dash-btn-acervo">' + icon('books') + ' Acervo</button>' +
          '</div>' +
        '</div>' +

        '<div class="stats-grid">' +
          statCard('teal', 'books', totalExemplares, 'Exemplares no acervo', '<span class="up">84%</span> de ocupação do acervo') +
          statCard('indigo', 'check', disp, 'Disponíveis para empréstimo', pct + '% do total') +
          statCard('blue', 'users', userAtivos, 'Usuários ativos', (S.usuarios().length - userAtivos) + ' inativos') +
          statCard('amber', 'loans', ativos.length, 'Empréstimos ativos', multas > 0 ? '<span class="down">' + fmtMoney(multas) + '</span> em multas' : 'Sem multas pendentes') +
          statCard('red', 'bell', atrasados.length, 'Atrasados', atrasados.length > 0 ? 'Exigem atenção' : 'Tudo em dia') +
        '</div>' +

        '<div class="grid-2-1">' +
          '<div class="card">' +
            '<div class="card-head">' +
              '<div><div class="card-title"><span class="card-ico">' + icon('loans') + '</span> Empréstimos recentes</div><div class="card-sub">Últimas operações realizadas</div></div>' +
              '<a href="#" class="btn btn-sm btn-ghost" data-goto="emprestimos">Ver todos</a>' +
            '</div>' +
            '<ul class="mini-list">' + (recentes || '<li><p style="padding:20px;color:var(--text-3);font-size:13px">Nenhum empréstimo registrado.</p></li>') + '</ul>' +
          '</div>' +

          '<div style="display:grid;gap:16px;align-content:start">' +
            '<div class="card">' +
              '<div class="card-head"><div class="card-title"><span class="card-ico">' + icon('bell') + '</span> Títulos esgotados</div></div>' +
              (baixaDisp
                ? '<ul class="mini-list">' + baixaDisp + '</ul>'
                : '<div class="empty-state" style="padding:28px;text-align:center;color:var(--text-3)">' + icon('check') + '<p>Todos os títulos disponíveis</p></div>') +
              '<button class="btn btn-ghost btn-sm" data-goto="acervo" style="margin:12px 16px;justify-content:center;width:calc(100% - 32px)">' + icon('books') + ' Gerenciar acervo</button>' +
            '</div>' +

            '<div class="card">' +
              '<div class="card-head"><div class="card-title"><span class="card-ico">' + icon('reports') + '</span> Acervo por categoria</div></div>' +
              catRows +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  },

  mount() {
    document.getElementById('dash-btn-emprestar').onclick = () => { window.app.navigate('emprestimos'); window.EmprestimosPage.openModalEmprestar(); };
    document.getElementById('dash-btn-acervo').onclick = () => window.app.navigate('acervo');
  }
};

function statCard(color, ic, valor, label, hint) {
  return (
    '<div class="stat-card">' +
      '<div class="stat-icon ' + color + '">' + icon(ic) + '</div>' +
      '<div style="min-width:0">' +
        '<div class="stat-value">' + valor + '</div>' +
        '<div class="stat-label">' + label + '</div>' +
        '<div class="stat-hint">' + hint + '</div>' +
      '</div>' +
    '</div>'
  );
}

window.DashboardPage = DashboardPage;