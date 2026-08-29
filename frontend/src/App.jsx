/* ============================================================
   BiblioGestor — Camada de layout + rotas
   ============================================================ */

import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar.jsx';
import { Topbar } from './components/Topbar.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { Acervo } from './pages/Acervo.jsx';
import { Usuarios } from './pages/Usuarios.jsx';
import { Emprestimos } from './pages/Emprestimos.jsx';
import { Relatorios } from './pages/Relatorios.jsx';

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="app">
      <Sidebar open={sidebarOpen} onClose={closeSidebar} />
      <main className="main">
        <Topbar onMenu={() => setSidebarOpen(true)} />
        <section className="content">
          <ScrollTop />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/acervo" element={<Acervo />} />
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/emprestimos" element={<Emprestimos />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </section>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Layout />
    </HashRouter>
  );
}
