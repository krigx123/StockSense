import React from 'react';
import { useStore } from '../store.jsx';
import { useModal } from '../Modal.jsx';
import { Icon } from '../icons.jsx';
import { Heading } from '../Shared.jsx';
import { WarehouseModal } from '../modals/MiscModals.jsx';

export default function Warehouses() {
  const { state } = useStore();
  const { openModal } = useModal();
  const warehouses = state.warehouseRecords || [];
  return <><Heading kicker="YOUR NETWORK" title="Warehouses" sub="Manage warehouse names, short codes, and addresses." actions={<button className="button button-primary" onClick={() => openModal(<WarehouseModal />)}><Icon.plus /> Add warehouse</button>} />
    <section className="panel table-panel"><div className="table-scroll"><table><thead><tr><th>WAREHOUSE</th><th>SHORT CODE</th><th>ADDRESS</th><th>LOCATIONS</th></tr></thead><tbody>{warehouses.map((w) => <tr key={w.id}><td><strong>{w.name}</strong></td><td className="sku-cell">{w.code}</td><td>{w.address || '—'}</td><td>{(state.locations || []).filter((l) => l.warehouseId === w.id).length}</td></tr>)}</tbody></table></div>{warehouses.length === 0 && <div className="empty-table">No warehouses yet.</div>}</section>
  </>;
}
