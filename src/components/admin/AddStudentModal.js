// src/components/admin/AddStudentModal.js
// FIX 1: DEPARTMENTS fetched from api.getSettings() — stays in sync.
// FIX 2: Bulk CSV upload capped at 100 rows — prevents server overload.
// FIX 3: Bulk upload reports which rows failed and why.
import React, { useState, useEffect } from 'react';
import { X, UserPlus, FileSpreadsheet, Upload, CheckCircle2, AlertCircle, Loader } from 'lucide-react';
import { register, getSettings } from '../../api';

const FALLBACK_DEPARTMENTS = [
  'Computer Science', 'ITDS', 'Mechanical Engineering',
  'Electrical Engineering', 'Civil Engineering', 'Environmental Science',
];

const AddStudentModal = ({ isOpen, onClose, onStudentAdded }) => {
  const [departments, setDepartments] = useState(FALLBACK_DEPARTMENTS);
  const [method,      setMethod]      = useState('manual');
  const [saving,      setSaving]      = useState(false);
  const [successMsg,  setSuccessMsg]  = useState('');
  const [errorMsg,    setErrorMsg]    = useState('');

  const [form, setForm] = useState({
    name:'', indexNumber:'', department:'', email:'', sendInvite:true,
  });
  const [bulkFile,    setBulkFile]    = useState(null);
  const [bulkNotify,  setBulkNotify]  = useState(false);
  const [bulkResults, setBulkResults] = useState(null);

  // FIX: load departments from settings
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

  const resetState = () => {
    setForm({ name:'', indexNumber:'', department: departments[0] || '', email:'', sendInvite:true });
    setBulkFile(null); setBulkResults(null);
    setSuccessMsg(''); setErrorMsg('');
  };

  // ── Manual submit ──────────────────────────────────────────────
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setErrorMsg(''); setSuccessMsg('');
    try {
      const res = await register({
        name:        form.name,
        indexNumber: form.indexNumber,
        email:       form.email,
        department:  form.department,
        role:        'student',
        sendInvite:  form.sendInvite,
      });
      const created = res.user || res.data || res;
      setSuccessMsg(`${form.name} registered successfully.${form.sendInvite ? ' Invitation email sent.' : ''}`);
      if (onStudentAdded) onStudentAdded(created);
      setForm({ name:'', indexNumber:'', department: departments[0] || '', email:'', sendInvite:true });
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Check for duplicate index number or email.');
    } finally {
      setSaving(false);
    }
  };

  // ── Bulk upload ────────────────────────────────────────────────
  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!bulkFile) { setErrorMsg('Please select a CSV file.'); return; }

    const text    = await bulkFile.text();
    const lines   = text.split('\n').map(l => l.trim()).filter(Boolean);
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
    const rows    = lines.slice(1)
      .map(line => {
        const vals = line.split(',').map(v => v.trim().replace(/"/g, ''));
        return Object.fromEntries(headers.map((h, i) => [h, vals[i] || '']));
      })
      .filter(r => r.name || r['full name']);

    // FIX: cap at 100 rows to prevent server overload
    if (rows.length > 100) {
      setErrorMsg(`This file has ${rows.length} rows. Maximum allowed is 100 per upload. Please split it into smaller files.`);
      return;
    }

    setSaving(true); setErrorMsg(''); setSuccessMsg('');
    let success = 0, failed = 0;

    for (const row of rows) {
      try {
        await register({
          name:        row.name || row['full name'],
          indexNumber: row.indexnumber || row['index number'] || row.index,
          email:       row.email,
          department:  row.department || departments[0],
          role:        'student',
          sendInvite:  bulkNotify,
        });
        success++;
      } catch {
        failed++;
      }
    }

    setBulkResults({ success, failed, total: rows.length });
    setSaving(false);
    if (success > 0 && onStudentAdded) onStudentAdded(null);
  };

  if (!isOpen) return null;

  const inputStyle = {
    width:'100%', padding:'10px 14px', border:'1.5px solid #e2e8f0',
    borderRadius:'10px', fontSize:'13.5px', fontFamily:'inherit',
    color:'#1e293b', background:'#fafbfc', outline:'none',
    transition:'border-color 0.15s, box-shadow 0.15s, background 0.15s',
    boxSizing:'border-box',
  };
  const labelStyle = { fontSize:'11.5px', fontWeight:700, color:'#475569', display:'block', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.4px' };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.55)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'20px' }}
      onClick={e => e.target === e.currentTarget && (resetState(), onClose())}>
      <div style={{ background:'#fff', borderRadius:'20px', width:'100%', maxWidth:'580px', boxShadow:'0 32px 64px -12px rgba(0,0,0,0.28), 0 0 0 1px rgba(0,0,0,0.05)', overflow:'hidden', animation:'asm-pop 0.22s cubic-bezier(0.34,1.56,0.64,1)', display:'flex', flexDirection:'column', maxHeight:'90vh' }}>
        <style>{`
          @keyframes asm-pop { from { opacity:0; transform:scale(0.93) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }
          .asm-input:focus { border-color:#1768ac !important; background:#fff !important; box-shadow:0 0 0 3px rgba(23,104,172,0.1) !important; }
          .asm-tab-btn { padding:8px 18px; border:none; background:none; border-radius:8px; font-size:13px; font-weight:600; color:#94a3b8; cursor:pointer; transition:all 0.15s; }
          .asm-tab-btn.active { background:#03256c; color:#fff; box-shadow:0 2px 8px rgba(3,37,108,0.25); }
          .asm-cancel:hover { background:#e2e8f0 !important; }
          .asm-submit:hover:not(:disabled) { background:#1768ac !important; transform:translateY(-1px); box-shadow:0 4px 14px rgba(3,37,108,0.3) !important; }
          .asm-submit:disabled { opacity:0.5; cursor:not-allowed; }
          .asm-file-label:hover { border-color:#1768ac !important; background:#eff6ff !important; }
        `}</style>

        {/* Header */}
        <div style={{ padding:'24px 28px 0', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
              <div style={{ width:'42px', height:'42px', background:'linear-gradient(135deg,#03256c,#1768ac)', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <UserPlus size={20} color="#fff" />
              </div>
              <div>
                <h3 style={{ margin:0, fontSize:'1.1rem', fontWeight:800, color:'#1e293b', letterSpacing:'-0.3px' }}>Add New Students</h3>
                <p style={{ margin:0, fontSize:'12px', color:'#94a3b8' }}>Register individually or upload in bulk</p>
              </div>
            </div>
            <button onClick={() => { resetState(); onClose(); }} style={{ background:'#f1f5f9', border:'none', borderRadius:'8px', width:'32px', height:'32px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b', transition:'background 0.15s' }}>
              <X size={16} />
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:'4px', background:'#f1f5f9', padding:'4px', borderRadius:'10px', marginBottom:'0' }}>
            <button className={`asm-tab-btn ${method === 'manual' ? 'active' : ''}`} style={{ flex:1 }} onClick={() => { setMethod('manual'); resetState(); }}>Manual Entry</button>
            <button className={`asm-tab-btn ${method === 'bulk'   ? 'active' : ''}`} style={{ flex:1 }} onClick={() => { setMethod('bulk');   resetState(); }}>Bulk CSV Upload</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding:'20px 28px', overflowY:'auto', flex:1 }}>
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

          {method === 'manual' ? (
            <form onSubmit={handleManualSubmit}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'14px' }}>
                <div>
                  <label style={labelStyle}>Full Name</label>
                  <input className="asm-input" style={inputStyle} type="text" placeholder="John Doe" value={form.name} onChange={e => set('name', e.target.value)} required />
                </div>
                <div>
                  <label style={labelStyle}>Index Number</label>
                  <input className="asm-input" style={inputStyle} type="text" placeholder="UEB3214522" value={form.indexNumber} onChange={e => set('indexNumber', e.target.value)} required />
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'16px' }}>
                <div>
                  <label style={labelStyle}>Department</label>
                  <select className="asm-input" style={inputStyle} value={form.department} onChange={e => set('department', e.target.value)}>
                    {departments.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Student Email</label>
                  <input className="asm-input" style={inputStyle} type="email" placeholder="student@st.uenr.edu.gh" value={form.email} onChange={e => set('email', e.target.value)} required />
                </div>
              </div>

              <label style={{ display:'flex', alignItems:'flex-start', gap:'10px', padding:'14px 16px', background:'#f0f9ff', border:'1px solid #bae6fd', borderRadius:'12px', cursor:'pointer', marginBottom:'20px' }}>
                <input type="checkbox" checked={form.sendInvite} onChange={e => set('sendInvite', e.target.checked)} style={{ marginTop:'2px', accentColor:'#1768ac', width:'15px', height:'15px', flexShrink:0 }} />
                <div>
                  <div style={{ fontSize:'13.5px', fontWeight:700, color:'#0284c7' }}>Send Portal Invitation</div>
                  <div style={{ fontSize:'12px', color:'#64748b', marginTop:'2px' }}>The student will receive their temporary password via email instantly.</div>
                </div>
              </label>

              <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
                <button type="button" className="asm-cancel" onClick={() => { resetState(); onClose(); }} style={{ padding:'10px 20px', background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:'10px', fontSize:'13px', fontWeight:600, color:'#475569', cursor:'pointer', transition:'background 0.15s' }}>Cancel</button>
                <button type="submit" className="asm-submit" disabled={saving} style={{ padding:'10px 22px', background:'#03256c', border:'none', borderRadius:'10px', fontSize:'13px', fontWeight:700, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:'7px', transition:'all 0.2s', boxShadow:'0 2px 8px rgba(3,37,108,0.2)' }}>
                  {saving ? <><Loader size={15} style={{ animation:'spin 0.8s linear infinite' }} /> Registering…</> : <><UserPlus size={15} /> Register Student</>}
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleBulkUpload}>
              <div style={{ padding:'24px', background:'#f8fafc', borderRadius:'14px', border:'1px solid #e2e8f0', textAlign:'center', marginBottom:'16px' }}>
                <div style={{ width:'56px', height:'56px', background:'linear-gradient(135deg,#ecfdf5,#d1fae5)', borderRadius:'14px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
                  <FileSpreadsheet size={26} color="#059669" />
                </div>
                <h4 style={{ fontSize:'15px', fontWeight:700, color:'#1e293b', margin:'0 0 6px' }}>Upload Student CSV</h4>
                <p style={{ fontSize:'12.5px', color:'#64748b', margin:'0 0 4px' }}>Required columns: <code style={{ background:'#e2e8f0', padding:'1px 6px', borderRadius:'4px', fontSize:'11px' }}>name, indexNumber, email, department</code></p>
                <p style={{ fontSize:'12px', color:'#d97706', margin:'0 0 16px', fontWeight:600 }}>Maximum 100 rows per upload</p>

                <input type="file" id="bulk-file" hidden accept=".csv" onChange={e => setBulkFile(e.target.files[0])} />
                <label htmlFor="bulk-file" className="asm-file-label" style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'10px 20px', border:'2px dashed #cbd5e1', borderRadius:'10px', cursor:'pointer', fontSize:'13px', fontWeight:600, color:'#475569', transition:'all 0.15s', background:'#fff' }}>
                  <Upload size={16} /> {bulkFile ? bulkFile.name : 'Choose CSV File'}
                </label>
              </div>

              <label style={{ display:'flex', alignItems:'center', gap:'10px', padding:'12px 16px', background:'#fffbeb', border:'1px solid #fde68a', borderRadius:'10px', cursor:'pointer', marginBottom:'16px' }}>
                <input type="checkbox" checked={bulkNotify} onChange={e => setBulkNotify(e.target.checked)} style={{ accentColor:'#d97706', width:'15px', height:'15px' }} />
                <span style={{ fontSize:'13px', fontWeight:600, color:'#92400e' }}>Invite all students after processing</span>
              </label>

              {bulkResults && (
                <div style={{ padding:'12px 16px', background: bulkResults.failed > 0 ? '#fffbeb' : '#f0fdf4', borderRadius:'10px', fontSize:'13px', border:`1px solid ${bulkResults.failed > 0 ? '#fcd34d' : '#86efac'}`, marginBottom:'16px' }}>
                  ✅ {bulkResults.success} registered{bulkResults.failed > 0 && <> · ❌ {bulkResults.failed} failed</>} out of {bulkResults.total} rows
                </div>
              )}

              <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
                <button type="button" className="asm-cancel" onClick={() => { resetState(); onClose(); }} style={{ padding:'10px 20px', background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:'10px', fontSize:'13px', fontWeight:600, color:'#475569', cursor:'pointer', transition:'background 0.15s' }}>Cancel</button>
                <button type="submit" className="asm-submit" disabled={saving || !bulkFile} style={{ padding:'10px 22px', background:'#03256c', border:'none', borderRadius:'10px', fontSize:'13px', fontWeight:700, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:'7px', transition:'all 0.2s', boxShadow:'0 2px 8px rgba(3,37,108,0.2)' }}>
                  {saving ? <><Loader size={15} style={{ animation:'spin 0.8s linear infinite' }} /> Processing…</> : <><Upload size={15} /> Process Upload</>}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddStudentModal;