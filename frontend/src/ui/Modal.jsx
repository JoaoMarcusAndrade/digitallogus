/* ============================================================
   BiblioGestor — Modal e Confirmação (React)
   ============================================================ */

import { createContext, useCallback, useContext, useState } from 'react';
import { Icon } from './icons.jsx';

const ModalContext = createContext(null);

export function useModal() {
  return useContext(ModalContext);
}

export function ModalProvider({ children }) {
  const [modal, setModal] = useState(null); // { content, size }
  const [confirm, setConfirm] = useState(null); // { message, title, okText, danger, onOk }

  const openModal = useCallback((content, size) => setModal({ content, size }), []);
  const closeModal = useCallback(() => setModal(null), []);

  const confirmBox = useCallback((message, onOk, opts = {}) => {
    setConfirm({ message, onOk, ...opts });
  }, []);

  const closeConfirm = () => setConfirm(null);

  return (
    <ModalContext.Provider value={{ openModal, closeModal, confirmBox }}>
      {children}

      {modal && (
        <div className="modal-root">
          <div className="modal-backdrop" onClick={closeModal} />
          <div
            className={`modal${modal.size ? ' modal-' + modal.size : ''}`}
            role="dialog"
            aria-modal="true"
          >
            {modal.content}
          </div>
        </div>
      )}

      {confirm && (
        <div className="modal-root">
          <div className="modal-backdrop" onClick={closeConfirm} />
          <div className="modal modal-sm" role="alertdialog">
            <div className="modal-body confirm-body">
              <div className={`confirm-icon ${confirm.danger ? 'danger' : 'warn'}`}>
                <Icon name={confirm.danger ? 'trash' : 'bell'} />
              </div>
              <h3 className="confirm-title">{confirm.title || 'Confirmar ação'}</h3>
              <p className="confirm-text"
                dangerouslySetInnerHTML={{ __html: confirm.message }} />
              <div className="confirm-actions">
                <button className="btn" onClick={closeConfirm}>Cancelar</button>
                <button
                  className={`btn ${confirm.danger ? 'btn-danger' : 'btn-primary'}`}
                  onClick={() => {
                    const ok = confirm.onOk;
                    closeConfirm();
                    ok && ok();
                  }}
                >
                  {confirm.okText || 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}

/* ---------- Pequenos helpers JSX ---------- */

export function ModalHead({ title, sub }) {
  const { closeModal } = useModal();
  return (
    <div className="modal-head">
      <div>
        {title && <h2>{title}</h2>}
        {sub && <p>{sub}</p>}
      </div>
      <button className="icon-btn" onClick={closeModal} aria-label="Fechar">
        <Icon name="close" />
      </button>
    </div>
  );
}

export function Field({ label, children, hint, full }) {
  return (
    <label className={`field${full ? ' full' : ''}`}>
      <span className="field-label">{label}</span>
      {children}
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

export function Dl({ label, value }) {
  return (
    <div className="dl-item">
      <div className="dl-label">{label}</div>
      <div className="dl-value">{value}</div>
    </div>
  );
}

const BADGE_MAP = {
  disponivel: { cls: 'badge badge-green', txt: 'Disponível' },
  emprestado: { cls: 'badge badge-amber', txt: 'Emprestado' },
  esgotado: { cls: 'badge badge-red', txt: 'Esgotado' },
  available: { cls: 'badge badge-green', txt: 'Disponível' },
  loaned: { cls: 'badge badge-amber', txt: 'Emprestado' },
  out: { cls: 'badge badge-red', txt: 'Esgotado' },
  ativo: { cls: 'badge badge-green', txt: 'Ativo' },
  inativo: { cls: 'badge badge-gray', txt: 'Inativo' },
  active: { cls: 'badge badge-green', txt: 'Ativo' },
  overdue: { cls: 'badge badge-red', txt: 'Atrasado' },
  returned: { cls: 'badge badge-blue', txt: 'Devolvido' },
  devolvido: { cls: 'badge badge-blue', txt: 'Devolvido' },
  atrasado: { cls: 'badge badge-red', txt: 'Atrasado' },
  renovado: { cls: 'badge badge-amber', txt: 'Renovado' }
};

export function StatusBadge({ status }) {
  const s = BADGE_MAP[status] || { cls: 'badge badge-gray', txt: status };
  return <span className={s.cls}>{s.txt}</span>;
}

export { useToast } from './Toast.jsx';
