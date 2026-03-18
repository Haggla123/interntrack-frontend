// src/components/industrial/PendingApprovals.js
import React, { useState, useEffect } from 'react';
import { Check, X, MapPin, Award, ChevronDown, ChevronUp, AlertCircle, BookOpen } from 'lucide-react';
import { getPendingLogs, approveLog, rejectLog } from '../../api';

const PendingApprovals = () => {
  const [logs, setLogs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [notes, setNotes]       = useState({});     // { logId: noteText }
  const [expanded, setExpanded] = useState({});     // { logId: bool }
  const [acting, setActing]     = useState(null);   // logId being actioned

  useEffect(() => {
    (async () => {
      try {
        const res = await getPendingLogs();
        const arr = Array.isArray(res) ? res : Array.isArray(res.data) ? res.data : [];
        setLogs(arr);
      } catch {
        setError('Could not load pending logs. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleApprove = async (log) => {
    const id = log._id || log.id;
    setActing(id);
    try {
      await approveLog(id, notes[id] || '');
      setLogs(prev => prev.filter(l => (l._id || l.id) !== id));
    } catch {
      setError('Failed to approve. Please try again.');
    } finally {
      setActing(null);
    }
  };

  const handleReject = async (log) => {
    const id = log._id || log.id;
    if (!notes[id]?.trim()) {
      setExpanded(prev => ({ ...prev, [id]: true }));
      setError('Please add a reason note before rejecting.');
      setTimeout(() => setError(''), 4000);
      return;
    }
    setActing(id);
    try {
      await rejectLog(id, notes[id]);
      setLogs(prev => prev.filter(l => (l._id || l.id) !== id));
    } catch {
      setError('Failed to reject. Please try again.');
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="bento-container fade-in">
      <div className="bento-item welcome-box">
        <div className="badge-pill">Verification Queue</div>
        <h3>Pending Logbook Entries</h3>
        <p>Review and verify the daily activities reported by your interns.</p>
      </div>

      {error && (
        <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'12px 16px', background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:'8px', color:'#dc2626', fontSize:'14px', marginBottom:'8px' }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {loading && (
        <div style={{ textAlign:'center', padding:'40px', color:'#64748b' }}>
          <p>Loading pending entries…</p>
        </div>
      )}

      {!loading && logs.length === 0 && !error && (
        <div style={{ textAlign:'center', padding:'48px 20px', color:'#94a3b8' }}>
          <BookOpen size={40} style={{ marginBottom:'12px', opacity:0.4 }} />
          <p style={{ fontWeight:600, color:'#64748b' }}>All caught up!</p>
          <p style={{ fontSize:'13px', marginTop:'4px' }}>No pending logbook entries right now.</p>
        </div>
      )}

      <div className="approval-stack">
        {logs.map(log => {
          const id       = log._id || log.id;
          const isOpen   = !!expanded[id];
          const isActing = acting === id;
          const dateStr  = new Date(log.date).toLocaleDateString('en-GB', {
            weekday: 'long', day: 'numeric', month: 'short', year: 'numeric',
          });

          return (
            <div key={id} className="bento-item review-card-bento">

              {/* Student identity */}
              <div className="review-meta-sidebar">
                <div className="student-profile-mini">
                  <div className="admin-avatar">
                    {(log.student?.name || 'S').charAt(0).toUpperCase()}
                  </div>
                  <div className="student-info-text">
                    <strong>{log.student?.name || 'Student'}</strong>
                    <p className="sub-text">{log.student?.indexNumber || ''}</p>
                    <p className="sub-text" style={{ fontSize:'11px', color:'#94a3b8' }}>{dateStr}</p>
                  </div>
                </div>
                <div className="meta-tag verified">
                  <MapPin size={12} /> Verified
                </div>
              </div>

              {/* Log content */}
              <div className="review-content-main">
                <div className="content-label">Activity Description</div>
                <p className="activity-text">"{log.activity}"</p>
                {log.skills && (
                  <div className="skills-row">
                    <Award size={14} className="text-indigo" />
                    <span className="skill-pill-lite">{log.skills}</span>
                  </div>
                )}

                {/* Expandable note box */}
                <button
                  onClick={() => setExpanded(prev => ({ ...prev, [id]: !isOpen }))}
                  style={{ marginTop:'10px', background:'none', border:'none', cursor:'pointer', color:'#64748b', fontSize:'12px', display:'flex', alignItems:'center', gap:'4px', padding:0 }}
                >
                  {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  {isOpen ? 'Hide note' : 'Add supervisor note'}
                </button>
                {isOpen && (
                  <textarea
                    rows={2}
                    placeholder="Optional note for student (required when rejecting)..."
                    value={notes[id] || ''}
                    onChange={(e) => setNotes(prev => ({ ...prev, [id]: e.target.value }))}
                    style={{ width:'100%', marginTop:'8px', padding:'8px 10px', fontSize:'13px', border:'1px solid #e2e8f0', borderRadius:'6px', resize:'vertical', fontFamily:'inherit', boxSizing:'border-box' }}
                  />
                )}
              </div>

              {/* Actions */}
              <div className="review-actions-zone">
                <button className="btn-approve-full" disabled={isActing} onClick={() => handleApprove(log)}>
                  <Check size={18} /> <span>{isActing ? '…' : 'Approve'}</span>
                </button>
                <button className="logout-action-btn btn-reject-mobile" disabled={isActing} onClick={() => handleReject(log)}>
                  <X size={16} /> <span>{isActing ? '…' : 'Reject'}</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PendingApprovals;
