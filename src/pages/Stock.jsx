import React, { useState } from 'react';
import { useStore } from '../store.jsx';
import { Heading } from '../Shared.jsx';
import { fmt, total } from '../helpers.js';

export default function Stock() {
  const { state } = useStore();
  const [query, setQuery] = useState('');
  const reserved = {};
  state.ops.filter((o) => o.type === 'Delivery' && !['Done', 'Canceled'].includes(o.status)).forEach((o) => o.lines.forEach((l) => { reserved[l.productId] = (reserved[l.productId] || 0) + l.quantity; }));
  const rows = state.products.filter((p) => `${p.name} ${p.sku}`.toLowerCase().includes(query.toLowerCase()));
  return <><Heading kicker="INVENTORY" title="Stock" sub="On-hand quantities, available stock, and unit cost." /><section className="panel table-panel"><div className="filter-bar"><input className="stock-search" placeholder="Search products or SKU" value={query} onChange={(e) => setQuery(e.target.value)} /></div><div className="table-scroll"><table><thead><tr><th>PRODUCT</th><th>PER UNIT COST</th><th>ON HAND</th><th>RESERVED</th><th>FREE TO USE</th></tr></thead><tbody>{rows.map((p) => { const onHand = total(p); const hold = Math.min(onHand, reserved[p.id] || 0); return <tr key={p.id}><td><span className="ledger-product"><strong>{p.name}</strong><small>{p.sku}</small></span></td><td>₹ {fmt(p.cost || 0)}</td><td><strong>{fmt(onHand)}</strong> <span className="muted-cell">{p.unit}</span></td><td>{fmt(hold)} <span className="muted-cell">{p.unit}</span></td><td><strong className="text-green">{fmt(onHand - hold)}</strong> <span className="muted-cell">{p.unit}</span></td></tr>; })}</tbody></table></div><div className="table-footer">Free to use = on hand − quantities reserved by open delivery orders.</div></section></>;
}
