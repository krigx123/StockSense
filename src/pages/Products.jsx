import React, { useState } from 'react';
import { useStore } from '../store.jsx';
import { useModal } from '../Modal.jsx';
import { useToast } from '../Toast.jsx';
import { Icon } from '../icons.jsx';
import { Heading } from '../Shared.jsx';
import FilterBar from '../FilterBar.jsx';
import { fmt, initials, total, allStock, stockTone, stockStatus, emptyFilters, exportCSV } from '../helpers.js';
import ProductModal from '../modals/ProductModal.jsx';
import OperationModal from '../modals/OperationModal.jsx';

export default function Products({ initialWarehouse }) {
  const { state } = useStore();
  const { openModal } = useModal();
  const toast = useToast();
  const [filters, setFilters] = useState(() => ({ ...emptyFilters(), warehouse: initialWarehouse || 'All locations' }));

  const q = filters.query.toLowerCase();
  const list = state.products.filter((p) =>
    (!q || `${p.name} ${p.sku} ${p.category}`.toLowerCase().includes(q)) &&
    (filters.category === 'All categories' || p.category === filters.category) &&
    (filters.warehouse === 'All locations' || Object.prototype.hasOwnProperty.call(p.locations, filters.warehouse)));

  function openReorder(p) {
    const location = filters.warehouse !== 'All locations' ? filters.warehouse : state.warehouses[0];
    const quantity = Math.max(1, (p.reorder * 2) - total(p));
    openModal(<OperationModal initialValues={{ opType: 'Receipt', status: 'Draft', productId: p.id, quantity, location }} />);
  }

  function exportProducts() {
    exportCSV('stocksense-products.csv',
      ['Name', 'SKU', 'Category', 'Unit', 'On hand', 'Reorder at', 'Status', 'Locations'],
      state.products.map((p) => [p.name, p.sku, p.category, p.unit, total(p), p.reorder, stockStatus(p),
        Object.entries(p.locations).map(([w, n]) => `${w}: ${n}`).join('; ')]));
    toast('CSV report downloaded');
  }

  return (
    <>
      <Heading kicker="INVENTORY" title="Products" sub="A clear view of every product across your locations."
        actions={<>
          <button className="button button-quiet" onClick={exportProducts}>Export CSV</button>
          <button className="button button-primary" onClick={() => openModal(<ProductModal />)}><Icon.plus /> Add product</button>
        </>} />
      <section className="panel table-panel">
        <div className="table-toolbar">
          <div><strong>{state.products.length} products</strong><span className="toolbar-dot">·</span><span>{fmt(allStock(state.products))} total units</span></div>
          <button className="button button-quiet compact-button" onClick={() => openModal(<OperationModal />)}><Icon.plus /> Stock movement</button>
        </div>
        <FilterBar filters={filters} setFilters={setFilters} />
        <div className="table-scroll">
          <table>
            <thead><tr><th>PRODUCT</th><th>SKU</th><th>CATEGORY</th><th>ON HAND</th><th>REORDER AT</th><th>STATUS</th><th></th></tr></thead>
            <tbody>
              {list.length === 0 && <tr><td colSpan={7} className="empty-table">No products match those filters.</td></tr>}
              {list.map((p) => (
                <tr key={p.id} className={total(p) <= p.reorder ? 'product-low-stock-row' : ''}>
                  <td><span className="table-product"><span className={`product-thumb ${stockTone(p)}`}>{initials(p.name)}</span><strong>{p.name}</strong></span></td>
                  <td className="sku-cell">{p.sku}</td>
                  <td><span className="category-chip">{p.category}</span></td>
                  <td><strong>{fmt(total(p))}</strong> <span className="muted-cell">{p.unit}</span></td>
                  <td>{fmt(p.reorder)} <span className="muted-cell">{p.unit}</span></td>
                  <td><span className={`stock-status ${stockTone(p)}`}><i></i>{stockStatus(p)}</span></td>
                  <td><div className="product-actions">
                    {total(p) <= p.reorder && <button className="button button-quiet compact-button reorder-button" onClick={() => openReorder(p)}>Reorder</button>}
                    <button className="row-menu" aria-label={`Edit ${p.name}`} onClick={() => openModal(<ProductModal product={p} />)}><Icon.dots /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <span>Showing <strong>{list.length ? 1 : 0}–{list.length}</strong> of {state.products.length} products</span>
          <span className="table-pages"><button disabled>←</button><b>1</b><button disabled>→</button></span>
        </div>
      </section>
    </>
  );
}
