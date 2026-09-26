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

  function save() {
    const clean = name.trim();
    if (!clean) { toast('Enter a location name'); return; }
    if (state.warehouses.some((w) => w.toLowerCase() === clean.toLowerCase())) { toast('That location already exists'); return; }
    dispatch({ type: 'ADD_WAREHOUSE', name: clean });
    closeModal();
    toast('Location added');
  }

  return (
    <ModalFrame title="Add a location" sub="Add a warehouse or storage area to your network."
      footer={<button className="button button-primary" onClick={save}>Add location</button>}>
      <label className="form-field">
        <span>Location name</span>
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Eastside Storage" required />
      </label>
      <div className="form-hint">Each location gets its own stock balance. Move stock between locations with a transfer operation.</div>
    </ModalFrame>
  );
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
  const canValidate = ['Ready', 'Waiting', 'Draft'].includes(o.status);

  function validate() {
    if (o.type === 'Delivery' && o.lines.some((l) => (state.products.find((p) => p.id === l.productId)?.locations[l.location] || 0) < l.quantity)) {
      toast('Not enough stock to validate this delivery'); return;
    }
    dispatch({ type: 'VALIDATE_OPERATION', id: o.id });
    closeModal();
    toast(`${o.reference} validated`);
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
      footer={canValidate
        ? <>
            <button className="button button-quiet" onClick={cancel}>Cancel operation</button>
            <button className="button button-primary" onClick={validate}>Validate &amp; update stock</button>
          </>
        : null}
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
