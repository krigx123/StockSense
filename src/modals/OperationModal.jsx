import React, { useState } from 'react';
import { useStore } from '../store.jsx';
import { useModal, ModalFrame } from '../Modal.jsx';
import { useToast } from '../Toast.jsx';

const PARTNER_LABEL = { Receipt: 'Supplier', Delivery: 'Customer / recipient', Transfer: 'Movement reference', Adjustment: 'Reason for adjustment' };
const PARTNER_PLACEHOLDER = {
  Receipt: 'e.g. Northside Timber Co.', Delivery: 'e.g. Studio Form & Co.',
  Transfer: 'e.g. Replenish production floor', Adjustment: 'e.g. Damaged during handling',
};
const HINT = {
  Receipt: 'Save a draft or mark ready. Stock changes only when the receipt is validated.',
  Delivery: 'Validation deducts stock from the selected location. Insufficient stock is blocked.',
  Transfer: 'A transfer reduces source stock and increases destination stock. Total stock stays the same.',
  Adjustment: 'Enter the physical counted quantity. The difference from recorded stock will be logged.',
};

function emptyLine(state, opType, overrides = {}) {
  const productId = overrides.productId || state.products[0]?.id || '';
  const p = state.products.find((product) => product.id === productId);
  const location = overrides.location || state.warehouses[0];
  return {
    productId,
    quantity: overrides.quantity ?? (opType === 'Adjustment' ? (p?.locations[location] ?? 0) : 1),
    location,
    toLocation: state.warehouses.find((warehouse) => warehouse !== location) || location,
  };
}

export default function OperationModal({ initialValues = {} }) {
  const { state, dispatch } = useStore();
  const { closeModal } = useModal();
  const toast = useToast();

  const [opType, setOpType] = useState(initialValues.opType || 'Receipt');
  const [partner, setPartner] = useState(initialValues.partner || '');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [initialStatus, setInitialStatus] = useState(initialValues.status || 'Draft');
  const [lines, setLines] = useState(() => [emptyLine(state, initialValues.opType || 'Receipt', initialValues)]);

  function onTypeChange(t) {
    setOpType(t);
    setLines(lines.map((l) => {
      const p = state.products.find((x) => x.id === l.productId);
      return { ...l, quantity: t === 'Adjustment' ? (p?.locations[l.location] ?? 0) : 1 };
    }));
  }

  function updateLine(i, field, value) {
    setLines(lines.map((l, idx) => {
      if (idx !== i) return l;
      const updated = { ...l, [field]: value };
      if (field === 'productId' && opType === 'Adjustment') {
        const p = state.products.find((x) => x.id === value);
        updated.quantity = p?.locations[l.location] ?? 0;
      }
      if (field === 'location' && opType === 'Adjustment') {
        const p = state.products.find((x) => x.id === l.productId);
        updated.quantity = p?.locations[value] ?? 0;
      }
      return updated;
    }));
  }

  function addLine() {
    setLines([...lines, emptyLine(state, opType)]);
  }

  function removeLine(i) {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, idx) => idx !== i));
  }

  function save() {
    for (const line of lines) {
      const p = state.products.find((x) => x.id === line.productId);
      if (!p) { toast('Select a valid product for every line'); return; }
      const n = Number(line.quantity);
      if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) { toast('Enter a whole number quantity of zero or more'); return; }
      if (opType !== 'Adjustment' && n < 1) { toast('Quantity must be at least 1'); return; }
      if (opType === 'Adjustment' && n === (p.locations[line.location] || 0)) { toast(`Counted quantity matches current stock for ${p.name}`); return; }
      if (opType === 'Transfer' && line.location === line.toLocation) { toast('Choose two different locations'); return; }
    }
    if (opType === 'Delivery' || opType === 'Transfer') {
      const requestedBySource = new Map();
      lines.forEach((line) => {
        const key = `${line.productId}:${line.location}`;
        requestedBySource.set(key, (requestedBySource.get(key) || 0) + Number(line.quantity));
      });
      for (const [key, requested] of requestedBySource) {
        const [productId, location] = key.split(':');
        const p = state.products.find((product) => product.id === productId);
        const available = p?.locations[location] || 0;
        if (requested > available) {
          toast(`Not enough ${p?.unit || 'stock'} in ${location} for ${p?.name || 'this product'}. Available: ${available}`);
          return;
        }
      }
    }
    if (opType === 'Adjustment' && !partner.trim() && lines.some((l) => {
      const p = state.products.find((x) => x.id === l.productId);
      return Number(l.quantity) > (p?.locations[l.location] || 0);
    })) { toast('Add a reason for a positive adjustment'); return; }

    dispatch({
      type: 'CREATE_OPERATION', opType,
      lines: lines.map((l) => ({ productId: l.productId, quantity: Number(l.quantity), location: l.location, toLocation: l.toLocation })),
      partner: partner.trim(), date, status: initialStatus,
    });
    closeModal();
    toast(`${opType} saved as ${initialStatus.toLowerCase()}`);
  }

  return (
    <ModalFrame
      title="New operation"
      sub="Record a stock movement in your workspace."
      footer={<button className="button button-primary" onClick={save}>{initialStatus === 'Draft' ? 'Save draft' : `Create ${initialStatus.toLowerCase()}`}</button>}
    >
      <div className="form-row">
        <label className="form-field">
          <span>Operation type</span>
          <select value={opType} onChange={(e) => onTypeChange(e.target.value)}>
            <option>Receipt</option><option>Delivery</option><option>Transfer</option><option>Adjustment</option>
          </select>
        </label>
        <label className="form-field">
          <span>Document status</span>
          <select value={initialStatus} onChange={(e) => setInitialStatus(e.target.value)}>
            <option>Draft</option><option>Waiting</option><option>Ready</option>
          </select>
        </label>
      </div>
      <label className="form-field">
        <span>{PARTNER_LABEL[opType]}</span>
        <input value={partner} onChange={(e) => setPartner(e.target.value)} placeholder={PARTNER_PLACEHOLDER[opType]} />
      </label>

      <div className="multi-lines-section">
        <div className="multi-lines-header">
          <span className="multi-lines-title">Product lines</span>
          <button type="button" className="button button-quiet compact-button" onClick={addLine}>＋ Add Product Line</button>
        </div>
        <div className="multi-lines-col-header">
          <span style={{ flex: 1 }}>Product</span>
          <span style={{ flex: '0 0 72px' }}>{opType === 'Adjustment' ? 'Counted' : 'Qty'}</span>
          <span style={{ flex: 1 }}>Location</span>
          {opType === 'Transfer' && <span style={{ flex: 1 }}>Move to</span>}
          <span style={{ flex: '0 0 28px' }}></span>
        </div>
        {lines.map((line, i) => (
          <div className="multi-line-row" key={i}>
            <div className="multi-line-product">
              <select className="multi-line-field" value={line.productId} onChange={(e) => updateLine(i, 'productId', e.target.value)}>
                {state.products.map((prod) => <option key={prod.id} value={prod.id}>{prod.name} · {prod.sku}</option>)}
              </select>
              <small className="multi-line-availability">
                {opType === 'Receipt' ? 'Stock will increase' : opType === 'Adjustment' ? `On hand: ${state.products.find((prod) => prod.id === line.productId)?.locations[line.location] || 0}` : `Available: ${state.products.find((prod) => prod.id === line.productId)?.locations[line.location] || 0}`}
              </small>
            </div>
            <input className="multi-line-qty-input" type="number" min={opType === 'Adjustment' ? 0 : 1} step="1" value={line.quantity}
                   onChange={(e) => updateLine(i, 'quantity', e.target.value)} required />
            <select className="multi-line-field" value={line.location} onChange={(e) => updateLine(i, 'location', e.target.value)}>
              {state.warehouses.map((w) => <option key={w}>{w}</option>)}
            </select>
            {opType === 'Transfer' && (
              <select className="multi-line-field" value={line.toLocation} onChange={(e) => updateLine(i, 'toLocation', e.target.value)}>
                {state.warehouses.map((w) => <option key={w}>{w}</option>)}
              </select>
            )}
            <button type="button" className="multi-line-remove" onClick={() => removeLine(i)} disabled={lines.length <= 1} aria-label="Remove line">×</button>
          </div>
        ))}
      </div>

      <div className="form-field">
        <span>Document date</span>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="form-hint">{HINT[opType]}{lines.length > 1 && ` This operation has ${lines.length} product lines.`}</div>
    </ModalFrame>
  );
}
