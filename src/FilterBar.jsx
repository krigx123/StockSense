import React from 'react';
import { useStore } from './store.jsx';
import { Icon } from './icons.jsx';
import { emptyFilters } from './helpers.js';

export default function FilterBar({ filters, setFilters, showStatus, showType }) {
  const { state } = useStore();
  const categories = [...new Set(state.products.map((p) => p.category))];
  const set = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="filter-bar">
      <label className="search-box">
        <Icon.search />
        <input type="search" placeholder="Search by name, SKU or reference..." value={filters.query} onChange={set('query')} />
      </label>
      <select className="filter-select" value={filters.category} onChange={set('category')}>
        <option>All categories</option>
        {categories.map((c) => <option key={c}>{c}</option>)}
      </select>
      <select className="filter-select" value={filters.warehouse} onChange={set('warehouse')}>
        <option>All locations</option>
        {state.warehouses.map((w) => <option key={w}>{w}</option>)}
      </select>
      {showStatus && (
        <select className="filter-select" value={filters.status} onChange={set('status')}>
          <option>All statuses</option>
          {['Draft', 'Waiting', 'Ready', 'Done', 'Canceled'].map((s) => <option key={s}>{s}</option>)}
        </select>
      )}
      {showType && (
        <select className="filter-select" value={filters.type} onChange={set('type')}>
          <option>All types</option>
          {['Receipt', 'Delivery', 'Transfer', 'Adjustment'].map((t) => <option key={t}>{t}</option>)}
        </select>
      )}
      <button className="filter-reset" onClick={() => setFilters(emptyFilters())}>Reset</button>
    </div>
  );
}
