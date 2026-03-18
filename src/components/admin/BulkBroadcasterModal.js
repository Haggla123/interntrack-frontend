// src/components/admin/BulkBroadcasterModal.js
// FIX: targetCount was hardcoded to students.length even when targeting
// academic or industrial supervisors. Now accepts counts for each role
// and shows the correct number based on the selected targetRole.
import React, { useState } from 'react';
import { X, Send, Info, CheckCircle2, AlertTriangle, RefreshCcw } from 'lucide-react';
import api from '../../api';

const PLACEHOLDER = `Dear {name},\n\nThe InternTrack placement portal is now active. Please log in using your credentials to view your placement and begin submitting weekly logbook entries.\n\nFor assistance, contact your academic supervisor.`;

const BulkBroadcasterModal = ({
  isOpen,
  onClose,
  // FIX: receive separate counts per role instead of a single targetCount
  studentCount    = 0,
  academicCount   = 0,
  industrialCount = 0,
}) => {
  const [subject,     setSubject]     = useState('');
  const [message,     setMessage]     = useState('');
  const [sending,     setSending]     = useState(false);
  const [result,      setResult]      = useState(null);
  const [error,       setError]       = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [targetRole,  setTargetRole]  = useState('student');

  if (!isOpen) return null;

  // FIX: derive the count from the selected role
  const targetCount = targetRole === 'student'    ? studentCount
                    : targetRole === 'academic'   ? academicCount
                    : industrialCount;

  const roleLabel = targetRole === 'student'    ? 'student'
                  : targetRole === 'academic'   ? 'academic supervisor'
                  : 'industrial supervisor';

  const previewText = (message || PLACEHOLDER).replace(/\{name\}/gi, 'Kwame');

  const handleSend = async () => {
    if (!subject.trim()) { setError('Please enter an email subject.'); return; }
    if (!message.trim()) { setError('Please enter a message body.');   return; }
    setSending(true); setError(''); setResult(null);
    try {
      const data = await api.sendBroadcast({ subject, message, targetRole });
      setResult(data);
    } catch (err) {
      setError(err.message || 'Broadcast failed. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setSubject(''); setMessage(''); setResult(null); setError(''); setShowPreview(false);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content scale-in" style={{ maxWidth:'620px' }}>
        <div className="modal-header">
          <div className="header-title-flex">
            <div className="icon-box-amber"><Send size={22} /></div>
            <h3>Portal Broadcaster</h3>
          </div>
          <button className="close-x" onClick={handleClose}><X /></button>
        </div>

        {result ? (
          <div style={{ padding:'40px 30px', textAlign:'center' }}>
            {result.failed === 0
              ? <CheckCircle2 size={52} color="#10b981" style={{ marginBottom:'16px' }} />
              : <AlertTriangle size={52} color="#f59e0b" style={{ marginBottom:'16px' }} />}
            <h3 style={{ margin:'0 0 8px' }}>{result.failed === 0 ? 'Broadcast Sent!' : 'Partially Sent'}</h3>
            <p style={{ color:'#64748b', fontSize:'14px' }}>
              <strong style={{ color:'#10b981' }}>{result.sent} delivered</strong>
              {result.failed > 0 && <>, <strong style={{ color:'#ef4444' }}>{result.failed} failed</strong></>}.
            </p>
            {result.errors?.length > 0 && (
              <div style={{ marginTop:'12px', background:'#fef2f2', borderRadius:'8px', padding:'12px', fontSize:'12px', color:'#ef4444', textAlign:'left' }}>
                {result.errors.map((e, i) => <div key={i}>{e.email}: {e.error}</div>)}
              </div>
            )}
            <button className="primary-btn-amber" style={{ marginTop:'24px', minWidth:'140px' }} onClick={handleClose}>Done</button>
          </div>
        ) : (
          <>
            <div className="modal-body-pushed">
              {/* Target audience */}
              <div style={{ marginBottom:'16px' }}>
                <label style={{ fontSize:'12px', fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:'6px' }}>
                  Send To
                </label>
                <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                  {[
                    { value:'student',    label:`Students (${studentCount})` },
                    { value:'academic',   label:`Academic Supervisors (${academicCount})` },
                    { value:'industrial', label:`Industrial Supervisors (${industrialCount})` },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setTargetRole(opt.value)}
                      style={{
                        padding:'6px 14px', borderRadius:'20px', border:'2px solid',
                        borderColor: targetRole === opt.value ? '#3b82f6' : '#e2e8f0',
                        background:  targetRole === opt.value ? '#eff6ff' : '#fff',
                        color:       targetRole === opt.value ? '#3b82f6' : '#64748b',
                        fontWeight:  targetRole === opt.value ? 700 : 400,
                        fontSize:'12px', cursor:'pointer',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* FIX: info banner shows count for the selected role */}
              <div className="broadcast-alert-info">
                <Info size={18} />
                <span>
                  This will send an email to <strong>{targetCount}</strong> active {roleLabel}{targetCount !== 1 ? 's' : ''}.
                </span>
              </div>

              <div className="input-group" style={{ marginTop:'20px' }}>
                <label>Email Subject</label>
                <input
                  type="text"
                  className="admin-input-select"
                  placeholder="e.g. InternTrack Portal Now Open!"
                  value={subject}
                  onChange={e => { setSubject(e.target.value); setError(''); }}
                />
              </div>

              <div className="input-group" style={{ marginTop:'15px' }}>
                <label>Message Body</label>
                <textarea
                  className="admin-textarea"
                  rows="7"
                  placeholder={PLACEHOLDER}
                  value={message}
                  onChange={e => { setMessage(e.target.value); setError(''); }}
                />
              </div>

              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'8px' }}>
                <small className="variable-hints">Use <code>{`{name}`}</code> to personalise with each recipient's first name.</small>
                <button type="button" style={{ background:'none', border:'none', fontSize:'12px', color:'#2563eb', cursor:'pointer', textDecoration:'underline' }} onClick={() => setShowPreview(p => !p)}>
                  {showPreview ? 'Hide Preview' : 'Preview Email'}
                </button>
              </div>

              {showPreview && (
                <div style={{ marginTop:'12px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'10px', padding:'16px', fontSize:'13px' }}>
                  <div style={{ fontWeight:700, color:'#1e293b', marginBottom:'4px' }}>Subject: {subject || '(no subject)'}</div>
                  <div style={{ fontWeight:600, fontSize:'12px', color:'#2c5282', marginBottom:'8px' }}>University of Energy and Natural Resources — UENR InternTrack</div>
                  <hr style={{ border:0, borderTop:'1px solid #e2e8f0', margin:'8px 0' }} />
                  <div style={{ whiteSpace:'pre-line', color:'#334155', lineHeight:1.6 }}>{previewText}</div>
                </div>
              )}

              {error && (
                <p style={{ color:'#ef4444', fontSize:'13px', marginTop:'12px', display:'flex', alignItems:'center', gap:'6px' }}>
                  <AlertTriangle size={13} /> {error}
                </p>
              )}
            </div>

            <div className="modal-footer-pushed">
              <button className="cancel-btn" onClick={handleClose} disabled={sending}>Discard</button>
              <button className="primary-btn-amber" onClick={handleSend} disabled={sending || targetCount === 0}>
                {sending
                  ? <><RefreshCcw size={15} className="spin" /> Sending to {targetCount}…</>
                  : <><Send size={15} /> Blast Announcement</>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BulkBroadcasterModal;