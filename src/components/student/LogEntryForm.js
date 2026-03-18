// src/components/student/LogEntryForm.js
import React, { useState, useEffect } from 'react';
import {
  Send, Lock, CheckCircle2, AlertCircle, Loader,
  Calendar, Tag, Briefcase,
} from 'lucide-react';
import './LogEntryForm.css';
import { submitLog, getMyLogs } from '../../api';

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MIN_CHARS = 20;
const MAX_CHARS = 1000;

// Circular character-count ring
const CharRing = ({ count, max = MAX_CHARS }) => {
  const r    = 18;
  const circ = 2 * Math.PI * r;
  const pct  = Math.min(count / max, 1);
  const dash = circ * pct;
  const near = count >= MIN_CHARS;
  const full = count >= max * 0.9;
  const color = full ? '#ef4444' : near ? '#10b981' : '#94a3b8';
  return (
    <svg width="44" height="44" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx="22" cy="22" r={r} fill="none" stroke="#f1f5f9" strokeWidth="3" />
      <circle
        cx="22" cy="22" r={r} fill="none"
        stroke={color} strokeWidth="3"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.2s, stroke 0.2s' }}
      />
      <text
        x="22" y="26"
        textAnchor="middle"
        style={{ transform: 'rotate(90deg)', transformOrigin: '22px 22px',
                 fontSize: '9px', fontWeight: 700, fill: color, fontFamily: 'var(--font-mono)' }}
      >
        {count < 1000 ? count : `${(count/1000).toFixed(1)}k`}
      </text>
    </svg>
  );
};

const LogEntryForm = ({ isLocationVerified }) => {
  const [activity,         setActivity]         = useState('');
  const [skills,           setSkills]           = useState('');
  const [status,           setStatus]           = useState('idle');
  const [errorMsg,         setErrorMsg]         = useState('');
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [checkingToday,    setCheckingToday]    = useState(true);

  // FIX: read from both storages — "Don't Remember Me" sessions use sessionStorage
  const placement = (() => {
    try {
      const raw = localStorage.getItem('studentPlacement') || sessionStorage.getItem('studentPlacement');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  })();

  const now       = new Date();
  const dayOfWeek = now.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const dayName   = DAYS[dayOfWeek];
  const dateStr   = now.toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  useEffect(() => {
    const check = async () => {
      try {
        const res  = await getMyLogs();
        const logs = res?.data || res || [];
        const today = new Date().toDateString();
        setAlreadySubmitted(logs.some(l => new Date(l.date).toDateString() === today));
      } catch { /* backend will guard */ }
      finally { setCheckingToday(false); }
    };
    check();
  }, [status]);

  const isLocked  = isWeekend || alreadySubmitted;
  const canSubmit = !isLocked && isLocationVerified &&
                    activity.trim().length >= MIN_CHARS &&
                    status !== 'submitting';

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setStatus('submitting');
    setErrorMsg('');
    try {
      await submitLog({
        activity:    activity.trim(),
        skills:      skills.trim(),
        companyName: placement?.companyName || '',
        companyId:   placement?.companyId   || null,
      });
      setStatus('success');
      setActivity('');
      setSkills('');
      setAlreadySubmitted(true);
      setTimeout(() => setStatus('idle'), 4000);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message || 'Failed to submit. Please try again.');
    }
  };

  // State-derived UI tokens
  const locIcon  = isLocationVerified ? '✓' : '⊘';
  const locLabel = isLocationVerified ? 'On-site' : 'Off-site';
  const locColor = isLocationVerified ? '#10b981' : '#f59e0b';
  const locBg    = isLocationVerified ? '#f0fdf4' : '#fffbeb';
  const locBorder= isLocationVerified ? '#86efac' : '#fde68a';

  const subLabel = isWeekend     ? `${dayName} — Locked`
                 : alreadySubmitted ? 'Submitted today'
                 :                   'Open for today';
  const subColor = isWeekend     ? '#94a3b8'
                 : alreadySubmitted ? '#10b981'
                 :                   '#3b82f6';

  return (
    <div className="dlf-root fade-in">

      {/* ── Date / context header ── */}
      <div className="dlf-header">
        <div className="dlf-header-left">
          <div className="dlf-date-badge">
            <Calendar size={13} />
            <span>{dateStr}</span>
          </div>
          {placement?.companyName && (
            <div className="dlf-company-tag">
              <Briefcase size={12} />
              <span>{placement.companyName}</span>
            </div>
          )}
        </div>

        <div className="dlf-status-chips">
          {/* Location chip */}
          <div className="dlf-chip" style={{ background: locBg, borderColor: locBorder, color: locColor }}>
            <span className="dlf-chip-dot" style={{ background: locColor }} />
            {locIcon} {locLabel}
          </div>
          {/* Submission chip */}
          <div className="dlf-chip" style={{
            background: isWeekend ? '#f8fafc' : alreadySubmitted ? '#f0fdf4' : '#eff6ff',
            borderColor: isWeekend ? '#e2e8f0' : alreadySubmitted ? '#86efac' : '#bfdbfe',
            color: subColor,
          }}>
            <span className="dlf-chip-dot" style={{ background: subColor }} />
            {subLabel}
          </div>
        </div>
      </div>

      {/* ── Lock banners ── */}
      {isWeekend && (
        <div className="dlf-banner dlf-banner-gray">
          <Lock size={16} />
          <div>
            <strong>Weekend — Submissions Locked</strong>
            <p>Log entries are only accepted Monday through Friday.</p>
          </div>
        </div>
      )}

      {!isWeekend && alreadySubmitted && status !== 'success' && (
        <div className="dlf-banner dlf-banner-green">
          <CheckCircle2 size={16} />
          <div>
            <strong>Today's log submitted!</strong>
            <p>Your supervisor will review it shortly. See you tomorrow.</p>
          </div>
        </div>
      )}

      {status === 'success' && (
        <div className="dlf-banner dlf-banner-green">
          <CheckCircle2 size={16} />
          <div>
            <strong>Entry submitted successfully</strong>
            <p>Your logbook has been updated and sent for review.</p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="dlf-banner dlf-banner-red">
          <AlertCircle size={16} />
          <div>
            <strong>Submission failed</strong>
            <p>{errorMsg}</p>
          </div>
        </div>
      )}

      {/* ── Main form card ── */}
      <div className="dlf-card">

        {/* Activity section */}
        <div className="dlf-section">
          <div className="dlf-section-head">
            <div>
              <div className="dlf-section-label">Daily Activity</div>
              <div className="dlf-section-sub">Describe your technical tasks, challenges and solutions today</div>
            </div>
            <CharRing count={activity.length} />
          </div>

          <textarea
            className="dlf-textarea"
            placeholder="Write a detailed description of what you worked on today — tasks completed, tools used, problems solved, and what you learned…"
            value={activity}
            maxLength={MAX_CHARS}
            onChange={e => setActivity(e.target.value)}
            disabled={isLocked || !isLocationVerified || status === 'submitting' || checkingToday}
          />

          {activity.length > 0 && activity.length < MIN_CHARS && (
            <p className="dlf-hint-warn">
              {MIN_CHARS - activity.length} more character{MIN_CHARS - activity.length !== 1 ? 's' : ''} needed
            </p>
          )}
          {activity.length >= MIN_CHARS && (
            <p className="dlf-hint-ok">
              <CheckCircle2 size={12} style={{ display:'inline', marginRight:'4px' }} />
              Minimum met
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="dlf-divider" />

        {/* Skills section */}
        <div className="dlf-section">
          <div className="dlf-section-label" style={{ display:'flex', alignItems:'center', gap:'6px' }}>
            <Tag size={13} /> Skills Applied / Learned
            <span className="dlf-optional-tag">optional</span>
          </div>
          <input
            type="text"
            className="dlf-input"
            placeholder="e.g. React Hooks, Database Indexing, UI Design"
            value={skills}
            maxLength={200}
            onChange={e => setSkills(e.target.value)}
            disabled={isLocked || !isLocationVerified || status === 'submitting' || checkingToday}
          />
        </div>

        {/* Divider */}
        <div className="dlf-divider" />

        {/* Submit footer */}
        <div className="dlf-footer">
          <div className="dlf-footer-hint">
            {!isLocationVerified && !isWeekend && !alreadySubmitted && (
              <span className="dlf-footer-warn">Verify your location above before submitting</span>
            )}
            {isLocationVerified && !isLocked && activity.length < MIN_CHARS && activity.length > 0 && (
              <span className="dlf-footer-warn">Entry must be at least {MIN_CHARS} characters</span>
            )}
            {canSubmit && (
              <span className="dlf-footer-ready">Ready to submit</span>
            )}
          </div>

          <button
            className={`dlf-submit-btn ${canSubmit ? 'dlf-submit-ready' : ''}`}
            disabled={!canSubmit || checkingToday}
            onClick={handleSubmit}
          >
            {checkingToday
              ? <><Loader size={16} className="dlf-spin" /> Checking…</>
              : status === 'submitting'
              ? <><Loader size={16} className="dlf-spin" /> Submitting…</>
              : isLocked
              ? <><Lock size={16} /> Locked</>
              : <><Send size={16} /> Submit Entry</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogEntryForm;