import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { seed, nowISO } from './seed.js';

const KEY = 'stocksense.mvp.v1';

function loadInitial() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* fall through to seed */ }
  return seed();
}

function reducer(state, action) {
  switch (action.type) {
    case 'RESET':
      return seed();

    case 'ADD_WAREHOUSE': {
      const name = action.name;
      const warehouses = [...state.warehouses, name];
      const products = state.products.map((p) => ({ ...p, locations: { ...p.locations, [name]: 0 } }));
      return { ...state, warehouses, products };
    }

    case 'REMOVE_WAREHOUSE': {
      const name = action.name;
      const warehouses = state.warehouses.filter((w) => w !== name);
      const products = state.products.map((p) => {
        const locations = { ...p.locations };
        delete locations[name];
        return { ...p, locations };
      });
      return { ...state, warehouses, products };
    }

    case 'SAVE_PRODUCT': {
      const { id, name, sku, category, unit, reorder, initial } = action;
      let products = state.products;
      let seq = state.seq;
      let ledger = state.ledger;
      let ops = state.ops;
      let p = id ? products.find((x) => x.id === id) : null;

      if (!p) {
        const newP = {
          id: `p${Date.now()}`, name, sku, category, unit, reorder,
          locations: Object.fromEntries(state.warehouses.map((w) => [w, 0])),
        };
        products = [newP, ...products];
        p = newP;
      } else {
        products = products.map((x) => (x.id === id ? { ...x, name, sku, category, unit, reorder } : x));
        p = products.find((x) => x.id === id);
      }

      const loc = state.warehouses[0];
      const diff = initial - (p.locations[loc] || 0);
      if (diff) {
        products = products.map((x) => (x.id === p.id ? { ...x, locations: { ...x.locations, [loc]: initial } } : x));
        const ref = `WH/ADJ/${String(seq++).padStart(4, '0')}`;
        ledger = [{
          id: `l${Date.now()}`, type: 'Adjustment', productId: p.id, quantity: diff, location: loc,
          reference: ref, time: nowISO(), actor: 'Jamie Davis', note: id ? 'Opening stock update' : 'Initial stock',
        }, ...ledger];
        ops = [{
          id: `o${Date.now()}`, type: 'Adjustment', reference: ref, partner: 'Initial inventory',
          date: new Date().toISOString().slice(0, 10), status: 'Done', lines: [{ productId: p.id, quantity: diff, location: loc }],
        }, ...ops];
      }
      return { ...state, products, seq, ledger, ops };
    }

    case 'SAVE_OPERATION': {
      const { opType, productId, quantity: n, location: loc, toLocation: to, partner, date } = action;
      const p = state.products.find((x) => x.id === productId);
      if (!p) return state;

      let seq = state.seq;
      const ref = `WH/${opType === 'Receipt' ? 'IN' : opType === 'Delivery' ? 'OUT' : opType === 'Transfer' ? 'MOVE' : 'ADJ'}/${String(seq++).padStart(4, '0')}`;
      const locations = { ...p.locations };
      let lines;
      const ledgerEntries = [];

      if (opType === 'Receipt') {
        locations[loc] = (locations[loc] || 0) + n;
        lines = [{ productId: p.id, quantity: n, location: loc }];
        ledgerEntries.push({ type: opType, quantity: n, location: loc });
      } else if (opType === 'Delivery') {
        locations[loc] -= n;
        lines = [{ productId: p.id, quantity: n, location: loc }];
        ledgerEntries.push({ type: opType, quantity: -n, location: loc });
      } else if (opType === 'Transfer') {
        locations[loc] -= n;
        locations[to] = (locations[to] || 0) + n;
        lines = [{ productId: p.id, quantity: n, from: loc, to }];
        ledgerEntries.push(
          { type: 'Transfer out', quantity: -n, location: loc, note: `To ${to}` },
          { type: 'Transfer in', quantity: n, location: to, note: `From ${loc}` },
        );
      } else {
        const before = locations[loc] || 0;
        const diff = n - before;
        locations[loc] = n;
        lines = [{ productId: p.id, quantity: diff, location: loc }];
        ledgerEntries.push({ type: opType, quantity: diff, location: loc, note: partner || 'Physical stock count' });
      }

      const products = state.products.map((x) => (x.id === p.id ? { ...x, locations } : x));
      const id = 'o' + Date.now();
      const resolvedPartner = opType === 'Transfer'
        ? `${loc} → ${to}`
        : partner || (opType === 'Receipt' ? 'Stock received' : opType === 'Delivery' ? 'Stock issued' : 'Physical stock count');
      const ops = [{ id, type: opType, reference: ref, partner: resolvedPartner, date, status: 'Done', lines }, ...state.ops];

      const at = nowISO();
      const newLedger = ledgerEntries.map((l, i) => ({
        id: `${id}-${i}`, type: l.type, productId: p.id, quantity: l.quantity, location: l.location, reference: ref,
        time: at, actor: 'Jamie Davis',
        note: l.note || (opType === 'Receipt' ? 'Goods received' : opType === 'Delivery' ? 'Customer shipment' : 'Internal transfer'),
      }));

      return { ...state, products, seq, ops, ledger: [...newLedger, ...state.ledger] };
    }

    case 'VALIDATE_OPERATION': {
      const o = state.ops.find((x) => x.id === action.id);
      if (!o) return state;
      const productMap = Object.fromEntries(state.products.map((p) => [p.id, { ...p, locations: { ...p.locations } }]));

      if (o.type === 'Delivery') {
        for (const l of o.lines) if ((productMap[l.productId].locations[l.location] || 0) < l.quantity) return state;
      }
      if (o.type === 'Transfer') {
        for (const l of o.lines) if ((productMap[l.productId].locations[l.from] || 0) < l.quantity) return state;
      }

      if (o.type === 'Receipt') o.lines.forEach((l) => { productMap[l.productId].locations[l.location] = (productMap[l.productId].locations[l.location] || 0) + l.quantity; });
      if (o.type === 'Delivery') o.lines.forEach((l) => { productMap[l.productId].locations[l.location] -= l.quantity; });
      if (o.type === 'Transfer') o.lines.forEach((l) => {
        productMap[l.productId].locations[l.from] -= l.quantity;
        productMap[l.productId].locations[l.to] = (productMap[l.productId].locations[l.to] || 0) + l.quantity;
      });
      if (o.type === 'Adjustment') o.lines.forEach((l) => { productMap[l.productId].locations[l.location] = Math.max(0, (productMap[l.productId].locations[l.location] || 0) + l.quantity); });

      const products = state.products.map((p) => productMap[p.id] || p);
      const ops = state.ops.map((x) => (x.id === o.id ? { ...x, status: 'Done' } : x));
      const at = nowISO();
      const newLedger = [];
      o.lines.forEach((l, i) => {
        if (o.type === 'Transfer') {
          newLedger.push(
            { id: `${o.id}-${i}a`, type: 'Transfer out', productId: l.productId, quantity: -l.quantity, location: l.from, reference: o.reference, time: at, actor: 'Jamie Davis', note: `To ${l.to}` },
            { id: `${o.id}-${i}b`, type: 'Transfer in', productId: l.productId, quantity: l.quantity, location: l.to, reference: o.reference, time: at, actor: 'Jamie Davis', note: `From ${l.from}` },
          );
        } else {
          newLedger.push({
            id: `${o.id}-${i}`, type: o.type, productId: l.productId, quantity: o.type === 'Delivery' ? -l.quantity : l.quantity, location: l.location,
            reference: o.reference, time: at, actor: 'Jamie Davis',
            note: o.type === 'Receipt' ? 'Goods received' : o.type === 'Delivery' ? 'Customer shipment' : 'Stock count',
          });
        }
      });
      return { ...state, products, ops, ledger: [...newLedger, ...state.ledger] };
    }

    case 'CANCEL_OPERATION': {
      const ops = state.ops.map((x) => (x.id === action.id ? { ...x, status: 'Canceled' } : x));
      return { ...state, ops };
    }

    default:
      return state;
  }
}

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitial);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [state]);

  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

export function useProduct(id) {
  const { state } = useStore();
  return state.products.find((p) => p.id === id);
}
