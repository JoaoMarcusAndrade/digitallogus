/* ============================================================
   BiblioGestor — Sistema de Toasts (React)
   ============================================================ */

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Icon } from './icons.jsx';

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

let TOAST_EVENT = null;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const push = useCallback((msg, tipo = 'info') => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, msg, tipo }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const toast = useCallback((msg, tipo) => push(msg, tipo), [push]);
  TOAST_EVENT = toast;

  const iconFor = (tipo) =>
    tipo === 'success' ? 'check' : tipo === 'danger' ? 'close' : tipo === 'warn' ? 'bell' : 'check';

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.tipo} show`}>
            <div className="toast-chip"><Icon name={iconFor(t.tipo)} /></div>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/* Toast global fora de componentes (ex.: callbacks de dados) */
export function toast(msg, tipo) {
  if (TOAST_EVENT) TOAST_EVENT(msg, tipo);
}
