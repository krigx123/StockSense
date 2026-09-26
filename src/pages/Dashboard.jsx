import React, { useState } from 'react';
import { useStore } from '../store.jsx';
import { useModal } from '../Modal.jsx';
import { useToast } from '../Toast.jsx';
import { Icon, OpIcon } from '../icons.jsx';
import { Heading, OperationsTable } from '../Shared.jsx';
import { fmt, ago, initials, total, allStock, lowProducts, outProducts, lowCount, stockTone, opClass, baseOpType, exportCSV } from '../helpers.js';
import OperationModal from '../modals/OperationModal.jsx';

export default function Dashboard({ setPage }) {
  const { state } = useStore();
  const { openModal } = useModal();
  const toast = useToast();
  const [filters, setFilters] = useState({ location: 'All locations', status: 'All statuses', type: 'All types' });

  const locationMatches = (record, location) => location === 'All locations' || (record.lines || []).some((line) => [line.location, line.from, line.to].includes(location)) || record.location === location;
  const opMatches = (op) => (filters.status === 'All statuses' || op.status === filters.status) && (filters.type === 'All types' || op.type === filters.type) && locationMatches(op, filters.location);
  const activeOps = state.ops.filter((o) => opMatches(o) && (filters.status !== 'All statuses' || !['Done', 'Canceled'].includes(o.status)));
  const filteredLedger = state.ledger.filter((entry) => {
    const op = state.ops.find((candidate) => candidate.reference === entry.reference);
    return (filters.type === 'All types' || baseOpType(entry.type) === filters.type) &&
      (filters.location === 'All locations' || entry.location === filters.location) &&
      (filters.status === 'All statuses' || (op && op.status === filters.status));
  });
  const displayName = state.user?.name || 'Inventory Manager';
  const safeName = displayName.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: '2-digit' }).toUpperCase();
  const low = lowProducts(state.products), out = outProducts(state.products);
  const waitingReceipts = state.ops.filter((o) => o.type === 'Receipt' && o.status !== 'Done' && o.status !== 'Canceled').length;
  const waitingDeliveries = state.ops.filter((o) => o.type === 'Delivery' && o.status !== 'Done' && o.status !== 'Canceled').length;
  const scheduled = state.ops.filter((o) => o.type === 'Transfer' && o.status !== 'Done' && o.status !== 'Canceled').length;

  const kpis = [
    ['Total units in stock', fmt(allStock(state.products)), 'Across all locations', 'mint', Icon.box],
    ['Low / out of stock', `${low.length} / ${out.length}`, 'Products need attention', 'amber', Icon.adjust],
    ['Pending receipts', waitingReceipts, 'Awaiting stock validation', 'blue', Icon.receipt],
    ['Pending deliveries', waitingDeliveries, 'Orders to fulfill', 'violet', Icon.delivery],
    ['Transfers scheduled', scheduled, 'Internal movements', 'cyan', Icon.move],
  ];

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
      <Heading kicker={today} title={`Good morning, ${safeName} <span class="wave">✳</span>`}
        sub="Here’s what’s happening across your inventory today."
        actions={<>
          <button className="button button-quiet" onClick={exportLedger}>Export report <Icon.arrow /></button>
          <button className="button button-primary" onClick={() => openModal(<OperationModal />)}><Icon.plus /> New operation</button>
        </>} />

      <section className="kpi-grid">
        {kpis.map(([label, value, note, color, IconC]) => (
          <article className="kpi-card" key={label}>
            <div className="kpi-top"><span className={`kpi-icon ${color}`}><IconC /></span><button className="subtle-dots" aria-label="More options"><Icon.dots /></button></div>
            <div className="kpi-value">{value}</div>
            <div className="kpi-label">{label}</div>
            <div className="kpi-note">{note}</div>
          </article>
        ))}
      </section>

      <div className="filter-bar dashboard-filter-bar" aria-label="Filter dashboard activity">
        <select className="filter-select" aria-label="Warehouse or location" value={filters.location} onChange={(e) => setFilters((current) => ({ ...current, location: e.target.value }))}>
          <option>All locations</option>{state.warehouses.map((location) => <option key={location}>{location}</option>)}
        </select>
        <select className="filter-select" aria-label="Status" value={filters.status} onChange={(e) => setFilters((current) => ({ ...current, status: e.target.value }))}>
          <option>All statuses</option>{['Draft', 'Waiting', 'Ready', 'Done', 'Canceled'].map((status) => <option key={status}>{status}</option>)}
        </select>
        <select className="filter-select" aria-label="Operation type" value={filters.type} onChange={(e) => setFilters((current) => ({ ...current, type: e.target.value }))}>
          <option>All types</option>{['Receipt', 'Delivery', 'Transfer', 'Adjustment'].map((type) => <option key={type}>{type}</option>)}
        </select>
        <button className="filter-reset" onClick={() => setFilters({ location: 'All locations', status: 'All statuses', type: 'All types' })}>Reset</button>
      </div>

      <div className="dashboard-grid">
        <section className="panel attention-panel">
          <div className="panel-heading">
            <div><div className="section-title-row"><h2>Needs attention</h2><span className="count-pill amber-pill">{lowCount(state.products)}</span></div>
              <p>Stock that’s running low or needs a reorder</p></div>
            <button className="text-link" onClick={() => setPage('products')}>View all <Icon.arrow /></button>
          </div>
          <div className="attention-list">
            {[...out, ...low].slice(0, 4).map((p) => (
              <div className="attention-row" key={p.id}>
                <span className={`product-thumb ${stockTone(p)}`}>{initials(p.name)}</span>
                <span className="attention-product"><strong>{p.name}</strong><small>{p.sku} <span>·</span> {p.category}</small></span>
                <span className="attention-amount">
                  <strong className={total(p) === 0 ? 'text-red' : 'text-amber'}>{fmt(total(p))} {p.unit}</strong>
                  <small>Reorder at {fmt(p.reorder)}</small>
                </span>
                <span className="stock-track"><i style={{ width: `${Math.max(4, Math.min(100, (total(p) / Math.max(1, p.reorder)) * 100))}%` }}></i></span>
              </div>
            ))}
            {[...out, ...low].length === 0 && <div className="empty-inline"><span>✓</span><strong>All stocked up</strong><small>No products need attention.</small></div>}
          </div>
          <div className="panel-footer">
            <span>{low.length} low stock <span className="footer-dot">·</span> {out.length} out of stock</span>
          </div>
        </section>

        <section className="panel activity-panel">
          <div className="panel-heading">
            <div><h2>Recent activity</h2><p>Latest movements across your locations</p></div>
            <button className="text-link" onClick={() => setPage('ledger')}>View history <Icon.arrow /></button>
          </div>
          <div className="activity-list">
            {filteredLedger.slice(0, 5).map((l) => {
              const p = state.products.find((x) => x.id === l.productId);
              return (
                <div className="activity-row" key={l.id}>
                  <span className={`activity-icon ${opClass(baseOpType(l.type))}`}><OpIcon type={baseOpType(l.type)} /></span>
                  <span className="activity-copy">
                    <strong>{l.type} <span>{l.quantity > 0 ? '+' : ''}{fmt(l.quantity)} {p?.unit || 'units'}</span></strong>
                    <small>{p?.name || 'Product'} · {l.location}</small>
                  </span>
                  <span className="activity-time">{ago(l.time)}</span>
                </div>
              );
            })}
            {filteredLedger.length === 0 && <div className="empty-inline"><strong>No matching activity</strong></div>}
          </div>
          <div className="panel-footer"><span>Updated in real time</span><span className="live-indicator"><i></i> Live</span></div>
        </section>

        <section className="panel operations-panel">
          <div className="panel-heading">
            <div><h2>Upcoming operations</h2><p>What’s moving through your warehouse</p></div>
            <button className="text-link" onClick={() => setPage('operations')}>All operations <Icon.arrow /></button>
          </div>
          <OperationsTable rows={activeOps.slice(0, 4)} showActions={false} />
        </section>

        <section className="panel location-panel">
          <div className="panel-heading">
            <div><h2>Stock by location</h2><p>Inventory distribution at a glance</p></div>
            <button className="icon-button small-icon" aria-label="View locations" onClick={() => setPage('warehouses')}><Icon.arrow /></button>
          </div>
          <div className="location-summary">
            {state.warehouses.map((w, i) => {
              const units = state.products.reduce((s, p) => s + (p.locations[w] || 0), 0);
              return (
                <div className="location-row" key={w}>
                  <span className={`location-mark mark-${i % 3}`}>{i === 0 ? '⌂' : '▦'}</span>
                  <span className="location-info"><strong>{w}</strong><small>{state.products.filter((p) => (p.locations[w] || 0) > 0).length} products stocked</small></span>
                  <span className="location-units">{fmt(units)} <small>units</small></span>
                </div>
              );
            })}
          </div>
          <div className="location-total"><span>Total inventory</span><strong>{fmt(allStock(state.products))} <small>units</small></strong></div>
        </section>
      </div>
    </>
  );
}
