import React, { useState } from 'react';
import { useStore } from '../store.jsx';
import { useModal, ModalFrame } from '../Modal.jsx';
import { useToast } from '../Toast.jsx';

const UNITS = ['pcs', 'sets', 'kg', 'g', 'm', 'cm', 'L', 'box'];

export default function ProductModal({ product }) {
  const { state, dispatch } = useStore();
  const { closeModal } = useModal();
  const toast = useToast();
  const isEdit = !!product;
  const firstWarehouse = state.warehouses[0];

  const [name, setName] = useState(product?.name || '');
  const [sku, setSku] = useState(product?.sku || '');
  const [category, setCategory] = useState(product?.category || '');
  const [unit, setUnit] = useState(product?.unit || 'pcs');
  const [reorder, setReorder] = useState(product?.reorder ?? 10);
  const [initial, setInitial] = useState(product ? (product.locations[firstWarehouse] || 0) : 0);

  const categories = [...new Set(state.products.map((p) => p.category))];

  function save() {
    const cleanName = name.trim(), cleanSku = sku.trim().toUpperCase(), cleanCategory = category.trim();
    const reorderNum = Number(reorder), initialNum = Number(initial);
    if (!cleanName || !cleanSku || !cleanCategory) { toast('Add a name, SKU, and category'); return; }
    if (state.products.some((p) => p.sku.toLowerCase() === cleanSku.toLowerCase() && p.id !== product?.id)) {
      toast('That SKU is already in use'); return;
    }
    if (!Number.isInteger(reorderNum) || reorderNum < 0 || !Number.isInteger(initialNum) || initialNum < 0) {
      toast('Stock and reorder point must be whole numbers of zero or more'); return;
    }
    dispatch({
      type: 'SAVE_PRODUCT', id: product?.id, name: cleanName, sku: cleanSku, category: cleanCategory,
      unit, reorder: reorderNum, initial: initialNum,
    });
    closeModal();
    toast(isEdit ? 'Product updated' : 'Product added');
  }

  return (
    <ModalFrame
      title={isEdit ? 'Edit product' : 'Add a product'}
      sub={isEdit ? 'Update product details and reorder settings.' : 'Add a product to your inventory.'}
      footer={<button className="button button-primary" onClick={save}>{isEdit ? 'Save product' : 'Add product'}</button>}
    >
      <div className="form-row">
        <label className="form-field">
          <span>Product name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Oak dining chair" required />
        </label>
        <label className="form-field">
          <span>SKU / code</span>
          <input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="e.g. FRN-001" required />
        </label>
      </div>
      <div className="form-row">
        <label className="form-field">
          <span>Category</span>
          <input list="category-list" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Furniture" />
          <datalist id="category-list">{categories.map((c) => <option key={c}>{c}</option>)}</datalist>
        </label>
        <label className="form-field">
          <span>Unit of measure</span>
          <select value={unit} onChange={(e) => setUnit(e.target.value)}>
            {UNITS.map((u) => <option key={u}>{u}</option>)}
          </select>
        </label>
      </div>
      <div className="form-row">
        <label className="form-field">
          <span>Reorder point</span>
          <input type="number" min="0" step="1" value={reorder} onChange={(e) => setReorder(e.target.value)} />
        </label>
        <label className="form-field">
          <span>{isEdit ? `Update stock at ${firstWarehouse}` : 'Initial stock'}</span>
          <input type="number" min="0" step="1" value={initial} onChange={(e) => setInitial(e.target.value)} />
        </label>
      </div>
      <div className="form-hint">Products are available across all locations. Stock changes are recorded in movement history.</div>
    </ModalFrame>
  );
}
