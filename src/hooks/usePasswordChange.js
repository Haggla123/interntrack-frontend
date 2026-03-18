// src/hooks/usePasswordChange.js
// Shared logic for password change forms across all roles
import { useState } from 'react';
import { changePassword } from '../api';

export const usePasswordChange = () => {
  const [fields, setFields]     = useState({ current: '', next: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [status, setStatus]     = useState({ type: '', msg: '' }); // type: 'success'|'error'

  const set = (key, val) => setFields(prev => ({ ...prev, [key]: val }));

  const submit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', msg: '' });

    if (fields.next.length < 8) {
      setStatus({ type: 'error', msg: 'New password must be at least 8 characters.' });
      return;
    }
    if (fields.next !== fields.confirm) {
      setStatus({ type: 'error', msg: 'New passwords do not match.' });
      return;
    }

    setSaving(true);
    try {
      await changePassword({ currentPassword: fields.current, newPassword: fields.next });
      setStatus({ type: 'success', msg: 'Password updated successfully.' });
      setFields({ current: '', next: '', confirm: '' });
    } catch (err) {
      setStatus({ type: 'error', msg: err.message || 'Failed to update password. Please check your current password.' });
    } finally {
      setSaving(false);
    }
  };

  return { fields, set, showPass, setShowPass, saving, status, submit };
};
