import React, { useState } from 'react';
import { useStore } from '../store.jsx';
import { useModal } from '../Modal.jsx';
import { Icon } from '../icons.jsx';
import { Heading, OperationsTable } from '../Shared.jsx';
import FilterBar from '../FilterBar.jsx';
import { emptyFilters } from '../helpers.js';
import OperationModal from '../modals/OperationModal.jsx';
import { OperationDetailModal } from '../modals/MiscModals.jsx';

const TABS = [
  { key: 'all', label: 'All operations' },
  { key: 'Receipt', label: 'Receipts' },
  { key: 'Delivery', label: 'Deliveries' },
  { key: 'Transfer', label: 'Transfers' },
  { key: 'Adjustment', label: 'Adjustments' },
];

export default function Operations() {
  const { state } = useStore();
  const { openModal } = useModal();
  const [filters, setFilters] = useState(emptyFilters());
  const [view, setView] = useState('list');

  const q = filters.query.toLowerCase();
  const rows = state.ops.filter((o) =>
    (!q || `${o.reference} ${o.partner} ${o.type}`.toLowerCase().includes(q)) &&
    (filters.status === 'All statuses' || o.status === filters.status) &&
    (filters.type === 'All types' || o.type === filters.type));

  return (
    <>
      <Heading kicker="WORKFLOW" title="Operations" sub="Receipts, deliveries, and movements — all in one place."
        actions={<button className="button button-primary" onClick={() => openModal(<OperationModal />)}><Icon.plus /> New operation</button>} />
      <section className="panel table-panel">
        <div className="operation-tabs">
          {TABS.map((t) => (
            <button key={t.key} className={`tab ${(filters.type === 'All types' ? 'all' : filters.type) === t.key ? 'active' : ''}`}
                    onClick={() => setFilters((f) => ({ ...f, type: t.key === 'all' ? 'All types' : t.key }))}>
              {t.label} {t.key === 'all' && <span>{state.ops.length}</span>}
            </button>
          ))}
          <span className="view-switch"><button className={view === 'list' ? 'selected' : ''} onClick={() => setView('list')} aria-label="List view">☷</button><button className={view === 'kanban' ? 'selected' : ''} onClick={() => setView('kanban')} aria-label="Kanban view">▦</button></span>
        </div>
        <FilterBar filters={filters} setFilters={setFilters} showStatus showType />
        {view === 'list' ? <OperationsTable rows={rows} /> : <div className="kanban-board">{['Draft','Waiting','Ready','Picking','Packed','Done','Canceled'].map((status) => <section className="kanban-column" key={status}><header><strong>{status}</strong><span>{rows.filter((o) => o.status === status).length}</span></header>{rows.filter((o) => o.status === status).map((o) => <button className="kanban-card" key={o.id} onClick={() => openModal(<OperationDetailModal operation={o} />)}><strong>{o.reference}</strong><span>{o.type} · {o.partner}</span><small>{o.lines.length} line · {o.date}</small></button>)}</section>)}</div>}
        <div className="table-footer"><span>Showing <strong>{rows.length}</strong> of {state.ops.length} operations</span></div>
      </section>
    </>
  );
}
