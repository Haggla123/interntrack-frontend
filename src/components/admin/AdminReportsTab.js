import React, { useState, useEffect } from 'react';
import { FileText, Download, Search, AlertCircle, Loader, CheckCircle2, User } from 'lucide-react';
import { getDocuments } from '../../api';
import { downloadFile } from '../../utils/downloadFile';

const AdminReportsTab = () => {
  const [reports,     setReports]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [search,      setSearch]      = useState('');
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    // getDocuments() uses the token from api.js automatically
    getDocuments()
      .then(res => {
        const all  = Array.isArray(res) ? res : Array.isArray(res.data) ? res.data : [];
        const docs = all.filter(d => d.type === 'final-report');
        setReports(docs);
      })
      .catch(() => setError('Could not load final reports.'))
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async (doc) => {
    const id = doc._id || doc.id;
    setDownloading(id);
    try {
      await downloadFile(id, doc.filename || `report_${id}.pdf`);
    } catch (err) {
      alert(err.message);
    } finally {
      setDownloading(null);
    }
  };

  const filtered = reports.filter(d => {
    const name = (d.student?.name      || '').toLowerCase();
    const idx  = (d.student?.indexNumber || '').toLowerCase();
    const file = (d.filename           || '').toLowerCase();
    const q    = search.toLowerCase();
    return name.includes(q) || idx.includes(q) || file.includes(q);
  });

  return (
    <div className="content-card fade-in">
      <div className="card-header-actions">
        <div>
          <h3>Final Internship Reports</h3>
          <p className="sub-text-sm">All student-submitted final reports. Download to review.</p>
        </div>
        <div className="search-wrapper-sm" style={{ position:'relative' }}>
          <Search size={14} style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} />
          <input
            type="text"
            placeholder="Search student or file…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="admin-input-select"
            style={{ paddingLeft:'30px', width:'220px' }}
          />
        </div>
      </div>

      {error && (
        <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'12px 16px', background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:'8px', color:'#dc2626', fontSize:'13px', margin:'12px 0' }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {loading && (
        <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'32px', color:'#94a3b8' }}>
          <Loader size={20} style={{ animation:'spin 1s linear infinite' }} />
          <span>Loading reports…</span>
        </div>
      )}

      {!loading && filtered.length === 0 && !error && (
        <div style={{ textAlign:'center', padding:'48px 20px', color:'#94a3b8' }}>
          <FileText size={40} style={{ opacity:0.3, marginBottom:'12px' }} />
          <p style={{ fontWeight:600, color:'#64748b' }}>
            {search ? `No reports matching "${search}"` : 'No final reports submitted yet.'}
          </p>
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginTop:'12px' }}>
        {filtered.map(doc => {
          const id      = doc._id || doc.id;
          const student = doc.student || {};
          const date    = new Date(doc.createdAt).toLocaleDateString('en-GB', {
            day:'numeric', month:'short', year:'numeric',
          });
          return (
            <div key={id} style={{
              display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'12px 16px', background:'#f8fafc', border:'1px solid #e2e8f0',
              borderRadius:'10px', gap:'12px',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:'12px', flex:1, minWidth:0 }}>
                <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:'#dbeafe', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <User size={16} color="#3b82f6" />
                </div>
                <div style={{ minWidth:0 }}>
                  <p style={{ fontWeight:600, color:'#1e293b', fontSize:'14px', margin:0 }}>
                    {student.name || 'Unknown Student'}
                  </p>
                  <p style={{ color:'#64748b', fontSize:'12px', margin:'2px 0 0' }}>
                    {student.indexNumber || '—'} &nbsp;·&nbsp; Submitted {date}
                  </p>
                  <p style={{ color:'#94a3b8', fontSize:'11px', margin:'1px 0 0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {doc.filename}
                  </p>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', flexShrink:0 }}>
                <span style={{ fontSize:'11px', padding:'3px 8px', borderRadius:'20px', background:'#f0fdf4', color:'#15803d', border:'1px solid #86efac', display:'flex', alignItems:'center', gap:'4px' }}>
                  <CheckCircle2 size={11} /> Submitted
                </span>
                <button
                  onClick={() => handleDownload(doc)}
                  disabled={downloading === id}
                  style={{ display:'flex', alignItems:'center', gap:'6px', padding:'6px 12px', background:'#3b82f6', color:'#fff', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'12px', fontWeight:600, opacity: downloading === id ? 0.6 : 1 }}
                >
                  {downloading === id
                    ? <Loader size={13} style={{ animation:'spin 1s linear infinite' }} />
                    : <Download size={13} />}
                  {downloading === id ? 'Downloading…' : 'Download'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminReportsTab;