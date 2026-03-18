// src/components/admin/AdminDocumentsTab.js
// FIX: replaced raw fetch + localStorage.getItem('token') with the
// shared api.uploadFile() helper which reads from both localStorage
// and sessionStorage.
import React, { useState, useEffect, useRef } from 'react';
import { FileDown, Upload, Trash2, FileText, AlertCircle, CheckCircle2, Loader, Users } from 'lucide-react';
import * as api from '../../api';

const AdminDocumentsTab = () => {
  const [docs, setDocs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg]             = useState({ text: '', type: '' });
  const fileRef = useRef(null);

  const flash = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 4000);
  };

  useEffect(() => {
    api.getPublicDocuments()
      .then(res => setDocs(Array.isArray(res) ? res : Array.isArray(res.data) ? res.data : []))
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { flash('Only PDF files are accepted.', 'error'); return; }
    if (file.size > 5 * 1024 * 1024)    { flash('File must be under 5 MB.', 'error'); return; }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file',     file);
      formData.append('type',     'attachment-letter');
      formData.append('isPublic', 'true');

      // FIX: use shared helper — reads from both localStorage and sessionStorage
      const res     = await api.uploadFile(formData);
      const created = res?.data || res;
      setDocs(prev => {
        const filtered = prev.filter(d => d.filename !== created.filename);
        return [created, ...filtered];
      });
      flash(`"${file.name}" uploaded. All students can now download it.`);
    } catch (err) {
      flash(err.message || 'Upload failed.', 'error');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDelete = async (docId, filename) => {
    if (!window.confirm(`Remove "${filename}"? Students will no longer be able to download it.`)) return;
    try {
      await api.deleteDocument(docId);
      setDocs(prev => prev.filter(d => (d._id || d.id) !== docId));
      flash(`"${filename}" removed.`);
    } catch (err) {
      flash(err.message || 'Failed to delete document.', 'error');
    }
  };

  return (
    <div className="content-card fade-in">
      <div className="card-header-actions">
        <div>
          <h3>Official Attachment Letters</h3>
          <p className="sub-text-sm">
            PDFs uploaded here are visible and downloadable by <strong>all students</strong> in their Attachment Letters tab.
          </p>
        </div>
        <div>
          <input type="file" accept="application/pdf" ref={fileRef} style={{ display: 'none' }} onChange={handleFileChange} />
          <button className="primary-btn" onClick={() => fileRef.current?.click()} disabled={uploading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {uploading
              ? <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> Uploading…</>
              : <><Upload size={15} /> Upload PDF Letter</>}
          </button>
        </div>
      </div>

      {msg.text && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px',
          background: msg.type === 'error' ? '#fef2f2' : '#f0fdf4',
          border: `1px solid ${msg.type === 'error' ? '#fca5a5' : '#86efac'}`,
          color:  msg.type === 'error' ? '#dc2626' : '#15803d',
        }}>
          {msg.type === 'error' ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
          {msg.text}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 16px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', marginBottom: '20px' }}>
        <Users size={16} style={{ color: '#2563eb', flexShrink: 0, marginTop: '1px' }} />
        <p style={{ fontSize: '13px', color: '#1e40af', margin: 0 }}>
          Any PDF you upload here becomes available to every student. Upload the official UENR introductory letter, offer letter templates, or any other documents students need for their attachment.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
          <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : docs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', border: '2px dashed #e2e8f0', borderRadius: '10px' }}>
          <FileText size={36} style={{ marginBottom: '10px', opacity: 0.4 }} />
          <p style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 4px' }}>No official documents uploaded yet</p>
          <p style={{ fontSize: '13px', margin: 0 }}>Upload a PDF above to make it available to all students.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {docs.map(doc => {
            const docId = doc._id || doc.id;
            return (
              <div key={docId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileDown size={20} color="#2563eb" />
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b', margin: 0 }}>{doc.filename}</p>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                      {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(0)} KB` : ''}
                      {doc.fileSize ? ' · ' : ''}
                      Uploaded {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                      {' · '}
                      <span style={{ color: '#10b981', fontWeight: 600 }}>
                        <Users size={11} style={{ display: 'inline', marginRight: '3px' }} />
                        Visible to all students
                      </span>
                    </p>
                  </div>
                </div>
                <button onClick={() => handleDelete(docId, doc.filename)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}
                  title="Remove from student view">
                  <Trash2 size={15} /> Remove
                </button>
              </div>
            );
          })}
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

export default AdminDocumentsTab;