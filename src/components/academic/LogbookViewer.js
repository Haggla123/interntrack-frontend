// src/components/academic/LogbookViewer.js
import React, { useState, useEffect } from 'react';
import {
  ChevronLeft, Tag, BookOpen, CheckCircle2, AlertCircle,
  Clock, Award, Shield, TrendingUp,
} from 'lucide-react';
import './LogbookViewer.css';
import { getStudentLogs } from '../../api';

const groupByWeek = (logs) => {
  if (!logs.length) return [];
  const weeks = {};
  logs.forEach(log => {
    const w = log.week || 1;
    if (!weeks[w]) weeks[w] = [];
    weeks[w].push(log);
  });
  Object.values(weeks).forEach(days =>
    days.sort((a, b) => new Date(a.date) - new Date(b.date))
  );
  return Object.entries(weeks)
    .map(([w, days]) => ({ week: Number(w), days }))
    .sort((a, b) => b.week - a.week); // newest first
};

const statusClass = (s) =>
  s === 'Approved' ? 'approved' : s === 'Rejected' ? 'rejected' : 'pending';

const StatusIcon = ({ s }) => {
  if (s === 'Approved') return <CheckCircle2 size={10} />;
  if (s === 'Rejected') return <AlertCircle size={10} />;
  return <Clock size={10} />;
};

const LogbookViewer = ({ student, onBack }) => {
  const [logs,         setLogs]         = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [selectedWeek, setSelectedWeek] = useState(null);

  useEffect(() => {
    if (!student) return;
    setLoading(true);
    setError('');
    setLogs([]);
    setSelectedWeek(null);
    getStudentLogs(student._id || student.id)
      .then(res => setLogs(Array.isArray(res) ? res : Array.isArray(res.data) ? res.data : []))
      .catch(() => setError('Could not load logbook entries.'))
      .finally(() => setLoading(false));
  }, [student]);

  if (!student) return null;

  const grouped    = groupByWeek(logs);
  const activeWeek = selectedWeek ?? (grouped[0]?.week ?? 1);
  const weekData   = grouped.find(w => w.week === activeWeek);

  const totalLogs  = logs.length;
  const approved   = logs.filter(l => l.status === 'Approved').length;
  const pending    = logs.filter(l => l.status === 'Pending').length;
  const verifyRate = totalLogs ? Math.round((approved / totalLogs) * 100) : 0;

  return (
    <div className="lv-root fade-in">

      {/* Header */}
      <div className="lv-header">
        <button className="lv-back-btn" onClick={onBack}>
          <ChevronLeft size={15} /> Back to Grading
        </button>
        <div className="lv-student-block">
          <h2 className="lv-student-name">{student.name}'s Logbook</h2>
          <div className="lv-student-meta">
            <span className="lv-meta-pill">{student.index}</span>
            {(student.company || student.companyName) && (
              <span className="lv-company-tag">{student.company || student.companyName}</span>
            )}
            {student.department && (
              <span className="lv-company-tag">{student.department}</span>
            )}
          </div>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="lv-skeleton">
          {[120, 90, 100].map((h, i) => (
            <div className="lv-skel-row" key={i}>
              <div className="lv-skel-date">
                <div className="lv-skel-bar" style={{ width: '60%', marginLeft: 'auto' }} />
                <div className="lv-skel-bar" style={{ width: '40%', marginLeft: 'auto', marginTop: 4 }} />
              </div>
              <div className="lv-skel-card" style={{ height: h }} />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="lv-error-box">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {!loading && !error && logs.length === 0 && (
        <div className="lv-empty">
          <div className="lv-empty-icon"><BookOpen size={28} /></div>
          <h4>No entries yet</h4>
          <p>This student hasn't submitted any logbook entries.</p>
        </div>
      )}

      {!loading && !error && logs.length > 0 && (
        <>
          {/* Stats strip */}
          <div className="lv-stats-strip">
            {[
              { icon: <TrendingUp size={16} color="#3b82f6"  />, bg: '#eff6ff', label: 'Total Entries', value: totalLogs },
              { icon: <CheckCircle2 size={16} color="#10b981"/>, bg: '#f0fdf4', label: 'Approved',      value: approved  },
              { icon: <Clock size={16} color="#f59e0b"       />, bg: '#fffbeb', label: 'Pending',       value: pending   },
              { icon: <Shield size={16} color="#6366f1"      />, bg: '#eef2ff', label: 'Verify Rate',   value: `${verifyRate}%` },
              { icon: <Award  size={16} color="#0369a1"      />, bg: '#e0f2fe', label: 'Weeks Logged',  value: grouped.length },
            ].map(({ icon, bg, label, value }) => (
              <div className="lv-stat-chip" key={label}>
                <div className="lv-stat-chip-icon" style={{ background: bg }}>{icon}</div>
                <div>
                  <div className="lv-stat-chip-label">{label}</div>
                  <div className="lv-stat-chip-value">{value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Week navigation */}
          <div className="lv-nav">
            <div className="lv-week-tabs">
              {grouped.map(({ week, days }) => {
                const wPending  = days.filter(l => l.status === 'Pending').length;
                const wApproved = days.filter(l => l.status === 'Approved').length;
                const dotColor  = wPending > 0 ? '#fbbf24'
                                : wApproved === days.length ? '#34d399' : '#94a3b8';
                const isActive  = activeWeek === week;
                return (
                  <button
                    key={week}
                    className={`lv-week-tab ${isActive ? 'active' : ''}`}
                    onClick={() => setSelectedWeek(week)}
                  >
                    Wk {week}
                    <span className="lv-tab-dot" style={{
                      background:  isActive ? dotColor : 'transparent',
                      border:      isActive ? 'none' : `1.5px solid ${dotColor}`,
                    }} />
                  </button>
                );
              })}
            </div>
            <div className="lv-nav-verify">
              <CheckCircle2 size={14} color="#34d399" />
              <span className="lv-verify-rate">{verifyRate}%</span>
              <span>verified</span>
            </div>
          </div>

          {/* Timeline */}
          {weekData ? (
            <div className="lv-timeline" key={activeWeek}>
              {weekData.days.map((log, i) => {
                const d      = new Date(log.date);
                const day    = d.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase();
                const num    = d.getDate();
                const month  = d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();
                const sClass = statusClass(log.status);
                return (
                  <div className="lv-entry" key={log._id || i}>
                    <div className="lv-date-col">
                      <span className="lv-day-name">{day}</span>
                      <span className="lv-date-num">{num}</span>
                      <span className="lv-month">{month}</span>
                    </div>

                    <div className={`lv-node ${sClass}`} />

                    <div className="lv-card">
                      <div className="lv-card-top">
                        <p className="lv-activity">{log.activity}</p>
                        <span className={`lv-status-badge ${sClass}`}>
                          <StatusIcon s={log.status} /> {log.status}
                        </span>
                      </div>
                      <div className="lv-card-footer">
                        {log.skills && (
                          <span className="lv-skills-tag">
                            <Tag size={11} /> {log.skills}
                          </span>
                        )}
                        {log.supervisorNote && (
                          <div className="lv-sup-note">
                            <span className="lv-sup-note-label">Note</span>
                            {log.supervisorNote}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="lv-empty" style={{ padding: '40px' }}>
              <p>No entries for Week {activeWeek}.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LogbookViewer;