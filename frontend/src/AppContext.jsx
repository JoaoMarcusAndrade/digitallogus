/* ============================================================
   BiblioGestor — Contexto global da aplicação
   ============================================================ */

import { createContext, useCallback, useContext, useState } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [detailRequest, setDetailRequest] = useState(null); // { page, id, ts }
  const [loanRequest, setLoanRequest] = useState(null); // { ts } gatilho para abrir modal de empréstimo

  const openDetail = useCallback((page, id) => {
    setDetailRequest({ page, id, ts: Date.now() });
  }, []);

  const openLoan = useCallback(() => {
    setLoanRequest({ ts: Date.now() });
  }, []);

  const value = { openDetail, detailRequest, openLoan, loanRequest };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}
