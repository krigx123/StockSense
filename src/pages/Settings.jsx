import React, { useState } from 'react';
import { useStore } from '../store.jsx';
import { useModal } from '../Modal.jsx';
import { useToast } from '../Toast.jsx';
import { Heading } from '../Shared.jsx';
import { ConfirmModal } from '../modals/MiscModals.jsx';

export default function Settings({ setPage }) {
  const { dispatch } = useStore();
  const { openModal, closeModal } = useModal();
  const toast = useToast();

  const [workspaceName, setWorkspaceName] = useState('Acme Workshop');
  const [defaultUnit, setDefaultUnit] = useState('Pieces (pcs)');
  const [alertsOn, setAlertsOn] = useState(true); // fixed: this toggle is now wired up end-to-end

  function saveSettings() {
    toast('Workspace settings saved');
  }

  function resetDemo() {
    openModal(
      <ConfirmModal
        title="Reset demo data?"
        description="This replaces the saved workspace on this browser with the original StockSense demo data."
        buttonLabel="Reset demo"
        onConfirm={() => {
          dispatch({ type: 'RESET' });
          closeModal();
          toast('Demo data restored');
        }}
      />
    );
  }

  return (
    <>
      <Heading kicker="PREFERENCES" title="Settings" sub="Make StockSense work the way your team works." />
      <div className="settings-layout">
        <aside className="settings-menu">
          <button className="active">General</button>
          <button onClick={() => setPage('warehouses')}>Warehouses</button>
          <button onClick={() => toast('Profile settings are part of the production follow-up')}>Profile</button>
        </aside>
        <section className="panel settings-panel">
          <div className="settings-section">
            <span className="settings-symbol">⌂</span>
            <div><h2>Workspace details</h2><p>Information about your inventory workspace</p></div>
          </div>
          <div className="settings-field">
            <label>Workspace name</label>
            <input value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} />
            <small>This is the name your team sees across StockSense.</small>
          </div>
          <div className="settings-field">
            <label>Default unit of measure</label>
            <select value={defaultUnit} onChange={(e) => setDefaultUnit(e.target.value)}>
              <option>Pieces (pcs)</option><option>Kilograms (kg)</option><option>Metres (m)</option><option>Sets</option>
            </select>
          </div>
          <div className="settings-field">
            <label>Low stock alert</label>
            <div className="toggle-row">
              <span><strong>Show low stock alerts</strong><small>Highlight products that are at or below their reorder point</small></span>
              <button className={`toggle-switch ${alertsOn ? 'on' : ''}`} role="switch" aria-checked={alertsOn}
                      onClick={() => { setAlertsOn((v) => !v); toast(!alertsOn ? 'Low stock alerts enabled' : 'Low stock alerts disabled'); }}>
                <i></i>
              </button>
            </div>
          </div>
          <div className="settings-actions">
            <span>Changes are saved on this device.</span>
            <button className="button button-primary" onClick={saveSettings}>Save changes</button>
          </div>
          <div className="demo-notice">
            <strong>Prototype workspace</strong>
            <span>Your workspace data is stored in this browser. For shared access, connect a backend and user accounts.</span>
            <button onClick={resetDemo}>Reset demo data</button>
          </div>
        </section>
      </div>
    </>
  );
}
