// src/components/admin/AddLecturerModal.js
// FIX: DEPARTMENTS now fetched from api.getSettings() so admin changes
// in the Settings tab are reflected here automatically.
import React, { useState, useEffect } from 'react';
import { X, UserCheck, Mail, CheckCircle2, AlertCircle, Loader } from 'lucide-react';
import { register, getSettings } from '../../api';

const FALLBACK_DEPARTMENTS = [
  'Computer Science', 'ITDS', 'Mathematical Sciences',
  'Physics', 'Electrical Engineering', 'Civil Engineering',
];

const AddLecturerModal = ({ isOpen, onClose, onLecturerAdded }) => {
  const [departments, setDepartments] = useState(FALLBACK_DEPARTMENTS);
  const [form, setForm]   = useState({ name:'', staffId:'', department:'', email:'', sendInvite:true });
  const [saving, setSaving]         = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg,   setErrorMsg]   = useState('');

  // FIX: load departments from settings so they stay in sync with admin config
  useEffect(() => {
    if (!isOpen) return;
    getSettings()
      .then(res => {
        const data  = res?.data || res || {};
        const depts = data.departments;
        if (Array.isArray(depts) && depts.length > 0) {
          setDepartments(depts);
          setForm(prev => ({ ...prev, department: prev.department || depts[0] }));
        } else {
          setForm(prev => ({ ...prev, department: prev.department || FALLBACK_DEPARTMENTS[0] }));
        }
      })
      .catch(() => {
        setForm(prev => ({ ...prev, department: prev.department || FALLBACK_DEPARTMENTS[0] }));
      });
  }, [isOpen]);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setErrorMsg(''); setSuccessMsg('');
    try {
      const res = await register({
        name:       form.name,
        staffId:    form.staffId,
        email:      form.email,
        department: form.department,
        role:       'academic',
        sendInvite: form.sendInvite,
      });
      const created = res.user || res.data || res;
      setSuccessMsg(`${form.name} registered successfully.${form.sendInvite ? ' Login credentials sent.' : ''}`);
      if (onLecturerAdded) onLecturerAdded(created);
      setForm({ name:'', staffId:'', department: departments[0] || '', email:'', sendInvite:true });
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Check for duplicate staff ID or email.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const inputStyle = { width:'100%', padding:'10px 14px', border:'1.5px solid #e2e8f0', borderRadius:'10px', fontSize:'13.5px', fontFamily:'inherit', color:'#1e293b', background:'#fafbfc', outline:'none', transition:'border-color 0.15s, box-shadow 0.15s, background 0.15s', boxSizing:'border-box' };
  const labelStyle = { fontSize:'11.5px', fontWeight:700, color:'#475569', display:'block', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.4px' };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.55)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'20px' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'#fff', borderRadius:'20px', width:'100%', maxWidth:'540px', boxShadow:'0 32px 64px -12px rgba(0,0,0,0.28), 0 0 0 1px rgba(0,0,0,0.05)', overflow:'hidden', animation:'alm-pop 0.22s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <style>{`
          @keyframes alm-pop { from { opacity:0; transform:scale(0.93) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }
          .alm-input:focus { border-color:#4f46e5 !important; background:#fff !important; box-shadow:0 0 0 3px rgba(79,70,229,0.1) !important; }
          .alm-cancel:hover { background:#e2e8f0 !important; }
          .alm-submit:hover:not(:disabled) { background:#4338ca !important; transform:translateY(-1px); box-shadow:0 4px 14px rgba(79,70,229,0.3) !important; }
          .alm-submit:disabled { opacity:0.5; cursor:not-allowed; }
        `}</style>

        {/* Header */}
        <div style={{ background:'linear-gradient(135deg, #312e81, #4f46e5)', padding:'24px 28px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
              <div style={{ width:'44px', height:'44px', background:'rgba(255,255,255,0.18)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <UserCheck size={22} color="#fff" />
              </div>
              <div>
                <h3 style={{ margin:0, fontSize:'1.1rem', fontWeight:800, color:'#fff', letterSpacing:'-0.3px' }}>Register New Supervisor</h3>
                <p style={{ margin:0, fontSize:'12px', color:'rgba(255,255,255,0.65)' }}>Academic faculty portal access</p>
              </div>
            </div>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'8px', width:'32px', height:'32px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#fff' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding:'24px 28px' }}>
          {successMsg && (
            <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 14px', background:'#f0fdf4', border:'1px solid #86efac', borderRadius:'10px', color:'#15803d', fontSize:'13px', marginBottom:'16px' }}>
              <CheckCircle2 size={14} /> {successMsg}
            </div>
          )}
          {errorMsg && (
            <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 14px', background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:'10px', color:'#dc2626', fontSize:'13px', marginBottom:'16px' }}>
              <AlertCircle size={14} /> {errorMsg}
            </div>
          )}

          <div style={{ marginBottom:'14px' }}>
            <label style={labelStyle}>Full Name & Title</label>
            <input className="alm-input" style={inputStyle} type="text" placeholder="e.g. Dr. S.O Frimpong" value={form.name} onChange={e => set('name', e.target.value)} required />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'14px' }}>
            <div>
              <label style={labelStyle}>Staff ID</label>
              <input className="alm-input" style={inputStyle} type="text" placeholder="UENR-LEC-000" value={form.staffId} onChange={e => set('staffId', e.target.value)} required />
            </div>
            <div>
              <label style={labelStyle}>Department</label>
              <select className="alm-input" style={inputStyle} value={form.department} onChange={e => set('department', e.target.value)}>
                {departments.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom:'16px' }}>
            <label style={labelStyle}>Official Email</label>
            <div style={{ position:'relative' }}>
              <Mail size={15} style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} />
              <input className="alm-input" style={{ ...inputStyle, paddingLeft:'36px' }} type="email" placeholder="lecturer@uenr.edu.gh" value={form.email} onChange={e => set('email', e.target.value)} required />
            </div>
          </div>

          <label style={{ display:'flex', alignItems:'flex-start', gap:'10px', padding:'14px 16px', background:'#eef2ff', border:'1px solid #c7d2fe', borderRadius:'12px', cursor:'pointer', marginBottom:'20px' }}>
            <input type="checkbox" id="sendLecturerCreds" checked={form.sendInvite} onChange={e => set('sendInvite', e.target.checked)} style={{ marginTop:'2px', accentColor:'#4f46e5', width:'15px', height:'15px', flexShrink:0 }} />
            <div>
              <div style={{ fontSize:'13.5px', fontWeight:700, color:'#4338ca' }}>Enable Portal Access</div>
              <div style={{ fontSize:'12px', color:'#64748b', marginTop:'2px' }}>Auto-generates a temporary password and sends login instructions to the email above.</div>
            </div>
          </label>

          <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
            <button type="button" className="alm-cancel" onClick={onClose} style={{ padding:'10px 20px', background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:'10px', fontSize:'13px', fontWeight:600, color:'#475569', cursor:'pointer', transition:'background 0.15s' }}>Discard</button>
            <button type="submit" className="alm-submit" disabled={saving} style={{ padding:'10px 22px', background:'#4f46e5', border:'none', borderRadius:'10px', fontSize:'13px', fontWeight:700, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:'7px', transition:'all 0.2s', boxShadow:'0 2px 8px rgba(79,70,229,0.25)' }}>
              {saving ? <><Loader size={15} style={{ animation:'spin 0.8s linear infinite' }} /> Registering…</> : <><UserCheck size={15} /> Confirm & Register</>}
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLecturerModal;