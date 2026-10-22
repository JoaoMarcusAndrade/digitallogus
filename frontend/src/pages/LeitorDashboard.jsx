/* ============================================================
   Alexandria — Página: Painel do Leitor (somente leitura)
   ============================================================ */

import { useNavigate } from 'react-router-dom';
import { Icon } from '../ui/icons.jsx';
import { StatusBadge } from '../ui/Modal.jsx';
import { useApp } from '../AppContext.jsx';
import { useSession } from '../store/session.jsx';
import api from '../api/client.js';
import { useApi } from '../api/useApi.js';
import { corPara } from '../ui/labels.js';
import { fmtDate } from '../ui/format.js';

export function LeitorDashboard() {
  const navigate = useNavigate();
  const { user, userId } = useSession();
  const { dataVersion } = useApp();

  const { data: painel, loading, erro } = useApi(
    async () => api.dashboardLeitor(userId),
    [userId, dataVersion]
  );

  const stats = painel?.stats;
  const totalEx = stats?.totalCopies ?? 0;
  const disp = stats?.totalAvailable ?? 0;
  const pct = stats?.availableRate ?? 0;
  const abertos = stats?.myOpen ?? 0;
  const noPrazo = stats?.myOnTime ?? 0;
  const atrasados = stats?.myOverdue ?? 0;

  // O leitor é tratado pelo primeiro nome.
  const primeiro = user?.firstName || (user?.name || 'Leitor').split(' ')[0];
  const hoje = new Date();
  const dt = hoje.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const meus = (painel?.myLoans || []).map((e) => (
    <li key={e.id}>
      <div className="book-cover" style={{ background: e.book ? (e.book.coverColor || corPara(e.book.title)) : '#3a5f9e' }}>
        {e.book ? e.book.title.charAt(0) : '?'}
      </div>
      <div className="m-main">
        <b>{e.book ? e.book.title : '—'}</b>
        <span>{e.book ? e.book.author : ''}</span>
      </div>
      <div className="m-side" style={{ textAlign: 'right' }}>
        <StatusBadge status={e.status} />
        <br />
        <span style={{ fontSize: 11 }}>dev. {fmtDate(e.dataDevolucaoPrevista)}</span>
      </div>
    </li>
  ));

  const disponiveis = (painel?.available || []).map((l) => (
    <li key={l.id}>
      <div className="book-cover" style={{ background: l.coverColor || corPara(l.title) }}>{l.title.charAt(0)}</div>
      <div className="m-main">
        <b>{l.title}</b>
        <span>{l.author}</span>
      </div>
      <div className="m-side"><span className="badge badge-green">{l.quantityAvailable} disp.</span></div>
    </li>
  ));

  return (
    <div className="view-enter">
      <div className="hero">
        <div className="hero-glow hero-glow-a"></div>
        <div className="hero-glow hero-glow-b"></div>
        <div className="hero-main">
          <span className="hero-kicker">Minha biblioteca</span>
          <h1 className="hero-title">Olá, {primeiro}</h1>
          <p className="hero-sub">{dt.charAt(0).toUpperCase() + dt.slice(1)} — acompanhe seus empréstimos e explore o acervo.</p>
          <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className="hero-pill"><Icon name="loans" /> <b>{abertos}</b> empréstimos em aberto</span>
            <span className="hero-pill"><Icon name="bell" /> <b>{atrasados}</b> atrasados</span>
            <span className="hero-pill"><Icon name="check" /> <b>{disp}</b> exemplares disponíveis</span>
          </div>
        </div>
        <div className="hero-side">
          <button className="btn btn-light" onClick={() => navigate('/acervo')}>
            <Icon name="books" /> Explorar acervo
          </button>
          <button className="btn btn-glass" onClick={() => navigate('/meus-emprestimos')}>
            <Icon name="loans" /> Meus empréstimos
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
        <StatCard color="teal" ic="books" valor={totalEx} label="Títulos no acervo" hint={pct + '% disponíveis'} />
        <StatCard color="blue" ic="check" valor={disp} label="Exemplares disponíveis" hint="para empréstimo" />
        <StatCard color="amber" ic="loans" valor={abertos} label="Meus empréstimos ativos" hint={<><span className="up">{noPrazo}</span> dentro do prazo</>} />
        <StatCard color="red" ic="bell" valor={atrasados} label="Meus atrasados" hint={atrasados > 0 ? 'Exigem atenção' : 'Tudo em dia'} />
      </div>

      <div className="grid-2-1">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title"><span className="card-ico"><Icon name="loans" /></span> Meus empréstimos</div>
              <div className="card-sub">Situação atual dos seus exemplares</div>
            </div>
            <button className="btn btn-sm btn-ghost" onClick={() => navigate('/meus-emprestimos')}>Ver todos</button>
          </div>
          {loading ? (
            <p style={{ padding: 20, color: 'var(--text-3)', fontSize: 13 }}>Carregando...</p>
          ) : (
            <ul className="mini-list">
              {meus.length ? meus : <li><p style={{ padding: 20, color: 'var(--text-3)', fontSize: 13 }}>Você ainda não tem empréstimos registrados.</p></li>}
            </ul>
          )}
        </div>

        <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
          <div className="card">
            <div className="card-head">
              <div className="card-title"><span className="card-ico"><Icon name="books" /></span> Disponíveis para empréstimo</div>
            </div>
            {disponiveis.length
              ? <ul className="mini-list">{disponiveis}</ul>
              : (
                <div className="empty-state" style={{ padding: 28, textAlign: 'center', color: 'var(--text-3)' }}>
                  <Icon name="check" />
                  <p>Nenhum título disponível no momento</p>
                </div>
              )}
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/acervo')}
              style={{ margin: '12px 16px', justifyContent: 'center', width: 'calc(100% - 32px)' }}>
              <Icon name="books" /> Ver acervo completo
            </button>
          </div>

          <div className="card">
            <div className="card-head">
              <div className="card-title"><span className="card-ico"><Icon name="bell" /></span> Como funciona</div>
            </div>
            <div style={{ padding: 16, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>
              Escolha um título no <b>Acervo</b> e solicite o empréstimo no balcão da biblioteca. A equipe gerencia prazos, renovações e devoluções — acompanhe tudo em <b>Meus empréstimos</b>.
            </div>
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
