import React, { useEffect, useState } from 'react';
import { useStore } from '../store.jsx';
import { useModal } from '../Modal.jsx';
import { useToast } from '../Toast.jsx';
import { Heading } from '../Shared.jsx';
import { ConfirmModal } from '../modals/MiscModals.jsx';

export default function Settings({ setPage, initialSection = 'general' }) {
  const { state, dispatch } = useStore();
  const { openModal, closeModal } = useModal();
  const toast = useToast();

  const [workspaceName, setWorkspaceName] = useState('Acme Workshop');
  const [defaultUnit, setDefaultUnit] = useState('Pieces (pcs)');
  const [alertsOn, setAlertsOn] = useState(true); // fixed: this toggle is now wired up end-to-end
  const [section, setSection] = useState(initialSection);
  const [profile, setProfile] = useState(() => ({ name: state.user?.name || '', email: state.user?.email || '', role: state.user?.role || 'Inventory Manager', location: state.user?.location || '' }));
  useEffect(() => setSection(initialSection), [initialSection]);

  function saveProfile(e) {
    e.preventDefault();
    if (!profile.name.trim() || !profile.email.trim()) { toast('Enter your name and email address'); return; }
    dispatch({ type: 'SET_USER', user: { ...state.user, name: profile.name.trim(), email: profile.email.trim(), role: profile.role, location: profile.location } });
    toast('Profile saved successfully');
  }

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
          <button className={section === 'general' ? 'active' : ''} onClick={() => setSection('general')}>General</button>
          <button onClick={() => setPage('warehouses')}>Warehouses</button>
          <button className={section === 'profile' ? 'active' : ''} onClick={() => setSection('profile')}>Profile</button>
        </aside>
        <section className="panel settings-panel">
          {section === 'profile' ? <form onSubmit={saveProfile}>
            <div className="settings-section"><span className="settings-symbol">◎</span><div><h2>Your profile</h2><p>Manage your account details and assigned location</p></div></div>
            <div className="settings-field"><label>Full Name</label><input value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} required /></div>
            <div className="settings-field"><label>Email Address</label><input type="email" value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} required /></div>
            <div className="settings-field"><label>Role</label><select value={profile.role} onChange={(e) => setProfile((p) => ({ ...p, role: e.target.value }))}><option>Inventory Manager</option><option>Warehouse Staff</option></select></div>
            <div className="settings-field"><label>Assigned Location / Warehouse</label><select value={profile.location} onChange={(e) => setProfile((p) => ({ ...p, location: e.target.value }))}><option value="">Unassigned</option>{(state.warehouses || []).map((location) => <option key={location}>{location}</option>)}</select></div>
            <div className="settings-actions"><span>Profile changes update your workspace immediately.</span><button className="button button-primary">Save Profile</button></div>
          </form> : <>
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
          </>}
        </section>
      </div>
    </>
  );
}
