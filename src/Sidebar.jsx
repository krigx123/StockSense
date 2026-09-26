import React from 'react';
import { useStore } from './store.jsx';

const NAV = [
  { key: 'dashboard', label: 'Overview' },
  { key: 'products', label: 'Products', withCount: true },
  { key: 'stock', label: 'Stock on hand' },
  { key: 'operations', label: 'Operations' },
  { key: 'ledger', label: 'Move history' },
];
const MANAGE = [
  { key: 'warehouses', label: 'Warehouses' },
  { key: 'locations', label: 'Locations' },
  { key: 'settings', label: 'Settings' },
];

export default function Sidebar({ page, setPage, mobileOpen, setMobileOpen }) {
  const { state, dispatch } = useStore();
  const userName = state.user?.name?.trim() || 'Inventory Manager';
  const userInitials = userName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'I';

  function go(key) {
    setPage(key);
    setMobileOpen(false);
  }

  return (
    <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
      <a className="brand" href="#dashboard" aria-label="StockSense home" onClick={(e) => { e.preventDefault(); go('dashboard'); }}>
        <span className="brand-icon">
          <svg viewBox="0 0 32 32" fill="none"><path d="M16 3.8 27 10v12L16 28.2 5 22V10L16 3.8Z" stroke="currentColor" strokeWidth="2.2"/><path d="m10.1 15.4 4 4 8-8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4"/></svg>
        </span>
        <span>Stock<span>Sense</span></span>
      </a>
      <div className="workspace-switch">
        <span className="workspace-avatar">A</span>
        <span className="workspace-copy"><strong>Acme Workshop</strong><small>Workspace</small></span>
        <svg viewBox="0 0 16 16"><path d="m4 6 4 4 4-4"/></svg>
      </div>
      <div className="nav-group">
        <span className="nav-label">WORKSPACE</span>
        <nav className="primary-nav" aria-label="Main navigation">
          {NAV.map((n) => (
            <button key={n.key} className={`nav-item ${page === n.key ? 'active' : ''}`} onClick={() => go(n.key)}>
              {n.label}
              {n.withCount && <span className="nav-count">{state.products.length}</span>}
            </button>
          ))}
        </nav>
      </div>
      <div className="nav-group secondary-nav">
        <span className="nav-label">MANAGE</span>
        {MANAGE.map((n) => (
          <button key={n.key} className={`nav-item ${page === n.key ? 'active' : ''}`} onClick={() => go(n.key)}>{n.label}</button>
        ))}
      </div>
      <div className="sidebar-bottom">
        <div className="help-card">
          <span className="help-spark">✳</span>
          <strong>Need a hand?</strong>
          <p>Your inventory is in good hands.</p>
          <button onClick={() => go('settings')}>Visit help center <span>↗</span></button>
        </div>
        <button className="profile-button" onClick={() => go('settings-profile')}>
          <span className="profile-avatar">{userInitials}</span>
          <span className="profile-copy"><strong>{userName}</strong><small>{state.user?.role || 'Inventory Manager'}</small></span>
          <svg viewBox="0 0 16 16"><circle cx="8" cy="3" r="1"/><circle cx="8" cy="8" r="1"/><circle cx="8" cy="13" r="1"/></svg>
        </button>
        <button className="sidebar-logout" onClick={() => { dispatch({ type: 'SET_USER', user: null }); setMobileOpen(false); }}>Log out</button>
      </div>
    </aside>
  );
}
