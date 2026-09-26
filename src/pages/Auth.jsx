import React, { useState } from 'react';
import { useStore } from '../store.jsx';

export default function Auth() {
  const { dispatch } = useStore();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  function submit(e) {
    e.preventDefault();
    if (!email.trim() || password.length < 6 || (mode === 'signup' && !name.trim())) { setMessage('Enter the required details. Password must be at least 6 characters.'); return; }
    dispatch({ type: 'SET_USER', user: { name: mode === 'signup' ? name.trim() : email.split('@')[0], email: email.trim() } });
  }
  return <main className="auth-page"><section className="auth-card"><a className="brand auth-brand" href="#"><span className="brand-icon">✓</span><span>Stock<span>Sense</span></span></a><div className="eyebrow">INVENTORY WORKSPACE</div><h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1><p className="auth-sub">{mode === 'login' ? 'Sign in to keep your inventory moving.' : 'Set up your StockSense workspace.'}</p><form onSubmit={submit}>{mode === 'signup' && <label className="form-field"><span>Your name</span><input autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required /></label>}<label className="form-field"><span>Email address</span><input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label><label className="form-field"><span>Password</span><input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength="6" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>{message && <p className="auth-error">{message}</p>}<button className="button button-primary auth-submit">{mode === 'login' ? 'Sign in' : 'Create account'}</button></form><p className="auth-switch">{mode === 'login' ? 'New to StockSense?' : 'Already have an account?'} <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage(''); }}>{mode === 'login' ? 'Create an account' : 'Sign in'}</button></p><small className="auth-note">Demo sign-in is stored on this device. Connect an identity provider for secure accounts and OTP recovery.</small></section></main>;
}
