// src/components/academic/GradingSection.js
import React, { useState } from 'react';
import './GradingSection.css';
import { Award, FileText, CheckCircle, X, Search, GraduationCap, Loader, AlertCircle, Eye } from 'lucide-react';
import { submitGrade, updateGrade, getStudentGrade } from '../../api';

const GradingSection = ({ students, setStudents, setActiveTab, onViewLogbook, onViewReport, onGradeUpdate }) => {
  const [searchTerm, setSearchTerm]     = useState('');
  const [showFinalizer, setFinalizer]   = useState(null);
  const [selectedGrade, setGrade]       = useState('');
  const [submitting, setSubmitting]     = useState(false);
  const [errorMsg, setErrorMsg]         = useState('');
  // View Evaluation modal state
  const [evalModal, setEvalModal]       = useState(null);  // { student, grades[] }
  const [evalLoading, setEvalLoading]   = useState(false);

  const filtered = students.filter(s =>
    (s.name  || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.index || '').includes(searchTerm)
  );

  const handleConfirmGrade = async () => {
    if (!selectedGrade) { setErrorMsg('Please select a grade.'); return; }
    setSubmitting(true);
    setErrorMsg('');
    const studentId = showFinalizer._id || showFinalizer.id;
    try {
      if (showFinalizer.status === 'Graded' && showFinalizer.gradeId) {
        // Update existing grade record
        await updateGrade(showFinalizer.gradeId, { grade: selectedGrade });
      } else {
        // New grade
        await submitGrade({ studentId, grade: selectedGrade, type: 'academic' });
      }
      if (onGradeUpdate) onGradeUpdate(studentId, selectedGrade);
      setFinalizer(null);
      setGrade('');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save grade. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const gradeColor = (g) => {
    if (!g || g === '-') return '#94a3b8';
    if (g === 'A')  return '#15803d';
    if (g === 'B+' || g === 'B') return '#0369a1';
    if (g === 'C+' || g === 'C') return '#b45309';
    return '#dc2626';
  };

  // FIX: Legacy records stored score as Math.round(pct/10) so values 0–10.
  // New records store the raw percentage 0–100.
  // Normalise both to /100 for display.
  const displayScore = (raw) => {
    if (raw == null || raw === 0) return null;
    const n = Number(raw);
    return n <= 10 ? n * 10 : n;   // ≤10 → old format, scale up
  };

  const handleViewEvaluation = async (student) => {
    setEvalLoading(true);
    setEvalModal({ student, grades: [] });
    try {
      const res    = await getStudentGrade(student._id || student.id);
      const grades = Array.isArray(res) ? res : Array.isArray(res.data) ? res.data : [];
      setEvalModal({ student, grades });
    } catch {
      setEvalModal({ student, grades: null });
    } finally {
      setEvalLoading(false);
    }
  };

  return (
    <div className="grading-container fade-in">
      <div className="bento-item welcome-box academic-banner">
        <div className="badge-pill">University Grading Center</div>
        <h2>Final Internship Assessment</h2>
        <p>Evaluate industrial competency and logbook compliance for finalized grading.</p>
      </div>

      <div className="grading-search-header">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by student name or index..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="grading-stats-mini">
          <span>Total: {students.length}</span>
          <span className="pending-tag">
            Pending: {students.filter(s => s.status !== 'Graded').length}
          </span>
        </div>
      </div>

      <div className="grading-card bento-item" style={{ marginTop:'8px' }}>
        <div className="table-responsive">
          <table className="grading-table">
            <thead>
              <tr>
                <th>Intern Details</th>
                <th>Indus. Score (100)</th>
                <th>Logbook / Report</th>
                <th>Status</th>
                <th>Final Grade</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map(s => (
                <tr key={s.id || s._id} className={s.status === 'Graded' ? 'row-graded' : ''}>
                  <td>
                    <div className="name-cell">
                      <strong>{s.name}</strong>
                      <span>{s.index}</span>
                    </div>
                  </td>
                  <td>
                    <div className="score-pill">
                      <Award size={14} /> {displayScore(s.indusScore) != null ? `${displayScore(s.indusScore)}/100` : '—'}
                    </div>
                  </td>
                  <td>
                    <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                      <button
                        className="view-logbook-btn"
                        onClick={() => onViewLogbook ? onViewLogbook(s) : setActiveTab('view-logbook')}
                      >
                        <FileText size={14} /> View Logbook
                      </button>
                      {/* View Final Report — opens ReportReviewer where supervisor can download & grade */}
                      <button
                        className="view-logbook-btn"
                        style={{ background:'#f0fdf4', color:'#15803d', borderColor:'#86efac' }}
                        onClick={() => onViewReport ? onViewReport(s) : setActiveTab('view-report')}
                      >
                        <FileText size={14} /> View Report
                      </button>
                      {/* View Evaluation: shows the industrial supervisor's scored breakdown */}
                      <button
                        className="view-logbook-btn"
                        style={{ background:'#eef2ff', color:'#4f46e5', borderColor:'#c7d2fe' }}
                        onClick={() => handleViewEvaluation(s)}
                      >
                        <Eye size={14} /> View Evaluation
                      </button>
                    </div>
                  </td>
                  <td>
                    <span className={`pill ${(s.status || '').toLowerCase().replace(/ /g, '-')}`}>
                      {s.status || 'Pending Grading'}
                    </span>
                  </td>
                  <td className="grade-cell-bold" style={{ color: gradeColor(s.finalGrade), fontWeight: 800 }}>
                    {s.finalGrade || '—'}
                  </td>
                  <td>
                    <button
                      className={`finalize-btn ${s.status === 'Graded' ? 'edit' : ''}`}
                      onClick={() => { setFinalizer(s); setGrade(s.finalGrade !== '-' ? s.finalGrade : ''); }}
                    >
                      {s.status === 'Graded' ? 'Edit' : <><CheckCircle size={14} /> Grade</>}
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="no-results">
                    {searchTerm ? `No results for "${searchTerm}"` : 'No students found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grade modal */}
      {showFinalizer && (
        <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.55)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'20px' }}
          onClick={e => e.target === e.currentTarget && (setFinalizer(null), setGrade(''), setErrorMsg(''))}>
          <div style={{ background:'#fff', borderRadius:'20px', width:'100%', maxWidth:'400px', boxShadow:'0 32px 64px -12px rgba(0,0,0,0.28), 0 0 0 1px rgba(0,0,0,0.05)', overflow:'hidden', animation:'gm-pop 0.22s cubic-bezier(0.34,1.56,0.64,1)' }}>
            <style>{`
              @keyframes gm-pop { from{opacity:0;transform:scale(0.93) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
              @keyframes gm-spin{to{transform:rotate(360deg)}}
              .gm-grade:hover { border-color:#1768ac !important; color:#1768ac !important; background:#eff6ff !important; }
              .gm-grade.sel { background:#03256c !important; color:#fff !important; border-color:#03256c !important; box-shadow:0 4px 12px rgba(3,37,108,0.25) !important; }
              .gm-save:hover:not(:disabled) { background:#1768ac !important; transform:translateY(-1px); box-shadow:0 6px 18px rgba(3,37,108,0.3) !important; }
              .gm-save:disabled { opacity:0.45; cursor:not-allowed; }
            `}</style>

            {/* Header */}
            <div style={{ background:'linear-gradient(135deg,#1e1b4b,#312e81)', padding:'20px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                <div style={{ width:'38px', height:'38px', background:'rgba(255,255,255,0.18)', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <GraduationCap size={20} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize:'14px', fontWeight:800, color:'#fff' }}>Assign Final Grade</div>
                  <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.65)' }}>{showFinalizer.name}</div>
                </div>
              </div>
              <button onClick={() => { setFinalizer(null); setGrade(''); setErrorMsg(''); }} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'8px', width:'30px', height:'30px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#fff' }}>
                <X size={15} />
              </button>
            </div>

            <div style={{ padding:'20px 24px' }}>
              {/* Industrial score badge */}
              {displayScore(showFinalizer.indusScore) != null && (
                <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 14px', background:'#f8fafc', borderRadius:'10px', border:'1px solid #e2e8f0', marginBottom:'16px' }}>
                  <Award size={16} color="#6366f1" />
                  <span style={{ fontSize:'13px', color:'#475569' }}>Industrial Score:</span>
                  <span style={{ fontSize:'14px', fontWeight:800, color:'#4f46e5', fontFamily:'var(--font-mono)' }}>{displayScore(showFinalizer.indusScore)}/100</span>
                </div>
              )}

              {errorMsg && (
                <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 14px', background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:'10px', color:'#dc2626', fontSize:'13px', marginBottom:'14px' }}>
                  <AlertCircle size={14} /> {errorMsg}
                </div>
              )}

              <div style={{ fontSize:'11.5px', fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'10px' }}>Select Letter Grade</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'8px', marginBottom:'20px' }}>
                {['A','B+','B','C+','C','D','F'].map(g => (
                  <button key={g} className={`gm-grade ${selectedGrade === g ? 'sel' : ''}`}
                    onClick={() => setGrade(g)}
                    style={{ padding:'14px 8px', border:'2px solid #e2e8f0', background:'#f8fafc', color:'#64748b', borderRadius:'10px', fontWeight:800, fontSize:'1.05rem', cursor:'pointer', transition:'all 0.15s', fontFamily:'var(--font-mono)' }}>
                    {g}
                  </button>
                ))}
              </div>

              <button className="gm-save" onClick={handleConfirmGrade} disabled={submitting || !selectedGrade}
                style={{ width:'100%', padding:'13px', background:'#03256c', border:'none', borderRadius:'12px', fontWeight:700, fontSize:'14px', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', transition:'all 0.2s', boxShadow:'0 2px 8px rgba(3,37,108,0.2)' }}>
                {submitting
                  ? <><div style={{ width:'16px', height:'16px', border:'2.5px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'gm-spin 0.8s linear infinite' }} /> Saving…</>
                  : 'Submit Final Grade'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── View Evaluation modal ── */}
      {evalModal && (
        <>
          <style>{`
            @keyframes eval-sheet  { from{opacity:0;transform:translateY(100%)} to{opacity:1;transform:translateY(0)} }
            @keyframes eval-center { from{opacity:0;transform:scale(0.95) translateY(6px)} to{opacity:1;transform:scale(1) translateY(0)} }
            @keyframes eval-spin   { to{transform:rotate(360deg)} }
            .eval-grid { display:grid; grid-template-columns:1fr 1fr; gap:5px; }
            /* Mobile: slide up from bottom as a sheet */
            .eval-overlay { position:fixed; inset:0; background:rgba(15,23,42,0.55); backdrop-filter:blur(6px); display:flex; align-items:flex-end; justify-content:center; z-index:1000; }
            .eval-shell   { width:100%; max-width:100%; max-height:75vh; border-radius:18px 18px 0 0; animation:eval-sheet 0.28s cubic-bezier(0.32,0.72,0,1); }
            /* Desktop (≥540px): center as a regular modal */
            @media (min-width:540px) {
              .eval-overlay { align-items:center; padding:16px; }
              .eval-shell   { max-width:480px; max-height:86vh; border-radius:16px; animation:eval-center 0.2s cubic-bezier(0.34,1.56,0.64,1); }
            }
          `}</style>
          <div className="eval-overlay" onClick={e => e.target === e.currentTarget && setEvalModal(null)}>
            <div className="eval-shell" style={{ background:'#fff', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 -6px 32px rgba(0,0,0,0.18)' }}>

              {/* Drag pill — mobile only visual */}
              <div style={{ width:'32px', height:'3px', background:'#cbd5e1', borderRadius:'2px', margin:'8px auto 0', flexShrink:0 }} />

              {/* Header + score strip */}
              <div style={{ background:'linear-gradient(135deg,#1e1b4b,#4338ca)', padding:'10px 14px 12px', flexShrink:0, marginTop:'4px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:(!evalLoading && Array.isArray(evalModal.grades) && evalModal.grades.length > 0) ? '8px' : '0' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'7px', minWidth:0 }}>
                    <Eye size={13} color="rgba(255,255,255,0.7)" style={{ flexShrink:0 }} />
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:'12.5px', fontWeight:800, color:'#fff' }}>Industrial Evaluation</div>
                      <div style={{ fontSize:'10.5px', color:'rgba(255,255,255,0.5)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{evalModal.student?.name}</div>
                    </div>
                  </div>
                  <button onClick={() => setEvalModal(null)} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'6px', width:'24px', height:'24px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#fff', flexShrink:0 }}>
                    <X size={12} />
                  </button>
                </div>

                {!evalLoading && Array.isArray(evalModal.grades) && evalModal.grades.length > 0 && (() => {
                  const indus = evalModal.grades.find(g => g.type === 'industrial');
                  if (!indus) return null;
                  const raw = displayScore(indus.score) ?? 0;
                  const sc  = raw >= 70 ? '#34d399' : raw >= 50 ? '#fbbf24' : '#f87171';
                  const gc  = indus.grade;
                  return (
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', background:'rgba(0,0,0,0.2)', borderRadius:'8px', padding:'6px 10px' }}>
                      <span style={{ fontFamily:'var(--font-mono)', fontWeight:900, fontSize:'1.25rem', color:sc, lineHeight:1, letterSpacing:'-0.5px', flexShrink:0 }}>{raw}</span>
                      <span style={{ fontSize:'9px', color:'rgba(255,255,255,0.4)', fontWeight:700, alignSelf:'flex-end', paddingBottom:'1px', flexShrink:0 }}>/100</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ height:'5px', background:'rgba(255,255,255,0.15)', borderRadius:'3px', overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${Math.min(raw,100)}%`, background:sc, borderRadius:'3px' }} />
                        </div>
                      </div>
                      <div style={{ width:'28px', height:'28px', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.12)', border:`1.5px solid ${gradeColor(gc)}55`, fontFamily:'var(--font-mono)', fontWeight:900, fontSize:'0.85rem', color:'#fff', flexShrink:0 }}>{gc}</div>
                    </div>
                  );
                })()}
              </div>

              {/* Scrollable body */}
              <div style={{ padding:'10px 12px', overflowY:'auto', flex:1, WebkitOverflowScrolling:'touch' }}>

                {evalLoading && (
                  <div style={{ textAlign:'center', padding:'20px', color:'#94a3b8' }}>
                    <div style={{ width:'20px', height:'20px', border:'2.5px solid #e2e8f0', borderTopColor:'#6366f1', borderRadius:'50%', animation:'eval-spin 0.8s linear infinite', margin:'0 auto 6px' }} />
                    <p style={{ fontSize:'12px', margin:0 }}>Loading…</p>
                  </div>
                )}

                {!evalLoading && evalModal.grades === null && (
                  <p style={{ textAlign:'center', color:'#ef4444', padding:'16px', fontSize:'12px', margin:0 }}>Could not load evaluation data.</p>
                )}

                {!evalLoading && Array.isArray(evalModal.grades) && evalModal.grades.length === 0 && (
                  <div style={{ textAlign:'center', padding:'18px 16px', color:'#94a3b8' }}>
                    <Award size={22} color="#cbd5e1" style={{ margin:'0 auto 6px', display:'block' }} />
                    <p style={{ fontWeight:700, color:'#64748b', margin:'0 0 2px', fontSize:'12.5px' }}>Not yet evaluated</p>
                    <p style={{ fontSize:'11.5px', margin:0 }}>The industrial supervisor hasn't submitted an evaluation yet.</p>
                  </div>
                )}

                {!evalLoading && Array.isArray(evalModal.grades) && evalModal.grades.length > 0 && (() => {
                  const indus = evalModal.grades.find(g => g.type === 'industrial');
                  if (!indus) return <p style={{ textAlign:'center', color:'#94a3b8', padding:'14px', fontSize:'12px' }}>No industrial grade found.</p>;

                  const CRITERIA = [
                    { key:'attendance',          label:'Attendance',    max:15 },
                    { key:'punctuality',         label:'Punctuality',   max:15 },
                    { key:'cooperation',         label:'Co-operation',  max:10 },
                    { key:'aptitudeForLearning', label:'Aptitude',      max:15 },
                    { key:'understandingOfJob',  label:'Understanding', max:15 },
                    { key:'safetyAdherence',     label:'Safety & Env.', max:15 },
                    { key:'workIndependently',   label:'Works Indep.',  max:15 },
                  ].filter(c => indus[c.key] != null);

                  return (
                    <>
                      {CRITERIA.length > 0 && (
                        <div className="eval-grid" style={{ marginBottom:'8px' }}>
                          {CRITERIA.map(({ key, label, max }) => {
                            const pct = Math.round((indus[key] / max) * 100);
                            const bar = pct >= 70 ? '#6366f1' : pct >= 50 ? '#f59e0b' : '#ef4444';
                            return (
                              <div key={key} style={{ padding:'6px 8px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'7px' }}>
                                <div style={{ fontSize:'9px', fontWeight:800, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.3px', marginBottom:'2px' }}>{label}</div>
                                <div style={{ display:'flex', alignItems:'baseline', gap:'1px', marginBottom:'3px' }}>
                                  <span style={{ fontSize:'0.95rem', fontWeight:900, color:'#1e293b', fontFamily:'var(--font-mono)' }}>{indus[key]}</span>
                                  <span style={{ fontSize:'9px', color:'#94a3b8' }}>/{max}</span>
                                </div>
                                <div style={{ height:'3px', background:'#e2e8f0', borderRadius:'2px', overflow:'hidden' }}>
                                  <div style={{ height:'100%', width:`${pct}%`, background:bar, borderRadius:'2px' }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {indus.comments && (
                        <div style={{ padding:'6px 10px', background:'#f0f9ff', borderLeft:'3px solid #3b82f6', borderRadius:'0 6px 6px 0', fontSize:'11.5px', color:'#0369a1', lineHeight:1.5, marginBottom:'6px' }}>
                          <div style={{ fontSize:'8.5px', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.5px', color:'#2563eb', marginBottom:'2px' }}>Supervisor Comment</div>
                          {indus.comments}
                        </div>
                      )}

                      {indus.submittedBy?.name && (
                        <div style={{ fontSize:'10px', color:'#94a3b8', textAlign:'right', display:'flex', alignItems:'center', justifyContent:'flex-end', gap:'3px' }}>
                          <Award size={9} /> Evaluated by <strong style={{ color:'#64748b' }}>{indus.submittedBy.name}</strong>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Footer */}
              <div style={{ padding:'8px 12px 10px', borderTop:'1px solid #f1f5f9', background:'#fff', flexShrink:0 }}>
                <button onClick={() => setEvalModal(null)} style={{ width:'100%', padding:'9px', background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:'9px', fontSize:'13px', fontWeight:700, color:'#475569', cursor:'pointer' }}>Close</button>
              </div>

            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default GradingSection;