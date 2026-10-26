import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Eye, EyeOff } from 'lucide-react';
import { authApi } from '../lib/api';
import { paths } from '../lib/routes';

// /reset/<token>: choose a new password from the link in the reset email.
export default function ResetPasswordPage({ token, onLogin }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const passwordRef = useRef(null);

  // The new-password field is what this page is for, so start there.
  useEffect(() => passwordRef.current?.focus(), []);

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError('The two passwords don’t match.');
    setBusy(true);
    setError('');
    const res = await authApi.reset(token, password);
    setBusy(false);
    if (!res.ok) return setError(res.data.error || 'Could not reset your password.');
    setDone(true);
  };

  return (
    <div className="account-page">
      <div className="wrap account-gate">
        <span className="icon" />
        <h1>{done ? 'Password changed' : 'Choose a new password'}</h1>
        {done ? (
          <>
            <p>You can now log in with your new password. For safety, you’ve been logged out on all devices.</p>
            <div className="cta-row">
              <button className="btn blue" onClick={onLogin}>
                Log in
              </button>
              <a className="btn ghost-dark" href={paths.home}>
                Back to the store
              </a>
            </div>
          </>
        ) : (
          <form className="form account-card reset-form" onSubmit={submit} noValidate>
            <label>
              NEW PASSWORD
              <span className="auth-pw">
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  ref={passwordRef}
                />
                <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? 'Hide password' : 'Show password'}>
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>
            <small className="auth-hint">At least 8 characters. Avoid common passwords.</small>
            <label>
              CONFIRM NEW PASSWORD
              <input
                type={showPw ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </label>
            {error && (
              <p className="err" role="alert">
                {error}
              </p>
            )}
            <button className="btn blue wide" type="submit" disabled={busy}>
              {busy ? 'Saving…' : 'Save new password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

ResetPasswordPage.propTypes = {
  token: PropTypes.string.isRequired,
  onLogin: PropTypes.func.isRequired
};
