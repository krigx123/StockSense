import React from 'react';
import { useStore } from '../store.jsx';
import { useModal } from '../Modal.jsx';
import { Icon } from '../icons.jsx';
import { Heading } from '../Shared.jsx';
import { fmt } from '../helpers.js';
import { WarehouseModal, WarehouseMenuModal } from '../modals/MiscModals.jsx';

export default function Warehouses({ setPage, setProductWarehouseFilter }) {
  const { state } = useStore();
  const { openModal } = useModal();

  function openStock(name) {
    setProductWarehouseFilter(name);
    setPage('products');
  }

  return (
    <>
      <Heading kicker="YOUR NETWORK" title="Warehouses" sub="Manage locations and see how inventory is distributed."
        actions={<button className="button button-primary" onClick={() => openModal(<WarehouseModal />)}><Icon.plus /> Add location</button>} />
      <div className="warehouse-grid">
        {state.warehouses.map((w, i) => {
          const prods = state.products.filter((p) => (p.locations[w] || 0) > 0);
          const units = prods.reduce((s, p) => s + p.locations[w], 0);
          return (
            <article className="panel warehouse-card" key={w}>
              <div className="warehouse-card-top">
                <span className={`warehouse-hero-icon mark-${i % 3}`}>{i === 0 ? '⌂' : '▦'}</span>
                <button className="row-menu" onClick={() => openModal(<WarehouseMenuModal name={w} onOpenStock={openStock} />)}><Icon.dots /></button>
              </div>
              <h2>{w}</h2>
              <p>{prods.length} products stocked</p>
              <div className="warehouse-units"><strong>{fmt(units)}</strong><span>total units</span></div>
              <div className="warehouse-bottom">
                <span><i></i> Active</span>
                <button className="text-link" onClick={() => openStock(w)}>View stock <Icon.arrow /></button>
              </div>
            </article>
          );
        })}
        <button className="add-warehouse-card" onClick={() => openModal(<WarehouseModal />)}>
          <span><Icon.plus /></span><strong>Add a location</strong><small>Expand your inventory network</small>
        </button>
      </div>
    </>
  );
}
