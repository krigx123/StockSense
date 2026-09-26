import React, { useState } from 'react';
import { useStore } from '../store.jsx';
import { useModal, ModalFrame } from '../Modal.jsx';
import { useToast } from '../Toast.jsx';
import { dateLabel } from '../helpers.js';
import { OpIcon } from '../icons.jsx';

export function WarehouseModal() {
  const { state, dispatch } = useStore();
  const { closeModal } = useModal();
  const toast = useToast();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');

  function save() {
    const clean = name.trim();
    const cleanCode = code.trim().toUpperCase();
    if (!clean || !cleanCode) { toast('Enter a warehouse name and short code'); return; }
    if (state.warehouseRecords.some((w) => w.name.toLowerCase() === clean.toLowerCase() || w.code.toLowerCase() === cleanCode.toLowerCase())) { toast('Warehouse name and short code must be unique'); return; }
    dispatch({ type: 'ADD_WAREHOUSE', id: `w${Date.now()}`, name: clean, code: cleanCode, address: address.trim() });
    closeModal();
    toast('Warehouse added');
  }

  return (
    <ModalFrame title="Add a warehouse" sub="Create a warehouse record with its own address and short code."
      footer={<button className="button button-primary" onClick={save}>Add warehouse</button>}>
      <label className="form-field">
        <span>Warehouse name</span><input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Eastside Warehouse" required />
      </label>
      <div className="form-row"><label className="form-field"><span>Short code</span><input value={code} onChange={(e) => setCode(e.target.value)} placeholder="EAST" maxLength={8} required /></label><label className="form-field"><span>Address</span><input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, city" /></label></div>
    </ModalFrame>
  );
}

export function LocationModal() {
  const { state, dispatch } = useStore();
  const { closeModal } = useModal();
  const toast = useToast();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [warehouseId, setWarehouseId] = useState(state.warehouseRecords?.[0]?.id || '');
  function save() {
    const clean = name.trim(), short = code.trim().toUpperCase();
    if (!clean || !short || !warehouseId) { toast('Enter a location name, code, and warehouse'); return; }
    if (state.locations.some((l) => l.name.toLowerCase() === clean.toLowerCase() || l.code.toLowerCase() === short.toLowerCase())) { toast('Location name and short code must be unique'); return; }
    dispatch({ type: 'ADD_LOCATION', location: { id: clean, name: clean, code: short, warehouseId } });
    closeModal(); toast('Location added');
  }
  return <ModalFrame title="Add a location" sub="Add a stock-holding area inside a warehouse." footer={<button className="button button-primary" onClick={save}>Add location</button>}>
    <label className="form-field"><span>Location name</span><input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Packing area" /></label>
    <div className="form-row"><label className="form-field"><span>Short code</span><input value={code} onChange={(e) => setCode(e.target.value)} placeholder="PACK" maxLength={8} /></label><label className="form-field"><span>Warehouse</span><select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>{state.warehouseRecords.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select></label></div>
  </ModalFrame>;
}

export function ConfirmModal({ title, description, buttonLabel = 'Confirm', onConfirm }) {
  return (
    <ModalFrame title={title} sub={description}
      footer={<button className="button button-danger" onClick={onConfirm}>{buttonLabel}</button>}>
      <div className="confirm-warning">This action cannot be undone.</div>
    </ModalFrame>
  );
}

export function OperationDetailModal({ operation }) {
  const { state, dispatch } = useStore();
  const { closeModal } = useModal();
  const toast = useToast();
  const o = state.ops.find((x) => x.id === operation.id) || operation;
  const canValidate = ['Ready', 'Waiting'].includes(o.status);
  const canCancel = !['Done', 'Canceled'].includes(o.status);

  function validate() {
    if (o.type === 'Delivery' && o.lines.some((l) => (state.products.find((p) => p.id === l.productId)?.locations[l.location] || 0) < l.quantity)) {
      toast('Not enough stock to validate this delivery'); return;
    }
    if (o.type === 'Transfer' && o.lines.some((l) => (state.products.find((p) => p.id === l.productId)?.locations[l.from] || 0) < l.quantity)) {
      toast('Not enough stock to validate this transfer'); return;
    }
    dispatch({ type: 'VALIDATE_OPERATION', id: o.id });
    closeModal();
    toast(`${o.reference} validated`);
  }
  function setReady() {
    dispatch({ type: 'SET_OPERATION_STATUS', id: o.id, status: 'Ready' });
    closeModal(); toast(`${o.reference} is ready`);
  }
  function cancel() {
    dispatch({ type: 'CANCEL_OPERATION', id: o.id });
    closeModal();
    toast('Operation canceled');
  }

  return (
    <ModalFrame
      title={o.reference}
      sub={`${o.type} · ${dateLabel(o.date)}`}
      footer={<>
        <button className="button button-quiet" onClick={() => window.print()}>Print</button>
        {canCancel && <button className="button button-quiet" onClick={cancel}>Cancel</button>}
        {o.status === 'Draft' && <button className="button button-quiet" onClick={setReady}>Mark ready</button>}
        {canValidate && <button className="button button-primary" onClick={validate}>Validate</button>}
      </>}
    >
      <div className="operation-detail">
        <div className="detail-meta"><span>Contact / route</span><strong>{o.partner}</strong></div>
        <div className="detail-meta">
          <span>Status</span>
          <span className={`status-badge ${o.status.toLowerCase()}`}><i></i>{o.status}</span>
        </div>
        <div className="detail-lines-title">Products</div>
        {o.lines.map((line, i) => {
          const p = state.products.find((x) => x.id === line.productId);
          return (
            <div className="operation-detail-line" key={i}>
              <span><strong>{p?.name || 'Product'}</strong><small>{p?.sku || ''} · {line.quantity} {p?.unit || 'units'}</small></span>
              <span>{line.location || `${line.from} → ${line.to}`}</span>
            </div>
          );
        })}
      </div>
    </ModalFrame>
  );
}

export function WarehouseMenuModal({ name, onOpenStock }) {
  const { state, dispatch } = useStore();
  const { closeModal } = useModal();
  const toast = useToast();

  function remove() {
    if (state.warehouses.length <= 1) { toast('Keep at least one location'); return; }
    if (state.products.some((p) => (p.locations[name] || 0) > 0)) { toast('Move all stock out before removing this location'); return; }
    dispatch({ type: 'REMOVE_WAREHOUSE', name });
    closeModal();
    toast('Location removed');
  }

  return (
    <ModalFrame title={name} sub="Location actions" footer={<button className="button button-quiet" onClick={closeModal}>Close</button>}>
      <div className="operation-detail-line">
        <span><strong>View stock</strong><small>See products stored here</small></span>
        <button className="button button-quiet compact-button" onClick={() => { closeModal(); onOpenStock(name); }}>Open</button>
      </div>
      <div className="operation-detail-line">
        <span><strong>Remove location</strong><small>Only empty locations can be removed</small></span>
        <button className="button button-danger compact-button" onClick={remove}>Remove</button>
      </div>
    </ModalFrame>
  );
}
