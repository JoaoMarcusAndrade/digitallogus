/* ============================================================
   Alexandria — Layout + rotas (por papel de acesso)
   ============================================================ */

import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar.jsx';
import { Topbar } from './components/Topbar.jsx';
import { LoginScreen } from './components/LoginScreen.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { LeitorDashboard } from './pages/LeitorDashboard.jsx';
import { Acervo } from './pages/Acervo.jsx';
import { Usuarios } from './pages/Usuarios.jsx';
import { Emprestimos } from './pages/Emprestimos.jsx';
import { MeusEmprestimos } from './pages/MeusEmprestimos.jsx';
import { useSession } from './store/session.jsx';

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

/** Rota restrita ao bibliotecário. */
function SomenteBibliotecario({ children }) {
  const { isBibliotecario } = useSession();
  if (!isBibliotecario) return <Navigate to="/dashboard" replace />;
  return children;
}

function Layout() {
  const { isBibliotecario } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = () => setSidebarOpen(false);

  const painel = isBibliotecario ? <Dashboard /> : <LeitorDashboard />;

  return (
    <div className="app">
      <Sidebar open={sidebarOpen} onClose={closeSidebar} />
      <main className="main">
        <Topbar onMenu={() => setSidebarOpen(true)} />
        <section className="content">
          <ScrollTop />
          <Routes>
            <Route path="/" element={painel} />
            <Route path="/dashboard" element={painel} />
            <Route path="/acervo" element={<Acervo />} />
            <Route path="/meus-emprestimos" element={<MeusEmprestimos />} />
            <Route path="/usuarios" element={<SomenteBibliotecario><Usuarios /></SomenteBibliotecario>} />
            <Route path="/emprestimos" element={<SomenteBibliotecario><Emprestimos /></SomenteBibliotecario>} />
            <Route path="*" element={painel} />
          </Routes>
        </section>
      </main>
    </div>
  );
}

export default function App() {
  const { user, loading } = useSession();

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', color: 'var(--text-3)' }}>
        Carregando...
      </div>
    );
  }

  return (
    <HashRouter>
      {user ? <Layout /> : <LoginScreen />}
    </HashRouter>
  );
}
