// src/components/admin/BulkBroadcasterModal.js
import React, { useState } from 'react';
import { X, Send, Info, CheckCircle2, AlertTriangle, Loader, Eye, EyeOff } from 'lucide-react';
import api from '../../api';

const PLACEHOLDER = `Dear {name},\n\nThe InternTrack placement portal is now active. Please log in using your credentials to view your placement and begin submitting weekly logbook entries.\n\nFor assistance, contact your academic supervisor.`;

const BulkBroadcasterModal = ({
  isOpen, onClose,
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

  const TABS = [
    { value: 'student',    label: 'Students',              count: studentCount },
    { value: 'academic',   label: 'Academic Supervisors',  count: academicCount },
    { value: 'industrial', label: 'Industrial Supervisors',count: industrialCount },
  ];

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.6)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'16px' }}
      onClick={e => e.target === e.currentTarget && handleClose()}>
      <style>{`
        @keyframes bb-pop { from{opacity:0;transform:scale(0.95) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes bb-spin { to{transform:rotate(360deg)} }
        .bb-tab-btn:hover { opacity:0.85; }
        .bb-send-btn:hover:not(:disabled) { opacity:0.9; }
        .bb-discard:hover { background:#f1f5f9 !important; }
      `}</style>

      <div style={{ background:'#fff', borderRadius:'20px', width:'100%', maxWidth:'580px', maxHeight:'92vh', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 32px 64px -12px rgba(0,0,0,0.25)', animation:'bb-pop 0.22s cubic-bezier(0.34,1.56,0.64,1)' }}>

        {/* ── Header ── */}
        <div style={{ background:'linear-gradient(135deg,#810eba,#0362c1)', padding:'20px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <div style={{ width:'42px', height:'42px', background:'rgba(255,255,255,0.2)', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Send size={20} color="#fff" />
            </div>
            <div>
              <h3 style={{ margin:0, fontSize:'1rem', fontWeight:800, color:'#ffffff' }}>Portal Broadcaster</h3>
              <p style={{ margin:0, fontSize:'11.5px', color:'rgba(255,255,255,0.7)', marginTop:'1px' }}>Send announcements to your portal users</p>
            </div>
          </div>
          <button onClick={handleClose} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:'8px', width:'32px', height:'32px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#fff' }}>
            <X size={16} />
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ overflowY:'auto', flex:1, padding:'22px 24px', display:'flex', flexDirection:'column', gap:'18px' }}>

          {result ? (
            /* ── Success / Partial result ── */
            <div style={{ textAlign:'center', padding:'20px 0' }}>
              <div style={{ width:'72px', height:'72px', borderRadius:'50%', background: result.failed === 0 ? '#f0fdf4' : '#fffbeb', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                {result.failed === 0
                  ? <CheckCircle2 size={36} color="#10b981" />
                  : <AlertTriangle size={36} color="#0362c1" />}
              </div>
              <h3 style={{ margin:'0 0 8px', fontSize:'1.1rem', color:'#1e293b' }}>{result.failed === 0 ? 'Broadcast Sent!' : 'Partially Sent'}</h3>
              <p style={{ color:'#64748b', fontSize:'14px', margin:'0 0 6px' }}>
                <strong style={{ color:'#10b981' }}>{result.sent} delivered</strong>
                {result.failed > 0 && <>, <strong style={{ color:'#ef4444' }}>{result.failed} failed</strong></>}
              </p>
              {result.errors?.length > 0 && (
                <div style={{ marginTop:'12px', background:'#fef2f2', borderRadius:'8px', padding:'12px', fontSize:'12px', color:'#ef4444', textAlign:'left' }}>
                  {result.errors.map((e, i) => <div key={i}>{e.email}: {e.error}</div>)}
                </div>
              )}
              <button onClick={handleClose} style={{ marginTop:'24px', padding:'10px 32px', background:'linear-gradient(135deg,#92400e,#d97706)', color:'#fff', border:'none', borderRadius:'10px', fontWeight:700, fontSize:'14px', cursor:'pointer' }}>
                Done
              </button>
            </div>

          ) : (
            <>
              {/* ── Audience tabs ── */}
              <div>
                <label style={{ fontSize:'11px', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.6px', color:'#94a3b8', display:'block', marginBottom:'8px' }}>Send To</label>
                <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                  {TABS.map(tab => (
                    <button key={tab.value} className="bb-tab-btn"
                      onClick={() => setTargetRole(tab.value)}
                      style={{ padding:'8px 16px', borderRadius:'20px', border:'2px solid', fontSize:'12.5px', fontWeight:700, cursor:'pointer', transition:'all 0.15s',
                        borderColor: targetRole === tab.value ? '#0362c1' : '#e2e8f0',
                        background:  targetRole === tab.value ? '#fffbeb' : '#fff',
                        color:       targetRole === tab.value ? '#92400e' : '#64748b',
                      }}>
                      {tab.label} <span style={{ fontSize:'11px', fontWeight:900, color: targetRole === tab.value ? '#0362c1' : '#94a3b8' }}>({tab.count})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Info banner ── */}
              <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'12px 16px', background:'#fffbeb', border:'1px solid #fde68a', borderRadius:'10px', fontSize:'13px', color:'#92400e' }}>
                <Info size={16} color="#0362c1" style={{ flexShrink:0 }} />
                <span>This will send an email to <strong>{targetCount}</strong> active {roleLabel}{targetCount !== 1 ? 's' : ''}.</span>
              </div>

              {/* ── Subject ── */}
              <div>
                <label style={{ fontSize:'11px', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.6px', color:'#94a3b8', display:'block', marginBottom:'7px' }}>Email Subject</label>
                <input
                  type="text"
                  placeholder="e.g. InternTrack Portal Now Open!"
                  value={subject}
                  onChange={e => { setSubject(e.target.value); setError(''); }}
                  style={{ width:'100%', padding:'11px 14px', border:'1.5px solid #e2e8f0', borderRadius:'10px', fontSize:'13.5px', fontFamily:'inherit', color:'#1e293b', outline:'none', boxSizing:'border-box', transition:'border-color 0.15s' }}
                  onFocus={e => e.target.style.borderColor='#0362c1'}
                  onBlur={e  => e.target.style.borderColor='#e2e8f0'}
                />
              </div>

              {/* ── Message body ── */}
              <div>
                <label style={{ fontSize:'11px', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.6px', color:'#94a3b8', display:'block', marginBottom:'7px' }}>Message Body</label>
                <textarea
                  rows={6}
                  placeholder={PLACEHOLDER}
                  value={message}
                  onChange={e => { setMessage(e.target.value); setError(''); }}
                  style={{ width:'100%', padding:'11px 14px', border:'1.5px solid #e2e8f0', borderRadius:'10px', fontSize:'13px', fontFamily:'inherit', color:'#1e293b', outline:'none', resize:'vertical', boxSizing:'border-box', lineHeight:1.6, transition:'border-color 0.15s' }}
                  onFocus={e => e.target.style.borderColor='#0721b4'}
                  onBlur={e  => e.target.style.borderColor='#e2e8f0'}
                />
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'6px' }}>
                  <span style={{ fontSize:'11.5px', color:'#94a3b8' }}>Use <code style={{ background:'#f1f5f9', padding:'1px 5px', borderRadius:'4px', fontSize:'11px' }}>{`{name}`}</code> to personalise with first name</span>
                  <button onClick={() => setShowPreview(p => !p)}
                    style={{ display:'flex', alignItems:'center', gap:'5px', background:'none', border:'none', fontSize:'12px', color:'#2563eb', cursor:'pointer', fontWeight:600, padding:'4px 0' }}>
                    {showPreview ? <><EyeOff size={13} /> Hide Preview</> : <><Eye size={13} /> Preview Email</>}
                  </button>
                </div>
              </div>

              {/* ── Preview ── */}
              {showPreview && (
                <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'12px', padding:'16px', fontSize:'13px' }}>
                  <div style={{ fontWeight:700, color:'#1e293b', marginBottom:'3px' }}>Subject: <span style={{ color:'#475569' }}>{subject || '(no subject)'}</span></div>
                  <div style={{ fontSize:'11.5px', color:'#2c5282', fontWeight:600, marginBottom:'8px' }}>University of Energy and Natural Resources — UENR InternTrack</div>
                  <hr style={{ border:0, borderTop:'1px solid #e2e8f0', margin:'8px 0' }} />
                  <div style={{ whiteSpace:'pre-line', color:'#334155', lineHeight:1.65 }}>{previewText}</div>
                </div>
              )}

              {/* ── Error ── */}
              {error && (
                <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 14px', background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:'8px', color:'#dc2626', fontSize:'13px' }}>
                  <AlertTriangle size={14} style={{ flexShrink:0 }} /> {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Footer ── */}
        {!result && (
          <div style={{ padding:'14px 24px', borderTop:'1px solid #f1f5f9', background:'#fafbfc', display:'flex', justifyContent:'flex-end', gap:'10px', flexShrink:0 }}>
            <button className="bb-discard" onClick={handleClose} disabled={sending}
              style={{ padding:'10px 20px', background:'#fff', border:'1.5px solid #e2e8f0', borderRadius:'10px', fontSize:'13px', fontWeight:600, color:'#64748b', cursor:'pointer', transition:'background 0.15s' }}>
              Discard
            </button>
            <button className="bb-send-btn" onClick={handleSend} disabled={sending || targetCount === 0}
              style={{ padding:'10px 22px', background: sending || targetCount === 0 ? '#94a3b8' : 'linear-gradient(135deg,#810eba,#0362c1)', color:'#fff', border:'none', borderRadius:'10px', fontSize:'13px', fontWeight:700, cursor: sending || targetCount === 0 ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', gap:'7px', transition:'opacity 0.15s' }}>
              {sending
                ? <><div style={{ width:'14px', height:'14px', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'bb-spin 0.8s linear infinite' }} /> Sending to {targetCount}…</>
                : <><Send size={14} /> Blast Announcement</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkBroadcasterModal;