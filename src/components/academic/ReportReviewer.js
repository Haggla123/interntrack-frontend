// src/components/academic/ReportReviewer.js
import React, { useState, useEffect } from 'react';
import { FileText, Download, ChevronLeft, Loader, BookOpen, CheckCircle2, Calendar } from 'lucide-react';
import './ReportReviewer.css';
import { getDocuments } from '../../api';
import { downloadFile } from '../../utils/downloadFile';

const ReportReviewer = ({ student, onBack }) => {
  const [reportDoc,   setReportDoc]   = useState(null);
  const [loadingDoc,  setLoadingDoc]  = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [errorMsg,    setErrorMsg]    = useState('');

  const studentId = student?._id || student?.id;

  useEffect(() => {
    if (!studentId) return;
    setLoadingDoc(true);
    setReportDoc(null);
    setErrorMsg('');
    getDocuments({ studentId: studentId.toString(), type: 'final-report' })
      .then(res => {
        const docs = Array.isArray(res) ? res : Array.isArray(res.data) ? res.data : [];
        // Pick the most recent final-report
        const report = docs
          .filter(d => d.type === 'final-report')
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null;
        setReportDoc(report);
      })
      .catch(err => setErrorMsg(err.message || 'Could not load report.'))
      .finally(() => setLoadingDoc(false));
  }, [studentId]);

  const handleDownload = async () => {
    if (!reportDoc) return;
    setDownloading(true);
    setErrorMsg('');
    try {
      await downloadFile(
        reportDoc._id || reportDoc.id,
        reportDoc.filename || `FinalReport_${student.name}.pdf`
      );
    } catch (err) {
      setErrorMsg(err.message || 'Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (!student) return null;

  return (
    <div className="fade-in" style={{ maxWidth:'680px', margin:'0 auto', display:'flex', flexDirection:'column', gap:'16px' }}>
      <style>{`@keyframes rr-spin { to { transform: rotate(360deg); } }`}</style>

      {/* Back header */}
      <div style={{ display:'flex', alignItems:'center', gap:'14px', padding:'16px 20px', background:'#fff', border:'1px solid #e2e8f0', borderRadius:'14px', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
        <button
          onClick={onBack}
          style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'7px 14px', background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'13px', fontWeight:600, color:'#475569', cursor:'pointer', flexShrink:0 }}
        >
          <ChevronLeft size={15} /> Back to Grading
        </button>
        <div style={{ minWidth:0 }}>
          <h2 style={{ margin:0, fontSize:'1rem', fontWeight:800, color:'#1e293b', letterSpacing:'-0.2px' }}>
            {student.name} — Final Report
          </h2>
          <p style={{ margin:0, fontSize:'12px', color:'#94a3b8', marginTop:'2px' }}>
            {student.index} {student.companyName || student.company ? `· ${student.companyName || student.company}` : ''}
          </p>
        </div>
      </div>

      {/* Report card */}
      <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:'14px', boxShadow:'0 1px 3px rgba(0,0,0,0.06)', overflow:'hidden' }}>

        {/* Card header */}
        <div style={{ padding:'16px 20px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', gap:'8px' }}>
          <div style={{ width:'34px', height:'34px', background:'#eff6ff', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <FileText size={18} color="#1768ac" />
          </div>
          <div>
            <div style={{ fontSize:'14px', fontWeight:700, color:'#1e293b' }}>Student Submission</div>
            <div style={{ fontSize:'11.5px', color:'#94a3b8' }}>Final internship report uploaded by the student</div>
          </div>
        </div>

        {/* Card body */}
        <div style={{ padding:'24px 20px' }}>

          {/* Loading */}
          {loadingDoc && (
            <div style={{ display:'flex', alignItems:'center', gap:'10px', color:'#94a3b8', padding:'16px 0' }}>
              <div style={{ width:'20px', height:'20px', border:'2.5px solid #e2e8f0', borderTopColor:'#1768ac', borderRadius:'50%', animation:'rr-spin 0.8s linear infinite', flexShrink:0 }} />
              <span style={{ fontSize:'13px' }}>Checking for submitted report…</span>
            </div>
          )}

          {/* Error */}
          {!loadingDoc && errorMsg && (
            <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'12px 14px', background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:'10px', color:'#dc2626', fontSize:'13px' }}>
              {errorMsg}
            </div>
          )}

          {/* No report yet */}
          {!loadingDoc && !errorMsg && !reportDoc && (
            <div style={{ textAlign:'center', padding:'40px 20px', color:'#94a3b8' }}>
              <div style={{ width:'60px', height:'60px', background:'#f1f5f9', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
                <BookOpen size={28} color="#cbd5e1" />
              </div>
              <p style={{ fontWeight:700, color:'#64748b', margin:'0 0 4px', fontSize:'14px' }}>No report submitted yet</p>
              <p style={{ fontSize:'13px', margin:0 }}>The student hasn't uploaded their final report.</p>
            </div>
          )}

          {/* Report found */}
          {!loadingDoc && !errorMsg && reportDoc && (
            <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

              {/* File info row */}
              <div style={{ display:'flex', alignItems:'center', gap:'16px', padding:'16px 18px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'12px' }}>
                <div style={{ width:'52px', height:'52px', background:'linear-gradient(135deg,#eff6ff,#dbeafe)', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <FileText size={26} color="#1768ac" />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:'14px', fontWeight:700, color:'#1e293b', margin:'0 0 4px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {reportDoc.filename || `FinalReport_${student.name}.pdf`}
                  </p>
                  <div style={{ display:'flex', alignItems:'center', gap:'12px', flexWrap:'wrap' }}>
                    {reportDoc.fileSize && (
                      <span style={{ fontSize:'12px', color:'#64748b' }}>
                        {(reportDoc.fileSize / 1024).toFixed(0)} KB
                      </span>
                    )}
                    {reportDoc.createdAt && (
                      <span style={{ fontSize:'12px', color:'#64748b', display:'flex', alignItems:'center', gap:'4px' }}>
                        <Calendar size={12} />
                        Submitted {new Date(reportDoc.createdAt).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
                      </span>
                    )}
                    <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', fontSize:'11px', fontWeight:700, padding:'2px 8px', borderRadius:'20px', background:'#f0fdf4', color:'#15803d', border:'1px solid #86efac' }}>
                      <CheckCircle2 size={11} /> PDF
                    </span>
                  </div>
                </div>
              </div>

              {/* Download button */}
              <button
                onClick={handleDownload}
                disabled={downloading}
                style={{
                  width:'100%', padding:'14px', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px',
                  background: downloading ? '#94a3b8' : 'linear-gradient(135deg,#03256c,#1768ac)',
                  color:'#fff', border:'none', borderRadius:'12px', fontSize:'15px', fontWeight:700,
                  cursor: downloading ? 'not-allowed' : 'pointer',
                  boxShadow: downloading ? 'none' : '0 4px 14px rgba(3,37,108,0.25)',
                  transition:'all 0.2s',
                }}
              >
                {downloading
                  ? <><div style={{ width:'18px', height:'18px', border:'2.5px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'rr-spin 0.8s linear infinite' }} /> Downloading…</>
                  : <><Download size={18} /> Download Final Report</>}
              </button>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ReportReviewer;