# StockSense — React + Vite

A React + Vite inventory prototype based on the StockSense wireframes. It uses componentized React with
a `useReducer` store, local browser persistence, document workflow states, and separate warehouse and
location records.

## Run it

```bash
npm install
npm run dev
```

Open the printed local URL (usually http://localhost:5173).

```bash
npm run build     # production build to dist/
npm run preview   # preview the production build locally
```

## What changed vs. the vanilla prototype

- **Structure**: one big `app.js` → split into `store.jsx` (state + reducer), `pages/*` (Dashboard,
  Products, Operations, Ledger, Warehouses, Settings), `modals/*` (Operation, Product, Warehouse,
  Confirm, Operation detail, Warehouse menu), `Sidebar.jsx`, `Topbar.jsx`, `Toast.jsx`, `Modal.jsx`.
- **State**: global `StoreProvider` using `useReducer`, still persisted to `localStorage` under the same
  key (`stocksense.mvp.v1`) so existing saved demo data from the HTML version loads unchanged.
- **Modals & toasts**: promoted to React context providers (`ModalProvider`, `ToastProvider`) instead of
  imperative `showModal()`/`toast()` DOM calls.
- **Bug fix carried over**: the Settings → "Show low stock alerts" toggle is wired up (it was a dead
  button in the original HTML/JS build).
- **CSS**: untouched — `src/styles.css` is the same file, so the look and feel is identical.

## Still true from the original README

Browser storage is device-local, not shared or backed up. This remains a client-side MVP demonstration,
not a secure multi-user system — see the parent project's implementation-plan notes for the production
roadmap (auth, backend, document workflow states, hardening).

## Wireframe additions

- Login and signup screens provide a local demo session; they do not authenticate against a server.
- Receipt, delivery, transfer, and adjustment documents can be created as Draft, Waiting, or Ready. Drafts do not change on-hand stock; detail view supports status progression, validation, cancel, and print.
- Operations and Move history include list and Kanban views.
- Warehouses (name, short code, address) and Locations (name, short code, parent warehouse) are separate records.
- Stock lists per-unit cost, on-hand, reserved, and free-to-use quantities. Open deliveries reduce free-to-use without changing on-hand until validation.
- New references use `<WAREHOUSE_CODE>/<OPERATION>/<ID>`.
