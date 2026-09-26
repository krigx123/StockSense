import React, { useEffect, useState } from 'react';
import { useStore } from '../store.jsx';
import { useToast } from '../Toast.jsx';

const CREDENTIALS_KEY = 'stocksense.demo.credentials.v1';

function readCredentials() {
  try { return JSON.parse(localStorage.getItem(CREDENTIALS_KEY) || '{}'); }
  catch { return {}; }
}

async function hashPassword(value, saltHex) {
  const salt = saltHex
    ? Uint8Array.from(saltHex.match(/.{2}/g), (byte) => parseInt(byte, 16))
    : window.crypto.getRandomValues(new Uint8Array(16));
  const saltValue = Array.from(salt, (byte) => byte.toString(16).padStart(2, '0')).join('');
  const material = await window.crypto.subtle.importKey('raw', new TextEncoder().encode(value), 'PBKDF2', false, ['deriveBits']);
  const digest = await window.crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 120000, hash: 'SHA-256' }, material, 256);
  const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${saltValue}:${hash}`;
}

export default function Auth() {
  const { dispatch } = useStore();
  const toast = useToast();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (mode !== 'forgot_otp' || secondsLeft <= 0) return undefined;
    const timer = setTimeout(() => setSecondsLeft((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [mode, secondsLeft]);

  function backToLogin() {
    setMode('login'); setMessage(''); setPassword(''); setConfirmPassword(''); setOtp(''); setGeneratedOtp(''); setSecondsLeft(0);
  }
  function sendOtp() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setMessage('Enter a valid email address.'); return; }
    const nextOtp = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(nextOtp); setOtp(''); setSecondsLeft(60); setMessage(''); setMode('forgot_otp');
    toast(`Demo OTP: ${nextOtp}`);
  }
  async function submit(e) {
    e.preventDefault(); setMessage('');
    if (mode === 'forgot_email') { sendOtp(); return; }
    if (mode === 'forgot_otp') {
      if (!/^\d{6}$/.test(otp) || otp !== generatedOtp) { setMessage('That OTP is incorrect. Please try again.'); return; }
      setMode('forgot_new_pass'); return;
    }
    if (mode === 'forgot_new_pass') {
      if (password.length < 6) { setMessage('Password must be at least 6 characters.'); return; }
      if (password !== confirmPassword) { setMessage('Passwords do not match.'); return; }
      try {
        const credentials = readCredentials();
        credentials[email.trim().toLowerCase()] = await hashPassword(password);
        localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
        backToLogin(); toast('Password updated successfully. Please sign in.');
      } catch { setMessage('Password could not be saved in this browser. Please try again.'); }
      return;
    }
    if (!email.trim() || password.length < 6 || (mode === 'signup' && !name.trim())) { setMessage('Enter the required details. Password must be at least 6 characters.'); return; }
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const credentials = readCredentials();
      if (mode === 'login' && credentials[normalizedEmail]) {
        const [salt] = credentials[normalizedEmail].split(':');
        if (credentials[normalizedEmail] !== await hashPassword(password, salt)) { setMessage('Incorrect email or password.'); return; }
      }
      if (mode === 'signup') {
        credentials[normalizedEmail] = await hashPassword(password);
        localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
      }
      dispatch({ type: 'SET_USER', user: { name: mode === 'signup' ? name.trim() : email.split('@')[0], email: email.trim() } });
    } catch { setMessage('Authentication could not be completed in this browser. Please try again.'); }
  }
  const resetting = mode.startsWith('forgot_');
  const title = mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Create your account' : mode === 'forgot_email' ? 'Reset your password' : mode === 'forgot_otp' ? 'Verify your email' : 'Choose a new password';
  return <main className="auth-page"><section className="auth-card"><a className="brand auth-brand" href="#"><span className="brand-icon">✓</span><span>Stock<span>Sense</span></span></a><div className="eyebrow">INVENTORY WORKSPACE</div><h1>{title}</h1><p className="auth-sub">{resetting ? 'Follow the steps to reset your password.' : mode === 'login' ? 'Sign in to keep your inventory moving.' : 'Set up your StockSense workspace.'}</p>
    <form onSubmit={submit}>
      {mode === 'signup' && <label className="form-field"><span>Your name</span><input autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required /></label>}
      {(mode === 'login' || mode === 'signup' || mode === 'forgot_email') && <label className="form-field"><span>Email address</span><input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>}
      {(mode === 'login' || mode === 'signup' || mode === 'forgot_new_pass') && <label className="form-field"><span>{mode === 'forgot_new_pass' ? 'New password' : 'Password'}</span><input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength="6" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>}
      {mode === 'forgot_new_pass' && <label className="form-field"><span>Confirm password</span><input type="password" autoComplete="new-password" minLength="6" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required /></label>}
      {mode === 'forgot_otp' && <><div className="form-hint">A demo OTP was sent for testing: <strong>{generatedOtp}</strong></div><label className="form-field"><span>6-digit OTP</span><input inputMode="numeric" autoComplete="one-time-code" maxLength="6" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} required /></label><div className="auth-switch">{secondsLeft ? `Resend available in ${secondsLeft}s` : <button type="button" onClick={sendOtp}>Resend OTP</button>}</div></>}
      {message && <p className="auth-error">{message}</p>}
      <button className="button button-primary auth-submit">{mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create account' : mode === 'forgot_email' ? 'Send OTP' : mode === 'forgot_otp' ? 'Verify OTP' : 'Update password'}</button>
    </form>
    {resetting ? <p className="auth-switch"><button onClick={backToLogin}>Back to Sign in</button></p> : <><p className="auth-switch">{mode === 'login' ? <> <button onClick={() => { setMode('forgot_email'); setMessage(''); }}>Forgot password?</button><br />New to StockSense? </> : 'Already have an account?'} <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage(''); }}>{mode === 'login' ? 'Create an account' : 'Sign in'}</button></p><small className="auth-note">Demo sign-in is stored on this device. Connect an identity provider for secure accounts and OTP recovery.</small></>}
  </section></main>;
}
