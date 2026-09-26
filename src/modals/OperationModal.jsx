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
  Receipt: 'Validating this receipt immediately adds units and records the movement.',
  Delivery: 'Validation deducts stock from the selected location. Insufficient stock is blocked.',
  Transfer: 'A transfer reduces source stock and increases destination stock. Total stock stays the same.',
  Adjustment: 'Enter the physical counted quantity. The difference from recorded stock will be logged.',
};

export default function OperationModal() {
  const { state, dispatch } = useStore();
  const { closeModal } = useModal();
  const toast = useToast();

  const [opType, setOpType] = useState('Receipt');
  const [productId, setProductId] = useState(state.products[0]?.id || '');
  const [location, setLocation] = useState(state.warehouses[0]);
  const [toLocation, setToLocation] = useState(state.warehouses[1] || state.warehouses[0]);
  const [partner, setPartner] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const p = state.products.find((x) => x.id === productId);
  const currentAt = (loc) => p?.locations[loc] ?? 0;
  const [quantity, setQuantity] = useState(1);

  function onTypeChange(t) {
    setOpType(t);
    if (t === 'Adjustment') setQuantity(currentAt(location));
    else setQuantity(1);
  }
  function onLocationChange(loc) {
    setLocation(loc);
    if (opType === 'Adjustment') setQuantity(currentAt(loc));
  }
  function onProductChange(id) {
    setProductId(id);
    const np = state.products.find((x) => x.id === id);
    if (opType === 'Adjustment') setQuantity(np?.locations[location] ?? 0);
  }

  function save() {
    const n = Number(quantity);
    if (!p || !Number.isFinite(n) || n < 0 || !Number.isInteger(n)) { toast('Enter a whole number quantity of zero or more'); return; }
    if (opType !== 'Adjustment' && n < 1) { toast('Quantity must be at least 1'); return; }
    if (opType === 'Adjustment' && n === (p.locations[location] || 0)) { toast('Counted quantity matches current stock'); return; }
    if (opType === 'Transfer' && location === toLocation) { toast('Choose two different locations'); return; }
    if ((opType === 'Delivery' || opType === 'Transfer') && (p.locations[location] || 0) < n) {
      toast(`Not enough ${p.unit} in ${location}. Available: ${p.locations[location] || 0}`);
      return;
    }
    if (opType === 'Adjustment' && n > (p.locations[location] || 0) && !partner.trim()) { toast('Add a reason for a positive adjustment'); return; }

    dispatch({ type: 'SAVE_OPERATION', opType, productId, quantity: n, location, toLocation, partner: partner.trim(), date });
    closeModal();
    toast(`${opType} validated`);
  }

  return (
    <ModalFrame
      title="New operation"
      sub="Record a stock movement in your workspace."
      footer={<button className="button button-primary" onClick={save}>Validate operation</button>}
    >
      <label className="form-field">
        <span>Operation type</span>
        <select value={opType} onChange={(e) => onTypeChange(e.target.value)}>
          <option>Receipt</option><option>Delivery</option><option>Transfer</option><option>Adjustment</option>
        </select>
      </label>
      <label className="form-field">
        <span>{PARTNER_LABEL[opType]}</span>
        <input value={partner} onChange={(e) => setPartner(e.target.value)} placeholder={PARTNER_PLACEHOLDER[opType]} />
      </label>
      <div className="form-row">
        <label className="form-field">
          <span>Product</span>
          <select value={productId} onChange={(e) => onProductChange(e.target.value)}>
            {state.products.map((prod) => <option key={prod.id} value={prod.id}>{prod.name} · {prod.sku}</option>)}
          </select>
        </label>
        <label className="form-field">
          <span>{opType === 'Adjustment' ? 'Counted quantity' : opType === 'Transfer' ? 'Quantity to move' : 'Quantity'}</span>
          <input type="number" min={opType === 'Adjustment' ? 0 : 1} step="1" value={quantity}
                 onChange={(e) => setQuantity(e.target.value)} required />
        </label>
      </div>
      <div className="form-row">
        <label className="form-field">
          <span>Location</span>
          <select value={location} onChange={(e) => onLocationChange(e.target.value)}>
            {state.warehouses.map((w) => <option key={w}>{w}</option>)}
          </select>
        </label>
        {opType === 'Transfer' && (
          <label className="form-field">
            <span>Move to</span>
            <select value={toLocation} onChange={(e) => setToLocation(e.target.value)}>
              {state.warehouses.map((w) => <option key={w}>{w}</option>)}
            </select>
          </label>
        )}
      </div>
      <div className="form-field">
        <span>Document date</span>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="form-hint">{HINT[opType]}</div>
    </ModalFrame>
  );
}
