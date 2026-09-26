import React, { useState } from 'react';
import { StoreProvider } from './store.jsx';
import { ToastProvider } from './Toast.jsx';
import { ModalProvider } from './Modal.jsx';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Products from './pages/Products.jsx';
import Operations from './pages/Operations.jsx';
import Ledger from './pages/Ledger.jsx';
import Warehouses from './pages/Warehouses.jsx';
import Settings from './pages/Settings.jsx';

function Shell() {
  const [page, setPage] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  // Carries a location filter from Warehouses -> Products, mirroring the vanilla app's filters.warehouse behavior.
  const [productWarehouseFilter, setProductWarehouseFilter] = useState(null);

  function go(p) {
    setPage(p);
  }

  let content;
  if (page === 'dashboard') content = <Dashboard setPage={go} />;
  else if (page === 'products') content = <Products key={productWarehouseFilter || 'all'} initialWarehouse={productWarehouseFilter} />;
  else if (page === 'operations') content = <Operations />;
  else if (page === 'ledger') content = <Ledger />;
  else if (page === 'warehouses') content = <Warehouses setPage={go} setProductWarehouseFilter={setProductWarehouseFilter} />;
  else content = <Settings setPage={go} />;

  return (
    <div className="app-shell">
      <Sidebar page={page} setPage={go} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <main className="main-area">
        <Topbar page={page} onMobileMenu={() => setMobileOpen((v) => !v)} />
        <div className="page-content">{content}</div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <ModalProvider>
          <Shell />
        </ModalProvider>
      </ToastProvider>
    </StoreProvider>
  );
}
