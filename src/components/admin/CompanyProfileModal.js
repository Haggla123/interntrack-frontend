// src/components/admin/CompanyProfileModal.js
import React from 'react';
import { X, Building2, Users, MapPin, Phone, Mail, ShieldCheck, ExternalLink, Briefcase } from 'lucide-react';

const S = {
  overlay: {
    position:'fixed', inset:0, background:'rgba(15,23,42,0.55)',
    backdropFilter:'blur(6px)', display:'flex', alignItems:'center',
    justifyContent:'center', zIndex:1000, padding:'12px',
  },
  modal: {
    background:'#fff', borderRadius:'20px', width:'100%', maxWidth:'660px',
    maxHeight:'92vh', display:'flex', flexDirection:'column',
    boxShadow:'0 32px 64px -12px rgba(0,0,0,0.28), 0 0 0 1px rgba(0,0,0,0.05)',
    overflow:'hidden', animation:'cpm-pop 0.22s cubic-bezier(0.34,1.56,0.64,1)',
  },
  header: {
    background:'linear-gradient(135deg, #03256c 0%, #1768ac 100%)',
    padding:'24px 28px', position:'relative', flexShrink:0,
  },
  closeBtn: {
    position:'absolute', top:'16px', right:'16px',
    background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'8px',
    width:'32px', height:'32px', display:'flex', alignItems:'center',
    justifyContent:'center', cursor:'pointer', color:'#fff',
    transition:'background 0.15s',
  },
  body: { padding:'24px 28px', overflowY:'auto', flex:1 },
  statCard: {
    background:'#f8fafc', border:'1px solid #e2e8f0',
    borderRadius:'12px', padding:'14px 16px', flex:1, minWidth:'100px',
  },
  supervisorCard: {
    background:'linear-gradient(135deg, #f0f9ff, #eff6ff)',
    border:'1px solid #bae6fd', borderRadius:'12px',
    padding:'16px', marginBottom:'20px',
  },
  rosterTable: {
    width:'100%', borderCollapse:'collapse',
  },
  footer: {
    padding:'16px 28px', borderTop:'1px solid #f1f5f9',
    display:'flex', justifyContent:'flex-end', flexShrink:0,
    background:'#fafbfc',
  },
};

const CompanyProfileModal = ({ isOpen, onClose, company, students = [], onViewStudent }) => {
  if (!isOpen || !company) return null;

  const companyId = (company._id || company.id || '').toString();
  const assignedInterns = students.filter(s => {
    const raw = typeof s.companyId === 'object' ? s.companyId?._id : s.companyId;
    const sid = (raw ?? '').toString();
    return sid === companyId ||
      (s.companyName || '').toLowerCase() === (company.name || '').toLowerCase();
  });

  const usedSlots  = assignedInterns.length;
  const totalSlots = Number(company.slots) || 0;
  const fillPct    = totalSlots > 0 ? Math.round((usedSlots / totalSlots) * 100) : 0;
  const slotColor  = fillPct >= 90 ? '#dc2626' : fillPct >= 70 ? '#d97706' : '#10b981';

  const initials = (company.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.modal} className="cpm-modal-shell">
        <style>{`
          @keyframes cpm-pop { from { opacity:0; transform:scale(0.93) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }
          .cpm-close:hover { background: rgba(255,255,255,0.25) !important; }
          .cpm-intern-row:hover { background: #f8fafc; }
          .cpm-action-btn:hover { background: #1768ac !important; color: #fff !important; }
          .cpm-close-main:hover { background: #e2e8f0 !important; }
          @media (max-width: 480px) {
            .cpm-modal-shell { border-radius: 16px !important; }
            .cpm-stat-row { flex-direction: column !important; }
            .cpm-stat-row > div { min-width: 0 !important; }
          }
        `}</style>

        {/* Header */}
        <div style={S.header}>
          <button className="cpm-close" style={S.closeBtn} onClick={onClose}>
            <X size={16} />
          </button>
          <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
            <div style={{ width:'52px', height:'52px', borderRadius:'14px', background:'rgba(255,255,255,0.18)', border:'1px solid rgba(255,255,255,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', fontWeight:800, color:'#fff', flexShrink:0, letterSpacing:'-0.5px' }}>
              {initials}
            </div>
            <div>
              <h2 style={{ color:'#fff', fontSize:'1.25rem', fontWeight:800, margin:'0 0 4px', letterSpacing:'-0.3px' }}>{company.name}</h2>
              <div style={{ display:'flex', alignItems:'center', gap:'12px', flexWrap:'wrap' }}>
                <span style={{ color:'rgba(255,255,255,0.75)', fontSize:'12.5px', display:'flex', alignItems:'center', gap:'4px' }}>
                  <MapPin size={12} /> {company.location || 'Location not set'}
                </span>
                {company.category && (
                  <span style={{ background:'rgba(255,255,255,0.15)', color:'rgba(255,255,255,0.9)', fontSize:'11px', fontWeight:700, padding:'2px 9px', borderRadius:'20px', border:'1px solid rgba(255,255,255,0.2)' }}>
                    {company.category}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={S.body}>

          {/* Stats row */}
          <div className="cpm-stat-row" style={{ display:'flex', gap:'10px', marginBottom:'16px' }}>
            {[
              { label:'Current Interns', value: usedSlots, icon: <Users size={16} color="#1768ac" />, bg:'#eff6ff' },
              { label:'Total Capacity',  value: totalSlots, icon: <Briefcase size={16} color="#7c3aed" />, bg:'#f5f3ff' },
              { label:'Slots Available', value: Math.max(0, totalSlots - usedSlots), icon: <Building2 size={16} color="#059669" />, bg:'#ecfdf5' },
            ].map(item => (
              <div key={item.label} style={{ ...S.statCard, borderTop:`3px solid ${item.bg === '#eff6ff' ? '#bfdbfe' : item.bg === '#f5f3ff' ? '#ddd6fe' : '#a7f3d0'}` }}>
                <div style={{ width:'30px', height:'30px', borderRadius:'8px', background:item.bg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'8px' }}>
                  {item.icon}
                </div>
                <div style={{ fontSize:'1.5rem', fontWeight:900, color:'#1e293b', lineHeight:1, fontFamily:'var(--font-mono)' }}>{item.value}</div>
                <div style={{ fontSize:'11px', color:'#94a3b8', fontWeight:600, marginTop:'3px', textTransform:'uppercase', letterSpacing:'0.4px' }}>{item.label}</div>
              </div>
            ))}
          </div>

          {/* Utilisation bar */}
          <div style={{ padding:'12px 16px', background:'#f8fafc', borderRadius:'10px', border:'1px solid #e2e8f0', marginBottom:'16px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
              <span style={{ fontSize:'12px', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.4px' }}>Slot Utilisation</span>
              <span style={{ fontSize:'13px', fontWeight:800, color:slotColor, fontFamily:'var(--font-mono)' }}>{fillPct}%</span>
            </div>
            <div style={{ height:'8px', background:'#e2e8f0', borderRadius:'4px', overflow:'hidden' }}>
              <div style={{ width:`${fillPct}%`, height:'100%', background:`linear-gradient(to right, ${slotColor}cc, ${slotColor})`, borderRadius:'4px', transition:'width 0.5s var(--ease)' }} />
            </div>
          </div>

          {/* Industrial supervisor */}
          {company.supervisorName && (
            <div style={S.supervisorCard}>
              <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'10px' }}>
                <ShieldCheck size={14} color="#0284c7" />
                <span style={{ fontSize:'11px', fontWeight:800, color:'#0284c7', textTransform:'uppercase', letterSpacing:'0.5px' }}>Industrial Supervisor</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:'#0284c7', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px', fontWeight:800, color:'#fff', flexShrink:0 }}>
                  {(company.supervisorName || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize:'14px', fontWeight:700, color:'#1e293b' }}>{company.supervisorName}</div>
                  <div style={{ display:'flex', gap:'12px', marginTop:'4px', flexWrap:'wrap' }}>
                    {company.supervisorEmail && (
                      <span style={{ fontSize:'12px', color:'#475569', display:'flex', alignItems:'center', gap:'4px' }}>
                        <Mail size={11} /> {company.supervisorEmail}
                      </span>
                    )}
                    {company.supervisorPhone && (
                      <span style={{ fontSize:'12px', color:'#475569', display:'flex', alignItems:'center', gap:'4px' }}>
                        <Phone size={11} /> {company.supervisorPhone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Roster */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
            <h4 style={{ fontSize:'13px', fontWeight:800, color:'#1e293b', textTransform:'uppercase', letterSpacing:'0.5px', margin:0 }}>Assigned Intern Roster</h4>
            <span style={{ fontSize:'11px', background:'#eff6ff', color:'#1768ac', border:'1px solid #bfdbfe', padding:'2px 8px', borderRadius:'20px', fontWeight:700 }}>
              {assignedInterns.length} intern{assignedInterns.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div style={{ border:'1px solid #e2e8f0', borderRadius:'12px', overflow:'hidden' }}>
            <table style={S.rosterTable}>
              <thead>
                <tr style={{ background:'#f8fafc' }}>
                  {['Student', 'Index No.', 'Status', ''].map(h => (
                    <th key={h} style={{ padding:'10px 14px', fontSize:'10.5px', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.5px', color:'#94a3b8', textAlign:'left', borderBottom:'1px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assignedInterns.length > 0 ? assignedInterns.map((intern, i) => (
                  <tr key={intern._id || intern.id} className="cpm-intern-row" style={{ borderBottom: i < assignedInterns.length - 1 ? '1px solid #f1f5f9' : 'none', transition:'background 0.1s' }}>
                    <td style={{ padding:'12px 14px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                        <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'#1e1b4b', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:800, flexShrink:0 }}>
                          {(intern.name || '?').charAt(0)}
                        </div>
                        <span style={{ fontSize:'13.5px', fontWeight:600, color:'#1e293b' }}>{intern.name}</span>
                      </div>
                    </td>
                    <td style={{ padding:'12px 14px', fontFamily:'var(--font-mono)', fontSize:'12px', color:'#475569', fontWeight:500 }}>
                      {intern.indexNumber || intern.index || '—'}
                    </td>
                    <td style={{ padding:'12px 14px' }}>
                      <span style={{
                        padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:700,
                        background: intern.status === 'Graded' ? '#f0fdf4' : '#fffbeb',
                        color:      intern.status === 'Graded' ? '#15803d' : '#b45309',
                        border:    `1px solid ${intern.status === 'Graded' ? '#86efac' : '#fcd34d'}`,
                      }}>
                        {intern.status || 'Active'}
                      </span>
                    </td>
                    <td style={{ padding:'12px 14px', textAlign:'right' }}>
                      <button
                        className="cpm-action-btn"
                        title="View Student"
                        onClick={() => onViewStudent && onViewStudent(intern)}
                        style={{ background:'#f1f5f9', border:'none', borderRadius:'8px', padding:'6px 12px', fontSize:'12px', fontWeight:600, color:'#475569', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:'5px', transition:'all 0.15s' }}
                      >
                        <ExternalLink size={13} /> View
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign:'center', padding:'32px', color:'#94a3b8', fontSize:'13px', fontStyle:'italic' }}>
                      No interns currently assigned to this firm.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div style={S.footer}>
          <button
            className="cpm-close-main"
            onClick={onClose}
            style={{ padding:'9px 22px', background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:'10px', fontSize:'13px', fontWeight:700, color:'#475569', cursor:'pointer', transition:'all 0.15s' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompanyProfileModal;