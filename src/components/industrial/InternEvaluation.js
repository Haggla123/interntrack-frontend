// src/components/industrial/InternEvaluation.js
// Redesigned: shows Not Evaluated / Evaluated tabs so the supervisor
// sees at a glance who still needs a score. Evaluated students show
// their submitted grade inline with an Edit button. After submitting,
// the student moves tabs immediately.
import React, { useState, useEffect, useCallback } from 'react';
import {
  Award, CheckCircle2, AlertCircle, Loader, Users,
  Clock, Edit3, ChevronRight, RotateCcw,
} from 'lucide-react';
import { getStudents, getMyGrades, submitGrade, updateGrade } from '../../api';

// ── Grade helpers ─────────────────────────────────────────────────
const scoreToGrade = (pct) => {
  if (pct >= 80) return 'A';
  if (pct >= 75) return 'B+';
  if (pct >= 70) return 'B';
  if (pct >= 65) return 'C+';
  if (pct >= 60) return 'C';
  if (pct >= 55) return 'D+';
  if (pct >= 45) return 'D';
  return 'F';
};

// grades store the raw percentage (0–100). Normalise both to /100.
const normaliseScore = (raw) => {
  if (raw == null) return null;
  const n = Number(raw);
  return n <= 10 ? n * 10 : n;
};

const gradeColor = (g) => {
  if (!g || g === '-') return '#94a3b8';
  if (g === 'A')               return '#15803d';
  if (g === 'B+' || g === 'B') return '#0369a1';
  if (g === 'C+' || g === 'C') return '#b45309';
  return '#dc2626';
};

const CRITERIA = [
  { name: 'attendance',          label: 'Attendance',                              max: 15 },
  { name: 'punctuality',         label: 'Punctuality',                             max: 15 },
  { name: 'cooperation',         label: 'Co-operation',                            max: 10 },
  { name: 'aptitudeForLearning', label: 'Aptitude for Learning',                   max: 15 },
  { name: 'understandingOfJob',  label: 'Understanding of Job',                    max: 15 },
  { name: 'safetyAdherence',     label: 'Adherence to Safety & Environment Rules', max: 15 },
  { name: 'workIndependently',   label: 'Ability to Work Independently',           max: 15 },
];

const DEFAULT_SCORES = Object.fromEntries(CRITERIA.map(c => [c.name, Math.round(c.max * 0.7)]));

// ── Evaluated card ────────────────────────────────────────────────
const EvaluatedCard = ({ student, grade, onEdit }) => {
  const g     = grade?.grade || '—';
  const score = normaliseScore(grade?.score);
  const gc    = gradeColor(g);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '14px',
      padding: '13px 18px', marginBottom: '8px',
      background: '#fff',
      border: '1px solid #d1fae5',
      borderLeft: `4px solid ${gc}`,
      borderRadius: '10px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{
        width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
        background: '#f0fdf4', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: '15px', fontWeight: 800, color: '#15803d',
      }}>
        {(student.name || 'S').charAt(0)}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--gray-800)' }}>{student.name}</div>
        <div style={{ fontSize: '11px', color: 'var(--gray-400)', fontFamily: 'var(--font-mono)', marginTop: '1px' }}>
          {student.indexNumber || student.index} · {student.department}
        </div>
      </div>

      <div style={{ textAlign: 'center', flexShrink: 0 }}>
        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--gray-400)', marginBottom: '1px' }}>Score</div>
        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--gray-700)', fontFamily: 'var(--font-mono)' }}>
          {score != null ? score : '—'}<span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--gray-400)' }}>{score != null ? '/100' : ''}</span>
        </div>
      </div>

      <div style={{
        width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: gc + '1a', border: `2px solid ${gc}40`,
        fontSize: '1rem', fontWeight: 900, color: gc, fontFamily: 'var(--font-mono)',
      }}>
        {g}
      </div>

      <button
        onClick={() => onEdit(student, grade)}
        style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: '6px 12px', border: '1.5px solid var(--gray-200)',
          borderRadius: '7px', background: '#fff', color: 'var(--gray-500)',
          fontSize: '12px', fontWeight: 600, cursor: 'pointer', flexShrink: 0,
          transition: 'all 0.15s',
        }}
      >
        <Edit3 size={12} /> Edit
      </button>
    </div>
  );
};

// ── Pending card ──────────────────────────────────────────────────
const PendingCard = ({ student, onStart }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '14px',
    padding: '13px 18px', marginBottom: '8px',
    background: '#fff',
    border: '1px solid var(--gray-200)',
    borderLeft: '4px solid #f59e0b',
    borderRadius: '10px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  }}>
    <div style={{
      width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
      background: '#fffbeb', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: '15px', fontWeight: 800, color: '#d97706',
    }}>
      {(student.name || 'S').charAt(0)}
    </div>

    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--gray-800)' }}>{student.name}</div>
      <div style={{ fontSize: '11px', color: 'var(--gray-400)', fontFamily: 'var(--font-mono)', marginTop: '1px' }}>
        {student.indexNumber || student.index} · {student.department}
      </div>
    </div>

    <span style={{
      padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
      background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a',
      display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0,
    }}>
      <Clock size={10} /> Pending
    </span>

    <button
      onClick={() => onStart(student)}
      style={{
        display: 'flex', alignItems: 'center', gap: '5px',
        padding: '7px 14px', border: 'none',
        borderRadius: '7px', background: 'var(--brand-navy)', color: '#fff',
        fontSize: '12px', fontWeight: 700, cursor: 'pointer', flexShrink: 0,
        transition: 'background 0.15s',
      }}
    >
      Evaluate <ChevronRight size={13} />
    </button>
  </div>
);

// ── Evaluation form ───────────────────────────────────────────────
const EvalForm = ({ student, existingGrade, onSubmit, onCancel, submitting, errMsg }) => {
  const [scores,   setScores]   = useState(() =>
    existingGrade
      ? Object.fromEntries(
          CRITERIA.map(c => [c.name, existingGrade[c.name] ?? Math.round(c.max * 0.7)])
        )
      : DEFAULT_SCORES
  );
  const [comments, setComments] = useState(existingGrade?.comments || '');

  const total      = CRITERIA.reduce((sum, c) => sum + (scores[c.name] || 0), 0);
  const totalColor = total >= 70 ? '#10b981' : total >= 50 ? '#f59e0b' : '#ef4444';

  const setScore = (name, val, max) =>
    setScores(prev => ({ ...prev, [name]: Math.min(max, Math.max(0, Number(val))) }));

  const barColor = (val, max) => {
    const p = val / max;
    return p >= 0.8 ? '#10b981' : p >= 0.5 ? '#f59e0b' : '#ef4444';
  };

  return (
    <div style={{
      background: '#fff', border: '1px solid var(--gray-200)',
      borderRadius: '14px', padding: '24px',
      boxShadow: '0 4px 24px rgba(3,37,108,0.08)', marginBottom: '16px',
    }}>
      {/* Form header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{
          width: '42px', height: '42px', borderRadius: '50%',
          background: 'var(--brand-navy)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '16px', fontWeight: 900, color: '#fff', flexShrink: 0,
        }}>
          {(student.name || 'S').charAt(0)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--gray-800)' }}>
            {existingGrade ? 'Edit Evaluation:' : 'Evaluating:'} {student.name}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--gray-400)', fontFamily: 'var(--font-mono)' }}>
            {student.indexNumber || student.index} · {student.department}
          </div>
        </div>
        <button onClick={onCancel} style={{
          background: 'none', border: '1px solid var(--gray-200)', borderRadius: '7px',
          padding: '6px 12px', fontSize: '12px', color: 'var(--gray-500)', cursor: 'pointer',
        }}>
          Cancel
        </button>
      </div>

      {errMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#dc2626', fontSize: '13px', marginBottom: '16px' }}>
          <AlertCircle size={14} /> {errMsg}
        </div>
      )}

      {/* Sliders */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
        {CRITERIA.map(({ name, label, max }) => {
          const val = scores[name] || 0;
          const color = barColor(val, max);
          return (
            <div key={name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)' }}>{label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '13px', color }}>
                  {val}<span style={{ fontSize: '10px', fontWeight: 400, color: 'var(--gray-400)' }}>/{max}</span>
                </span>
              </div>
              <div style={{ position: 'relative', height: '8px', background: 'var(--gray-200)', borderRadius: '4px' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${(val/max)*100}%`, background: color, borderRadius: '4px', transition: 'width 0.15s' }} />
                <input type="range" min={0} max={max} step={1} value={val}
                  onChange={e => setScore(name, e.target.value, max)}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', margin: 0 }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gray-600)' }}>Total Score</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '20px', color: totalColor }}>{total}</span>
            <span style={{ fontSize: '11px', color: 'var(--gray-400)' }}>/ 100</span>
            <span style={{
              padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 800,
              background: total >= 70 ? '#ecfdf5' : total >= 50 ? '#fffbeb' : '#fef2f2',
              color: totalColor,
              border: `1px solid ${total >= 70 ? '#86efac' : total >= 50 ? '#fde68a' : '#fca5a5'}`,
            }}>
              {scoreToGrade(total)}
            </span>
          </div>
        </div>
        <div style={{ height: '6px', background: 'var(--gray-200)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${total}%`, background: totalColor, borderRadius: '3px', transition: 'width 0.25s ease' }} />
        </div>
      </div>

      {/* Comments */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gray-600)', display: 'block', marginBottom: '6px' }}>Comments (optional)</label>
        <textarea className="corporate-textarea" rows={2}
          placeholder="Additional observations…"
          value={comments} onChange={e => setComments(e.target.value)}
          style={{ fontSize: '13px' }} />
      </div>

      <button
        onClick={() => onSubmit(scores, comments, total)}
        disabled={submitting}
        style={{
          width: '100%', padding: '11px', border: 'none', borderRadius: '9px',
          background: 'var(--brand-navy)', color: '#fff', fontWeight: 700, fontSize: '14px',
          cursor: submitting ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          opacity: submitting ? 0.7 : 1,
        }}
      >
        {submitting
          ? <><Loader size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Saving…</>
          : <><Award size={16} /> {existingGrade ? 'Update Evaluation' : 'Submit Evaluation'}</>}
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </button>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────
const InternEvaluation = () => {
  const [students,   setStudents]   = useState([]);
  const [myGrades,   setMyGrades]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState('pending');
  const [editing,    setEditing]    = useState(null); // { student, grade|null }
  const [submitting, setSubmitting] = useState(false);
  const [errMsg,     setErrMsg]     = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, gRes] = await Promise.all([getStudents(), getMyGrades()]);
      const toArr = r => Array.isArray(r) ? r : Array.isArray(r?.data) ? r.data : [];
      setStudents(toArr(sRes));
      // Only keep industrial type grades submitted by this user
      setMyGrades(toArr(gRes).filter(g => g.type === 'industrial'));
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // O(1) lookup: studentId → grade record
  const evaluatedMap = new Map(
    myGrades.map(g => [(g.student?._id || g.student || '').toString(), g])
  );

  const notEvaluated = students.filter(s => !evaluatedMap.has((s._id || s.id || '').toString()));
  const evaluated    = students.filter(s =>  evaluatedMap.has((s._id || s.id || '').toString()));

  const handleStart  = (student)        => { setEditing({ student, grade: null }); setErrMsg(''); };
  const handleEdit   = (student, grade) => { setEditing({ student, grade });       setErrMsg(''); };
  const handleCancel = ()               => { setEditing(null); setErrMsg(''); };

  const handleSubmit = async (scores, comments, pct) => {
    setSubmitting(true);
    setErrMsg('');
    const { student, grade: existingGrade } = editing;
    const payload = {
      grade:    scoreToGrade(pct),
      // store the raw 100-point total score
      score:    pct,
      comments: comments.trim(),
      // store all 7 UENR criteria as their actual raw marks
      // (e.g. attendance out of 15, cooperation out of 10, etc.)
      
      attendance:          scores.attendance,
      punctuality:         scores.punctuality,
      cooperation:         scores.cooperation,
      aptitudeForLearning: scores.aptitudeForLearning,
      understandingOfJob:  scores.understandingOfJob,
      safetyAdherence:     scores.safetyAdherence,
      workIndependently:   scores.workIndependently,
    };
    try {
      if (existingGrade) {
        await updateGrade(existingGrade._id, payload);
      } else {
        await submitGrade({ ...payload, studentId: student._id || student.id, type: 'industrial' });
      }
      setSuccessMsg(`${student.name} — Grade ${scoreToGrade(pct)} saved`);
      setEditing(null);
      setTimeout(() => setSuccessMsg(''), 4000);
      await loadData();
      setActiveTab('done');
    } catch (e) {
      setErrMsg(e.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const tabBtn = (key, label, count) => (
    <button
      onClick={() => setActiveTab(key)}
      style={{
        padding: '7px 18px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
        cursor: 'pointer', border: '1.5px solid', transition: 'all 0.15s',
        borderColor: activeTab === key ? 'var(--brand-navy)' : 'var(--gray-200)',
        background:  activeTab === key ? 'var(--brand-navy)' : '#fff',
        color:       activeTab === key ? '#fff' : 'var(--gray-500)',
        display: 'inline-flex', alignItems: 'center', gap: '6px',
      }}
    >
      {label}
      <span style={{
        padding: '1px 7px', borderRadius: '20px', fontSize: '11px',
        background: activeTab === key ? 'rgba(255,255,255,0.2)' : 'var(--gray-100)',
        color: activeTab === key ? '#fff' : 'var(--gray-500)',
      }}>
        {count}
      </span>
    </button>
  );

  return (
    <div style={{ maxWidth: '740px', margin: '0 auto' }} className="fade-in">

      {/* Banner */}
      <div className="bento-item welcome-box hero-gradient" style={{ marginBottom: '20px', padding: '22px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <Award size={17} style={{ opacity: 0.8 }} />
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>Industrial Evaluation</span>
        </div>
        <h2 style={{ color: '#fff', margin: '0 0 5px', fontSize: '1.35rem', fontWeight: 800 }}>UENR Internship Assessment</h2>
        <p style={{ color: 'rgba(255,255,255,0.72)', margin: 0, fontSize: '13px' }}>
          Evaluate intern performance across 7 official UENR criteria (100 marks total)
        </p>
      </div>

      {/* Stats row */}
      {!loading && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { label: 'Total',     value: students.length,       bg: '#eff6ff', color: '#1d4ed8' },
            { label: 'Evaluated', value: evaluated.length,      bg: '#f0fdf4', color: '#15803d' },
            { label: 'Pending',   value: notEvaluated.length,   bg: notEvaluated.length > 0 ? '#fffbeb' : '#f0fdf4', color: notEvaluated.length > 0 ? '#b45309' : '#15803d' },
          ].map(({ label, value, bg, color }) => (
            <div key={label} style={{ padding: '8px 16px', background: bg, borderRadius: '8px', border: `1px solid ${color}25`, display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 900, color, fontFamily: 'var(--font-mono)' }}>{value}</span>
              <span style={{ fontSize: '10px', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</span>
            </div>
          ))}
          <button onClick={loadData} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 13px', border: '1px solid var(--gray-200)', borderRadius: '8px', background: '#fff', color: 'var(--gray-500)', fontSize: '12px', cursor: 'pointer' }}>
            <RotateCcw size={12} /> Refresh
          </button>
        </div>
      )}

      {/* Success */}
      {successMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 16px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', color: '#15803d', fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>
          <CheckCircle2 size={15} /> {successMsg}
        </div>
      )}

      {/* Evaluation form (replaces list when active) */}
      {editing && (
        <EvalForm
          student={editing.student}
          existingGrade={editing.grade}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitting={submitting}
          errMsg={errMsg}
        />
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '40px', color: 'var(--gray-400)' }}>
          <Loader size={20} style={{ animation: 'spin 0.8s linear infinite' }} />
          <span style={{ fontSize: '14px' }}>Loading interns…</span>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* Tabs + lists */}
      {!loading && !editing && (
        <>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            {tabBtn('pending', <><Clock size={12} /> Not Evaluated</>, notEvaluated.length)}
            {tabBtn('done',    <><CheckCircle2 size={12} /> Evaluated</>,  evaluated.length)}
            {tabBtn('all',     <><Users size={12} /> All</>,               students.length)}
          </div>

          {/* Not evaluated */}
          {activeTab === 'pending' && (
            notEvaluated.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '52px 24px', color: 'var(--gray-400)' }}>
                <CheckCircle2 size={40} color="#10b981" style={{ margin: '0 auto 12px', display: 'block', opacity: 0.5 }} />
                <p style={{ fontWeight: 700, color: 'var(--gray-600)', margin: '0 0 4px', fontSize: '15px' }}>All interns evaluated!</p>
                <p style={{ fontSize: '13px', margin: 0 }}>Switch to the Evaluated tab to view or edit scores.</p>
              </div>
            ) : (
              <>
                <p style={{ fontSize: '12px', color: 'var(--gray-400)', fontWeight: 600, marginBottom: '10px' }}>
                  {notEvaluated.length} intern{notEvaluated.length !== 1 ? 's' : ''} awaiting evaluation
                </p>
                {notEvaluated.map(s => (
                  <PendingCard key={s._id || s.id} student={s} onStart={handleStart} />
                ))}
              </>
            )
          )}

          {/* Evaluated */}
          {activeTab === 'done' && (
            evaluated.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '52px 24px', color: 'var(--gray-400)' }}>
                <Users size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
                <p style={{ fontWeight: 700, color: 'var(--gray-600)', margin: '0 0 4px', fontSize: '15px' }}>No evaluations yet</p>
                <p style={{ fontSize: '13px', margin: 0 }}>Go to the Not Evaluated tab to get started.</p>
              </div>
            ) : (
              <>
                <p style={{ fontSize: '12px', color: 'var(--gray-400)', fontWeight: 600, marginBottom: '10px' }}>
                  {evaluated.length} intern{evaluated.length !== 1 ? 's' : ''} evaluated
                </p>
                {evaluated.map(s => {
                  const sid   = (s._id || s.id || '').toString();
                  const grade = evaluatedMap.get(sid);
                  return <EvaluatedCard key={sid} student={s} grade={grade} onEdit={handleEdit} />;
                })}
              </>
            )
          )}

          {/* All interns — evaluated first, then pending */}
          {activeTab === 'all' && (
            students.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '52px 24px', color: 'var(--gray-400)' }}>
                <Users size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
                <p style={{ fontWeight: 700, color: 'var(--gray-600)', margin: '0 0 4px', fontSize: '15px' }}>No interns assigned</p>
              </div>
            ) : (
              <>
                <p style={{ fontSize: '12px', color: 'var(--gray-400)', fontWeight: 600, marginBottom: '10px' }}>
                  {students.length} intern{students.length !== 1 ? 's' : ''} total
                  {' · '}{evaluated.length} evaluated{' · '}{notEvaluated.length} pending
                </p>
                {/* Evaluated first */}
                {evaluated.map(s => {
                  const sid   = (s._id || s.id || '').toString();
                  const grade = evaluatedMap.get(sid);
                  return <EvaluatedCard key={sid} student={s} grade={grade} onEdit={handleEdit} />;
                })}
                {/* Then not-evaluated */}
                {notEvaluated.map(s => (
                  <PendingCard key={s._id || s.id} student={s} onStart={handleStart} />
                ))}
              </>
            )
          )}
        </>
      )}
    </div>
  );
};

export default InternEvaluation;