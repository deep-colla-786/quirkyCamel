import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Trash2 } from 'lucide-react';
import { authApi } from '../../lib/api';

// "Delete my account" with a password confirmation (DPDP Act: right to erasure).
export default function DeleteAccount({ onDeleted }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!password) return setError('Enter your password to confirm.');
    setBusy(true);
    setError('');
    const res = await authApi.deleteAccount(password);
    setBusy(false);
    if (!res.ok) return setError(res.data.error || 'Could not delete your account.');
    onDeleted();
  };

  if (!open) {
    return (
      <button type="button" className="account-delete-link" onClick={() => setOpen(true)}>
        <Trash2 size={15} /> Delete account
      </button>
    );
  }
  return (
    <form className="form account-delete" onSubmit={submit} noValidate>
      <p>
        This removes your profile, saved address, cart and saved items, and logs you out everywhere. Your past orders are
        kept for our tax records. This can’t be undone.
      </p>
      <label>
        PASSWORD
        <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      {error && (
        <p className="err" role="alert">
          {error}
        </p>
      )}
      <div className="account-delete-actions">
        <button type="submit" className="btn danger" disabled={busy}>
          {busy ? 'Deleting…' : 'Delete my account'}
        </button>
        <button type="button" className="btn ghost-dark" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}

DeleteAccount.propTypes = { onDeleted: PropTypes.func.isRequired };
