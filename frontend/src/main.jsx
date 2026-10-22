/* ============================================================
   Alexandria — Entry point (React + Vite)
   ============================================================ */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import { AppProvider } from './AppContext.jsx';
import { SessionProvider } from './store/session.jsx';
import { ToastProvider } from './ui/Toast.jsx';
import { ModalProvider } from './ui/Modal.jsx';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SessionProvider>
      <AppProvider>
        <ToastProvider>
          <ModalProvider>
            <App />
          </ModalProvider>
        </ToastProvider>
      </AppProvider>
    </SessionProvider>
  </React.StrictMode>
);
