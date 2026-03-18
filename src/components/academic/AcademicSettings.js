// src/components/academic/AcademicSettings.js
import React from 'react';
import { ShieldCheck, Lock, Eye, EyeOff, RefreshCcw, Info, AlertCircle, CheckCircle2 } from 'lucide-react';
import { usePasswordChange } from '../../hooks/usePasswordChange';

const AcademicSettings = ({ handleLogout }) => {
  const { fields, set, showPass, setShowPass, saving, status, submit } = usePasswordChange();

  return (
    <div className="bento-container fade-in">
      <div className="bento-item welcome-box academic-banner">
        <div className="badge-pill">Faculty Security</div>
        <h2>Settings & Privacy</h2>
        <p>Manage your university credentials and active supervisor session.</p>
      </div>

      <div className="settings-layout">
        {/* Password form */}
        <div className="bento-item security-card">
          <div className="card-header-flex">
            <h3><ShieldCheck size={20} color="#1e1b4b" /> Update Authentication</h3>
          </div>

          {status.msg && (
            <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 14px', background: status.type === 'success' ? '#f0fdf4' : '#fef2f2', border:`1px solid ${status.type === 'success' ? '#86efac' : '#fca5a5'}`, borderRadius:'8px', color: status.type === 'success' ? '#15803d' : '#dc2626', fontSize:'13px', marginBottom:'14px' }}>
              {status.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              {status.msg}
            </div>
          )}

          <form onSubmit={submit} className="settings-form">
            <div className="form-group">
              <label>Current Faculty Password</label>
              <input
                type={showPass ? 'text' : 'password'}
                className="bento-input"
                placeholder="Enter current password"
                value={fields.current}
                onChange={(e) => set('current', e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>New Password</label>
                <input
                  type={showPass ? 'text' : 'password'}
                  className="bento-input"
                  placeholder="At least 8 characters"
                  value={fields.next}
                  onChange={(e) => set('next', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type={showPass ? 'text' : 'password'}
                  className="bento-input"
                  placeholder="Re-type new password"
                  value={fields.confirm}
                  onChange={(e) => set('confirm', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="settings-actions-row">
              <div className="show-password-toggle" onClick={() => setShowPass(!showPass)} style={{ cursor:'pointer', display:'flex', alignItems:'center', gap:'6px', fontSize:'13px', color:'#64748b' }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                <span>{showPass ? 'Hide' : 'Show'} Passwords</span>
              </div>
            </div>

            <button type="submit" className="univ-btn save-btn" disabled={saving}>
              {saving ? <RefreshCcw size={18} className="spin" /> : <Lock size={18} />}
              {saving ? 'Updating…' : 'Update Faculty Credentials'}
            </button>
          </form>

          {/* Logout */}
          <div style={{ marginTop:'24px', paddingTop:'16px', borderTop:'1px solid #f1f5f9' }}>
            <button onClick={handleLogout} style={{ display:'flex', alignItems:'center', gap:'6px', color:'#dc2626', background:'none', border:'none', cursor:'pointer', fontSize:'13px', fontWeight:600 }}>
              Sign Out of Faculty Portal
            </button>
          </div>
        </div>

        {/* Security notice */}
        <div className="bento-item info-card notice-card">
          <div className="card-header-flex">
            <h3><Info size={18} color="#1768ac" /> Faculty Guidelines</h3>
          </div>
          <p>Keeping your supervisor account secure protects student data integrity.</p>
          <ul className="guideline-list">
            <li>Passwords are encrypted via <strong>bcrypt</strong> before storage.</li>
            <li>Changing your password will invalidate all other active sessions.</li>
            <li>Use a mix of uppercase letters, numbers, and symbols.</li>
            <li>Minimum 8 characters required.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AcademicSettings;
