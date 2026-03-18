// src/components/admin/SupervisorsTab.js
// New standalone component — replaces the inline case 'supervisors' block
// in AdminDashboard.js so it's easier to maintain.
//
// Features:
//   • Filter tabs: All / Academic / Industrial
//   • Search by name, department, staff ID, or company
//   • Student load badge per academic supervisor (from students prop)
//   • Inline edit for each supervisor
//   • Add Lecturer button wired to existing modal
//   • "View Students" shortcut links to Students tab filtered by supervisor
import React, { useState } from 'react';
import {
  Search, PlusCircle, Users, Building2, UserCheck,
  Mail, Phone, Edit3, Save, X, Trash2, ExternalLink,
} from 'lucide-react';

const ROLE_TABS = [
  { key: 'all',        label: 'All',                  icon: <Users size={14} /> },
  { key: 'academic',   label: 'Academic Supervisors',  icon: <UserCheck size={14} /> },
  { key: 'industrial', label: 'Industrial Supervisors', icon: <Building2 size={14} /> },
];

const LoadBadge = ({ count, capacity = 60 }) => {
  const pct = Math.round((count / Math.max(capacity, 1)) * 100);
  const [bg, color, border] =
    pct >= 90 ? ['#fef2f2','#dc2626','#fca5a5'] :
    pct >= 60 ? ['#fffbeb','#d97706','#fde68a'] :
               ['#f0fdf4','#15803d','#bbf7d0'];
  return (
    <span style={{ padding:'2px 9px', borderRadius:'20px', fontSize:'11px', fontWeight:700, background:bg, color, border:`1px solid ${border}`, whiteSpace:'nowrap' }}>
      {count} student{count !== 1 ? 's' : ''}
    </span>
  );
};

const SupervisorsTab = ({
  supervisors,
  students,
  loadingData,
  onAddLecturer,           // () => opens AddLecturerModal
  onAddAdmin,              // () => opens AddAdminModal (optional)
  onSave,                  // (id, payload) => Promise
  onDelete,                // (id, name) => Promise
  onViewStudents,          // (supId) => switches to students tab filtered
}) => {
  const [roleFilter,       setRoleFilter]       = useState('all');
  const [search,           setSearch]           = useState('');
  const [editing,          setEditing]          = useState(null);   // { ...sup }
  const [savingId,         setSavingId]         = useState('');
  const [deletingId,       setDeletingId]       = useState('');
  const [confirmDeleteId,  setConfirmDeleteId]  = useState('');

  // ── derived counts ────────────────────────────────────────────
  const supStudentCount = (supId) => {
    const id = supId.toString();
    return students.filter(s => {
      const sid = typeof s.academicSupervisor === 'object'
        ? (s.academicSupervisor?._id || '').toString()
        : (s.academicSupervisor || '').toString();
      return sid === id;
    }).length;
  };

  const academicCount   = supervisors.filter(s => s.role === 'academic').length;
  const industrialCount = supervisors.filter(s => s.role === 'industrial').length;

  // ── filtered list ─────────────────────────────────────────────
  const filtered = supervisors
    .filter(s => roleFilter === 'all' || s.role === roleFilter)
    .filter(s =>
      !search ||
      (s.name       || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.department || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.staffId    || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.companyOrg || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.email      || '').toLowerCase().includes(search.toLowerCase())
    );

  // ── handlers ──────────────────────────────────────────────────
  const handleSave = async (id) => {
    setSavingId(id);
    try {
      await onSave(id, { ...editing });
      setEditing(null);
    } catch { /* onSave handles error display */ }
    finally { setSavingId(''); }
  };

  const handleDelete = async (id, name) => {
    setDeletingId(id);
    try {
      await onDelete(id, name);
      setConfirmDeleteId('');
    } catch { }
    finally { setDeletingId(''); }
  };

  return (
    <div className="content-card fade-in">

      {/* ── Header ── */}
      <div className="card-header-actions" style={{ marginBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Supervisors</h3>
          <p className="sub-text-sm" style={{ marginTop: '3px' }}>
            Manage faculty and industrial mentors across all departments.
          </p>
        </div>
        <button className="primary-btn" onClick={onAddLecturer}>
          <PlusCircle size={16} /> Add Academic Supervisor
        </button>
      </div>

      {/* ── Role filter tabs ── */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
        {ROLE_TABS.map(tab => {
          const count = tab.key === 'all' ? supervisors.length
                      : tab.key === 'academic' ? academicCount
                      : industrialCount;
          const active = roleFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setRoleFilter(tab.key)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '7px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                cursor: 'pointer', border: '1.5px solid', transition: 'all 0.15s',
                borderColor: active ? 'var(--brand-navy)' : 'var(--gray-200)',
                background:  active ? 'var(--brand-navy)' : '#fff',
                color:       active ? '#fff' : 'var(--gray-500)',
              }}
            >
              {tab.icon}
              {tab.label}
              <span style={{
                padding: '1px 7px', borderRadius: '20px', fontSize: '11px',
                background: active ? 'rgba(255,255,255,0.2)' : 'var(--gray-100)',
                color: active ? '#fff' : 'var(--gray-500)',
              }}>
                {count}
              </span>
            </button>
          );
        })}

        {/* Search */}
        <div style={{
          flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '8px',
          background: 'var(--gray-50)', border: '1.5px solid var(--gray-200)',
          borderRadius: '20px', padding: '6px 14px', marginLeft: 'auto',
        }}>
          <Search size={14} color="var(--gray-400)" style={{ flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search name, department, staff ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '13px', color: 'var(--gray-800)' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--gray-400)', padding:0 }}>
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      {loadingData ? (
        <p style={{ color: 'var(--gray-400)', fontSize: '14px', textAlign: 'center', padding: '40px' }}>Loading supervisors…</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--gray-400)' }}>
          <Users size={36} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <p style={{ fontWeight: 600, color: 'var(--gray-600)', marginBottom: '4px' }}>
            {search ? `No supervisors matching "${search}"` : 'No supervisors in this category yet.'}
          </p>
          {roleFilter === 'academic' && !search && (
            <button className="primary-btn" style={{ marginTop: '12px' }} onClick={onAddLecturer}>
              <PlusCircle size={15} /> Add Academic Supervisor
            </button>
          )}
        </div>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Department / Organisation</th>
                <th>Staff ID / Email</th>
                <th style={{ textAlign: 'center' }}>Load</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(sup => {
                const id        = (sup._id || sup.id || '').toString();
                const isEditing = editing && (editing._id || editing.id || '').toString() === id;
                const isAcademic = sup.role === 'academic';
                const count     = isAcademic ? supStudentCount(id) : null;
                const isConfirmDelete = confirmDeleteId === id;

                return (
                  <React.Fragment key={id}>
                    <tr style={{ background: isEditing ? '#f0f9ff' : undefined }}>

                      {/* Name */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                            background: isAcademic ? '#ede9fe' : '#e0f2fe',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '13px', fontWeight: 800,
                            color: isAcademic ? '#7c3aed' : '#0369a1',
                          }}>
                            {(sup.name || '?').charAt(0)}
                          </div>
                          <div>
                            <strong style={{ fontSize: '13.5px', color: 'var(--gray-800)' }}>{sup.name}</strong>
                            {sup.email && (
                              <div style={{ fontSize: '11px', color: 'var(--gray-400)', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '1px' }}>
                                <Mail size={10} /> {sup.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role badge */}
                      <td>
                        <span style={{
                          padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                          background: isAcademic ? '#ede9fe' : '#e0f2fe',
                          color:      isAcademic ? '#7c3aed' : '#0369a1',
                          border:     `1px solid ${isAcademic ? '#ddd6fe' : '#bae6fd'}`,
                        }}>
                          {isAcademic ? 'Academic' : 'Industrial'}
                        </span>
                      </td>

                      {/* Dept / Org */}
                      <td style={{ fontSize: '13px', color: 'var(--gray-600)' }}>
                        {isAcademic ? (sup.department || '—') : (sup.companyOrg || sup.companyId?.name || '—')}
                      </td>

                      {/* Staff ID / Email */}
                      <td>
                        {isAcademic && sup.staffId && (
                          <code style={{ fontSize: '12px', background: 'var(--gray-100)', padding: '2px 6px', borderRadius: '4px' }}>{sup.staffId}</code>
                        )}
                        {!isAcademic && sup.phone && (
                          <span style={{ fontSize: '12px', color: 'var(--gray-500)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Phone size={11} /> {sup.phone}
                          </span>
                        )}
                        {!sup.staffId && !sup.phone && <span style={{ color: 'var(--gray-300)' }}>—</span>}
                      </td>

                      {/* Load — only for academic */}
                      <td style={{ textAlign: 'center' }}>
                        {isAcademic
                          ? <LoadBadge count={count} />
                          : <span style={{ color: 'var(--gray-300)', fontSize: '12px' }}>—</span>}
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="action-group-sm">
                          {isAcademic && onViewStudents && (
                            <button
                              className="text-link-btn"
                              style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => onViewStudents(id)}
                            >
                              <ExternalLink size={12} /> Students
                            </button>
                          )}
                          <button
                            className="text-link-btn-secondary"
                            style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => setEditing(isEditing ? null : { ...sup })}
                          >
                            <Edit3 size={12} /> {isEditing ? 'Cancel' : 'Edit'}
                          </button>
                          {!isConfirmDelete ? (
                            <button
                              className="btn-reject-outline"
                              style={{ fontSize: '12px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => setConfirmDeleteId(id)}
                            >
                              <Trash2 size={12} /> Remove
                            </button>
                          ) : (
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: 600 }}>Confirm?</span>
                              <button
                                onClick={() => handleDelete(id, sup.name)}
                                disabled={deletingId === id}
                                style={{ padding: '3px 10px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                              >
                                {deletingId === id ? '…' : 'Yes'}
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId('')}
                                style={{ padding: '3px 8px', background: 'var(--gray-100)', color: 'var(--gray-600)', border: '1px solid var(--gray-200)', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                              >
                                No
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Inline edit row */}
                    {isEditing && (
                      <tr>
                        <td colSpan={6} style={{ padding: 0, background: '#f0f9ff', borderBottom: '2px solid var(--brand-blue)' }}>
                          <div style={{ padding: '16px 20px' }}>
                            <p style={{ fontSize: '11px', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                              Editing: {sup.name}
                            </p>
                            <div className="form-grid-2" style={{ marginBottom: '12px' }}>
                              <div className="input-group">
                                <label>Full Name</label>
                                <input className="admin-input-select-sm" value={editing.name || ''} onChange={e => setEditing(p => ({ ...p, name: e.target.value }))} />
                              </div>
                              <div className="input-group">
                                <label>Email</label>
                                <input type="email" className="admin-input-select-sm" value={editing.email || ''} onChange={e => setEditing(p => ({ ...p, email: e.target.value }))} />
                              </div>
                              {isAcademic ? (
                                <>
                                  <div className="input-group">
                                    <label>Department</label>
                                    <input className="admin-input-select-sm" value={editing.department || ''} onChange={e => setEditing(p => ({ ...p, department: e.target.value }))} />
                                  </div>
                                  <div className="input-group">
                                    <label>Staff ID</label>
                                    <input className="admin-input-select-sm" value={editing.staffId || ''} onChange={e => setEditing(p => ({ ...p, staffId: e.target.value }))} />
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="input-group">
                                    <label>Organisation</label>
                                    <input className="admin-input-select-sm" value={editing.companyOrg || ''} onChange={e => setEditing(p => ({ ...p, companyOrg: e.target.value }))} />
                                  </div>
                                  <div className="input-group">
                                    <label>Phone</label>
                                    <input className="admin-input-select-sm" value={editing.phone || ''} onChange={e => setEditing(p => ({ ...p, phone: e.target.value }))} />
                                  </div>
                                </>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button className="cancel-btn" onClick={() => setEditing(null)}>Cancel</button>
                              <button
                                className="btn-verify-confirm"
                                onClick={() => handleSave(id)}
                                disabled={savingId === id}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                              >
                                {savingId === id
                                  ? <><span style={{ width:'14px', height:'14px', border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin 0.8s linear infinite' }} /> Saving…</>
                                  : <><Save size={14} /> Save Changes</>}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

export default SupervisorsTab;