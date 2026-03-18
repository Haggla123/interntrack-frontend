// src/pages/ChangePassword.js
// FIX: Role redirect after password change read only localStorage.
// For sessionStorage sessions the role was always '' → redirected to /student
// regardless of actual role. Now reads both storages.
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff, AlertCircle, CheckCircle2, Loader, Lock } from 'lucide-react';
import { changePassword } from '../api';
import { useAuth } from '../context/AuthContext';

const RULES = [
  { test: (p) => p.length >= 8,           label: 'At least 8 characters' },
  { test: (p) => /[A-Z]/.test(p),         label: 'One uppercase letter' },
  { test: (p) => /[0-9]/.test(p),         label: 'One number' },
  { test: (p) => /[^A-Za-z0-9]/.test(p),  label: 'One special character' },
];

const ChangePassword = () => {
  const navigate  = useNavigate();
  const { updateUser } = useAuth();

  const [form, setForm]       = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });
  const [showPass, setShow]   = useState(false);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);

  const passedRules = RULES.filter(r => r.test(form.newPassword));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (passedRules.length < RULES.length) {
      setError('Please meet all password requirements before continuing.');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      await changePassword({
        currentPassword: form.currentPassword,
        newPassword:     form.newPassword,
      });

      // Clear the forced-change flag via AuthContext (writes to correct storage)
      if (updateUser) updateUser({ needsPasswordChange: false });

      setSuccess(true);

      // FIX: read role from whichever storage has the session
      const role = (() => {
        try {
          const raw = localStorage.getItem('user') || sessionStorage.getItem('user');
          return JSON.parse(raw)?.role || '';
        } catch { return ''; }
      })();

      setTimeout(() => {
        if (role === 'admin')        navigate('/admin');
        else if (role === 'academic')    navigate('/academic');
        else if (role === 'industrial')  navigate('/industrial');
        else                             navigate('/student');
      }, 1800);

    } catch (err) {
      setError(err.message || 'Failed to update password. Check your current password and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#f8fafc', padding:'20px' }}>
      <div style={{ background:'white', borderRadius:'16px', boxShadow:'0 4px 24px rgba(0,0,0,0.08)', padding:'40px', width:'100%', maxWidth:'420px' }}>

        <div style={{ textAlign:'center', marginBottom:'28px' }}>
          <div style={{ width:'56px', height:'56px', background:'#eff6ff', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
            <Lock size={26} color="#2563eb" />
          </div>
          <h2 style={{ fontSize:'22px', fontWeight:700, color:'#1e293b', margin:0 }}>Set New Password</h2>
          <p style={{ fontSize:'13px', color:'#64748b', marginTop:'6px' }}>
            For security, please change your temporary password before continuing.
          </p>
        </div>

        {success ? (
          <div style={{ textAlign:'center', padding:'20px 0' }}>
            <CheckCircle2 size={48} color="#10b981" style={{ marginBottom:'12px' }} />
            <p style={{ fontWeight:600, color:'#15803d' }}>Password updated! Redirecting…</p>
          </div>
        ) : (
          <>
            {error && (
              <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 14px', background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:'8px', color:'#dc2626', fontSize:'13px', marginBottom:'16px' }}>
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
              <div>
                <label style={{ fontSize:'12px', fontWeight:600, color:'#475569', display:'block', marginBottom:'5px' }}>
                  Temporary / Current Password
                </label>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter current password"
                  required
                  value={form.currentPassword}
                  onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                  style={{ width:'100%', padding:'10px 12px', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'14px', boxSizing:'border-box', outline:'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize:'12px', fontWeight:600, color:'#475569', display:'block', marginBottom:'5px' }}>
                  New Password
                </label>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  required
                  value={form.newPassword}
                  onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                  style={{ width:'100%', padding:'10px 12px', border:`1px solid ${form.newPassword && passedRules.length === RULES.length ? '#86efac' : '#e2e8f0'}`, borderRadius:'8px', fontSize:'14px', boxSizing:'border-box', outline:'none' }}
                />
                {form.newPassword && (
                  <div style={{ marginTop:'8px', display:'flex', flexDirection:'column', gap:'3px' }}>
                    {RULES.map((r, i) => {
                      const pass = r.test(form.newPassword);
                      return (
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', color: pass ? '#15803d' : '#94a3b8' }}>
                          <div style={{ width:'6px', height:'6px', borderRadius:'50%', background: pass ? '#10b981' : '#cbd5e1', flexShrink:0 }} />
                          {r.label}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize:'12px', fontWeight:600, color:'#475569', display:'block', marginBottom:'5px' }}>
                  Confirm New Password
                </label>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Re-type new password"
                  required
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  style={{ width:'100%', padding:'10px 12px', border:`1px solid ${form.confirmPassword && form.confirmPassword === form.newPassword ? '#86efac' : '#e2e8f0'}`, borderRadius:'8px', fontSize:'14px', boxSizing:'border-box', outline:'none' }}
                />
              </div>

              <div
                onClick={() => setShow(!showPass)}
                style={{ display:'flex', alignItems:'center', gap:'6px', cursor:'pointer', fontSize:'12px', color:'#64748b' }}
              >
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                {showPass ? 'Hide' : 'Show'} passwords
              </div>

              <button
                type="submit"
                disabled={saving}
                style={{ width:'100%', padding:'12px', background: saving ? '#93c5fd' : '#2563eb', color:'white', border:'none', borderRadius:'10px', fontSize:'15px', fontWeight:600, cursor: saving ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}
              >
                {saving
                  ? <><Loader size={18} style={{ animation:'spin 1s linear infinite' }} /> Securing…</>
                  : <><ShieldCheck size={18} /> Secure My Account</>}
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ChangePassword;