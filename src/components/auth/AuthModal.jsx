import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { X, Eye, EyeOff, Lock } from 'lucide-react';
import { authApi } from '../../lib/api';
import { isValidEmail } from '../../lib/validation';
import { paths } from '../../lib/routes';
import useDialog from '../../hooks/useDialog';

const EMPTY = { name: '', email: '', phone: '', password: '' };
const TITLES = { login: 'Welcome back', signup: 'Join the caravan', forgot: 'Reset your password' };
const INTROS = { login: 'Log in to order and track your kits.', signup: 'Create an account to order and track your kits.' };
const SUBMIT_LABELS = { login: 'Log in', signup: 'Create account', forgot: 'Send reset link' };
const SWITCH_PROMPTS = { login: 'New to Quirky Camel? ', signup: 'Already have an account? ' };

export default function AuthModal({ isOpen, initialMode = 'login', reason, onClose, onAuthed, allowGuest = false, onGuest }) {
  const [mode, setMode] = useState(initialMode);
  const [fields, setFields] = useState(EMPTY);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const firstInput = useRef(null);

  // Reset each time the modal opens
  useEffect(() => {
    if (!isOpen) return;
    setMode(initialMode);
    setError('');
    setNotice('');
    setBusy(false);
    setFields((f) => ({ ...EMPTY, email: f.email }));
    const t = setTimeout(() => firstInput.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [isOpen, initialMode]);

  // Escape closes, Tab stays inside the modal, focus returns to the opener on close.
  const dialogRef = useDialog(isOpen, onClose, { initialFocus: firstInput });

  if (!isOpen) return null;

  const set = (e) => setFields((f) => ({ ...f, [e.target.name]: e.target.value }));
  const isSignup = mode === 'signup';
  const isForgot = mode === 'forgot';
  const submitLabel = SUBMIT_LABELS[mode];

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (isSignup && fields.name.trim().length < 2) return setError('Please enter your name.');
    if (!isValidEmail(fields.email.trim())) return setError('Please enter a valid email address.');
    if (isForgot) return requestReset();
    if (isSignup && fields.password.length < 8) return setError('Password must be at least 8 characters.');
    if (!isForgot && !fields.password) return setError('Please enter your password.');

    setBusy(true);
    const res = isSignup
      ? await authApi.signup({ name: fields.name, email: fields.email, phone: fields.phone, password: fields.password })
      : await authApi.login(fields.email, fields.password);
    setBusy(false);
    if (!res.ok) return setError(res.data.error || 'Something went wrong. Please try again.');
    setFields(EMPTY);
    onAuthed(res.data.user, isSignup);
  };

  // "Forgot password": always the same answer, whether or not the email has an account.
  const requestReset = async () => {
    setBusy(true);
    const res = await authApi.forgot(fields.email.trim());
    setBusy(false);
    if (!res.ok) return setError(res.data.error || 'Something went wrong. Please try again.');
    setNotice(res.data.message);
  };

  const switchMode = (m) => {
    setMode(m);
    setError('');
    setNotice('');
  };

  return (
    <div className="auth-scrim" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={dialogRef} className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="auth-close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        <div className="auth-brand">
          <span className="icon" />
          <h2 id="auth-title">{TITLES[mode]}</h2>
          <p>{isForgot ? 'Enter your account email and we’ll send you a link to choose a new password.' : reason || INTROS[mode]}</p>
        </div>

        {!isForgot && (
        <div className="auth-tabs" role="group" aria-label="Account">
          <button aria-pressed={!isSignup} onClick={() => switchMode('login')}>
            Log in
          </button>
          <button aria-pressed={isSignup} onClick={() => switchMode('signup')}>
            Create account
          </button>
        </div>
        )}

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
          {!isForgot && (
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
            {isSignup && <small className="auth-hint">At least 8 characters. Avoid common passwords.</small>}
            {mode === 'login' && (
              <button type="button" className="auth-forgot" onClick={() => switchMode('forgot')}>
                Forgot password?
              </button>
            )}
          </label>
          )}

          {notice && (
            <p className="auth-notice" role="status">
              {notice}
            </p>
          )}

          {isSignup && (
            <p className="auth-privacy">
              By creating an account you agree to our{' '}
              <a href={paths.terms} onClick={onClose}>
                Terms
              </a>{' '}
              and{' '}
              <a href={paths.privacy} onClick={onClose}>
                Privacy policy
              </a>
              .
            </p>
          )}

          {error && (
            <p className="err" role="alert">
              {error}
            </p>
          )}

          <button className="btn blue wide" type="submit" disabled={busy}>
            {busy ? 'Please wait…' : submitLabel}
          </button>
        </form>

        {allowGuest && !isForgot && (
          <div className="auth-guest">
            <span>or</span>
            <button type="button" className="btn ghost-dark wide" onClick={onGuest}>
              Continue as guest
            </button>
          </div>
        )}

        <p className="auth-switch">
          {isForgot ? 'Remembered it? ' : SWITCH_PROMPTS[mode]}
          <button type="button" onClick={() => switchMode(isSignup ? 'login' : 'signup')}>
            {isSignup || isForgot ? 'Log in' : 'Create an account'}
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
  allowGuest: PropTypes.bool,
  onGuest: PropTypes.func,
  isOpen: PropTypes.bool.isRequired,
  initialMode: PropTypes.oneOf(['login', 'signup']),
  reason: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onAuthed: PropTypes.func.isRequired
};
