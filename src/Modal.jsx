import React, { createContext, useContext, useEffect, useState } from 'react';

const ModalContext = createContext(null);

export function ModalProvider({ children }) {
  const [content, setContent] = useState(null); // React node or null

  const openModal = (node) => setContent(() => node);
  const closeModal = () => setContent(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeModal(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('modal-open', !!content);
  }, [content]);

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      <div className="modal-backdrop" hidden={!content} onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
        <section className="modal" role="dialog" aria-modal="true">
          {content}
        </section>
      </div>
    </ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal must be used within ModalProvider');
  return ctx;
}

// Shared header/body/footer chrome used by every modal, mirrors modalFrame() from the vanilla app.
export function ModalFrame({ title, sub, children, footer }) {
  const { closeModal } = useModal();
  return (
    <>
      <div className="modal-head">
        <div>
          <div className="eyebrow">STOCKSENSE</div>
          <h2>{title}</h2>
          <p>{sub}</p>
        </div>
        <button className="modal-close" aria-label="Close" onClick={closeModal}>×</button>
      </div>
      <div className="modal-body">{children}</div>
      <div className="modal-actions">
        <button className="button button-quiet" onClick={closeModal}>Cancel</button>
        {footer}
      </div>
    </>
  );
}
