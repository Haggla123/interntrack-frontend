// src/components/student/LogbookHistory.js
import React, { useState, useEffect } from 'react';
import {
  ChevronDown, Tag, AlertCircle, BookOpen,
  CheckCircle2, Clock, XCircle, TrendingUp, Calendar,
} from 'lucide-react';
import './LogbookHistory.css';
import { getMyLogs } from '../../api';

const groupByWeek = (logs) => {
  if (!logs.length) return [];
  const weeks = {};
  logs.forEach(log => {
    const w = log.week || 1;
    if (!weeks[w]) weeks[w] = { week: w, days: [] };
    weeks[w].days.push(log);
  });
  Object.values(weeks).forEach(w =>
    w.days.sort((a, b) => new Date(a.date) - new Date(b.date))
  );
  return Object.values(weeks).sort((a, b) => b.week - a.week);
};

const STATUS_META = {
  Approved: { color: '#15803d', bg: '#f0fdf4', border: '#86efac', icon: <CheckCircle2 size={11} />, dot: '#10b981' },
  Rejected: { color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', icon: <XCircle    size={11} />, dot: '#ef4444' },
  Pending:  { color: '#b45309', bg: '#fffbeb', border: '#fcd34d', icon: <Clock       size={11} />, dot: '#f59e0b' },
};
const sm = (s) => STATUS_META[s] || STATUS_META.Pending;

// Week summary strip: coloured dots for each day
const WeekDots = ({ days }) => (
  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
    {days.map((log, i) => (
      <span key={i} title={log.status} style={{
        width: '8px', height: '8px', borderRadius: '50%',
        background: sm(log.status).dot, flexShrink: 0,
      }} />
    ))}
  </div>
);

const LogbookHistory = () => {
  const [weeklyLogs, setWeeklyLogs] = useState([]);
  const [allLogs,    setAllLogs]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [openWeek,   setOpenWeek]   = useState(null);
  const [filter,     setFilter]     = useState('all'); // 'all'|'approved'|'pending'|'rejected'

  useEffect(() => {
    getMyLogs()
      .then(res => {
        const arr = Array.isArray(res) ? res : Array.isArray(res.data) ? res.data : [];
        setAllLogs(arr);
        const grouped = groupByWeek(arr);
        setWeeklyLogs(grouped);
        if (grouped.length) setOpenWeek(grouped[0].week);
      })
      .catch(() => setError('Could not load logbook. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const total    = allLogs.length;
  const approved = allLogs.filter(l => l.status === 'Approved').length;
  const pending  = allLogs.filter(l => l.status === 'Pending').length;
  const rejected = allLogs.filter(l => l.status === 'Rejected').length;

  // Filter weeks: if a filter is active, only show weeks that have matching entries
  const visibleWeeks = filter === 'all'
    ? weeklyLogs
    : weeklyLogs
        .map(w => ({ ...w, days: w.days.filter(l => l.status.toLowerCase() === filter) }))
        .filter(w => w.days.length > 0);

  const FILTERS = [
    { key: 'all',      label: 'All',      count: total,    dot: '#64748b' },
    { key: 'approved', label: 'Approved', count: approved, dot: '#10b981' },
    { key: 'pending',  label: 'Pending',  count: pending,  dot: '#f59e0b' },
    { key: 'rejected', label: 'Rejected', count: rejected, dot: '#ef4444' },
  ];

  return (
    <div className="lbh-root fade-in">

      {/* ── Header ── */}
      <div className="lbh-header">
        <div className="lbh-header-icon">
          <BookOpen size={20} />
        </div>
        <div>
          <h3 className="lbh-title">Logbook Archive</h3>
          <p className="lbh-sub">Your daily entries grouped by internship week</p>
        </div>
      </div>

      {/* ── Stats strip ── */}
      {!loading && !error && total > 0 && (
        <div className="lbh-stats">
          {[
            { label: 'Total Entries', value: total,    color: '#3b82f6', bg: '#eff6ff' },
            { label: 'Approved',      value: approved, color: '#10b981', bg: '#f0fdf4' },
            { label: 'Pending',       value: pending,  color: '#f59e0b', bg: '#fffbeb' },
            { label: 'Rejected',      value: rejected, color: '#ef4444', bg: '#fef2f2' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className="lbh-stat-chip" style={{ background: bg }}>
              <span className="lbh-stat-val" style={{ color }}>{value}</span>
              <span className="lbh-stat-label">{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Filter tabs ── */}
      {!loading && !error && total > 0 && (
        <div className="lbh-filters">
          {FILTERS.map(({ key, label, count, dot }) => (
            <button
              key={key}
              className={`lbh-filter-btn ${filter === key ? 'active' : ''}`}
              onClick={() => setFilter(key)}
            >
              <span className="lbh-filter-dot" style={{ background: dot }} />
              {label}
              <span className="lbh-filter-count">{count}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="lbh-skeleton">
          {[1, 2, 3].map(i => (
            <div key={i} className="lbh-skel-row" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="lbh-error">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && !error && total === 0 && (
        <div className="lbh-empty">
          <div className="lbh-empty-icon"><BookOpen size={30} /></div>
          <p className="lbh-empty-title">No entries yet</p>
          <p className="lbh-empty-sub">Submit your first entry from the <strong>Daily Log</strong> tab.</p>
        </div>
      )}

      {/* ── No results for filter ── */}
      {!loading && !error && total > 0 && visibleWeeks.length === 0 && (
        <div className="lbh-empty" style={{ padding: '36px' }}>
          <p className="lbh-empty-title" style={{ fontSize: '14px' }}>
            No {filter} entries yet
          </p>
        </div>
      )}

      {/* ── Week accordion list ── */}
      <div className="lbh-weeks">
        {visibleWeeks.map((weekData) => {
          const isOpen      = openWeek === weekData.week;
          const wApproved   = weekData.days.filter(l => l.status === 'Approved').length;
          const wPending    = weekData.days.filter(l => l.status === 'Pending').length;
          const wRejected   = weekData.days.filter(l => l.status === 'Rejected').length;
          const allApproved = wApproved === weekData.days.length;
          const hasPending  = wPending > 0;

          // Week accent colour
          const accentColor = allApproved ? '#10b981' : hasPending ? '#f59e0b' : '#ef4444';

          return (
            <div key={weekData.week} className={`lbh-week ${isOpen ? 'open' : ''}`}>

              {/* Week header */}
              <button
                className="lbh-week-header"
                onClick={() => setOpenWeek(isOpen ? null : weekData.week)}
                style={{ borderLeft: `4px solid ${accentColor}` }}
              >
                <div className="lbh-week-left">
                  <div className="lbh-week-badge" style={{ background: accentColor + '18', color: accentColor }}>
                    <Calendar size={12} />
                    <span>Week {weekData.week}</span>
                  </div>
                  <WeekDots days={weekData.days} />
                </div>

                <div className="lbh-week-right">
                  <div className="lbh-week-counts">
                    {wApproved > 0 && <span style={{ color: '#15803d', fontWeight: 700, fontSize: '11px' }}>{wApproved}✓</span>}
                    {wPending  > 0 && <span style={{ color: '#b45309', fontWeight: 700, fontSize: '11px' }}>{wPending}…</span>}
                    {wRejected > 0 && <span style={{ color: '#dc2626', fontWeight: 700, fontSize: '11px' }}>{wRejected}✗</span>}
                    <span className="lbh-entry-count">{weekData.days.length} {weekData.days.length === 1 ? 'entry' : 'entries'}</span>
                  </div>
                  <ChevronDown
                    size={16}
                    style={{ transition: 'transform 0.25s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}
                  />
                </div>
              </button>

              {/* Day entries */}
              {isOpen && (
                <div className="lbh-days">
                  {weekData.days.map((log, i) => {
                    const d       = new Date(log.date);
                    const dayName = d.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase();
                    const num     = d.getDate();
                    const month   = d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();
                    const meta    = sm(log.status);
                    return (
                      <div
                        key={log._id || i}
                        className="lbh-day-entry"
                        style={{ animationDelay: `${i * 0.05}s` }}
                      >
                        {/* Date stamp */}
                        <div className="lbh-day-date">
                          <span className="lbh-day-name">{dayName}</span>
                          <span className="lbh-day-num">{num}</span>
                          <span className="lbh-day-month">{month}</span>
                        </div>

                        {/* Connector dot */}
                        <div className="lbh-day-node" style={{ background: meta.dot }} />

                        {/* Content */}
                        <div className="lbh-day-content">
                          <div className="lbh-day-top">
                            <p className="lbh-day-activity">{log.activity}</p>
                            <span className="lbh-status-badge" style={{
                              color: meta.color, background: meta.bg, border: `1px solid ${meta.border}`,
                            }}>
                              {meta.icon} {log.status}
                            </span>
                          </div>

                          <div className="lbh-day-footer">
                            {log.skills && (
                              <span className="lbh-skills-tag">
                                <Tag size={11} /> {log.skills}
                              </span>
                            )}
                            {log.supervisorNote && (
                              <div className="lbh-sup-note">
                                <span className="lbh-sup-label">Note</span>
                                {log.supervisorNote}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress summary footer */}
      {!loading && total > 0 && (
        <div className="lbh-footer-bar">
          <TrendingUp size={14} />
          <span>
            <strong>{approved}</strong> of <strong>{total}</strong> entries approved
          </span>
          <div className="lbh-footer-track">
            <div className="lbh-footer-fill" style={{ width: total > 0 ? `${(approved / total) * 100}%` : '0%' }} />
          </div>
          <span className="lbh-footer-pct">
            {total > 0 ? Math.round((approved / total) * 100) : 0}%
          </span>
        </div>
      )}
    </div>
  );
};

export default LogbookHistory;