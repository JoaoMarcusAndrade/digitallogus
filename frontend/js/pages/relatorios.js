/* ============================================================
   BiblioGestor — Página: Relatórios (visão analítica do protótipo)
   ============================================================ */

const RelatoriosPage = {
  render() {
    const S = window.Store;
    const livros = S.livros();

    const catCount = {};
    livros.forEach(l => { catCount[l.categoria] = (catCount[l.categoria] || 0) + 1; });
    const catTotal = livros.length || 1;

    const statsLinhas = Object.entries(catCount).map(([c, n]) => {
      const pct = Math.round((n / catTotal) * 100 * 10) / 10;
      return (
        '<div class="bookbar">' +
          '<div style="width:150px;font-size:13px;font-weight:600">' + escapeHtml(c) + '</div>' +
          '<div class="bar-track" style="height:12px">' +
            '<div class="progress-lg solid-bar" style="width:' + pct + '%;height:100%"></div>' +
          '</div>' +
          '<div style="width:90px;text-align:right;font-size:12.5px;color:var(--text-2)"><b>' + n + '</b> · ' + pct + '%</div>' +
        '</div>'
      );
    }).join('');

    const meses = [
      { m: 'Mar', shape: [6, 9, 8, 12, 10, 14, 16, 18] },
      { m: 'Abr', shape: [4, 7, 13, 5, 12, 15, 12, 19] },
      { m: 'Mai', shape: [8, 5, 16, 7, 9, 18, 10, 17] },
      { m: 'Jun', shape: [10, 8, 14, 11, 15, 12, 17, 16] },
      { m: 'Jul', shape: [12, 11, 9, 15, 18, 10, 14, 20] },
      { m: 'Ago', shape: [15, 14, 18, 13, 12, 17, 15, 19] }
    ];
    const diasMeta = 15;
    const maxBar = 20;
    const mesesHtml = meses.map(mo => {
      const bars = mo.shape.map(h =>
        '<div class="bar' + (h >= diasMeta ? '' : ' lite') + '" style="height:' + (h / maxBar * 100) + '%" title="' + h + ' empréstimos"></div>').join('');
      return (
        '<div style="flex:1;text-align:center">' +
          '<div class="mini-chart">' + bars + '</div>' +
          '<div style="font-size:11px;color:var(--text-3);margin-top:6px;font-weight:600">' + mo.m + '</div>' +
        '</div>'
      );
    }).join('');

    const contagemEmprestimo = {};
    S.emprestimos().forEach(e => {
      contagemEmprestimo[e.livroId] = (contagemEmprestimo[e.livroId] || 0) + 1;
    });
    const topLivros = Object.entries(contagemEmprestimo)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, n]) => {
        const l = S.livro(id);
        if (!l) return '';
        const emUso = l.exemplares - l.exemplaresDisp;
        return (
          '<li>' +
            '<div class="book-cover" style="background:' + l.capa + '">' + escapeHtml(l.titulo.charAt(0)) + '</div>' +
            '<div class="m-main"><b>' + escapeHtml(l.titulo) + '</b><span>' + escapeHtml(l.autor) + '</span></div>' +
            '<div class="m-side"><b style="font-size:15px">' + n + '</b><br><span style="font-size:11px">empréstimos</span></div>' +
          '</li>'
        );
      }).join('');

    const dev = S.emprestimos().filter(e => e.status === 'devolvido').length;
    const atrasados = S.emprestimosAtrasados().length;
    const totalMeses = meses.reduce((s, mo) => s + mo.shape.reduce((a, b) => a + b, 0), 0);
    const media = Math.round(totalMeses / meses.length);

    return (
      '<div class="view-enter">' +
        '<div class="page-head">' +
          '<div>' +
            '<span class="page-kicker">Inteligência</span>' +
            '<h1 class="page-title">Relatórios</h1>' +
            '<p class="page-sub">Visão consolidada do movimento da biblioteca.</p>' +
          '</div>' +
          '<div class="page-actions">' +
            '<button class="btn btn-ghost" id="btn-exportar">' + icon('download') + ' Exportar CSV (simulado)</button>' +
          '</div>' +
        '</div>' +

        '<div class="stats-grid">' +
          statCard('green', 'check', dev, 'Devoluções registradas', 'no período observado') +
          statCard('amber', 'loans', S.emprestimos().length, 'Total de empréstimos', dev + ' concluídos') +
          statCard('red', 'bell', atrasados, 'Em aberto e atrasados', 'exigem cobrança') +
          statCard('indigo', 'users', S.usuarios().length, 'Usuários cadastrados', S.usuariosAtivos() + ' ativos') +
        '</div>' +

        '<div class="grid-2-1">' +
          '<div class="card">' +
            '<div class="card-head"><div><div class="card-title"><span class="card-ico">' + icon('reports') + '</span> Empréstimos por mês</div><div class="card-sub">Volume de operações · Mar a Ago/2026</div></div>' +
              '<span class="badge badge-blue">Simulação de histórico</span></div>' +
            '<div class="chart-summary" style="padding-top:16px">' +
              '<div><b>' + totalMeses + '</b><span>operações no período</span></div>' +
              '<div><b>' + media + '</b><span>média mensal</span></div>' +
              '<div><b>' + meses[0].shape.reduce((a, b) => a + b, 0) + ' → ' + meses[meses.length - 1].shape.reduce((a, b) => a + b, 0) + '</b><span>evolução</span></div>' +
            '</div>' +
            '<div style="padding:14px 18px 6px;display:flex">' + mesesHtml + '</div>' +
            '<div class="chart-legend">' +
              '<span class="legend-item"><span class="legend-dot"></span> Movimento mensal</span>' +
              '<span class="legend-item"><span class="legend-dot lite"></span> Meta de 15/mês</span>' +
            '</div>' +
          '</div>' +

          '<div class="card">' +
            '<div class="card-head"><div class="card-title"><span class="card-ico">' + icon('eye') + '</span> Títulos mais emprestados</div></div>' +
            '<ul class="mini-list">' + topLivros + '</ul>' +
          '</div>' +
        '</div>' +

        '<div class="card" style="margin-top:18px">' +
          '<div class="card-head"><div><div class="card-title"><span class="card-ico">' + icon('books') + '</span> Composição do acervo por categoria</div><div class="card-sub">Distribuição dos títulos cadastrados</div></div></div>' +
          statsLinhas +
        '</div>' +
      '</div>'
    );
  },

  mount() {
    document.getElementById('btn-exportar').onclick = () => {
      toast('Exportação simulada: geração de CSV ainda não implementada.', 'info');
    };
  }
};

window.RelatoriosPage = RelatoriosPage;