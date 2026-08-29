/* ============================================================
   BiblioGestor — Página: Relatórios (visão analítica do protótipo)
   ============================================================ */

import { Icon } from '../ui/icons.jsx';
import { useToast } from '../ui/Modal.jsx';
import {
  useStore, livros, emprestimos, emprestimosAtrasados, usuarios, usuariosAtivos, livro
} from '../store/store.js';
import { escapeHtml } from '../ui/format.js';

const MESES = [
  { m: 'Mar', shape: [6, 9, 8, 12, 10, 14, 16, 18] },
  { m: 'Abr', shape: [4, 7, 13, 5, 12, 15, 12, 19] },
  { m: 'Mai', shape: [8, 5, 16, 7, 9, 18, 10, 17] },
  { m: 'Jun', shape: [10, 8, 14, 11, 15, 12, 17, 16] },
  { m: 'Jul', shape: [12, 11, 9, 15, 18, 10, 14, 20] },
  { m: 'Ago', shape: [15, 14, 18, 13, 12, 17, 15, 19] }
];
const DIAS_META = 15;
const MAX_BAR = 20;

export function Relatorios() {
  useStore();
  const toast = useToast();
  const liv = livros();

  const catCount = {};
  liv.forEach((l) => { catCount[l.categoria] = (catCount[l.categoria] || 0) + 1; });
  const catTotal = liv.length || 1;

  const statsLinhas = Object.entries(catCount).map(([c, n]) => {
    const pct = Math.round((n / catTotal) * 1000) / 10;
    return (
      <div className="bookbar" key={c}>
        <div style={{ width: 150, fontSize: 13, fontWeight: 600 }}>{c}</div>
        <div className="bar-track" style={{ height: 12 }}>
          <div className="progress-lg solid-bar" style={{ width: pct + '%', height: '100%' }}></div>
        </div>
        <div style={{ width: 90, textAlign: 'right', fontSize: '12.5px', color: 'var(--text-2)' }}>
          <b>{n}</b> · {pct}%
        </div>
      </div>
    );
  });

  const mesesHtml = MESES.map((mo) => (
    <div key={mo.m} style={{ flex: 1, textAlign: 'center' }}>
      <div className="mini-chart">
        {mo.shape.map((h, i) => (
          <div
            key={i}
            className={'bar' + (h >= DIAS_META ? '' : ' lite')}
            style={{ height: (h / MAX_BAR) * 100 + '%' }}
            title={h + ' empréstimos'}
          ></div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6, fontWeight: 600 }}>{mo.m}</div>
    </div>
  ));

  const contEmprestimo = {};
  emprestimos().forEach((e) => {
    contEmprestimo[e.livroId] = (contEmprestimo[e.livroId] || 0) + 1;
  });
  const topLivros = Object.entries(contEmprestimo)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, n]) => {
      const l = livro(id);
      if (!l) return null;
      return (
        <li key={id}>
          <div className="book-cover" style={{ background: l.capa }}>{escapeHtml(l.titulo.charAt(0))}</div>
          <div className="m-main"><b>{l.titulo}</b><span>{l.autor}</span></div>
          <div className="m-side"><b style={{ fontSize: 15 }}>{n}</b><br /><span style={{ fontSize: 11 }}>empréstimos</span></div>
        </li>
      );
    });

  const dev = emprestimos().filter((e) => e.status === 'devolvido').length;
  const atrasados = emprestimosAtrasados().length;
  const totalMeses = MESES.reduce((s, mo) => s + mo.shape.reduce((a, b) => a + b, 0), 0);
  const media = Math.round(totalMeses / MESES.length);

  return (
    <div className="view-enter">
      <div className="page-head">
        <div>
          <span className="page-kicker">Inteligência</span>
          <h1 className="page-title">Relatórios</h1>
          <p className="page-sub">Visão consolidada do movimento da biblioteca.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-ghost" onClick={() => toast('Exportação simulada: geração de CSV ainda não implementada.', 'info')}>
            <Icon name="download" /> Exportar CSV (simulado)
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard color="green" ic="check" valor={dev} label="Devoluções registradas" hint="no período observado" />
        <StatCard color="amber" ic="loans" valor={emprestimos().length} label="Total de empréstimos" hint={dev + ' concluídos'} />
        <StatCard color="red" ic="bell" valor={atrasados} label="Em aberto e atrasados" hint="exigem cobrança" />
        <StatCard color="indigo" ic="users" valor={usuarios().length} label="Usuários cadastrados" hint={usuariosAtivos() + ' ativos'} />
      </div>

      <div className="grid-2-1">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title"><span className="card-ico"><Icon name="reports" /></span> Empréstimos por mês</div>
              <div className="card-sub">Volume de operações · Mar a Ago/2026</div>
            </div>
            <span className="badge badge-blue">Simulação de histórico</span>
          </div>
          <div className="chart-summary" style={{ paddingTop: 16 }}>
            <div><b>{totalMeses}</b><span>operações no período</span></div>
            <div><b>{media}</b><span>média mensal</span></div>
            <div>
              <b>{MESES[0].shape.reduce((a, b) => a + b, 0)} → {MESES[MESES.length - 1].shape.reduce((a, b) => a + b, 0)}</b>
              <span>evolução</span>
            </div>
          </div>
          <div style={{ padding: '14px 18px 6px', display: 'flex' }}>{mesesHtml}</div>
          <div className="chart-legend">
            <span className="legend-item"><span className="legend-dot"></span> Movimento mensal</span>
            <span className="legend-item"><span className="legend-dot lite"></span> Meta de 15/mês</span>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div className="card-title"><span className="card-ico"><Icon name="eye" /></span> Títulos mais emprestados</div>
          </div>
          <ul className="mini-list">{topLivros}</ul>
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="card-head">
          <div>
            <div className="card-title"><span className="card-ico"><Icon name="books" /></span> Composição do acervo por categoria</div>
            <div className="card-sub">Distribuição dos títulos cadastrados</div>
          </div>
        </div>
        {statsLinhas}
      </div>
    </div>
  );
}

function StatCard({ color, ic, valor, label, hint }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}><Icon name={ic} /></div>
      <div style={{ minWidth: 0 }}>
        <div className="stat-value">{valor}</div>
        <div className="stat-label">{label}</div>
        <div className="stat-hint">{hint}</div>
      </div>
    </div>
  );
}
