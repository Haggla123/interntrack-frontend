import React, { useState } from 'react';
import { Phone, Mail, Building, User, MapPin, X, Search, Award, BookOpen, TrendingUp, ChevronRight } from 'lucide-react';
import './AssignedStudents.css';

const AssignedStudents = ({ students = [], onViewLogbook, setActiveTab, visitedStudentIds = new Set() }) => {
  const [selected,     setSelected]     = useState(null);
  const [search,       setSearch]       = useState('');
  const [visitFilter,  setVisitFilter]  = useState('all'); // 'all' | 'visited' | 'unvisited'

  const searchFiltered = students.filter(s =>
    (s.name  || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.index || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.company || '').toLowerCase().includes(search.toLowerCase())
  );

  const filtered = searchFiltered.filter(s => {
    if (visitFilter === 'all') return true;
    const sid = (s._id || s.id || '').toString();
    const isVisited = visitedStudentIds.has(sid);
    return visitFilter === 'visited' ? isVisited : !isVisited;
  });

  const gradeColor = (g) => {
    if (!g || g === '-') return '#94a3b8';
    if (g === 'A')        return '#15803d';
    if (g === 'B+' || g === 'B') return '#0369a1';
    if (g === 'C+' || g === 'C') return '#b45309';
    return '#dc2626';
  };

  return (
    <div className="assigned-root fade-in">

      {/* ── Header banner ── */}
      <div className="bento-item welcome-box academic-banner" style={{ marginBottom: '20px' }}>
        <div className="badge-pill">Student Management</div>
        <h2 style={{ color: '#fff', margin: '10px 0 6px' }}>Assigned Interns</h2>
        <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>
          Review placement locations and internship progress for your {students.length} student{students.length !== 1 ? 's' : ''}.
        </p>
      </div>

      {/* ── Filter tabs + search ── */}
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { key: 'all',       label: `All (${students.length})` },
            { key: 'unvisited', label: `Not Visited (${students.filter(s => !visitedStudentIds.has((s._id||s.id||'').toString())).length})` },
            { key: 'visited',   label: `Visited (${students.filter(s => visitedStudentIds.has((s._id||s.id||'').toString())).length})` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setVisitFilter(tab.key)}
              style={{
                padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                cursor: 'pointer', border: '1.5px solid',
                borderColor: visitFilter === tab.key ? 'var(--brand-navy)' : 'var(--gray-200)',
                background:  visitFilter === tab.key ? 'var(--brand-navy)' : '#fff',
                color:       visitFilter === tab.key ? '#fff' : 'var(--gray-500)',
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Search bar ── */}
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div className="as-search-box">
          <Search size={15} style={{ color: 'var(--gray-400)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search name, index or company…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', padding: 0 }}>
              <X size={14} />
            </button>
          )}
        </div>
        <span style={{ fontSize: '12px', color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>
          {filtered.length} of {students.length}
        </span>
      </div>

      {/* ── Table ── */}
      <div className="content-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="as-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Company</th>
                <th>Location</th>
                <th>Progress</th>
                <th>Grade</th>
                <th>Visit</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map(s => (
                <tr key={s.id || s._id} className={selected?.id === s.id ? 'as-row-selected' : ''}>
                  <td>
                    <div className="as-name-cell">
                      <div className="as-avatar">{(s.name || 'S').charAt(0)}</div>
                      <div>
                        <strong style={{ fontSize: '13.5px', color: 'var(--gray-800)' }}>{s.name}</strong>
                        <span style={{ display: 'block', fontSize: '11px', color: 'var(--gray-400)', fontFamily: 'var(--font-mono)' }}>{s.index}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '13px', color: 'var(--gray-700)', fontWeight: 500 }}>
                      {s.company || <span style={{ color: 'var(--gray-300)', fontStyle: 'italic' }}>Not placed</span>}
                    </span>
                  </td>
                  <td>
                    {s.location ? (
                      <span className="as-location-pill">
                        <MapPin size={11} /> {s.location}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--gray-300)', fontSize: '12px', fontStyle: 'italic' }}>—</span>
                    )}
                  </td>
                  <td>
                    <div className="as-progress-cell">
                      <div className="as-progress-track">
                        <div className="as-progress-fill" style={{ width: `${s.progress || 0}%` }} />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gray-600)', width: '34px', textAlign: 'right' }}>
                        {s.progress || 0}%
                      </span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '14px', color: gradeColor(s.finalGrade) }}>
                      {s.finalGrade && s.finalGrade !== '-' ? s.finalGrade : '—'}
                    </span>
                  </td>
                  <td>
                    {(() => {
                      const sid = (s._id || s.id || '').toString();
                      return visitedStudentIds.has(sid)
                        ? <span className="badge-pill-green">Visited</span>
                        : <span className="badge-pill-amber">Not Visited</span>;
                    })()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button className="as-btn-outline" onClick={() => onViewLogbook ? onViewLogbook(s) : setActiveTab && setActiveTab('view-logbook')}>
                        <BookOpen size={13} /> Logbook
                      </button>
                      <button className="as-btn-primary" onClick={() => setSelected(s)}>
                        Details <ChevronRight size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: 'var(--gray-400)', fontStyle: 'italic', fontSize: '13px' }}>
                    {search ? `No students matching "${search}"` : 'No students assigned yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Detail Drawer ── */}
      {selected && (
        <>
          <div className="drawer-overlay" onClick={() => setSelected(null)} />
          <div className="info-drawer open admin-theme">
            <button className="close-btn" onClick={() => setSelected(null)}><X size={22} /></button>

            {/* Header gradient */}
            <div style={{ height: '110px', background: 'linear-gradient(135deg, #1e1b4b, #312e81)', flexShrink: 0 }} />

            {/* Profile */}
            <div style={{ textAlign: 'center', marginTop: '-52px', padding: '0 20px 20px', borderBottom: '1px solid var(--gray-100)' }}>
              <div style={{ width: '92px', height: '92px', background: '#fff', border: '4px solid #fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 900, color: '#1e1b4b', margin: '0 auto 12px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
                {selected.name.charAt(0)}
              </div>
              <h3 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 800, color: 'var(--gray-800)' }}>{selected.name}</h3>
              <p style={{ margin: '0 0 8px', fontSize: '12px', color: 'var(--gray-400)', fontFamily: 'var(--font-mono)' }}>{selected.index} · {selected.department}</p>
              <span className={`badge-pill-${selected.status === 'Graded' ? 'green' : 'amber'}`}>
                {selected.status}
              </span>
            </div>

            <div className="drawer-content" style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>

              {/* Contact */}
              <div className="content-group">
                <label><User size={12} /> Contact</label>
                <div className="admin-data-card">
                  {selected.email && <p style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '6px 0', fontSize: '13px' }}><Mail size={14} color="#64748b" /> {selected.email}</p>}
                  {selected.phone && <p style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '6px 0', fontSize: '13px' }}><Phone size={14} color="#64748b" /> {selected.phone}</p>}
                  {!selected.email && !selected.phone && <p style={{ color: 'var(--gray-400)', fontSize: '13px' }}>No contact info.</p>}
                </div>
              </div>

              {/* Placement */}
              <div className="content-group">
                <label><Building size={12} /> Placement</label>
                <div className="admin-data-card">
                  <p style={{ margin: '4px 0', fontSize: '13px', fontWeight: 600, color: 'var(--gray-800)' }}>{selected.company || 'Not placed'}</p>
                  {selected.location && (
                    <p style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '6px 0', fontSize: '12px', color: 'var(--gray-500)' }}>
                      <MapPin size={13} /> {selected.location}
                    </p>
                  )}
                  {selected.supervisor && (
                    <p style={{ margin: '6px 0', fontSize: '12px', color: 'var(--gray-500)' }}>
                      <strong style={{ color: 'var(--gray-700)' }}>Industrial Sup:</strong> {selected.supervisor}
                    </p>
                  )}
                  {selected.supervisorEmail && (
                    <p style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '4px 0', fontSize: '12px', color: 'var(--gray-500)' }}>
                      <Mail size={12} /> {selected.supervisorEmail}
                    </p>
                  )}
                  {selected.supervisorPhone && (
                    <p style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '4px 0', fontSize: '12px', color: 'var(--gray-500)' }}>
                      <Phone size={12} /> {selected.supervisorPhone}
                    </p>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="content-group">
                <label><TrendingUp size={12} /> Progress</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {[
                    { label: 'Weeks', value: selected.weeks || 0 },
                    { label: 'Indus. Score', value: selected.indusScore ? `${selected.indusScore}/10` : '—' },
                    { label: 'Final Grade', value: selected.finalGrade && selected.finalGrade !== '-' ? selected.finalGrade : '—' },
                  ].map(stat => (
                    <div key={stat.label} style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: '10px', padding: '12px 8px', textAlign: 'center' }}>
                      <span style={{ display: 'block', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: '4px', letterSpacing: '0.5px' }}>{stat.label}</span>
                      <strong style={{ fontSize: '16px', color: 'var(--gray-800)', fontFamily: 'var(--font-mono)' }}>{stat.value}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                <button
                  className="btn-primary-lite"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => { onViewLogbook ? onViewLogbook(selected) : setActiveTab && setActiveTab('view-logbook'); setSelected(null); }}
                >
                  <BookOpen size={15} /> View Logbook
                </button>
                <button
                  className="as-btn-outline"
                  style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
                  onClick={() => { setActiveTab && setActiveTab('grading'); setSelected(null); }}
                >
                  <Award size={15} /> Grade Student
                </button>
              </div>

            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AssignedStudents;