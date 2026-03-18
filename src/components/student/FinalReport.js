// src/components/student/FinalReport.js
// FIX: replaced raw fetch + localStorage.getItem('token') with the
// shared api.uploadFile() helper which reads from both localStorage
// and sessionStorage — so "Don't Remember Me" sessions work too.
import React, { useState } from 'react';
import { Lock, FileCheck, Send, AlertCircle, FileText, Upload, CheckCircle, Loader } from 'lucide-react';
import { uploadFile } from '../../api';

const FinalReport = ({ completedWeeks, totalWeeks = 6 }) => {
  const [reportFile, setReportFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [errorMsg,   setErrorMsg]   = useState('');

  const isEligible = completedWeeks >= totalWeeks;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setErrorMsg('Please upload your report in PDF format (.pdf only).');
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('File exceeds 5MB. Please compress your PDF and try again.');
      e.target.value = '';
      return;
    }
    setErrorMsg('');
    setReportFile(file);
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    if (!reportFile) return;
    setSubmitting(true);
    setErrorMsg('');
    try {
      const formData = new FormData();
      formData.append('file', reportFile);
      formData.append('type', 'final-report');
      // FIX: use shared helper — no more hardcoded localStorage.getItem('token')
      await uploadFile(formData);
      setSubmitted(true);
    } catch (err) {
      setErrorMsg(err.message || 'Upload failed. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isEligible) {
    return (
      <div className="bento-item locked-state fade-in">
        <div className="locked-content">
          <div className="lock-icon-circle"><Lock size={40} /></div>
          <h3>Final Report Locked</h3>
          <p>You have completed <strong>{completedWeeks}</strong> of the required <strong>{totalWeeks}</strong> weeks.</p>
          <div className="requirement-tag">
            <AlertCircle size={14} />
            <span>Eligibility: {totalWeeks} Weeks Minimum</span>
          </div>
          <div style={{ marginTop:'16px', background:'#f8fafc', borderRadius:'8px', padding:'12px 16px' }}>
            <div style={{ width:'100%', height:'8px', background:'#e2e8f0', borderRadius:'4px', overflow:'hidden' }}>
              <div style={{ width:`${Math.min((completedWeeks / totalWeeks) * 100, 100)}%`, height:'100%', background:'#3b82f6', borderRadius:'4px' }} />
            </div>
            <p style={{ fontSize:'12px', color:'#64748b', marginTop:'6px', textAlign:'center' }}>
              {completedWeeks} / {totalWeeks} weeks completed
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="bento-item report-success-card fade-in">
        <div className="success-content" style={{ textAlign:'center', padding:'40px' }}>
          <CheckCircle size={60} color="#10b981" style={{ marginBottom:'20px' }} />
          <h2>Report Submitted Successfully</h2>
          <p>Your final internship report has been sent to your Academic Supervisor for review.</p>
          <div style={{ marginTop:'20px', display:'inline-flex', alignItems:'center', gap:'6px', padding:'8px 16px', background:'#f0fdf4', border:'1px solid #86efac', borderRadius:'8px', fontSize:'13px', color:'#15803d' }}>
            <FileText size={14} /> {reportFile?.name}
          </div>
          <p style={{ fontSize:'13px', color:'#64748b', marginTop:'12px' }}>
            You will be notified once your supervisor has reviewed it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="final-report-wrapper fade-in">
      <div className="report-grid">

        <div className="bento-item format-guidelines">
          <div className="box-header">
            <FileText size={20} color="#03256c" />
            <h3>Final Report Format</h3>
          </div>
          <div className="format-content">
            <p className="format-hint">Ensure your PDF follows this structure before uploading:</p>
            <div className="format-box">
              <pre>{`1. COVER PAGE
   - Student Name & Index Number
   - Organisation Name
   - Supervisor Names

2. INTRODUCTION
   - Background of the Organisation
   - Objectives of the Internship

3. TECHNICAL ACTIVITIES
   - Detailed logs of tasks performed
   - Skills & Tools utilised

4. CHALLENGES & SOLUTIONS
   - Problems encountered
   - How you resolved them

5. CONCLUSION & RECOMMENDATION
   - Key takeaways
   - Suggestions for improvement`}</pre>
            </div>
          </div>
        </div>

        <div className="bento-item submission-zone">
          <h3>Submit Completed Report</h3>
          <p className="sub-text">PDF only · Max 5MB · Sent directly to your Academic Supervisor</p>

          {errorMsg && (
            <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 14px', background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:'8px', color:'#dc2626', fontSize:'13px', margin:'12px 0' }}>
              <AlertCircle size={14} /> {errorMsg}
            </div>
          )}

          <form onSubmit={handleFinalSubmit}>
            <div className="upload-container">
              <input type="file" id="final-report-upload" accept=".pdf,application/pdf" onChange={handleFileChange} hidden />
              <label
                htmlFor="final-report-upload"
                className="drop-zone"
                style={{
                  cursor: 'pointer',
                  borderColor: reportFile ? '#10b981' : undefined,
                  background:  reportFile ? '#f0fdf4'  : undefined,
                }}
              >
                {reportFile ? <FileCheck size={32} color="#10b981" /> : <Upload size={32} color="#1768ac" />}
                <span style={{ color: reportFile ? '#15803d' : undefined, fontWeight: reportFile ? 600 : undefined }}>
                  {reportFile ? reportFile.name : 'Click to select PDF Report'}
                </span>
                <small>
                  {reportFile
                    ? `${(reportFile.size / 1024).toFixed(0)} KB — ready to upload`
                    : 'Max file size: 5MB'}
                </small>
              </label>
            </div>

            <button
              type="submit"
              className={`univ-btn submit-final-btn ${!reportFile ? 'disabled' : ''}`}
              disabled={!reportFile || submitting}
            >
              {submitting
                ? <><Loader size={18} style={{ animation:'spin 1s linear infinite' }} /> Uploading…</>
                : <><Send size={18} /> Submit to Supervisor</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FinalReport;