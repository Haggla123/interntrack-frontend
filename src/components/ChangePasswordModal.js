// src/components/ChangePasswordModal.js
// Place at: src/components/ChangePasswordModal.js

import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { changePassword } from '../api';
import { useAuth } from '../context/AuthContext';

const ChangePasswordModal = ({ isOpen, onDone }) => {
  const { updateUser }  = useAuth();
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handle = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const toggleShow = (f) => setShow(prev => ({ ...prev, [f]: !prev[f] }));

  const rules = [
    { label: 'At least 8 characters',  pass: form.next.length >= 8 },
    { label: 'Contains a number',      pass: /\d/.test(form.next) },
    { label: 'Passwords match',        pass: form.next.length > 0 && form.next === form.confirm },
  ];
  const allPass = rules.every(r => r.pass);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allPass) return;
    setLoading(true);
    setErrorMsg('');
    try {
      await changePassword({ currentPassword: form.current, newPassword: form.next });
      updateUser({ needsPasswordChange: false });
      setSuccess(true);
      setTimeout(() => onDone(), 1800);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to change password. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '420px',
        padding: '32px 28px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        fontFamily: 'Inter, sans-serif',
      }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '52px', height: '52px', background: '#eff6ff', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
          }}>
            <ShieldCheck size={26} style={{ color: '#3b82f6' }} />
          </div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>
            Set Your Password
          </h3>
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#64748b' }}>
            You're using a temporary password. Please set a permanent one to continue.
          </p>
        </div>

        {/* Success */}
        {success ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle2 size={48} style={{ color: '#10b981', marginBottom: '12px' }} />
            <p style={{ fontWeight: 600, color: '#065f46', fontSize: '15px' }}>
              Password updated! Redirecting…
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>

            {errorMsg && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '12px 14px', marginBottom: '16px',
                background: '#fef2f2', border: '1px solid #fca5a5',
                borderRadius: '8px', color: '#dc2626', fontSize: '13px',
              }}>
                <AlertCircle size={15} /> {errorMsg}
              </div>
            )}

            {[
              { name: 'current', label: 'Temporary Password' },
              { name: 'next',    label: 'New Password' },
              { name: 'confirm', label: 'Confirm New Password' },
            ].map(({ name, label }) => (
              <div key={name} style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '5px' }}>
                  {label}
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type={show[name] ? 'text' : 'password'}
                    name={name}
                    value={form[name]}
                    onChange={handle}
                    required
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '10px 36px 10px 32px', fontSize: '14px',
                      border: '1px solid #e2e8f0', borderRadius: '8px',
                      outline: 'none', color: '#1e293b',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => toggleShow(name)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}
                  >
                    {show[name] ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            ))}

            {/* Live rules checklist */}
            {form.next && (
              <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px' }}>
                {rules.map((r, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    fontSize: '12px', color: r.pass ? '#15803d' : '#94a3b8',
                    marginBottom: i < rules.length - 1 ? '5px' : 0,
                  }}>
                    <CheckCircle2 size={13} style={{ flexShrink: 0, color: r.pass ? '#10b981' : '#cbd5e1' }} />
                    {r.label}
                  </div>
                ))}
              </div>
            )}

            <button
              type="submit"
              disabled={!allPass || loading}
              style={{
                width: '100%', padding: '12px', border: 'none', borderRadius: '10px',
                fontWeight: 700, fontSize: '14px', cursor: allPass ? 'pointer' : 'not-allowed',
                background: allPass ? '#3b82f6' : '#e2e8f0',
                color: allPass ? '#fff' : '#94a3b8',
                transition: 'background 0.2s',
              }}
            >
              {loading ? 'Saving…' : 'Set New Password & Continue'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ChangePasswordModal;
