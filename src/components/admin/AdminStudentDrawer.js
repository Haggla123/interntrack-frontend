// src/components/admin/AdminStudentDrawer.js
import React, { useState } from 'react';
import { X, User, ShieldAlert, Key, Trash2, ExternalLink, CheckCircle2, AlertCircle, Loader, BookOpen, Tag, Edit3, Save } from 'lucide-react';
import { resetStudentPassword, revokePlacement, deleteStudent, getStudentLogs, updateStudent } from '../../api';

const AdminStudentDrawer = ({ student, onClose, onStudentUpdated, onStudentDeleted }) => {
  const [tab, setTab]               = useState('actions');
  const [logs, setLogs]             = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [acting, setActing]         = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg]     = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Edit form state - pre-populated from student prop
  const [editForm, setEditForm] = useState({
    name:        student?.name || '',
    email:       student?.email || '',
    indexNumber: student?.indexNumber || student?.index || '',
    department:  student?.department || student?.dept || '',
  });
  const [editSaving, setEditSaving] = useState(false);

  const studentId = student?._id || student?.id;

  const flash = (type, msg) => {
    if (type === 'success') { setSuccessMsg(msg); setErrorMsg(''); }
    else                    { setErrorMsg(msg);   setSuccessMsg(''); }
    setTimeout(() => { setSuccessMsg(''); setErrorMsg(''); }, 5000);
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await getStudentLogs(studentId);
      setLogs(Array.isArray(res) ? res : Array.isArray(res.data) ? res.data : []);
    } catch { setLogs([]); }
    finally  { setLoadingLogs(false); }
  };

  const handleViewLogs = () => { setTab('logs'); if (!logs.length) fetchLogs(); };

  const handleResetPassword = async () => {
    setActing('reset');
    try {
      const res = await resetStudentPassword(studentId);
      const tempPass = res?.tempPassword || res?.data?.tempPassword;
      flash('success', tempPass ? `Password reset. Temp: ${tempPass}` : 'Password reset. Credentials sent to student.');
      if (onStudentUpdated) onStudentUpdated(studentId, { needsPasswordChange: true });
    } catch (err) { flash('error', err.message || 'Failed to reset password.'); }
    finally { setActing(''); }
  };

  const handleRevoke = async () => {
    setActing('revoke');
    try {
      await revokePlacement(studentId);
      flash('success', `Placement revoked for ${student.name}.`);
      if (onStudentUpdated) onStudentUpdated(studentId, { placementStatus: 'Unplaced', companyName: '', companyId: null });
    } catch (err) { flash('error', err.message || 'Failed to revoke placement.'); }
    finally { setActing(''); }
  };

  const handleDelete = async () => {
    setActing('delete');
    try {
      await deleteStudent(studentId);
      if (onStudentDeleted) onStudentDeleted(studentId);
      onClose();
    } catch (err) {
      flash('error', err.message || 'Failed to delete student record.');
      setActing(''); setConfirmDelete(false);
    }
  };

  const handleEditSave = async () => {
    setEditSaving(true);
    try {
      const res = await updateStudent(studentId, editForm);
      const updated = res?.data || res;
      flash('success', 'Student details updated.');
      if (onStudentUpdated) onStudentUpdated(studentId, updated);
    } catch (err) { flash('error', err.message || 'Failed to update student.'); }
    finally { setEditSaving(false); }
  };

  const statusColor = s => {
    if (s === 'Approved') return { color:'#15803d', background:'#f0fdf4', border:'1px solid #86efac' };
    if (s === 'Rejected') return { color:'#dc2626', background:'#fef2f2', border:'1px solid #fca5a5' };
    return { color:'#b45309', background:'#fffbeb', border:'1px solid #fcd34d' };
  };

  const isPlaced = student?.placementStatus === 'Active' || student?.status === 'Placed';

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="info-drawer open admin-theme">
        <button className="close-btn" onClick={onClose}><X size={24} /></button>

        <div className="drawer-header-admin">
          <div className="drawer-avatar-lg">{(student.name || 'S').charAt(0)}</div>
          <h3>{student.name}</h3>
          <p>{student.indexNumber || student.index} · {student.department || student.dept}</p>
          <span className={`badge-pill-${isPlaced ? 'green' : 'amber'}`} style={{ marginTop:'6px', display:'inline-block' }}>
            {student.placementStatus || student.status || 'Pending'}
          </span>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:'1px solid #f1f5f9', margin:'0 0 12px' }}>
          {[['actions','Actions'],['edit','Edit'],['logs','Logbook']].map(([key, label]) => (
            <button key={key}
              onClick={() => key === 'logs' ? handleViewLogs() : setTab(key)}
              style={{ flex:1, padding:'10px', background:'none', border:'none', cursor:'pointer',
                fontWeight: tab===key ? 700 : 400, color: tab===key ? '#3b82f6' : '#64748b',
                borderBottom: tab===key ? '2px solid #3b82f6' : '2px solid transparent',
                fontSize:'13px', transition:'all 0.2s' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Feedback */}
        {successMsg && (
          <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 14px', background:'#f0fdf4', border:'1px solid #86efac', borderRadius:'8px', color:'#15803d', fontSize:'13px', margin:'0 16px 10px' }}>
            <CheckCircle2 size={14} /> {successMsg}
          </div>
        )}
        {errorMsg && (
          <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 14px', background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:'8px', color:'#dc2626', fontSize:'13px', margin:'0 16px 10px' }}>
            <AlertCircle size={14} /> {errorMsg}
          </div>
        )}

        <div className="drawer-content">

          {/* ── ACTIONS TAB ── */}
          {tab === 'actions' && (
            <>
              <div className="admin-action-grid">
                <button className="action-tile" onClick={handleResetPassword} disabled={acting==='reset'}>
                  {acting==='reset' ? <Loader size={20} style={{ animation:'spin 1s linear infinite' }} /> : <Key size={20} />}
                  <span>Reset Password</span>
                </button>
                <button className="action-tile" onClick={handleViewLogs}>
                  <ExternalLink size={20} /><span>View Logs</span>
                </button>
              </div>

              <div className="content-group">
                <label><ShieldAlert size={14} /> Placement Control</label>
                <div className="admin-data-card">
                  <p><strong>Status:</strong> {student.placementStatus || student.status || 'Unplaced'}</p>
                  <p><strong>Company:</strong> {student.companyName || (typeof student.company === 'string' ? student.company : student.company?.name) || '—'}</p>
                  {isPlaced && (
                    <button className="btn-text-red" onClick={handleRevoke} disabled={acting==='revoke'}>
                      {acting==='revoke' ? <><Loader size={13} style={{ animation:'spin 1s linear infinite' }} /> Revoking…</> : 'Revoke Placement'}
                    </button>
                  )}
                </div>
              </div>

              <div className="content-group">
                <label><User size={14} /> Student Info</label>
                <div className="admin-data-card">
                  <p><strong>Email:</strong> {student.email || '—'}</p>
                  <p><strong>Department:</strong> {student.department || student.dept || '—'}</p>
                  <p><strong>Index:</strong> {student.indexNumber || student.index || '—'}</p>
                </div>
              </div>

              <div className="drawer-footer-danger">
                {!confirmDelete ? (
                  <button className="btn-danger-outline" onClick={() => setConfirmDelete(true)}>
                    <Trash2 size={16} /> Delete Student Record
                  </button>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                    <p style={{ fontSize:'13px', color:'#dc2626', fontWeight:600 }}>Are you sure? This cannot be undone.</p>
                    <div style={{ display:'flex', gap:'8px' }}>
                      <button className="btn-danger-outline" onClick={handleDelete} disabled={acting==='delete'} style={{ flex:1 }}>
                        {acting==='delete' ? <><Loader size={13} style={{ animation:'spin 1s linear infinite' }} /> Deleting…</> : 'Yes, Delete'}
                      </button>
                      <button className="cancel-btn" onClick={() => setConfirmDelete(false)} style={{ flex:1 }}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── EDIT TAB ── */}
          {tab === 'edit' && (
            <div style={{ padding:'0 4px' }}>
              <p style={{ fontSize:'12px', color:'#64748b', marginBottom:'16px' }}>Edit student account details. Changes take effect immediately.</p>
              <div className="input-group" style={{ marginBottom:'12px' }}>
                <label>Full Name</label>
                <input className="admin-input-select-sm" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="input-group" style={{ marginBottom:'12px' }}>
                <label>Email Address</label>
                <input type="email" className="admin-input-select-sm" value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="input-group" style={{ marginBottom:'12px' }}>
                <label>Index Number</label>
                <input className="admin-input-select-sm" value={editForm.indexNumber} onChange={e => setEditForm(p => ({ ...p, indexNumber: e.target.value }))} />
              </div>
              <div className="input-group" style={{ marginBottom:'20px' }}>
                <label>Department</label>
                <input className="admin-input-select-sm" value={editForm.department} onChange={e => setEditForm(p => ({ ...p, department: e.target.value }))} />
              </div>
              <button className="btn-verify-confirm" onClick={handleEditSave} disabled={editSaving} style={{ width:'100%' }}>
                {editSaving ? <><Loader size={14} style={{ animation:'spin 1s linear infinite' }} /> Saving…</> : <><Save size={14} /> Save Changes</>}
              </button>
            </div>
          )}

          {/* ── LOGS TAB ── */}
          {tab === 'logs' && (
            <div>
              {loadingLogs && (
                <div style={{ textAlign:'center', padding:'32px', color:'#94a3b8' }}>
                  <Loader size={24} style={{ animation:'spin 1s linear infinite', marginBottom:'8px' }} />
                  <p style={{ fontSize:'13px' }}>Loading logs…</p>
                </div>
              )}
              {!loadingLogs && logs.length === 0 && (
                <div style={{ textAlign:'center', padding:'32px', color:'#94a3b8' }}>
                  <BookOpen size={36} style={{ marginBottom:'10px', opacity:0.4 }} />
                  <p style={{ fontSize:'13px' }}>No log entries submitted yet.</p>
                </div>
              )}
              {logs.map(log => (
                <div key={log._id||log.id} style={{ padding:'12px', background:'#f8fafc', borderRadius:'8px', marginBottom:'8px', border:'1px solid #e2e8f0' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'4px' }}>
                    <strong style={{ fontSize:'13px', color:'#1e293b' }}>
                      {new Date(log.date).toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' })}
                    </strong>
                    <span style={{ fontSize:'11px', fontWeight:600, padding:'2px 8px', borderRadius:'20px', ...statusColor(log.status) }}>
                      {log.status}
                    </span>
                  </div>
                  <p style={{ fontSize:'13px', color:'#475569', lineHeight:1.5, margin:'4px 0' }}>{log.activity}</p>
                  {log.skills && (
                    <p style={{ fontSize:'12px', color:'#64748b', display:'flex', alignItems:'center', gap:'4px', marginTop:'4px' }}>
                      <Tag size={11} /> {log.skills}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </>
  );
};

export default AdminStudentDrawer;