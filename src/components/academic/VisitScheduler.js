// src/components/academic/VisitScheduler.js
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, Plus, AlertCircle, Search, Check, ChevronRight, CheckCircle2, Loader, Trash2 } from 'lucide-react';
import './VisitScheduler.css';
import { scheduleVisit, getVisits, updateVisit } from '../../api';

const VisitScheduler = ({ students = [], setNextVisit }) => {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [visitDate, setVisitDate]   = useState('');
  const [visitTime, setVisitTime]   = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setDropdown] = useState(false);
  const [visits, setVisits]         = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]       = useState('');
  const [errorMsg, setErrorMsg]     = useState('');
  const [updatingVisit, setUpdatingVisit] = useState(''); // visitId being updated

  const handleStatusUpdate = async (visitId, status) => {
    setUpdatingVisit(visitId);
    try {
      const res = await updateVisit(visitId, { status });
      const updated = res?.data || res;
      const newVisits = visits.map(v => (v._id || v.id) === visitId ? { ...v, status: updated.status || status } : v);
      setVisits(newVisits);
      const upcoming = newVisits
        .filter(v => v.status !== 'Completed' && v.status !== 'Cancelled' && new Date(v.date) >= new Date())
        .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
      if (setNextVisit) setNextVisit(upcoming || null);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update visit.');
    } finally {
      setUpdatingVisit('');
    }
  };

  // Load existing scheduled visits
  useEffect(() => {
    getVisits()
      .then(res => {
        const arr = Array.isArray(res) ? res : Array.isArray(res.data) ? res.data : [];
        setVisits(arr);
        // Surface the nearest upcoming visit to parent (overview card)
        const upcoming = arr
          .filter(v => new Date(v.date) >= new Date())
          .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
        if (upcoming && setNextVisit) setNextVisit(upcoming);
      })
      .catch(() => {});
  }, []);

  const filteredOptions = students.filter(s =>
    (s.name    || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.company || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const priorityStudents = students.filter(s => !s.lastVisit || s.lastVisit === 'None');

  const handleSelect = (student) => {
    setSelectedStudent(student);
    setSearchTerm(student.name);
    setDropdown(false);
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    if (!selectedStudent) { setErrorMsg('Please select a student.'); return; }
    setSubmitting(true);
    setErrorMsg('');
    try {
      const payload = {
        studentId:   selectedStudent._id || selectedStudent.id,
        studentName: selectedStudent.name,
        company:     selectedStudent.company,
        location:    selectedStudent.location,
        date:        visitDate,
        time:        visitTime,
      };
      const res = await scheduleVisit(payload);
      const saved = res.data || res;
      const newVisits = [saved, ...visits];
      setVisits(newVisits);

      // Update next visit for overview
      const upcoming = newVisits
        .filter(v => new Date(v.date) >= new Date())
        .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
      if (setNextVisit) setNextVisit(upcoming || null);

      setSuccess(`Visit scheduled for ${selectedStudent.name} on ${new Date(visitDate).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}`);
      setSelectedStudent(null);
      setSearchTerm('');
      setVisitDate('');
      setVisitTime('');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to schedule visit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="scheduler-container fade-in">

      {success && (
        <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'12px 16px', background:'#f0fdf4', border:'1px solid #86efac', borderRadius:'8px', color:'#15803d', fontSize:'14px', marginBottom:'12px' }}>
          <CheckCircle2 size={15} /> {success}
        </div>
      )}

      {errorMsg && (
        <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'12px 16px', background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:'8px', color:'#dc2626', fontSize:'14px', marginBottom:'12px' }}>
          <AlertCircle size={15} /> {errorMsg}
        </div>
      )}

      <div className="scheduler-grid">

        {/* LEFT: Form */}
        <div className="schedule-form-card bento-item">
          <div className="card-header-flex">
            <h3><Plus size={20} /> Schedule New Visit</h3>
          </div>

          <form onSubmit={handleSchedule}>
            <div className="form-group custom-select-container">
              <label><User size={14} /> Search Intern</label>
              <div className="search-input-wrapper">
                <Search size={16} className="search-icon-inner" />
                <input
                  type="text"
                  className="bento-input search-field"
                  placeholder="Type name or company..."
                  value={searchTerm}
                  onFocus={() => setDropdown(true)}
                  onChange={(e) => { setSearchTerm(e.target.value); setDropdown(true); }}
                />
              </div>

              {showDropdown && (
                <div className="search-results-dropdown">
                  {filteredOptions.length > 0 ? filteredOptions.map(s => (
                    <div
                      key={s.id || s._id}
                      className="search-result-item"
                      onClick={() => handleSelect(s)}
                    >
                      <div className="res-info">
                        <strong>{s.name}</strong>
                        <span>{s.company} • {s.location}</span>
                      </div>
                      {selectedStudent?.id === s.id && <Check size={14} className="check-icon" />}
                    </div>
                  )) : (
                    <div className="no-res">No interns found for "{searchTerm}"</div>
                  )}
                </div>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label><Calendar size={14} /> Date</label>
                <input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} required min={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="form-group">
                <label><Clock size={14} /> Time</label>
                <input type="time" value={visitTime} onChange={(e) => setVisitTime(e.target.value)} required />
              </div>
            </div>

            <button type="submit" className="confirm-btn univ-btn" disabled={submitting}>
              {submitting ? <><Loader size={16} style={{ animation:'spin 1s linear infinite' }} /> Scheduling…</> : 'Confirm Visit'}
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </button>
          </form>
        </div>

        {/* RIGHT: Urgent visits */}
        <div className="bento-item priority-card">
          <div className="card-header-flex">
            <h3>Urgent Visits</h3>
            <AlertCircle size={18} color="#dc2626" />
          </div>
          <p className="sub-text">Students not yet visited:</p>
          <div className="priority-list">
            {priorityStudents.length > 0 ? priorityStudents.map(s => (
              <div key={s.id || s._id} className="priority-item" onClick={() => handleSelect(s)}>
                <div className="priority-info">
                  <strong>{s.name}</strong>
                  <span className="location-badge"><MapPin size={10} /> {s.location || 'Unknown'}</span>
                </div>
                <button type="button" className="quick-select">Select <ChevronRight size={14} /></button>
              </div>
            )) : (
              <div className="empty-priority">
                <Check size={20} />
                <p>All students have been visited.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scheduled visits list */}
      {visits.length > 0 && (
        <div className="bento-item" style={{ marginTop:'16px' }}>
          <h4 style={{ marginBottom:'12px', fontSize:'14px', fontWeight:700, color:'#1e293b' }}>
            All Scheduled Visits ({visits.length})
          </h4>
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {visits
              .sort((a, b) => new Date(a.date) - new Date(b.date))
              .map((v, i) => {
                const visitId    = v._id || v.id;
                const isPast     = new Date(v.date) < new Date();
                const isUpdating = updatingVisit === visitId;
                const status     = v.status || 'Scheduled';
                const isCompleted = status === 'Completed';
                const isCancelled = status === 'Cancelled';
                const isDone      = isCompleted || isCancelled;

                const statusColor = isCompleted ? '#15803d' : isCancelled ? '#dc2626' : isPast ? '#d97706' : '#0284c7';
                const statusBg    = isCompleted ? '#f0fdf4' : isCancelled ? '#fef2f2' : isPast ? '#fffbeb' : '#f0f9ff';
                const statusBorder= isCompleted ? '#86efac' : isCancelled ? '#fca5a5' : isPast ? '#fcd34d' : '#bae6fd';

                return (
                  <div key={visitId || i} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px 14px', background: statusBg, borderRadius:'8px', border:`1px solid ${statusBorder}`, fontSize:'13px', flexWrap:'wrap' }}>
                    <Calendar size={14} style={{ color: statusColor, flexShrink:0 }} />
                    <div style={{ flex:1, minWidth:'120px' }}>
                      <strong style={{ color:'#1e293b' }}>{v.studentName || v.student?.name || v.student}</strong>
                      {v.company && <span style={{ color:'#64748b', marginLeft:'8px' }}>{v.company}</span>}
                    </div>
                    <div style={{ color:'#64748b', whiteSpace:'nowrap' }}>
                      {new Date(v.date).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}
                      {v.time && ` • ${v.time}`}
                    </div>
                    <span style={{ fontSize:'11px', color: statusColor, background:'white', border:`1px solid ${statusBorder}`, padding:'2px 8px', borderRadius:'20px', whiteSpace:'nowrap' }}>
                      {status}
                    </span>
                    {!isDone && (
                      <div style={{ display:'flex', gap:'6px' }}>
                        <button
                          onClick={() => handleStatusUpdate(visitId, 'Completed')}
                          disabled={isUpdating}
                          title="Mark as Completed"
                          style={{ display:'flex', alignItems:'center', gap:'4px', padding:'4px 10px', background:'#f0fdf4', color:'#15803d', border:'1px solid #86efac', borderRadius:'6px', fontSize:'12px', fontWeight:600, cursor:'pointer' }}>
                          {isUpdating ? <Loader size={11} style={{ animation:'spin 1s linear infinite' }} /> : <Check size={11} />} Done
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(visitId, 'Cancelled')}
                          disabled={isUpdating}
                          title="Cancel Visit"
                          style={{ display:'flex', alignItems:'center', gap:'4px', padding:'4px 10px', background:'#fef2f2', color:'#dc2626', border:'1px solid #fca5a5', borderRadius:'6px', fontSize:'12px', fontWeight:600, cursor:'pointer' }}>
                          <Trash2 size={11} /> Cancel
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

export default VisitScheduler;