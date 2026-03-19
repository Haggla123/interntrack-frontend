// src/components/admin/VerificationModal.js
import React, { useState } from 'react';
import { X, CheckCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

const VerificationModal = ({ isOpen, onClose, studentData, lecturers, onApprove }) => {
  const [selectedLecturerId, setSelectedLecturerId] = useState('');
  const [error,    setError]    = useState('');
  const [saving,   setSaving]   = useState(false);
  const [approved, setApproved] = useState(false);

  if (!isOpen) return null;

  const selectedLecturer = lecturers.find(
    l => (l._id || l.id)?.toString() === selectedLecturerId
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLecturerId) {
      setError('Please assign an academic supervisor before confirming.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (typeof onApprove === 'function') await onApprove(studentData, selectedLecturerId);
      setApproved(true);
      setTimeout(() => {
        setApproved(false);
        setSelectedLecturerId('');
        setError('');
        onClose();
      }, 1500);
    } catch (err) {
      setError(err?.message || 'Approval failed. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content scale-in" style={{ maxWidth:'500px' }}>
        <div className="modal-header">
          <div className="header-title-flex">
            <ShieldCheck className="text-emerald" size={24} />
            <h3>Verify Placement</h3>
          </div>
          <button className="close-x" onClick={onClose}><X /></button>
        </div>

        {approved ? (
          <div style={{ textAlign:'center', padding:'40px 20px' }}>
            <CheckCircle2 size={48} color="#10b981" />
            <p style={{ marginTop:'12px', fontWeight:600 }}>Placement activated!</p>
            <small style={{ color:'#64748b' }}>
              {studentData.studentName} assigned to {selectedLecturer?.name}
            </small>
          </div>
        ) : (
          <div className="modal-body-pushed">
            <div className="verification-summary">
              <label>Student</label>
              <p><strong>{studentData.studentName}</strong> ({studentData.indexNumber})</p>
              <label style={{ marginTop:'10px', display:'block' }}>Reported Company</label>
              <p><strong>{studentData.companyName}</strong></p>
              <label style={{ marginTop:'10px', display:'block' }}>GPS Location</label>
              <p style={{ fontSize:'13px', color:'#64748b' }}>{studentData.lat}, {studentData.long}</p>
            </div>

            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Assign Academic Supervisor *</label>
                <select
                  className="admin-input-select"
                  value={selectedLecturerId}
                  onChange={e => { setSelectedLecturerId(e.target.value); setError(''); }}
                >
                  <option value="">Select Lecturer...</option>
                  {lecturers.map(lec => {
                    const id = (lec._id || lec.id)?.toString();
                    return (
                      <option key={id} value={id}>
                        {/* was lec.dept — correct field name is lec.department */}
                        {lec.name} ({lec.department || lec.staffId || 'Faculty'})
                      </option>
                    );
                  })}
                </select>
                {error && <small style={{ color:'#ef4444' }}>{error}</small>}
                <p className="helper-text">This lecturer will grade the student's logbook and final report.</p>
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn-verify-confirm" disabled={saving}>
                  <CheckCircle size={18} /> {saving ? 'Activating...' : 'Confirm & Activate'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerificationModal;