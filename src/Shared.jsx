import React from 'react';
import { useStore } from './store.jsx';
import { useModal } from './Modal.jsx';
import { dateLabel, opClass, baseOpType } from './helpers.js';
import { OpIcon } from './icons.jsx';
import { OperationDetailModal } from './modals/MiscModals.jsx';

export function Heading({ kicker, title, sub, actions }) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{kicker}</div>
        <h1 dangerouslySetInnerHTML={{ __html: title }} />
        <p>{sub}</p>
      </div>
      <div className="heading-actions">{actions}</div>
    </div>
  );
}

export function StatusBadge({ status }) {
  return <span className={`status-badge ${status.toLowerCase()}`}><i></i>{status}</span>;
}

export function OperationsTable({ rows, showActions = true }) {
  const { openModal } = useModal();
  return (
    <div className="table-scroll">
      <table className="operations-table">
        <thead>
          <tr><th>REFERENCE</th><th>TYPE</th><th>CONTACT / ROUTE</th><th>DATE</th><th>STATUS</th>{showActions && <th></th>}</tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={6} className="empty-table">No operations match those filters.</td></tr>}
          {rows.map((o) => (
            <tr key={o.id}>
              <td><strong className="ref-cell">{o.reference}</strong></td>
              <td><span className="type-cell"><i className={`type-icon ${opClass(o.type)}`}><OpIcon type={o.type} /></i>{o.type}</span></td>
              <td className="partner-cell">{o.partner}</td>
              <td>{dateLabel(o.date)}</td>
              <td><StatusBadge status={o.status} /></td>
              {showActions && (
                <td>
                  <button className="row-menu" aria-label={`Actions for ${o.reference}`}
                          onClick={() => openModal(<OperationDetailModal operation={o} />)}>
                    <svg viewBox="0 0 20 20"><circle cx="4" cy="10" r="1"/><circle cx="10" cy="10" r="1"/><circle cx="16" cy="10" r="1"/></svg>
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
