import React from 'react';
import {
  Calendar, CheckCircle2, BellRing, Users,
  Activity, MapPin, ChevronRight, ClipboardCheck,
  Clock, AlertTriangle, Eye
} from 'lucide-react';

const AcademicOverview = ({ students, setActiveTab, nextVisit, visitedStudentIds = new Set() }) => {
  const pendingGradingStudents = students.filter(s => s.status === 'Pending Grading');
  const totalStudents = students.length;
  const avgProgress   = totalStudents > 0
    ? Math.round(students.reduce((acc, s) => acc + (s.progress || 0), 0) / totalStudents)
    : 0;

  // Students who are placed, have no Completed visit AND no upcoming Scheduled visit
  const unvisitedStudents = students.filter(s => {
    if (!s.company || s.company === 'Not placed') return false;
    return !visitedStudentIds.has((s._id || s.id || '').toString());
  });

  return (
    <div className="bento-container fade-in">

      {/* ── Visit alert hero ── */}
      <div className="bento-row">
        {nextVisit ? (
          <div className="bento-item visit-alert-hero academic-theme">
            <div className="alert-content-left">
              <div className="pulse-container">
                <BellRing size={24} className="bell-pulse" />
              </div>
              <div className="alert-details">
                <span className="alert-badge">Upcoming Site Visit</span>
                <h2>{nextVisit.studentName || nextVisit.student?.name || 'Student'}</h2>
                <div className="alert-meta">
                  <span className="meta-item">
                    <Calendar size={14} />
                    {nextVisit.date
                      ? new Date(nextVisit.date).toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short', year:'numeric' })
                      : '—'}
                  </span>
                  {nextVisit.time && (
                    <span className="meta-item"><Clock size={14} /> {nextVisit.time}</span>
                  )}
                  <span className="meta-item">
                    <MapPin size={14} />
                    <span>
                      {nextVisit.company || 'Unknown Company'}
                      {nextVisit.location
                        ? <span style={{ opacity: 0.75 }}> — {nextVisit.location}</span>
                        : ''}
                    </span>
                  </span>
                </div>
              </div>
            </div>
            <button className="alert-action-btn" onClick={() => setActiveTab('visits')}>
              View Schedule <ChevronRight size={18} />
            </button>
          </div>
        ) : (
          <div className="bento-item visit-alert-hero empty">
            <div className="alert-details">
              <span className="alert-badge gray">Schedule Status</span>
              <h2>No Site Visits Scheduled</h2>
              <p>Use the <strong>Site Visits</strong> tab to coordinate your next industrial assessment.</p>
              <button className="alert-action-btn secondary" onClick={() => setActiveTab('visits')}>
                Go to Scheduler <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Stat cards ── */}
      <div className="bento-grid-3">
        <div className="bento-item" style={{ display:'flex', alignItems:'center', gap:'16px' }}>
          <div style={{ width:'44px', height:'44px', borderRadius:'12px', background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Users size={20} color="#3b82f6" />
          </div>
          <div>
            <p style={{ fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--gray-400)', margin:'0 0 4px' }}>Total Interns</p>
            <h3 style={{ fontSize:'1.8rem', fontWeight:900, margin:0, color:'var(--gray-800)', lineHeight:1 }}>{String(totalStudents).padStart(2, '0')}</h3>
          </div>
        </div>

        <div className="bento-item" style={{ display:'flex', alignItems:'center', gap:'16px' }}>
          <div style={{ width:'44px', height:'44px', borderRadius:'12px', background:'#fffbeb', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <ClipboardCheck size={20} color="#d97706" />
          </div>
          <div>
            <p style={{ fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--gray-400)', margin:'0 0 4px' }}>Pending Grading</p>
            <h3 style={{ fontSize:'1.8rem', fontWeight:900, margin:0, color: pendingGradingStudents.length > 0 ? '#d97706' : 'var(--gray-800)', lineHeight:1 }}>
              {String(pendingGradingStudents.length).padStart(2, '0')}
            </h3>
          </div>
        </div>

        <div className="bento-item" style={{ display:'flex', alignItems:'center', gap:'16px' }}>
          <div style={{ width:'44px', height:'44px', borderRadius:'12px', background:'#ecfdf5', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Activity size={20} color="#10b981" />
          </div>
          <div>
            <p style={{ fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--gray-400)', margin:'0 0 4px' }}>Avg. Completion</p>
            <h3 style={{ fontSize:'1.8rem', fontWeight:900, margin:0, color:'var(--gray-800)', lineHeight:1 }}>{avgProgress}%</h3>
          </div>
        </div>
      </div>

      {/* ── Unvisited students (urgent) ── */}
      <div className="bento-item">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px', flexWrap:'wrap', gap:'10px' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px' }}>
              <AlertTriangle size={16} color={unvisitedStudents.length > 0 ? '#d97706' : '#10b981'} />
              <h3 style={{ margin:0, fontSize:'0.95rem', fontWeight:700 }}>
                {unvisitedStudents.length > 0 ? 'Students Not Yet Visited' : 'All Students Visited'}
              </h3>
            </div>
            <p style={{ margin:0, fontSize:'12px', color:'var(--gray-400)' }}>
              {unvisitedStudents.length > 0
                ? `${unvisitedStudents.length} placed student${unvisitedStudents.length !== 1 ? 's' : ''} have no completed or scheduled site visit`
                : 'All placed students have a completed or upcoming scheduled visit'}
            </p>
          </div>
          <button className="btn-primary-lite" style={{ fontSize:'12px' }} onClick={() => setActiveTab('visits')}>
            Schedule Visit <ChevronRight size={14} />
          </button>
        </div>

        {unvisitedStudents.length > 0 ? (
          <div className="table-responsive">
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:'480px' }}>
              <thead>
                <tr>
                  <th style={{ padding:'10px 14px', background:'var(--gray-50)', fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--gray-500)', textAlign:'left', borderBottom:'1px solid var(--gray-200)' }}>Student</th>
                  <th style={{ padding:'10px 14px', background:'var(--gray-50)', fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--gray-500)', textAlign:'left', borderBottom:'1px solid var(--gray-200)' }}>Company</th>
                  <th style={{ padding:'10px 14px', background:'var(--gray-50)', fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--gray-500)', textAlign:'left', borderBottom:'1px solid var(--gray-200)' }}>Location</th>
                  <th style={{ padding:'10px 14px', background:'var(--gray-50)', fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--gray-500)', textAlign:'left', borderBottom:'1px solid var(--gray-200)' }}>Progress</th>
                  <th style={{ padding:'10px 14px', background:'var(--gray-50)', fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--gray-500)', textAlign:'right', borderBottom:'1px solid var(--gray-200)' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {unvisitedStudents.map(s => (
                  <tr key={s.id || s._id} style={{ borderBottom:'1px solid var(--gray-100)' }}>
                    <td style={{ padding:'12px 14px' }}>
                      <strong style={{ fontSize:'13.5px', color:'var(--gray-800)', display:'block' }}>{s.name}</strong>
                      <span style={{ fontSize:'11px', color:'var(--gray-400)', fontFamily:'var(--font-mono)' }}>{s.index}</span>
                    </td>
                    <td style={{ padding:'12px 14px', fontSize:'13px', color:'var(--gray-700)' }}>{s.company || '—'}</td>
                    <td style={{ padding:'12px 14px' }}>
                      {s.location
                        ? <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', background:'#e0f2fe', color:'#0369a1', padding:'2px 8px', borderRadius:'20px', fontSize:'11.5px', fontWeight:600 }}><MapPin size={10} /> {s.location}</span>
                        : <span style={{ color:'var(--gray-300)', fontSize:'12px' }}>—</span>}
                    </td>
                    <td style={{ padding:'12px 14px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px', minWidth:'100px' }}>
                        <div style={{ flex:1, height:'5px', background:'var(--gray-200)', borderRadius:'3px', overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${s.progress || 0}%`, background:'linear-gradient(to right, #1e1b4b, #1768ac)', borderRadius:'3px' }} />
                        </div>
                        <span style={{ fontSize:'11px', fontWeight:700, color:'var(--gray-600)', width:'30px' }}>{s.progress || 0}%</span>
                      </div>
                    </td>
                    <td style={{ padding:'12px 14px', textAlign:'right' }}>
                      <button
                        onClick={() => setActiveTab('visits')}
                        style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'5px 12px', background:'#fffbeb', color:'#d97706', border:'1px solid #fde68a', borderRadius:'6px', fontSize:'12px', fontWeight:600, cursor:'pointer', transition:'all 0.15s' }}
                      >
                        <Eye size={13} /> Schedule
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'16px', background:'#ecfdf5', borderRadius:'10px', color:'#065f46', fontSize:'13px' }}>
            <CheckCircle2 size={18} color="#10b981" />
            All placed students have a completed or upcoming scheduled visit.
          </div>
        )}
      </div>

      {/* ── Pending grading queue ── */}
      <div className="bento-item">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px', flexWrap:'wrap', gap:'10px' }}>
          <div>
            <h3 style={{ margin:'0 0 4px', fontSize:'0.95rem', fontWeight:700 }}>Priority Assessment Queue</h3>
            <p style={{ margin:0, fontSize:'12px', color:'var(--gray-400)' }}>Students awaiting final faculty grading</p>
          </div>
          <button className="btn-primary-lite" style={{ fontSize:'12px' }} onClick={() => setActiveTab('grading')}>
            Go to Grading <ChevronRight size={14} />
          </button>
        </div>

        {pendingGradingStudents.length > 0 ? (
          <div className="table-responsive">
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:'440px' }}>
              <thead>
                <tr>
                  {['Student','Company','Progress','Status'].map(h => (
                    <th key={h} style={{ padding:'10px 14px', background:'var(--gray-50)', fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--gray-500)', textAlign:'left', borderBottom:'1px solid var(--gray-200)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pendingGradingStudents.map(s => (
                  <tr key={s.id || s._id} style={{ borderBottom:'1px solid var(--gray-100)', cursor:'pointer' }} onClick={() => setActiveTab('grading')}>
                    <td style={{ padding:'12px 14px' }}>
                      <strong style={{ fontSize:'13.5px', color:'var(--gray-800)', display:'block' }}>{s.name}</strong>
                      <span style={{ fontSize:'11px', color:'var(--gray-400)', fontFamily:'var(--font-mono)' }}>{s.index}</span>
                    </td>
                    <td style={{ padding:'12px 14px', fontSize:'13px', color:'var(--gray-700)' }}>{s.company || '—'}</td>
                    <td style={{ padding:'12px 14px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px', minWidth:'100px' }}>
                        <div style={{ flex:1, height:'5px', background:'var(--gray-200)', borderRadius:'3px', overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${s.progress || 0}%`, background:'linear-gradient(to right, #1e1b4b, #1768ac)', borderRadius:'3px' }} />
                        </div>
                        <span style={{ fontSize:'11px', fontWeight:700, color:'var(--gray-600)', width:'30px' }}>{s.progress || 0}%</span>
                      </div>
                    </td>
                    <td style={{ padding:'12px 14px' }}>
                      <span style={{ background:'#fffbeb', color:'#b45309', border:'1px solid #fde68a', padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:700 }}>
                        Pending Grading
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'16px', background:'#ecfdf5', borderRadius:'10px', color:'#065f46', fontSize:'13px' }}>
            <CheckCircle2 size={18} color="#10b981" />
            All student assessments are currently up to date.
          </div>
        )}
      </div>

    </div>
  );
};

export default AcademicOverview;