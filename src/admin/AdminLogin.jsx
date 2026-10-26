import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { adminApi } from '../lib/api';

export default function AdminLogin({ notice, onLoggedIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState(notice || '');
  const [busy, setBusy] = useState(false);
  const emailRef = useRef(null);

  // The sign-in form is the whole page, so start in the email field.
  useEffect(() => emailRef.current?.focus(), []);

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return setError('Enter your admin email and password.');
    setBusy(true);
    setError('');
    // The server only opens an admin session for admin accounts.
    const res = await adminApi.login(email, password);
    if (!res.ok) {
      setBusy(false);
      return setError(res.data.error || 'Could not log in.');
    }
    onLoggedIn(res.data.user);
  };

  return (
    <main className="adl">
      <form className="adl-card" onSubmit={submit} noValidate>
        <div className="adl-brand">
          <span className="icon" />
          <div>
            <b>Quirky Camel</b>
            <small>Admin</small>
          </div>
        </div>
        <h1>Sign in to the dashboard</h1>
        <label>
          Email
          <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} ref={emailRef} />
        </label>
        <label>
          Password
          <span className="adl-pw">
            <input
              type={showPw ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? 'Hide password' : 'Show password'}>
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
        </label>
        {error && (
          <p className="ad-error" role="alert">
            {error}
          </p>
        )}
        <button className="btn blue wide" type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="adl-foot">
          <Lock size={13} /> Admin access only
        </p>
      </form>
    </main>
  );
}

AdminLogin.propTypes = {
  notice: PropTypes.string,
  onLoggedIn: PropTypes.func.isRequired
};
