/* ============================================================
   BiblioGestor — Página: Dashboard
   ============================================================ */

import { useNavigate } from 'react-router-dom';
import { Icon } from '../ui/icons.jsx';
import { StatusBadge } from '../ui/Modal.jsx';
import { useApp } from '../AppContext.jsx';
import {
  useStore, livros, usuarios, emprestimos, emprestimosAtivos, emprestimosAtrasados,
  usuario, livro, usuariosAtivos, receitaMultas, totalExemplares, totalDisponiveis
} from '../store/store.js';
import { initials, fmtDate, fmtMoney, escapeHtml } from '../ui/format.js';

export function Dashboard() {
  useStore();
  const navigate = useNavigate();
  const { openLoan } = useApp();

  const totalEx = totalExemplares();
  const disp = totalDisponiveis();
  const ativos = emprestimosAtivos();
  const atrasados = emprestimosAtrasados();
  const userAtivos = usuariosAtivos();
  const multas = receitaMultas();
  const pct = totalEx ? Math.round((disp / totalEx) * 100) : 0;

  const hoje = new Date();
  const saud = hoje.getHours() < 12 ? 'Bom dia' : hoje.getHours() < 18 ? 'Boa tarde' : 'Boa noite';
  const dt = hoje.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const recentes = emprestimos().slice(0, 6).map((e) => {
    const u = usuario(e.usuarioId);
    const l = livro(e.livroId);
    const atrasado = e.status !== 'devolvido' && (new Date(e.dataDevolucaoPrevista) < new Date());
    const st = e.status === 'devolvido' ? 'devolvido' : atrasado ? 'atrasado' : 'ativo';
    return (
      <li key={e.id}>
        <div className="avatar-sm" style={{ background: u ? u.color || '#64748b' : '#64748b' }}>{u ? initials(u.nome) : '?'}</div>
        <div className="m-main">
          <b>{l ? l.titulo : '—'}</b>
          <span>{u ? u.nome : '—'}</span>
        </div>
        <div className="m-side">
          <StatusBadge status={st} />
          <br />
          <span style={{ fontSize: 11 }}>dev. {fmtDate(e.dataDevolucaoPrevista)}</span>
        </div>
      </li>
    );
  });

  const baixaDisp = livros().filter((l) => l.exemplaresDisp === 0).slice(0, 4).map((l) => {
    const emUso = l.exemplares - l.exemplaresDisp;
    return (
      <li key={l.id}>
        <div className="book-cover" style={{ background: l.capa }}>{escapeHtml(l.titulo.charAt(0))}</div>
        <div className="m-main">
          <b>{l.titulo}</b>
          <span>Localização: {l.localizacao}</span>
        </div>
        <div className="m-side">
          <b style={{ color: 'var(--red)' }}>{emUso}/{l.exemplares}</b>
          <br />
          <span style={{ fontSize: 11 }}>exemplares em uso</span>
        </div>
      </li>
    );
  });

  const cats = {};
  livros().forEach((l) => { cats[l.categoria] = (cats[l.categoria] || 0) + l.exemplares; });
  const catMax = Math.max(1, ...Object.values(cats));
  const catRows = Object.entries(cats)
    .sort((a, b) => b[1] - a[1])
    .map(([c, n]) => (
      <div className="bookbar" key={c}>
        <div style={{ width: 130, fontSize: 13, fontWeight: 600 }}>{c}</div>
        <div className="bar-track" style={{ height: 10 }}>
          <div className="solid-bar" style={{ width: Math.round((n / catMax) * 100) + '%', height: '100%' }}></div>
        </div>
        <div style={{ width: 34, textAlign: 'right', fontWeight: 700, fontSize: 13 }}>{n}</div>
      </div>
    ));

  const userInativos = usuarios().length - userAtivos;

  return (
    <div className="view-enter">
      <div className="hero">
        <div className="hero-glow hero-glow-a"></div>
        <div className="hero-glow hero-glow-b"></div>
        <div className="hero-main">
          <span className="hero-kicker">Painel de controle</span>
          <h1 className="hero-title">{saud}, Ana</h1>
          <p className="hero-sub">{dt.charAt(0).toUpperCase() + dt.slice(1)} — resumo geral da biblioteca.</p>
          <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className="hero-pill"><Icon name="loans" /> <b>{ativos.length}</b> empréstimos ativos</span>
            <span className="hero-pill"><Icon name="bell" /> <b>{atrasados.length}</b> atrasados</span>
            <span className="hero-pill"><Icon name="check" /> <b>{disp}</b> exemplares livres</span>
          </div>
        </div>
        <div className="hero-side">
          <button className="btn btn-light" onClick={() => { navigate('/emprestimos'); openLoan(); }}>
            <Icon name="plus" /> Novo empréstimo
          </button>
          <button className="btn btn-glass" onClick={() => navigate('/acervo')}>
            <Icon name="books" /> Acervo
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard color="teal" ic="books" valor={totalEx} label="Exemplares no acervo" hint={<><span className="up">84%</span> de ocupação do acervo</>} />
        <StatCard color="indigo" ic="check" valor={disp} label="Disponíveis para empréstimo" hint={pct + '% do total'} />
        <StatCard color="blue" ic="users" valor={userAtivos} label="Usuários ativos" hint={userInativos + ' inativos'} />
        <StatCard color="amber" ic="loans" valor={ativos.length} label="Empréstimos ativos" hint={multas > 0 ? <><span className="down">{fmtMoney(multas)}</span> em multas</> : 'Sem multas pendentes'} />
        <StatCard color="red" ic="bell" valor={atrasados.length} label="Atrasados" hint={atrasados.length > 0 ? 'Exigem atenção' : 'Tudo em dia'} />
      </div>

      <div className="grid-2-1">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title"><span className="card-ico"><Icon name="loans" /></span> Empréstimos recentes</div>
              <div className="card-sub">Últimas operações realizadas</div>
            </div>
            <button className="btn btn-sm btn-ghost" onClick={() => navigate('/emprestimos')}>Ver todos</button>
          </div>
          <ul className="mini-list">{recentes.length ? recentes : <li><p style={{ padding: 20, color: 'var(--text-3)', fontSize: 13 }}>Nenhum empréstimo registrado.</p></li>}</ul>
        </div>

        <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
          <div className="card">
            <div className="card-head">
              <div className="card-title"><span className="card-ico"><Icon name="bell" /></span> Títulos esgotados</div>
            </div>
            {baixaDisp.length
              ? <ul className="mini-list">{baixaDisp}</ul>
              : (
                <div className="empty-state" style={{ padding: 28, textAlign: 'center', color: 'var(--text-3)' }}>
                  <Icon name="check" />
                  <p>Todos os títulos disponíveis</p>
                </div>
              )}
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/acervo')}
              style={{ margin: '12px 16px', justifyContent: 'center', width: 'calc(100% - 32px)' }}>
              <Icon name="books" /> Gerenciar acervo
            </button>
          </div>

          <div className="card">
            <div className="card-head">
              <div className="card-title"><span className="card-ico"><Icon name="reports" /></span> Acervo por categoria</div>
            </div>
            {catRows}
          </div>
        </div>
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
