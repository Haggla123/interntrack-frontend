// src/components/admin/ExportRegistryModal.js
import React, { useState } from 'react';
import { X, FileDown, CheckCircle2, FileJson, FileSpreadsheet } from 'lucide-react';

const COL_LABELS = {
  indexNumber: 'Index Number',
  name:        'Full Name',
  department:  'Department',
  company:     'Company',
  indusScore:  'Industrial Score',
  finalGrade:  'Final Grade',
  supervisor:  'Industrial Supervisor',
  status:      'Status',
};

const getVal = (s, k) => {
  switch (k) {
    case 'indexNumber': return s.indexNumber || s.index || '';
    case 'name':        return s.name        || '';
    case 'department':  return s.department  || '';
    case 'company':     return s.company || s.companyName || '';
    case 'indusScore':  return s.indusScore  || s.industrialScore || '';
    case 'finalGrade':  return s.finalGrade  || '-';
    case 'supervisor':  return s.supervisorName || s.supervisor || '';
    case 'status':      return s.status || s.gradeStatus || '';
    default:            return '';
  }
};

const ExportRegistryModal = ({ isOpen, onClose, students = [] }) => {
  const [format, setFormat]           = useState('csv');
  const [isExporting, setIsExporting] = useState(false);
  const [cols, setCols] = useState({
    indexNumber: true, name: true, department: true, company: true,
    indusScore: true, finalGrade: true, supervisor: false, status: true,
  });

  if (!isOpen) return null;

  const activeCols = Object.keys(cols).filter(k => cols[k]);

  const downloadCSV = () => {
    const escape = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const headers = activeCols.map(k => COL_LABELS[k]);
    const rows    = students.map(s => activeCols.map(k => getVal(s, k)));
    const csv     = [headers, ...rows].map(r => r.map(escape).join(',')).join('\n');
    const blob    = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url     = URL.createObjectURL(blob);
    const a       = document.createElement('a');
    a.href = url; a.download = `InternTrack_Registry_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const downloadJSON = () => {
    const data = students.map(s => {
      const obj = {};
      activeCols.forEach(k => { obj[COL_LABELS[k]] = getVal(s, k); });
      return obj;
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `InternTrack_Registry_${new Date().toISOString().slice(0,10)}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    setIsExporting(true);
    try { format === 'csv' ? downloadCSV() : downloadJSON(); } catch {}
    setTimeout(() => { setIsExporting(false); onClose(); }, 600);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content scale-in" style={{ maxWidth:'500px' }}>
        <div className="modal-header">
          <div className="header-title-flex">
            <div className="icon-box-emerald"><FileDown size={22} /></div>
            <h3>Export to Registry</h3>
          </div>
          <button className="close-x" onClick={onClose}><X /></button>
        </div>

        <div className="modal-body-pushed">
          <p className="sub-text-sm">
            Download official results for <strong>{students.length}</strong> students.
          </p>

          <div className="export-options-grid">
            {[['csv','CSV (Excel-compatible)',FileSpreadsheet,'text-emerald'],
              ['json','JSON (Raw Data)',FileJson,'text-blue']].map(([val, label, Icon, cls]) => (
              <div key={val} className={`format-card ${format === val ? 'selected' : ''}`} onClick={() => setFormat(val)}>
                <Icon size={32} className={cls} />
                <span>{label}</span>
                {format === val && <CheckCircle2 size={16} className="check-icon" />}
              </div>
            ))}
          </div>

          <div className="column-selector-box">
            <label className="tool-label">Columns to Include:</label>
            <div className="checkbox-group-grid">
              {Object.entries(COL_LABELS).map(([key, label]) => (
                <label key={key} style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'13px', cursor: (key === 'indexNumber' || key === 'name') ? 'not-allowed' : 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={!!cols[key]}
                    onChange={() => setCols(p => ({ ...p, [key]: !p[key] }))}
                    disabled={key === 'indexNumber' || key === 'name'}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <p style={{ fontSize:'12px', color:'#94a3b8', marginTop:'10px' }}>
            The file will download to your device immediately.
          </p>
        </div>

        <div className="modal-footer-pushed">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button className="primary-btn-emerald" onClick={handleExport} disabled={isExporting}>
            {isExporting ? 'Generating…' : `Download ${format.toUpperCase()}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportRegistryModal;
