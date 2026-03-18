// src/components/student/StudentSettings.js
import React from 'react';
import { ShieldCheck, Eye, EyeOff, AlertCircle, CheckCircle2, Loader } from 'lucide-react';
import { usePasswordChange } from '../../hooks/usePasswordChange';

const StudentSettings = () => {
  const { fields, set, showPass, setShowPass, saving, status, submit } = usePasswordChange();

  return (
    <div className="content-card fade-in">
      <h3>Security Settings</h3>
      <p style={{ color:'#64748b', fontSize:'14px', marginBottom:'20px' }}>
        Change your account password below. Minimum 8 characters required.
      </p>

      {status.msg && (
        <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 14px', background: status.type === 'success' ? '#f0fdf4' : '#fef2f2', border:`1px solid ${status.type === 'success' ? '#86efac' : '#fca5a5'}`, borderRadius:'8px', color: status.type === 'success' ? '#15803d' : '#dc2626', fontSize:'13px', marginBottom:'14px' }}>
          {status.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          {status.msg}
        </div>
      )}

      <form className="settings-form" onSubmit={submit}>
        <div className="form-section">
          <label>Current Password</label>
          <input
            type={showPass ? 'text' : 'password'}
            className="admin-input"
            value={fields.current}
            onChange={(e) => set('current', e.target.value)}
            placeholder="Enter current password"
            required
          />
        </div>
        <div className="form-section" style={{ marginTop:'15px' }}>
          <label>New Password</label>
          <input
            type={showPass ? 'text' : 'password'}
            className="admin-input"
            value={fields.next}
            onChange={(e) => set('next', e.target.value)}
            placeholder="At least 8 characters"
            required
          />
        </div>
        <div className="form-section" style={{ marginTop:'15px' }}>
          <label>Confirm New Password</label>
          <input
            type={showPass ? 'text' : 'password'}
            className="admin-input"
            value={fields.confirm}
            onChange={(e) => set('confirm', e.target.value)}
            placeholder="Type password again"
            required
          />
        </div>

        <div
          onClick={() => setShowPass(!showPass)}
          style={{ display:'flex', alignItems:'center', gap:'6px', cursor:'pointer', fontSize:'13px', color:'#64748b', marginTop:'10px' }}
        >
          {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
          {showPass ? 'Hide' : 'Show'} passwords
        </div>

        <button
          type="submit"
          className="primary-btn"
          style={{ marginTop:'20px' }}
          disabled={saving}
        >
          {saving
            ? <><Loader size={16} style={{ animation:'spin 1s linear infinite' }} /> Updating…</>
            : <><ShieldCheck size={18} /> Update Password</>}
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </button>
      </form>
    </div>
  );
};

export default StudentSettings;
