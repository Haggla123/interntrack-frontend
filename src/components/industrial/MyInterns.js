// src/components/industrial/MyInterns.js
// Shows the industrial supervisor a list of their assigned interns
// with details, placement info, and expandable logbook entries.
import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Search, ChevronDown, ChevronUp, BookOpen,
  Loader, RotateCcw, MapPin, Calendar, CheckCircle2,
  Clock, XCircle, User,
} from 'lucide-react';
import { getStudents, getStudentLogs } from '../../api';

// ── Status badge helper ───────────────────────────────────────────
const statusStyle = (status) => {
  switch (status) {
    case 'Active':
      return { bg: '#ecfdf5', color: '#15803d', border: '#86efac' };
    case 'Completed':
      return { bg: '#eff6ff', color: '#1d4ed8', border: '#93c5fd' };
    default:
      return { bg: '#fffbeb', color: '#b45309', border: '#fde68a' };
  }
};

const logStatusIcon = (status) => {
  if (status === 'Approved')  return <CheckCircle2 size={12} color="#15803d" />;
  if (status === 'Rejected')  return <XCircle size={12} color="#dc2626" />;
  return <Clock size={12} color="#b45309" />;
};

// ── Single intern row with expandable logs ────────────────────────
const InternCard = ({ student }) => {
  const [expanded, setExpanded] = useState(false);
  const [logs, setLogs]         = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsLoaded, setLogsLoaded]   = useState(false);

  const toggleLogs = async () => {
    if (!expanded && !logsLoaded) {
      setLoadingLogs(true);
      try {
        const res = await getStudentLogs(student._id || student.id);
        const arr = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        setLogs(arr);
        setLogsLoaded(true);
      } catch { /* silent */ }
      finally { setLoadingLogs(false); }
    }
    setExpanded(prev => !prev);
  };

  const st = statusStyle(student.placementStatus);
  const company = student.companyId?.name || student.companyName || '—';
  const acSup = student.academicSupervisor;

  return (
    <div style={{
      background: '#fff',
      border: '1px solid var(--gray-200)',
      borderRadius: '12px',
      marginBottom: '10px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      overflow: 'hidden',
    }}>
      {/* Main row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '14px',
        padding: '14px 18px', cursor: 'pointer',
      }} onClick={toggleLogs}>
        {/* Avatar */}
        <div style={{
          width: '42px', height: '42px', borderRadius: '50%', flexShrink: 0,
          background: 'var(--brand-navy)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '16px', fontWeight: 900, color: '#fff',
        }}>
          {(student.name || 'S').charAt(0).toUpperCase()}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--gray-800)' }}>
            {student.name}
          </div>
          <div style={{
            fontSize: '11.5px', color: 'var(--gray-400)',
            fontFamily: 'var(--font-mono)', marginTop: '2px',
            display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center',
          }}>
            <span>{student.indexNumber || '—'}</span>
            <span style={{ opacity: 0.4 }}>·</span>
            <span>{student.department || '—'}</span>
          </div>
        </div>

        {/* Company pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: '4px 12px', borderRadius: '20px', flexShrink: 0,
          background: '#f1f5f9', fontSize: '11px', fontWeight: 600,
          color: 'var(--gray-600)',
        }}>
          <MapPin size={11} />
          {company}
        </div>

        {/* Status badge */}
        <span style={{
          padding: '3px 10px', borderRadius: '20px', fontSize: '11px',
          fontWeight: 700, flexShrink: 0,
          background: st.bg, color: st.color, border: `1px solid ${st.border}`,
        }}>
          {student.placementStatus || 'Unplaced'}
        </span>

        {/* Expand toggle */}
        <div style={{ flexShrink: 0, color: 'var(--gray-400)' }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* Expanded section — details + logbook */}
      {expanded && (
        <div style={{
          borderTop: '1px solid var(--gray-100)',
          padding: '16px 18px',
          background: 'var(--gray-50, #f8fafc)',
        }}>
          {/* Detail grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '10px', marginBottom: '16px',
          }}>
            <DetailItem label="Email" value={student.email} />
            <DetailItem label="Company" value={company} />
            <DetailItem
              label="Academic Supervisor"
              value={acSup ? `${acSup.name}${acSup.department ? ` (${acSup.department})` : ''}` : '—'}
            />
            <DetailItem
              label="Joined"
              value={student.createdAt
                ? new Date(student.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                : '—'}
            />
          </div>

          {/* Logbook entries */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            marginBottom: '10px',
          }}>
            <BookOpen size={14} color="var(--gray-500)" />
            <span style={{
              fontSize: '12px', fontWeight: 700, color: 'var(--gray-600)',
              textTransform: 'uppercase', letterSpacing: '0.4px',
            }}>
              Logbook Entries
            </span>
            <span style={{
              padding: '1px 8px', borderRadius: '20px', fontSize: '11px',
              background: 'var(--gray-200, #e2e8f0)', color: 'var(--gray-500)',
              fontWeight: 700,
            }}>
              {logs.length}
            </span>
          </div>

          {loadingLogs && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '16px', color: 'var(--gray-400)', fontSize: '13px',
            }}>
              <Loader size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
              Loading logs…
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          )}

          {!loadingLogs && logs.length === 0 && (
            <p style={{
              fontSize: '13px', color: 'var(--gray-400)',
              padding: '12px 0', margin: 0,
            }}>
              No logbook entries yet.
            </p>
          )}

          {!loadingLogs && logs.length > 0 && (
            <div style={{
              display: 'flex', flexDirection: 'column', gap: '6px',
              maxHeight: '300px', overflowY: 'auto',
            }}>
              {logs.map(log => {
                const id = log._id || log.id;
                return (
                  <div key={id} style={{
                    display: 'flex', gap: '10px', alignItems: 'flex-start',
                    padding: '10px 12px', background: '#fff',
                    border: '1px solid var(--gray-200)',
                    borderRadius: '8px', fontSize: '13px',
                  }}>
                    <div style={{ flexShrink: 0, marginTop: '2px' }}>
                      {logStatusIcon(log.status)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', marginBottom: '3px',
                      }}>
                        <span style={{
                          fontSize: '11px', color: 'var(--gray-400)',
                          fontFamily: 'var(--font-mono)',
                        }}>
                          {log.date
                            ? new Date(log.date).toLocaleDateString('en-GB', {
                                weekday: 'short', day: 'numeric', month: 'short',
                              })
                            : '—'}
                          {log.week != null && ` · Week ${log.week}`}
                        </span>
                        <span style={{
                          fontSize: '10px', fontWeight: 700,
                          padding: '1px 7px', borderRadius: '10px',
                          background: log.status === 'Approved' ? '#ecfdf5'
                                    : log.status === 'Rejected' ? '#fef2f2'
                                    : '#fffbeb',
                          color: log.status === 'Approved' ? '#15803d'
                               : log.status === 'Rejected' ? '#dc2626'
                               : '#b45309',
                        }}>
                          {log.status}
                        </span>
                      </div>
                      <p style={{ margin: 0, color: 'var(--gray-700)', lineHeight: 1.45 }}>
                        {log.activity}
                      </p>
                      {log.skills && (
                        <p style={{
                          margin: '4px 0 0', fontSize: '11px',
                          color: 'var(--gray-400)', fontStyle: 'italic',
                        }}>
                          Skills: {log.skills}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Detail item ───────────────────────────────────────────────────
const DetailItem = ({ label, value }) => (
  <div>
    <div style={{
      fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '0.4px', color: 'var(--gray-400)', marginBottom: '2px',
    }}>
      {label}
    </div>
    <div style={{
      fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)',
      wordBreak: 'break-word',
    }}>
      {value || '—'}
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────
const MyInterns = () => {
  const [students, setStudents]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getStudents();
      const arr = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      setStudents(arr);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  const filtered = students.filter(s => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (s.name || '').toLowerCase().includes(q) ||
      (s.indexNumber || '').toLowerCase().includes(q) ||
      (s.department || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto' }} className="fade-in">

      {/* Banner */}
      <div className="bento-item welcome-box hero-gradient" style={{ marginBottom: '20px', padding: '22px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <Users size={17} style={{ opacity: 0.8 }} />
          <span style={{
            fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '1px', opacity: 0.8,
          }}>
            Industrial Supervisor
          </span>
        </div>
        <h2 style={{ color: '#fff', margin: '0 0 5px', fontSize: '1.35rem', fontWeight: 800 }}>
          My Interns
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.72)', margin: 0, fontSize: '13px' }}>
          View your assigned interns, their details, and logbook entries
        </p>
      </div>

      {/* Controls row */}
      {!loading && (
        <div style={{
          display: 'flex', gap: '10px', marginBottom: '14px',
          alignItems: 'center', flexWrap: 'wrap',
        }}>
          {/* Search */}
          <div style={{
            flex: 1, minWidth: '200px', position: 'relative',
          }}>
            <Search size={14} style={{
              position: 'absolute', left: '12px', top: '50%',
              transform: 'translateY(-50%)', color: 'var(--gray-400)',
            }} />
            <input
              type="text"
              placeholder="Search by name, index, department…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '9px 12px 9px 34px',
                border: '1.5px solid var(--gray-200)', borderRadius: '8px',
                fontSize: '13px', outline: 'none', background: '#fff',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Count + refresh */}
          <span style={{
            padding: '6px 14px', borderRadius: '8px', fontSize: '12px',
            fontWeight: 700, background: '#eff6ff', color: '#1d4ed8',
            border: '1px solid #93c5fd25',
          }}>
            {filtered.length} intern{filtered.length !== 1 ? 's' : ''}
          </span>

          <button
            onClick={loadStudents}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '7px 13px', border: '1px solid var(--gray-200)',
              borderRadius: '8px', background: '#fff', color: 'var(--gray-500)',
              fontSize: '12px', cursor: 'pointer',
            }}
          >
            <RotateCcw size={12} /> Refresh
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '10px', padding: '40px', color: 'var(--gray-400)',
        }}>
          <Loader size={20} style={{ animation: 'spin 0.8s linear infinite' }} />
          <span style={{ fontSize: '14px' }}>Loading interns…</span>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '52px 24px', color: 'var(--gray-400)',
        }}>
          <User size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
          <p style={{
            fontWeight: 700, color: 'var(--gray-600)',
            margin: '0 0 4px', fontSize: '15px',
          }}>
            {search ? 'No interns match your search' : 'No interns assigned'}
          </p>
          <p style={{ fontSize: '13px', margin: 0 }}>
            {search
              ? 'Try a different search term.'
              : 'Interns will appear here once they are placed at your company.'}
          </p>
        </div>
      )}

      {/* Intern cards */}
      {!loading && filtered.map(s => (
        <InternCard key={s._id || s.id} student={s} />
      ))}
    </div>
  );
};

export default MyInterns;