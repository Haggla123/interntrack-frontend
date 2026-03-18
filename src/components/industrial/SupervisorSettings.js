// src/components/industrial/SupervisorSettings.js
import React from 'react';
import { ShieldCheck, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Loader } from 'lucide-react';
import { usePasswordChange } from '../../hooks/usePasswordChange';

const SupervisorSettings = () => {
  const { fields, set, showPass, setShowPass, saving, status, submit } = usePasswordChange();

  return (
    <div className="bento-container fade-in">
      <div className="bento-item welcome-box">
        <div className="badge-pill">Security & Privacy</div>
        <h3>Account Settings</h3>
        <p>Manage your access credentials for the {new Date().getFullYear()} internship cycle.</p>
      </div>

      <div className="bento-item settings-form-box" style={{ maxWidth:'500px' }}>

        {status.msg && (
          <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 14px', background: status.type === 'success' ? '#f0fdf4' : '#fef2f2', border:`1px solid ${status.type === 'success' ? '#86efac' : '#fca5a5'}`, borderRadius:'8px', color: status.type === 'success' ? '#15803d' : '#dc2626', fontSize:'13px', marginBottom:'16px' }}>
            {status.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            {status.msg}
          </div>
        )}

        <form onSubmit={submit}>
          <div className="form-section">
            <label className="input-label-sm">Current Password</label>
            <input
              type={showPass ? 'text' : 'password'}
              className="corporate-input-sm"
              value={fields.current}
              onChange={(e) => set('current', e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <div className="form-section" style={{ marginTop:'20px' }}>
            <label className="input-label-sm">New Corporate Password</label>
            <input
              type={showPass ? 'text' : 'password'}
              className="corporate-input-sm"
              value={fields.next}
              onChange={(e) => set('next', e.target.value)}
              placeholder="At least 8 characters"
              required
            />
          </div>
          <div className="form-section" style={{ marginTop:'20px' }}>
            <label className="input-label-sm">Confirm Password</label>
            <input
              type={showPass ? 'text' : 'password'}
              className="corporate-input-sm"
              value={fields.confirm}
              onChange={(e) => set('confirm', e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div
            onClick={() => setShowPass(!showPass)}
            style={{ display:'flex', alignItems:'center', gap:'6px', cursor:'pointer', fontSize:'12px', color:'#64748b', marginTop:'10px' }}
          >
            {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
            {showPass ? 'Hide' : 'Show'} passwords
          </div>

          <button
            type="submit"
            className="btn-primary-lite"
            style={{ marginTop:'25px', width:'100%' }}
            disabled={saving}
          >
            {saving
              ? <><Loader size={15} style={{ animation:'spin 1s linear infinite' }} /> Updating…</>
              : <><Lock size={16} /> Update Supervisor Credentials</>}
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </button>
        </form>
      </div>
    </div>
  );
};

export default SupervisorSettings;
