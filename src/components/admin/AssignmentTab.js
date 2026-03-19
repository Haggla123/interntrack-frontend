// src/components/admin/AssignmentTab.js
// shows unassigned students prominently, supports batch selection,
// one-by-one assignment, supervisor load badges, and a clear split view.
import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, UserCheck, CheckCircle2, AlertCircle, Loader,
  Search, Link2, X, ChevronDown, ChevronUp, RefreshCw,
  UserX, Filter, Check,
} from 'lucide-react';
import { getStudents, getSupervisors, assignStudent } from '../../api';

// ── helpers ──────────────────────────────────────────────────────
const supName = (s) => {
  if (!s.academicSupervisor) return null;
  if (typeof s.academicSupervisor === 'object') return s.academicSupervisor.name || null;
  return null;
};
const supId = (s) => {
  if (!s.academicSupervisor) return null;
  if (typeof s.academicSupervisor === 'object') return (s.academicSupervisor._id || '').toString();
  return s.academicSupervisor.toString();
};
const isAssigned = (s) => !!supId(s);

// ── load badge ───────────────────────────────────────────────────
const LoadBadge = ({ count, capacity = 60 }) => {
  const pct = Math.round((count / capacity) * 100);
  if (pct >= 90) return <span style={badgeStyle('#fef2f2','#dc2626','#fca5a5')}>Overloaded · {count}</span>;
  if (pct >= 60) return <span style={badgeStyle('#fffbeb','#d97706','#fde68a')}>Near Limit · {count}</span>;
  return <span style={badgeStyle('#f0fdf4','#15803d','#86efac')}>Optimal · {count}</span>;
};
const badgeStyle = (bg, color, border) => ({
  padding: '2px 9px', borderRadius: '20px', fontSize: '11px',
  fontWeight: 700, background: bg, color, border: `1px solid ${border}`,
  whiteSpace: 'nowrap',
});

// ── StudentRow ────────────────────────────────────────────────────
const StudentRow = ({ student, selected, onToggle, supervisors, onAssignOne, saving }) => {
  const [open, setOpen] = useState(false);
  const [pickedSup, setPickedSup] = useState('');
  const sid = (student._id || student.id || '').toString();
  const assigned = isAssigned(student);
  const currentSupName = supName(student);

  const handleQuickAssign = async () => {
    if (!pickedSup) return;
    await onAssignOne(sid, pickedSup);
    setOpen(false);
    setPickedSup('');
  };

  return (
    <div style={{
      border: `1.5px solid ${selected ? 'var(--brand-blue)' : 'var(--gray-200)'}`,
      borderRadius: '10px',
      background: selected ? '#eff6ff' : '#fff',
      marginBottom: '6px',
      overflow: 'hidden',
      transition: 'all 0.15s',
    }}>
      {/* Main row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 14px' }}>
        {/* Checkbox */}
        <div
          onClick={() => onToggle(sid)}
          style={{
            width: '18px', height: '18px', borderRadius: '4px', flexShrink: 0, marginTop: '7px',
            border: `2px solid ${selected ? 'var(--brand-blue)' : 'var(--gray-300)'}`,
            background: selected ? 'var(--brand-blue)' : '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          {selected && <Check size={11} color="#fff" strokeWidth={3} />}
        </div>

        {/* Avatar */}
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
          background: assigned ? '#dcfce7' : '#f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '13px', fontWeight: 800,
          color: assigned ? '#15803d' : 'var(--gray-500)',
        }}>
          {(student.name || 'S').charAt(0)}
        </div>

        {/* Info — takes all remaining space, wraps internally */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--gray-800)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {student.name}
            {assigned && (
              <span style={badgeStyle('#f0fdf4','#15803d','#bbf7d0')}>
                <CheckCircle2 size={9} style={{ display:'inline', marginRight:'3px' }} />
                {currentSupName || 'Assigned'}
              </span>
            )}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--gray-400)', fontFamily: 'var(--font-mono)', marginTop: '1px', marginBottom: student.companyName ? '5px' : 0 }}>
            {student.indexNumber || student.index} · {student.department}
          </div>
          {/* Company pill moved inside info block so it wraps naturally */}
          {student.companyName && (
            <span style={{ display:'inline-block', fontSize: '11px', color: '#0369a1', background: '#e0f2fe', border: '1px solid #bae6fd', padding: '2px 8px', borderRadius: '12px' }}>
              {student.companyName}
            </span>
          )}
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setOpen(o => !o)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', padding: '4px', flexShrink: 0, display: 'flex', alignItems: 'center', marginTop: '2px' }}
          title={open ? 'Collapse' : 'Assign individually'}
        >
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Inline assign panel */}
      {open && (
        <div style={{ padding: '10px 14px 14px', borderTop: '1px solid var(--gray-100)', background: '#f8fafc' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            {assigned ? 'Re-assign Academic Supervisor' : 'Assign Academic Supervisor'}
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <select
              value={pickedSup}
              onChange={e => setPickedSup(e.target.value)}
              style={{ flex: 1, minWidth: '160px', padding: '7px 10px', border: '1px solid var(--gray-200)', borderRadius: '6px', fontSize: '13px', background: '#fff', outline: 'none' }}
            >
              <option value="">— Select supervisor —</option>
              {supervisors.map(sup => {
                const load = sup._studentCount || sup.studentCount || 0;
                return (
                  <option key={sup._id || sup.id} value={(sup._id || sup.id).toString()}>
                    {sup.name} ({sup.department || 'Faculty'}) · {load} students
                  </option>
                );
              })}
            </select>
            <button
              onClick={handleQuickAssign}
              disabled={!pickedSup || saving === sid}
              style={{
                padding: '7px 16px', borderRadius: '6px', border: 'none',
                background: pickedSup ? 'var(--brand-navy)' : 'var(--gray-200)',
                color: pickedSup ? '#fff' : 'var(--gray-400)',
                fontSize: '13px', fontWeight: 600, cursor: pickedSup ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.15s',
              }}
            >
              {saving === sid
                ? <><Loader size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> Saving…</>
                : <><Link2 size={13} /> Assign</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main component ───────────────────────────────────────────────
const AssignmentTab = () => {
  const [students,    setStudents]    = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [saving,      setSaving]      = useState(''); // student id being saved
  const [batchSaving, setBatchSaving] = useState(false);

  // selection + filter
  const [selected,    setSelected]    = useState(new Set());
  const [search,      setSearch]      = useState('');
  const [view,        setView]        = useState('unassigned'); // 'unassigned' | 'assigned' | 'all'
  const [batchSupId,  setBatchSupId]  = useState('');

  // feedback
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg,   setErrorMsg]   = useState('');

  const flash = (msg, type = 'success') => {
    if (type === 'success') { setSuccessMsg(msg); setErrorMsg(''); }
    else                    { setErrorMsg(msg);   setSuccessMsg(''); }
    setTimeout(() => { setSuccessMsg(''); setErrorMsg(''); }, 5000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [sRes, supRes] = await Promise.all([getStudents(), getSupervisors()]);
      const toArr = r => Array.isArray(r) ? r : Array.isArray(r?.data) ? r.data : [];
      const rawStudents = toArr(sRes);
      const rawSups     = toArr(supRes).filter(s => s.role === 'academic');

      // Attach live student counts to each supervisor
      const withCounts = rawSups.map(sup => {
        const id = (sup._id || sup.id || '').toString();
        const count = rawStudents.filter(s => supId(s) === id).length;
        return { ...sup, _studentCount: count };
      });

      setStudents(rawStudents);
      setSupervisors(withCounts);
    } catch (err) {
      setError('Failed to load data. ' + (err.message || 'Please refresh.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── filtered list ─────────────────────────────────────────────
  const filtered = students
    .filter(s => {
      if (view === 'unassigned') return !isAssigned(s);
      if (view === 'assigned')   return  isAssigned(s);
      return true;
    })
    .filter(s =>
      !search ||
      (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.indexNumber || s.index || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.companyName || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.department  || '').toLowerCase().includes(search.toLowerCase())
    );

  const unassignedCount = students.filter(s => !isAssigned(s)).length;
  const assignedCount   = students.filter(s =>  isAssigned(s)).length;

  // ── selection helpers ─────────────────────────────────────────
  const toggleOne = (id) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const toggleAll = () => {
    const allIds = filtered.map(s => (s._id || s.id || '').toString());
    const allSelected = allIds.every(id => selected.has(id));
    setSelected(allSelected ? new Set() : new Set(allIds));
  };
  const clearSelection = () => setSelected(new Set());

  // ── assign one student ────────────────────────────────────────
  const handleAssignOne = async (studentId, supervisorId) => {
    setSaving(studentId);
    try {
      const res = await assignStudent(studentId, { academicSupervisorId: supervisorId });
      const updated = res?.data || res;
      setStudents(prev => prev.map(s =>
        (s._id || s.id || '').toString() === studentId ? { ...s, ...updated, academicSupervisor: updated.academicSupervisor } : s
      ));
      // Update supervisor count
      setSupervisors(prev => prev.map(sup => {
        const id = (sup._id || sup.id || '').toString();
        if (id === supervisorId) return { ...sup, _studentCount: (sup._studentCount || 0) + 1 };
        return sup;
      }));
      flash(`Assigned successfully.`);
    } catch (err) {
      flash(err.message || 'Assignment failed.', 'error');
    } finally {
      setSaving('');
    }
  };

  // ── batch assign ──────────────────────────────────────────────
  const handleBatchAssign = async () => {
    if (!batchSupId) { flash('Please select a supervisor for batch assignment.', 'error'); return; }
    if (!selected.size) { flash('Please select at least one student.', 'error'); return; }

    setBatchSaving(true);
    let ok = 0, fail = 0;
    for (const sid of selected) {
      try {
        const res = await assignStudent(sid, { academicSupervisorId: batchSupId });
        const updated = res?.data || res;
        setStudents(prev => prev.map(s =>
          (s._id || s.id || '').toString() === sid ? { ...s, ...updated, academicSupervisor: updated.academicSupervisor } : s
        ));
        ok++;
      } catch { fail++; }
    }

    // Refresh supervisor counts
    const newSups = await getSupervisors().then(r => (Array.isArray(r) ? r : r?.data || []).filter(s => s.role === 'academic')).catch(() => supervisors);
    const rawStudents = await getStudents().then(r => Array.isArray(r) ? r : r?.data || []).catch(() => students);
    const withCounts  = newSups.map(sup => {
      const id = (sup._id || sup.id || '').toString();
      return { ...sup, _studentCount: rawStudents.filter(s => supId(s) === id).length };
    });
    setSupervisors(withCounts);
    setStudents(rawStudents);

    clearSelection();
    setBatchSupId('');
    setBatchSaving(false);
    flash(fail === 0
      ? `${ok} student${ok !== 1 ? 's' : ''} assigned successfully.`
      : `${ok} assigned, ${fail} failed.`,
      fail > 0 ? 'error' : 'success'
    );
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '12px', color: 'var(--gray-500)' }}>
      <Loader size={20} style={{ animation: 'spin 0.8s linear infinite' }} />
      <span style={{ fontSize: '14px' }}>Loading assignment data…</span>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px 20px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px', color: '#dc2626', fontSize: '14px', margin: '20px 0' }}>
      <AlertCircle size={16} /> {error}
      <button onClick={load} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, fontSize: '13px' }}>
        <RefreshCw size={14} /> Retry
      </button>
    </div>
  );

  const allFilteredIds = filtered.map(s => (s._id || s.id || '').toString());
  const allSelected    = allFilteredIds.length > 0 && allFilteredIds.every(id => selected.has(id));

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .asgn-grid { display: grid; grid-template-columns: 1fr 280px; gap: 16px; align-items: start; }
        .asgn-stats { display: flex; gap: 12px; flex-wrap: wrap; }
        .asgn-stat  { padding: 10px 16px; border-radius: 8px; min-width: 110px; flex: 1; }
        @media (max-width: 768px) {
          .asgn-grid  { grid-template-columns: 1fr; }
          .asgn-stat  { min-width: calc(50% - 6px); }
        }
      `}</style>
      <div className="content-card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700, color: 'var(--gray-800)' }}>
              Academic Supervisor Assignment
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--gray-400)' }}>
              Assign academic supervisors to students individually or in batches.
            </p>
          </div>
          <button onClick={load} style={{ background: 'none', border: '1px solid var(--gray-200)', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--gray-500)' }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {/* Stats row */}
        <div className="asgn-stats">
          {[
            { label: 'Total Students', value: students.length,    color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
            { label: 'Unassigned',     value: unassignedCount,    color: unassignedCount > 0 ? '#d97706' : '#15803d', bg: unassignedCount > 0 ? '#fffbeb' : '#f0fdf4', border: unassignedCount > 0 ? '#fde68a' : '#bbf7d0' },
            { label: 'Assigned',       value: assignedCount,      color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
            { label: 'Supervisors',    value: supervisors.length, color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
          ].map(({ label, value, color, bg, border }) => (
            <div key={label} className="asgn-stat" style={{ background: bg, border: `1px solid ${border}` }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>{label}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Feedback ── */}
      {successMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', color: '#15803d', fontSize: '13px' }}>
          <CheckCircle2 size={15} /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#dc2626', fontSize: '13px' }}>
          <AlertCircle size={15} /> {errorMsg}
        </div>
      )}

      <div className="asgn-grid">

        {/* ── LEFT: Student list ── */}
        <div className="content-card" style={{ padding: '20px' }}>

          {/* Filter tabs + search */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            {[
              { key: 'unassigned', label: `Unassigned (${unassignedCount})` },
              { key: 'assigned',   label: `Assigned (${assignedCount})` },
              { key: 'all',        label: `All (${students.length})` },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => { setView(tab.key); setSelected(new Set()); }}
                style={{
                  padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                  cursor: 'pointer', border: '1.5px solid',
                  borderColor: view === tab.key ? 'var(--brand-navy)' : 'var(--gray-200)',
                  background:  view === tab.key ? 'var(--brand-navy)' : '#fff',
                  color:       view === tab.key ? '#fff' : 'var(--gray-500)',
                  transition:  'all 0.15s',
                }}
              >
                {tab.label}
              </button>
            ))}

            {/* Search */}
            <div style={{ flex: 1, minWidth: '180px', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--gray-50)', border: '1.5px solid var(--gray-200)', borderRadius: '8px', padding: '7px 12px' }}>
              <Search size={14} color="var(--gray-400)" style={{ flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search name, index, company…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '13px', color: 'var(--gray-800)' }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', padding: 0 }}>
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Select-all bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 14px', background: 'var(--gray-50)', borderRadius: '6px', marginBottom: '10px', fontSize: '12px', color: 'var(--gray-600)' }}>
            <div
              onClick={toggleAll}
              style={{
                width: '16px', height: '16px', borderRadius: '3px', flexShrink: 0,
                border: `2px solid ${allSelected ? 'var(--brand-blue)' : 'var(--gray-300)'}`,
                background: allSelected ? 'var(--brand-blue)' : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              {allSelected && <Check size={10} color="#fff" strokeWidth={3} />}
            </div>
            <span>
              {selected.size > 0
                ? <><strong>{selected.size}</strong> selected · <button onClick={clearSelection} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand-blue)', fontWeight: 600, fontSize: '12px', padding: 0 }}>Clear</button></>
                : `${filtered.length} student${filtered.length !== 1 ? 's' : ''} shown`}
            </span>
            {selected.size > 0 && (
              <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--gray-400)' }}>
                Use the Batch Assignment panel →
              </span>
            )}
          </div>

          {/* Student list */}
          <div style={{ maxHeight: '520px', overflowY: 'auto', paddingRight: '2px' }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--gray-400)' }}>
                {view === 'unassigned'
                  ? <><UserCheck size={32} style={{ marginBottom: '10px', opacity: 0.4 }} /><p style={{ fontWeight: 600 }}>All students are assigned!</p></>
                  : <><Users size={32} style={{ marginBottom: '10px', opacity: 0.4 }} /><p>No students match this filter.</p></>}
              </div>
            ) : (
              filtered.map(s => (
                <StudentRow
                  key={s._id || s.id}
                  student={s}
                  selected={selected.has((s._id || s.id || '').toString())}
                  onToggle={toggleOne}
                  supervisors={supervisors}
                  onAssignOne={handleAssignOne}
                  saving={saving}
                />
              ))
            )}
          </div>
        </div>

        {/* ── RIGHT: Batch panel + Supervisor loads ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Batch assign panel */}
          <div className="content-card" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Users size={16} color="var(--brand-blue)" />
              <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 700, color: 'var(--gray-800)' }}>Batch Assignment</h4>
            </div>

            {selected.size === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px 10px', background: 'var(--gray-50)', borderRadius: '8px', border: '1.5px dashed var(--gray-200)' }}>
                <Filter size={20} style={{ color: 'var(--gray-300)', marginBottom: '8px' }} />
                <p style={{ fontSize: '12px', color: 'var(--gray-400)', margin: 0 }}>
                  Select students from the list to batch-assign them to a supervisor.
                </p>
              </div>
            ) : (
              <>
                <div style={{ padding: '8px 12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', marginBottom: '12px', fontSize: '13px', color: '#1d4ed8', fontWeight: 600 }}>
                  {selected.size} student{selected.size !== 1 ? 's' : ''} selected
                </div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
                  Assign to Supervisor
                </label>
                <select
                  value={batchSupId}
                  onChange={e => setBatchSupId(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', border: '1.5px solid var(--gray-200)', borderRadius: '6px', fontSize: '13px', marginBottom: '10px', background: '#fff', outline: 'none' }}
                >
                  <option value="">— Select supervisor —</option>
                  {supervisors.map(sup => (
                    <option key={sup._id || sup.id} value={(sup._id || sup.id).toString()}>
                      {sup.name} · {sup._studentCount || 0} students
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleBatchAssign}
                  disabled={batchSaving || !batchSupId}
                  style={{
                    width: '100%', padding: '10px', border: 'none', borderRadius: '8px',
                    background: batchSupId ? 'var(--brand-navy)' : 'var(--gray-200)',
                    color: batchSupId ? '#fff' : 'var(--gray-400)',
                    fontWeight: 700, fontSize: '13px', cursor: batchSupId ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                    transition: 'all 0.15s',
                  }}
                >
                  {batchSaving
                    ? <><Loader size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Assigning…</>
                    : <><Link2 size={14} /> Assign {selected.size} Student{selected.size !== 1 ? 's' : ''}</>}
                </button>
                <button
                  onClick={clearSelection}
                  style={{ width: '100%', padding: '6px', marginTop: '6px', border: '1px solid var(--gray-200)', borderRadius: '6px', background: '#fff', color: 'var(--gray-500)', fontSize: '12px', cursor: 'pointer' }}
                >
                  Clear Selection
                </button>
              </>
            )}
          </div>

          {/* Supervisor load panel */}
          <div className="content-card" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <UserCheck size={16} color="var(--brand-blue)" />
              <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 700, color: 'var(--gray-800)' }}>Supervisor Load</h4>
            </div>
            {supervisors.length === 0 ? (
              <p style={{ fontSize: '12px', color: 'var(--gray-400)', textAlign: 'center', padding: '12px' }}>No academic supervisors registered.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {supervisors
                  .sort((a, b) => (b._studentCount || 0) - (a._studentCount || 0))
                  .map(sup => {
                    const count    = sup._studentCount || 0;
                    const capacity = 60;
                    const pct      = Math.min(Math.round((count / capacity) * 100), 100);
                    const barColor = pct >= 90 ? '#dc2626' : pct >= 60 ? '#d97706' : '#10b981';
                    return (
                      <div key={sup._id || sup.id} style={{ padding: '10px 12px', background: 'var(--gray-50)', borderRadius: '8px', border: '1px solid var(--gray-100)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-800)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{sup.name}</div>
                            <div style={{ fontSize: '10px', color: 'var(--gray-400)' }}>{sup.department || 'Faculty'}</div>
                          </div>
                          <LoadBadge count={count} capacity={capacity} />
                        </div>
                        <div style={{ height: '4px', background: 'var(--gray-200)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: '2px', transition: 'width 0.4s ease' }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Unassigned warning banner */}
      {unassignedCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 18px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', fontSize: '13px', color: '#92400e' }}>
          <UserX size={16} color="#d97706" style={{ flexShrink: 0 }} />
          <strong>{unassignedCount} student{unassignedCount !== 1 ? 's' : ''}</strong>&nbsp;still need an academic supervisor.
          <button
            onClick={() => setView('unassigned')}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#d97706', fontWeight: 700, fontSize: '12px', whiteSpace: 'nowrap' }}
          >
            Show unassigned →
          </button>
        </div>
      )}

    </div>
  );
};

export default AssignmentTab;