// src/components/student/AttachmentLetters.js
import React, { useState, useEffect } from 'react';
import {
  FileDown, Info, MapPin, Send, CheckCircle2, AlertCircle,
  Loader, X, FileText, Download, ShieldCheck,
} from 'lucide-react';
import { submitPlacementRequest, getDocuments } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { downloadFile } from '../../utils/downloadFile';

const AttachmentLetters = () => {
  const { user, refreshUser } = useAuth();

  const [showForm,     setShowForm]     = useState(false);
  const [submitted,    setSubmitted]    = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [gpsCapturing, setGpsCapturing] = useState(false);
  const [formError,    setFormError]    = useState('');

  const [docs,        setDocs]        = useState([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [docMsg,      setDocMsg]      = useState({ text: '', type: '' });
  const [downloading, setDownloading] = useState('');

  const [form, setForm] = useState({
    companyName: '', supervisorEmail: '', supervisorPhone: '',
    supervisorName: '', lat: '', long: '',
  });
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const flashDoc = (text, type = 'success') => {
    setDocMsg({ text, type });
    setTimeout(() => setDocMsg({ text: '', type: '' }), 4000);
  };

  useEffect(() => { refreshUser(); }, [refreshUser]);

  useEffect(() => {
    getDocuments()
      .then(res => {
        const arr = Array.isArray(res) ? res : Array.isArray(res.data) ? res.data : [];
        setDocs(arr.filter(d => d.isPublic));
      })
      .catch(() => setDocs([]))
      .finally(() => setDocsLoading(false));
  }, []);

  const captureGPS = () => {
    if (!navigator.geolocation) { setFormError('Geolocation not supported.'); return; }
    setGpsCapturing(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        set('lat',  pos.coords.latitude.toFixed(6));
        set('long', pos.coords.longitude.toFixed(6));
        setGpsCapturing(false);
      },
      () => {
        setFormError('Could not capture location. Enable browser location access.');
        setGpsCapturing(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.lat || !form.long) { setFormError('Please capture your GPS coordinates first.'); return; }
    setSaving(true); setFormError('');
    try {
      await submitPlacementRequest({
        companyName:     form.companyName,
        supervisorEmail: form.supervisorEmail,
        supervisorPhone: form.supervisorPhone,
        supervisorName:  form.supervisorName,
        lat:             parseFloat(form.lat),
        long:            parseFloat(form.long),
      });
      setSubmitted(true);
    } catch (err) {
      setFormError(err.message || 'Submission failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };


  const handleDownload = async (docId, filename) => {
    setDownloading(docId);
    try {
      await downloadFile(docId, filename);
    } catch (err) {
      flashDoc(err.message || 'Download failed.', 'error');
    } finally {
      setDownloading('');
    }
  };

  const isPlaced = user?.placementStatus === 'Active' ||
                   user?.status === 'Placed' ||
                   !!(user?.academicSupervisor?._id || user?.academicSupervisor);

  if (submitted) return (
    <div className="bento-container fade-in">
      <div className="bento-item info-card" style={{ textAlign: 'center', padding: '50px' }}>
        <CheckCircle2 size={56} color="#10b981" style={{ marginBottom: '16px' }} />
        <h4>Placement Request Sent!</h4>
        <p>The Admin has been notified. Your logbook will be unlocked after verification.</p>
      </div>
    </div>
  );

  return (
    <div className="bento-container fade-in">
      <div className="bento-item status-box warning-alert">
        <div className="pulse-header"><label>Self-Placement Instructions</label><Info size={16} /></div>
        <p>Download the official letter below. Once a company accepts you, use <strong>"Report Placement"</strong> to notify Admin and unlock your logbook.</p>
      </div>

      {/* Official Letters */}
      <div className="bento-item info-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <ShieldCheck size={18} color="#2563eb" />
          <div>
            <h4 style={{ margin: 0 }}>Official UENR Documents</h4>
            <p className="sub-text" style={{ margin: 0 }}>Letters uploaded by the Admin for your attachment</p>
          </div>
        </div>

        {docMsg.text && (
          <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 12px',
            background: docMsg.type==='error' ? '#fef2f2' : '#f0fdf4',
            border:`1px solid ${docMsg.type==='error' ? '#fca5a5' : '#86efac'}`,
            borderRadius:'8px', color: docMsg.type==='error' ? '#dc2626' : '#15803d',
            fontSize:'13px', marginBottom:'12px' }}>
            {docMsg.type === 'error' ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
            {docMsg.text}
          </div>
        )}

        {docsLoading ? (
          <div style={{ textAlign:'center', padding:'20px', color:'#94a3b8' }}>
            <Loader size={18} style={{ animation:'spin 1s linear infinite' }} />
          </div>
        ) : docs.length === 0 ? (
          <div style={{ textAlign:'center', padding:'20px', color:'#94a3b8', border:'2px dashed #e2e8f0', borderRadius:'8px' }}>
            <FileText size={24} style={{ marginBottom:'6px', opacity:0.5 }} />
            <p style={{ fontSize:'13px', margin:0 }}>No official letters uploaded by Admin yet.</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {docs.map(doc => {
              const docId       = doc._id || doc.id;
              const isDownloading = downloading === docId;
              return (
                <div key={docId} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:'8px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                    <FileDown size={18} color="#2563eb" />
                    <div>
                      <p style={{ fontSize:'13px', fontWeight:600, color:'#1e293b', margin:0 }}>{doc.filename}</p>
                      <p style={{ fontSize:'11px', color:'#64748b', margin:0 }}>
                        Official · {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('en-GB') : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(docId, doc.filename)}
                    disabled={isDownloading}
                    style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 12px', background:'#2563eb', color:'#fff', border:'none', borderRadius:'6px', fontSize:'12px', fontWeight:600, cursor:'pointer' }}
                  >
                    {isDownloading
                      ? <><Loader size={12} style={{ animation:'spin 1s linear infinite' }} /> Downloading…</>
                      : <><Download size={12} /> Download</>}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Report Placement */}
      {isPlaced ? (
        <div className="bento-item info-card" style={{ textAlign:'center', padding:'28px 20px' }}>
          <CheckCircle2 size={32} color="#10b981" style={{ marginBottom:'10px' }} />
          <h4 style={{ color:'#059669' }}>Placement Confirmed</h4>
          <p className="sub-text" style={{ marginTop:'6px' }}>
            Your placement has been recorded. Your logbook is now active.
          </p>
        </div>
      ) : (
        <div className="bento-grid-2">
          <div className="bento-item info-card">
            <div className="doc-icon-circle"><Send size={28} /></div>
            <h4>Report Your Placement</h4>
            <p className="sub-text">Once a company accepts you, notify the admin to unlock your logbook.</p>
            <button className="btn-outline-lite" onClick={() => setShowForm(true)}>
              <Send size={16} /> Report My Placement
            </button>
          </div>

          {showForm && (
            <div className="bento-item info-card slide-in">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <h4>Report Secured Company</h4>
                  <div className="badge-pill-amber">Verification Required</div>
                </div>
                <button onClick={() => setShowForm(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8' }}>
                  <X size={18} />
                </button>
              </div>

              {formError && (
                <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 14px', background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:'8px', color:'#dc2626', fontSize:'13px', margin:'12px 0' }}>
                  <AlertCircle size={14} /> {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="modal-form" style={{ marginTop:'15px' }}>
                <div className="form-grid-2">
                  <div className="input-group">
                    <label>Company Name *</label>
                    <input type="text" placeholder="e.g. GRIDCo" className="corporate-input-sm" value={form.companyName} onChange={e => set('companyName', e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <label>Supervisor Name</label>
                    <input type="text" placeholder="e.g. Mr. Kofi Mensah" className="corporate-input-sm" value={form.supervisorName} onChange={e => set('supervisorName', e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Supervisor Email *</label>
                    <input type="email" placeholder="manager@company.com" className="corporate-input-sm" value={form.supervisorEmail} onChange={e => set('supervisorEmail', e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <label>Supervisor Phone *</label>
                    <input type="tel" placeholder="024XXXXXXX" className="corporate-input-sm" value={form.supervisorPhone} onChange={e => set('supervisorPhone', e.target.value)} required />
                  </div>
                </div>

                <div style={{ marginTop:'15px', padding:'15px', background:'#f8fafc', borderRadius:'10px', border:'1px solid #e2e8f0' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
                    <label style={{ fontSize:'12px', fontWeight:'700', color:'#475569' }}>Office GPS Location *</label>
                    <button type="button" onClick={captureGPS} disabled={gpsCapturing}
                      style={{ background:'none', border:'none', color:'#2563eb', fontSize:'12px', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:'4px' }}>
                      {gpsCapturing
                        ? <><Loader size={13} style={{ animation:'spin 1s linear infinite' }} /> Capturing…</>
                        : <><MapPin size={13} /> Auto-Capture</>}
                    </button>
                  </div>
                  <div className="form-grid-2">
                    <input type="text" placeholder="Latitude"  className="corporate-input-sm" value={form.lat}  onChange={e => set('lat', e.target.value)}  required />
                    <input type="text" placeholder="Longitude" className="corporate-input-sm" value={form.long} onChange={e => set('long', e.target.value)} required />
                  </div>
                  {form.lat && form.long && (
                    <p style={{ fontSize:'11px', color:'#15803d', marginTop:'6px', display:'flex', alignItems:'center', gap:'4px' }}>
                      <CheckCircle2 size={11} /> Captured: {form.lat}, {form.long}
                    </p>
                  )}
                </div>

                <button type="submit" className="btn-approve-full" style={{ width:'100%', marginTop:'20px' }} disabled={saving}>
                  {saving
                    ? <><Loader size={16} style={{ animation:'spin 1s linear infinite' }} /> Sending…</>
                    : <><Send size={16} /> Send Placement Request</>}
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AttachmentLetters;