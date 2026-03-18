// src/components/admin/AddAdminModal.js
import React, { useState } from 'react';
import { X, ShieldCheck, Mail, CheckCircle2, AlertCircle, Loader, Eye, EyeOff } from 'lucide-react';
import { register } from '../../api';

const AddAdminModal = ({ isOpen, onClose, onAdminAdded }) => {
  const [form, setForm] = useState({ name: '', staffId: '', email: '', password: '', confirmPassword: '' });
  const [saving, setSaving]         = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg]     = useState('');
  const [showPass, setShowPass]     = useState(false);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setErrorMsg('Passwords do not match.'); return; }
    if (form.password.length < 8) { setErrorMsg('Password must be at least 8 characters.'); return; }
    setSaving(true); setErrorMsg(''); setSuccessMsg('');
    try {
      const res = await register({ name: form.name, staffId: form.staffId, email: form.email, password: form.password, role: 'admin' });
      const created = res.user || res.data || res;
      setSuccessMsg(`${form.name} registered as Admin successfully.`);
      if (onAdminAdded) onAdminAdded(created);
      setForm({ name: '', staffId: '', email: '', password: '', confirmPassword: '' });
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Check for duplicate email or staff ID.');
    } finally { setSaving(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content scale-in" style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <div className="header-title-flex">
            <ShieldCheck className="text-indigo" size={24} />
            <h3>Add New Admin</h3>
          </div>
          <button className="close-x" onClick={onClose}><X /></button>
        </div>

        <form className="modal-body-pushed" onSubmit={handleSubmit}>
          {successMsg && (
            <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 14px', background:'#f0fdf4', border:'1px solid #86efac', borderRadius:'8px', color:'#15803d', fontSize:'13px', marginBottom:'14px' }}>
              <CheckCircle2 size={14} /> {successMsg}
            </div>
          )}
          {errorMsg && (
            <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 14px', background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:'8px', color:'#dc2626', fontSize:'13px', marginBottom:'14px' }}>
              <AlertCircle size={14} /> {errorMsg}
            </div>
          )}

          <div style={{ background:'#fffbeb', border:'1px solid #fcd34d', borderRadius:'8px', padding:'10px 14px', marginBottom:'16px', fontSize:'12px', color:'#92400e' }}>
            ⚠️ Admin accounts have full system access. Only create accounts for authorised personnel.
          </div>

          <div className="form-grid-2" style={{ marginBottom:'14px' }}>
            <div className="input-group">
              <label>Full Name *</label>
              <input type="text" className="modal-input" placeholder="e.g. Dr. Akosua Mensah"
                value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Staff ID *</label>
              <input type="text" className="modal-input" placeholder="e.g. UENR-ADM-001"
                value={form.staffId} onChange={e => set('staffId', e.target.value)} required />
            </div>
          </div>

          <div className="input-group" style={{ marginBottom:'14px' }}>
            <label>Email Address *</label>
            <div style={{ position:'relative' }}>
              <Mail size={15} style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} />
              <input type="email" className="modal-input" placeholder="admin@uenr.edu.gh"
                style={{ paddingLeft:'32px' }}
                value={form.email} onChange={e => set('email', e.target.value)} required />
            </div>
          </div>

          <div className="form-grid-2" style={{ marginBottom:'20px' }}>
            <div className="input-group">
              <label>Password *</label>
              <div style={{ position:'relative' }}>
                <input type={showPass ? 'text' : 'password'} className="modal-input"
                  placeholder="Min. 8 characters" style={{ paddingRight:'36px' }}
                  value={form.password} onChange={e => set('password', e.target.value)} required />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  style={{ position:'absolute', right:'8px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:0 }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div className="input-group">
              <label>Confirm Password *</label>
              <input type={showPass ? 'text' : 'password'} className="modal-input" placeholder="Repeat password"
                value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} required />
            </div>
          </div>

          <div className="modal-footer-btns">
            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-verify-confirm" disabled={saving}>
              {saving
                ? <><Loader size={15} style={{ animation:'spin 1s linear infinite' }} /> Creating…</>
                : <><ShieldCheck size={15} /> Create Admin Account</>}
            </button>
          </div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </form>
      </div>
    </div>
  );
};

export default AddAdminModal;
