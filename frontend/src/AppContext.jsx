/* ============================================================
   Alexandria — Contexto global da aplicação
   ============================================================ */

import { createContext, useCallback, useContext, useState } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [detailRequest, setDetailRequest] = useState(null); // { page, id, ts }
  const [loanRequest, setLoanRequest] = useState(null); // { ts } gatilho para abrir modal de empréstimo
  const [dataVersion, setDataVersion] = useState(0); // contador de recarregamento dos dados da API

  const openDetail = useCallback((page, id) => {
    setDetailRequest({ page, id, ts: Date.now() });
  }, []);

  const openLoan = useCallback(() => {
    setLoanRequest({ ts: Date.now() });
  }, []);

  /** Avisa as páginas de que os dados mudaram (após criar/editar/excluir). */
  const reloadData = useCallback(() => {
    setDataVersion((v) => v + 1);
  }, []);

  const value = { openDetail, detailRequest, openLoan, loanRequest, dataVersion, reloadData };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}
