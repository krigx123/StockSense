# StockSense — React + Vite

A React + Vite port of the original vanilla-JS StockSense prototype. Same features, same data model,
same visual design (styles.css is unchanged) — rebuilt as componentized React with a `useReducer` store
instead of hand-rolled DOM re-rendering.

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
