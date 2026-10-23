import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { X, Eye, EyeOff, Lock } from 'lucide-react';
import { authApi } from '../../lib/api';

const EMPTY = { name: '', email: '', phone: '', password: '' };

// Same rule as /^\S+@\S+\.\S+$/ (no whitespace; an '@' after the first character; a '.'
// at least one character after it and before the last character), without regex backtracking.
const isValidEmail = (value) => {
  if (/\s/.test(value)) return false;
  const at = value.indexOf('@', 1);
  const dot = value.lastIndexOf('.', value.length - 2);
  return at !== -1 && dot >= at + 2;
};

export default function AuthModal({ isOpen, initialMode = 'login', reason, onClose, onAuthed }) {
  const [mode, setMode] = useState(initialMode);
  const [fields, setFields] = useState(EMPTY);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const firstInput = useRef(null);

  // Reset each time the modal opens
  useEffect(() => {
    if (!isOpen) return;
    setMode(initialMode);
    setError('');
    setBusy(false);
    setFields((f) => ({ ...EMPTY, email: f.email }));
    const t = setTimeout(() => firstInput.current?.focus(), 50);
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, initialMode, onClose]);

  if (!isOpen) return null;

  const set = (e) => setFields((f) => ({ ...f, [e.target.name]: e.target.value }));
  const isSignup = mode === 'signup';
  const submitLabel = isSignup ? 'Create account' : 'Log in';

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (isSignup && fields.name.trim().length < 2) return setError('Please enter your name.');
    if (!isValidEmail(fields.email.trim())) return setError('Please enter a valid email address.');
    if (isSignup && fields.password.length < 8) return setError('Password must be at least 8 characters.');
    if (!fields.password) return setError('Please enter your password.');

    setBusy(true);
    const res = isSignup
      ? await authApi.signup({ name: fields.name, email: fields.email, phone: fields.phone, password: fields.password })
      : await authApi.login(fields.email, fields.password);
    setBusy(false);
    if (!res.ok) return setError(res.data.error || 'Something went wrong. Please try again.');
    setFields(EMPTY);
    onAuthed(res.data.user, isSignup);
  };

  const switchMode = (m) => {
    setMode(m);
    setError('');
  };

  return (
    <div className="auth-scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="auth-close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        <div className="auth-brand">
          <span className="icon" />
          <h2 id="auth-title">{isSignup ? 'Join the caravan' : 'Welcome back'}</h2>
          <p>{reason || (isSignup ? 'Create an account to order and track your kits.' : 'Log in to order and track your kits.')}</p>
        </div>

        <div className="auth-tabs" role="tablist">
          <button role="tab" aria-selected={!isSignup} onClick={() => switchMode('login')}>
            Log in
          </button>
          <button role="tab" aria-selected={isSignup} onClick={() => switchMode('signup')}>
            Create account
          </button>
        </div>

        <form className="form auth-form" onSubmit={submit} noValidate>
          {isSignup && (
            <label>
              FULL NAME
              <input ref={firstInput} name="name" autoComplete="name" value={fields.name} onChange={set} />
            </label>
          )}
          <label>
            EMAIL
            <input
              ref={isSignup ? undefined : firstInput}
              name="email"
              type="email"
              autoComplete="email"
              value={fields.email}
              onChange={set}
            />
          </label>
          {isSignup && (
            <label>
              MOBILE NUMBER <span className="auth-opt">(optional)</span>
              <input name="phone" type="tel" inputMode="tel" autoComplete="tel" value={fields.phone} onChange={set} />
            </label>
          )}
          <label>
            PASSWORD
            <span className="auth-pw">
              <input
                name="password"
                type={showPw ? 'text' : 'password'}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                value={fields.password}
                onChange={set}
              />
              <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? 'Hide password' : 'Show password'}>
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
            {isSignup && <small className="auth-hint">At least 8 characters.</small>}
          </label>

          {error && (
            <p className="err" role="alert">
              {error}
            </p>
          )}

          <button className="btn blue wide" type="submit" disabled={busy}>
            {busy ? 'Please wait…' : submitLabel}
          </button>
        </form>

        <p className="auth-switch">
          {isSignup ? 'Already have an account? ' : 'New to Quirky Camel? '}
          <button type="button" onClick={() => switchMode(isSignup ? 'login' : 'signup')}>
            {isSignup ? 'Log in' : 'Create an account'}
          </button>
        </p>
        <p className="auth-secure">
          <Lock size={13} /> Passwords are securely hashed and never stored in plain text.
        </p>
      </div>
    </div>
  );
}

AuthModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  initialMode: PropTypes.oneOf(['login', 'signup']),
  reason: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onAuthed: PropTypes.func.isRequired
};
