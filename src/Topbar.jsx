import React from 'react';
import { useStore } from './store.jsx';
import { useToast } from './Toast.jsx';
import { lowCount } from './helpers.js';

const TITLES = { dashboard: 'Overview', products: 'Products', operations: 'Operations', ledger: 'Movement history', warehouses: 'Warehouses', settings: 'Settings' };

export default function Topbar({ page, onMobileMenu }) {
  const { state } = useStore();
  const toast = useToast();
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const low = lowCount(state.products);

  return (
    <header className="topbar">
      <button className="mobile-menu icon-button" aria-label="Open menu" onClick={onMobileMenu}>
        <svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
      </button>
      <div className="breadcrumbs"><span>Workspace</span><span className="crumb-slash">/</span><strong>{TITLES[page] || 'Overview'}</strong></div>
      <div className="topbar-right">
        <span className="today-label">{today}</span>
        <button className="icon-button notification-button" aria-label="Notifications"
                onClick={() => toast(low ? `${low} products need a stock check` : 'You are all caught up')}>
          <svg viewBox="0 0 24 24"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"/></svg>
          <i></i>
        </button>
        <span className="top-divider"></span>
        <button className="top-profile" onClick={() => toast('Signed in as Jamie Davis · Inventory manager')}>
          <span className="profile-avatar">JD</span>
          <svg viewBox="0 0 16 16"><path d="m4 6 4 4 4-4"/></svg>
        </button>
      </div>
    </header>
  );
}
