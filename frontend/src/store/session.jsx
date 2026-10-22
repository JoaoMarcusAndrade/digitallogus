/* ============================================================
   Alexandria — Sessão do usuário (login, logout, papel de acesso)
   ============================================================ */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/client.js';
import { nomeExibido } from '../ui/labels.js';

const SESSION_KEY = 'alexandria_session';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restaura a sessão salva no navegador (recarregar a página não desloga).
  useEffect(() => {
    try {
      const salva = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
      if (salva && salva.user) setUser(salva.user);
    } catch (e) {
      localStorage.removeItem(SESSION_KEY);
    }
    setLoading(false);
  }, []);

  /** Login somente por e-mail (o login do sistema). */
  const login = useCallback(async (email, pass) => {
    const u = await api.login(email, pass);
    localStorage.setItem(SESSION_KEY, JSON.stringify({ user: u, at: Date.now() }));
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  const isLeitor = !!user && user.userLevel === 'leitor';
  const isBibliotecario = !!user && user.userLevel === 'bibliotecario';

  /**
   * Como o usuário é tratado nas telas:
   * leitor → apenas o primeiro nome; bibliotecário → nome completo.
   */
  const exibirNome = useCallback(
    (usuario) => nomeExibido(usuario, isLeitor),
    [isLeitor]
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      isLeitor,
      isBibliotecario,
      /** Nome de exibição conforme o papel (primeiro nome para o leitor). */
      exibirNome,
      /** ID do bibliotecário logado (usado nas chamadas privilegiadas `admId`). */
      admId: isBibliotecario ? user.id : null,
      /** ID do usuário logado (usado em `/api/emprestimos/me?userId=`). */
      userId: user ? user.id : null
    }),
    [user, loading, login, logout, isLeitor, isBibliotecario, exibirNome]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}
