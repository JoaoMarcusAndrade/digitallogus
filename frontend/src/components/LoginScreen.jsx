/* ============================================================
   Alexandria — Tela de login
   ============================================================ */

import { useState } from 'react';
import { Icon } from '../ui/icons.jsx';
import { useSession } from '../store/session.jsx';
import { useToast } from '../ui/Toast.jsx';

export function LoginScreen() {
  const { login } = useSession();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    if (!email.trim() || !senha) {
      setErro('Informe o e-mail e a senha para continuar.');
      return;
    }

    setEnviando(true);
    setErro('');

    try {
      const u = await login(email.trim(), senha);
      toast(`Login realizado. Que bom te ver de volta, ${u.firstName || u.name}!`, 'success');
    } catch (err) {
      setErro(err.message || 'E-mail ou senha inválidos. Tente novamente.');
      setSenha('');
    } finally {
      setEnviando(false);
    }
  }

  function preencherDemo() {
    setEmail('admin@biblio.com');
    setSenha('admin123');
    setErro('');
    toast('Dados de demonstração preenchidos.', 'info');
  }

  return (
    <section className="login-screen">
      <div className="login-panel">
        <div className="login-brand">
          <img className="login-logo" src="/assets/logo.svg" alt="Alexandria" />
        </div>

        <div className="login-art" aria-hidden="true">
          <div className="art-panel">
            <div className="art-head">
              <span className="art-title">Resumo operacional</span>
              <span className="art-live"><span className="live-dot" /> ao vivo</span>
            </div>
            <div className="art-nums">
              <div><b>1.248</b><span>Títulos no acervo</span></div>
              <div><b>386</b><span>Empréstimos no mês</span></div>
            </div>
            <div className="art-chart">
              <div className="art-bars">
                <span style={{ height: '34%' }} /><span style={{ height: '52%' }} /><span style={{ height: '41%' }} />
                <span style={{ height: '70%' }} /><span style={{ height: '58%' }} /><span style={{ height: '84%' }} />
                <span style={{ height: '62%' }} />
              </div>
              <div className="art-caption">Empréstimos — últimos 7 dias</div>
            </div>
            <div className="art-foot">Atualizado agora · dados de exemplo</div>
          </div>
        </div>
      </div>

      <div className="login-side">
        <div className="login-card">
          <span className="login-kicker">Bem-vindo de volta</span>
          <h1 className="login-title">Entrar na sua conta</h1>
          <p className="login-sub">Acesse o painel de gestão da sua biblioteca.</p>

          <form onSubmit={enviar} noValidate>
            <label className="field">
              <span className="field-label">E-mail</span>
              <div className="input-group">
                <span className="igroup-ico"><Icon name="user" /></span>
                <input
                  className="input input-lg"
                  type="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck="false"
                  placeholder="seu e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </label>

            <label className="field">
              <span className="field-label">Senha</span>
              <div className="input-group">
                <span className="igroup-ico"><Icon name="lock" /></span>
                <input
                  className="input input-lg"
                  type={mostrarSenha ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
                <button
                  type="button"
                  className="pass-toggle"
                  onClick={() => setMostrarSenha((v) => !v)}
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  title={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  <span className={`igroup-ico eye${mostrarSenha ? ' off' : ''}`}><Icon name="eye" /></span>
                </button>
              </div>
            </label>

            <div className="login-row">
              <label className="checkbox">
                <input type="checkbox" defaultChecked />
                <span>Manter conectado</span>
              </label>
              <a href="#" className="login-link" onClick={(e) => { e.preventDefault(); preencherDemo(); }}>
                Preencher com dados de demonstração
              </a>
            </div>

            {erro && (
              <div className="login-error" role="alert" aria-live="assertive">
                <Icon name="close" />
                <span>{erro}</span>
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={enviando}>
              {enviando ? 'Entrando...' : 'Entrar'} <span className="btn-arrow"><Icon name="arrowRight" /></span>
            </button>
          </form>

          <div className="login-hint">
            <span className="hint-dot" />
            Demonstração · bibliotecário <b>admin</b>/<b>admin123</b> · leitor <b>david</b>/<b>leitor123</b>
          </div>
        </div>
        <p className="login-foot">© 2026 Alexandria — sistema de gestão de biblioteca</p>
      </div>
    </section>
  );
}
