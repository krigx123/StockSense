import React from 'react';
import { useStore } from '../store.jsx';
import { useModal } from '../Modal.jsx';
import { Heading } from '../Shared.jsx';
import { LocationModal } from '../modals/MiscModals.jsx';

export default function Locations() {
  const { state } = useStore();
  const { openModal } = useModal();
  const locations = state.locations || [];
  return <><Heading kicker="YOUR NETWORK" title="Locations" sub="Storage areas within each warehouse." actions={<button className="button button-primary" onClick={() => openModal(<LocationModal />)}>＋ Add location</button>} /><section className="panel table-panel"><div className="table-scroll"><table><thead><tr><th>LOCATION</th><th>SHORT CODE</th><th>WAREHOUSE</th><th>ON HAND</th></tr></thead><tbody>{locations.map((l) => { const units = state.products.reduce((sum, p) => sum + (p.locations[l.id] || 0), 0); return <tr key={l.id}><td><strong>{l.name}</strong></td><td className="sku-cell">{l.code}</td><td>{state.warehouseRecords?.find((w) => w.id === l.warehouseId)?.name || '—'}</td><td>{units.toLocaleString()}</td></tr>; })}</tbody></table></div></section></>;
}
