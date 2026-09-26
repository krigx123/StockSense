import React, { useState } from 'react';
import { useStore } from '../store.jsx';
import { useToast } from '../Toast.jsx';
import { Icon, OpIcon } from '../icons.jsx';
import { Heading } from '../Shared.jsx';
import FilterBar from '../FilterBar.jsx';
import { fmt, ago, opClass, baseOpType, emptyFilters, exportCSV } from '../helpers.js';
import { useModal } from '../Modal.jsx';
import { OperationDetailModal } from '../modals/MiscModals.jsx';

export default function Ledger() {
  const { state } = useStore();
  const toast = useToast();
  const { openModal } = useModal();
  const [filters, setFilters] = useState(emptyFilters());
  const [view, setView] = useState('list');

  const q = filters.query.toLowerCase();
  const rows = state.ledger.filter((l) => {
    const p = state.products.find((x) => x.id === l.productId);
    const op = state.ops.find((o) => o.reference === l.reference);
    return (!q || `${p?.name || ''} ${p?.sku || ''} ${l.reference} ${l.location}`.toLowerCase().includes(q)) &&
      (filters.status === 'All statuses' || op?.status === filters.status) &&
      (filters.type === 'All types' || op?.type === filters.type || (filters.type === 'Transfer' && l.type.startsWith('Transfer')));
  });
  const kanbanRows = state.ops.filter((o) => (!q || `${o.reference} ${o.partner} ${o.type}`.toLowerCase().includes(q)) && (filters.status === 'All statuses' || o.status === filters.status) && (filters.type === 'All types' || o.type === filters.type));

  const net = state.ledger.reduce((s, l) => s + l.quantity, 0);

  function exportLedger() {
    exportCSV('stocksense-movement-history.csv',
      ['Date', 'Movement', 'Product', 'SKU', 'Quantity', 'Location', 'Reference', 'By', 'Note'],
      state.ledger.map((l) => {
        const p = state.products.find((x) => x.id === l.productId);
        return [new Date(l.time).toLocaleString(), l.type, p?.name, p?.sku, l.quantity, l.location, l.reference, l.actor, l.note];
      }));
    toast('CSV report downloaded');
  }

  return (
    <>
      <Heading kicker="AUDIT TRAIL" title="Movement history" sub="A traceable record of every change to your stock."
        actions={<button className="button button-primary" onClick={exportLedger}>Export CSV <Icon.down /></button>} />
      <section className="panel table-panel">
        <div className="operation-tabs"><strong className="move-view-title">Move history</strong><span className="view-switch"><button className={view === 'list' ? 'selected' : ''} onClick={() => setView('list')} aria-label="List view">☷</button><button className={view === 'kanban' ? 'selected' : ''} onClick={() => setView('kanban')} aria-label="Kanban view">▦</button></span></div>
        <div className="ledger-summary">
          <div><span>All-time movements</span><strong>{state.ledger.length}</strong></div>
          <div><span>Net quantity change</span><strong>{net > 0 ? '+' : ''}{fmt(net)} <small>units</small></strong></div>
          <div><span>Locations tracked</span><strong>{state.warehouses.length}</strong></div>
        </div>
        <FilterBar filters={filters} setFilters={setFilters} showStatus showType />
        {view === 'kanban' ? <div className="kanban-board">{['Draft','Waiting','Ready','Done','Canceled'].map((status) => <section className="kanban-column" key={status}><header><strong>{status}</strong><span>{kanbanRows.filter((o) => o.status === status).length}</span></header>{kanbanRows.filter((o) => o.status === status).map((o) => <button className="kanban-card" key={o.id} onClick={() => openModal(<OperationDetailModal operation={o} />)}><strong>{o.reference}</strong><span>{o.type} · {o.partner}</span><small>{o.date}</small></button>)}</section>)}</div> : <div className="table-scroll">
          <table>
            <thead><tr><th>MOVEMENT</th><th>PRODUCT</th><th>LOCATION</th><th>REFERENCE</th><th>QUANTITY</th><th>WHEN</th><th>BY</th></tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={7} className="empty-table">No stock movements yet.</td></tr>}
              {rows.map((l) => {
                const p = state.products.find((x) => x.id === l.productId);
                return (
                  <tr key={l.id}>
                    <td><span className="type-cell"><i className={`type-icon ${opClass(baseOpType(l.type))}`}><OpIcon type={baseOpType(l.type)} /></i>{l.type}</span></td>
                    <td><span className="ledger-product"><strong>{p?.name || 'Unknown'}</strong><small>{p?.sku || ''}</small></span></td>
                    <td>{l.location}</td>
                    <td className="sku-cell">{l.reference}</td>
                    <td><strong className={l.quantity > 0 ? 'text-green' : l.quantity < 0 ? 'text-red' : ''}>{l.quantity > 0 ? '+' : ''}{fmt(l.quantity)}</strong> <span className="muted-cell">{p?.unit || 'units'}</span></td>
                    <td>{ago(l.time)}</td>
                    <td>{l.actor}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>}
        <div className="table-footer"><span>Showing <strong>{rows.length}</strong> movements</span></div>
      </section>
    </>
  );
}
