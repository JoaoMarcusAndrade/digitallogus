/* ============================================================
   Alexandria — Página: Dashboard (bibliotecário)
   ============================================================ */

import { useNavigate } from 'react-router-dom';
import { Icon } from '../ui/icons.jsx';
import { StatusBadge } from '../ui/Modal.jsx';
import { useApp } from '../AppContext.jsx';
import { useSession } from '../store/session.jsx';
import api from '../api/client.js';
import { useApi } from '../api/useApi.js';
import { corPara } from '../ui/labels.js';
import { initials, fmtDate } from '../ui/format.js';

export function Dashboard() {
  const navigate = useNavigate();
  const { user, admId } = useSession();
  const { openLoan, dataVersion } = useApp();

  const { data: painel, loading, erro } = useApi(
    async () => api.dashboardResumo(admId),
    [admId, dataVersion]
  );

  const stats = painel?.stats;
  const totalEx = stats?.totalCopies ?? 0;
  const disp = stats?.totalAvailable ?? 0;
  const ocupacao = stats?.occupancyRate ?? 0;
  const pct = stats?.availabilityRate ?? 0;
  const atrasados = stats?.loansOverdue ?? 0;
  const noPrazo = stats?.loansActive ?? 0;
  const emAberto = noPrazo + atrasados;
  const userAtivos = stats?.usersActive ?? 0;
  const userInativos = stats?.usersInactive ?? 0;

  const hoje = new Date();
  const saud = hoje.getHours() < 12 ? 'Bom dia' : hoje.getHours() < 18 ? 'Boa tarde' : 'Boa noite';
  const dt = hoje.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const primeiro = user?.firstName || (user?.name || 'Bibliotecário').split(' ')[0];

  const recentes = (painel?.recent || []).map((e) => (
    <li key={e.id}>
      <div className="avatar-sm" style={{ background: e.reader ? corPara(e.reader.name) : '#64748b' }}>
        {e.reader ? initials(e.reader.name) : '?'}
      </div>
      <div className="m-main">
        <b>{e.book ? e.book.title : '—'}</b>
        <span>{e.reader ? e.reader.name : '—'}</span>
      </div>
      <div className="m-side">
        <StatusBadge status={e.status} />
        <br />
        <span style={{ fontSize: 11 }}>dev. {fmtDate(e.dataDevolucaoPrevista)}</span>
      </div>
    </li>
  ));

  const esgotados = (painel?.outOfStockTitles || []).map((l) => {
    const emUso = l.quantity - l.quantityAvailable;
    return (
      <li key={l.id}>
        <div className="book-cover" style={{ background: l.coverColor || corPara(l.title) }}>{l.title.charAt(0)}</div>
        <div className="m-main">
          <b>{l.title}</b>
          <span>Localização: {l.location || '—'}</span>
        </div>
        <div className="m-side">
          <b style={{ color: 'var(--red)' }}>{emUso}/{l.quantity}</b>
          <br />
          <span style={{ fontSize: 11 }}>exemplares em uso</span>
        </div>
      </li>
    );
  });

  const categorias = painel?.categories || [];
  const catMax = Math.max(1, ...categorias.map((c) => c.copies));
  const catRows = categorias.map((c) => (
    <div className="bookbar" key={c.category}>
      <div style={{ width: 130, fontSize: 13, fontWeight: 600 }}>{c.category}</div>
      <div className="bar-track" style={{ height: 10 }}>
        <div className="solid-bar" style={{ width: Math.round((c.copies / catMax) * 100) + '%', height: '100%' }}></div>
      </div>
      <div style={{ width: 34, textAlign: 'right', fontWeight: 700, fontSize: 13 }}>{c.copies}</div>
    </div>
  ));

  return (
    <div className="view-enter">
      <div className="hero">
        <div className="hero-glow hero-glow-a"></div>
        <div className="hero-glow hero-glow-b"></div>
        <div className="hero-main">
          <span className="hero-kicker">Painel de controle</span>
          <h1 className="hero-title">{saud}, {primeiro}</h1>
          <p className="hero-sub">{dt.charAt(0).toUpperCase() + dt.slice(1)} — resumo geral da biblioteca.</p>
          <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className="hero-pill"><Icon name="loans" /> <b>{emAberto}</b> empréstimos ativos</span>
            <span className="hero-pill"><Icon name="bell" /> <b>{atrasados}</b> atrasados</span>
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

      {erro && (
        <div className="alert alert-danger" style={{ marginBottom: 16 }}>
          <Icon name="close" />
          <div><b>Não foi possível carregar o painel</b><span>{erro}</span></div>
        </div>
      )}

      <div className="stats-grid">
        <StatCard color="teal" ic="books" valor={totalEx} label="Exemplares no acervo" hint={<><span className="up">{ocupacao}%</span> de ocupação do acervo</>} />
        <StatCard color="indigo" ic="check" valor={disp} label="Disponíveis para empréstimo" hint={pct + '% do total'} />
        <StatCard color="blue" ic="users" valor={userAtivos} label="Usuários ativos" hint={userInativos + ' inativos'} />
        <StatCard color="amber" ic="loans" valor={emAberto} label="Empréstimos ativos" hint={<><span className="up">{noPrazo}</span> dentro do prazo</>} />
        <StatCard color="red" ic="bell" valor={atrasados} label="Atrasados" hint={atrasados > 0 ? 'Exigem atenção' : 'Tudo em dia'} />
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
          {loading ? (
            <p style={{ padding: 20, color: 'var(--text-3)', fontSize: 13 }}>Carregando...</p>
          ) : (
            <ul className="mini-list">{recentes.length ? recentes : <li><p style={{ padding: 20, color: 'var(--text-3)', fontSize: 13 }}>Nenhum empréstimo registrado.</p></li>}</ul>
          )}
        </div>

        <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
          <div className="card">
            <div className="card-head">
              <div className="card-title"><span className="card-ico"><Icon name="bell" /></span> Títulos esgotados</div>
            </div>
            {esgotados.length
              ? <ul className="mini-list">{esgotados}</ul>
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
            {catRows.length ? catRows : <p style={{ padding: 16, color: 'var(--text-3)', fontSize: 13 }}>Sem categorias cadastradas.</p>}
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
