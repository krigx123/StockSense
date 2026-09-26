import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { seed, nowISO } from './seed.js';

const KEY = 'stocksense.mvp.v1';

function loadInitial() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      const base = seed();
      const oldWarehouses = Array.isArray(saved.warehouses) ? saved.warehouses : base.warehouses;
      const warehouseRecords = (saved.warehouseRecords || []).map((w) => typeof w === 'string' ? { id: w, name: w, code: w.slice(0, 5).toUpperCase(), address: '' } : w);
      const known = new Set(warehouseRecords.map((w) => w.name));
      oldWarehouses.forEach((w) => { if (typeof w === 'string' && !known.has(w)) warehouseRecords.push({ id: w, name: w, code: w.replace(/[^a-z0-9]/gi, '').slice(0, 5).toUpperCase(), address: '' }); });
      const locations = saved.locations || oldWarehouses.map((w, i) => ({ id: w, name: w, code: `LOC${i + 1}`, warehouseId: warehouseRecords.find((x) => x.name === w)?.id || w }));
      const migrateRef = (record) => ({ ...record, reference: typeof record.reference === 'string' && record.reference.startsWith('WH/') ? `${warehouseRecords[0]?.code || 'WH'}/${record.reference.slice(3)}` : record.reference });
      return { ...base, ...saved, seq: saved.seq || base.seq, warehouses: oldWarehouses.filter((w) => typeof w === 'string'), warehouseRecords, locations,
        ops: (saved.ops || base.ops).map(migrateRef), ledger: (saved.ledger || base.ledger).map(migrateRef),
        products: (saved.products || base.products).map((p) => ({ ...p, cost: p.cost ?? base.products.find((x) => x.id === p.id)?.cost ?? 0 })),
        user: saved.user || null };
    }
  } catch { /* fall through to seed */ }
  return seed();
}

function reducer(state, action) {
  switch (action.type) {
    case 'RESET':
      return { ...seed(), user: state.user };

    case 'SET_USER':
      return { ...state, user: action.user };

    case 'ADD_WAREHOUSE': {
      const name = action.name;
      const warehouseRecords = [...(state.warehouseRecords || []), { id: action.id, name, code: action.code, address: action.address }];
      return { ...state, warehouseRecords };
    }

    case 'REMOVE_WAREHOUSE': {
      const name = action.name;
      return { ...state, warehouseRecords: (state.warehouseRecords || []).filter((w) => w.id !== action.id) };
    }

    case 'ADD_LOCATION': {
      const location = action.location;
      const locations = [...(state.locations || []), location];
      const warehouses = state.warehouses.includes(location.name) ? state.warehouses : [...state.warehouses, location.name];
      const products = state.products.map((p) => ({ ...p, locations: { ...p.locations, [location.name]: 0 } }));
      return { ...state, locations, warehouses, products };
    }

    case 'REMOVE_LOCATION': {
      const location = (state.locations || []).find((x) => x.id === action.id);
      if (!location) return state;
      const locations = state.locations.filter((x) => x.id !== action.id);
      const warehouses = state.warehouses.filter((w) => w !== location.name);
      const products = state.products.map((p) => { const stock = { ...p.locations }; delete stock[location.name]; return { ...p, locations: stock }; });
      return { ...state, locations, warehouses, products };
    }

    case 'SAVE_PRODUCT': {
      const { id, name, sku, category, unit, cost = 0, reorder, initial } = action;
      let products = state.products;
      let seq = state.seq;
      let ledger = state.ledger;
      let ops = state.ops;
      let p = id ? products.find((x) => x.id === id) : null;

      if (!p) {
        const newP = {
          id: `p${Date.now()}`, name, sku, category, unit, cost, reorder,
          locations: Object.fromEntries(state.warehouses.map((w) => [w, 0])),
        };
        products = [newP, ...products];
        p = newP;
      } else {
        products = products.map((x) => (x.id === id ? { ...x, name, sku, category, unit, cost, reorder } : x));
        p = products.find((x) => x.id === id);
      }

      const loc = state.warehouses[0];
      const diff = initial - (p.locations[loc] || 0);
      if (diff) {
        products = products.map((x) => (x.id === p.id ? { ...x, locations: { ...x.locations, [loc]: initial } } : x));
        const whCode = state.warehouseRecords?.[0]?.code || 'WH';
        const ref = `${whCode}/ADJ/${String(seq++).padStart(4, '0')}`;
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

    case 'SAVE_OPERATION':
    case 'CREATE_OPERATION': {
      const { opType, productId, quantity: n, location: loc, toLocation: to, partner, date } = action;
      const p = state.products.find((x) => x.id === productId);
      if (!p) return state;
      let seq = state.seq;
      const id = 'o' + Date.now();
      const selectedLocation = (state.locations || []).find((x) => x.id === loc || x.name === loc);
      const wh = (state.warehouseRecords || []).find((w) => w.id === selectedLocation?.warehouseId || w.name === (action.warehouseName || loc)) || state.warehouseRecords?.[0];
      const prefix = wh?.code || 'WH';
      const typeCode = opType === 'Receipt' ? 'IN' : opType === 'Delivery' ? 'OUT' : opType === 'Transfer' ? 'MOVE' : 'ADJ';
      const ref = `${prefix}/${typeCode}/${String(seq++).padStart(4, '0')}`;
      const amount = opType === 'Adjustment' ? n - (p.locations[loc] || 0) : n;
      const lines = [{ productId: p.id, quantity: amount, ...(opType === 'Transfer' ? { from: loc, to } : { location: loc }) }];
      const resolvedPartner = opType === 'Transfer'
        ? `${loc} → ${to}`
        : partner || (opType === 'Receipt' ? 'Stock received' : opType === 'Delivery' ? 'Stock issued' : 'Physical stock count');
      const ops = [{ id, type: opType, reference: ref, partner: resolvedPartner, date, status: action.status || 'Draft', lines, warehouseId: wh?.id || null }, ...state.ops];
      return { ...state, seq, ops };
    }

    case 'VALIDATE_OPERATION': {
      const o = state.ops.find((x) => x.id === action.id);
      if (!o || ['Done', 'Canceled'].includes(o.status)) return state;
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

    case 'SET_OPERATION_STATUS': {
      const ops = state.ops.map((x) => (x.id === action.id ? { ...x, status: action.status } : x));
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
