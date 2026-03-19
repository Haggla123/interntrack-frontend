import React, { useState, useEffect } from 'react';
import '../styles/AdminDashboard.css';
import { useAuth } from '../context/AuthContext';
import { User, Calendar,CheckCircle2, Mail,Loader, Phone, ShieldCheck,MapPin, X, LayoutDashboard, Users, UserCheck, Building2, Settings, LogOut, Bell, Search, PlusCircle, Link2, FileDown, Trash2, ClipboardCheck, AlertCircle, Import , Menu, FileText } from 'lucide-react';
import VerificationModal from '../components/admin/VerificationModal'; 
import AddCompanyModal from '../components/admin/AddCompanyModal';
import AddLecturerModal from '../components/admin/AddLecturerModal';
import CompanyProfileModal from '../components/admin/CompanyProfileModal';
import AddStudentModal from '../components/admin/AddStudentModal';
import ExportRegistryModal from '../components/admin/ExportRegistryModal';
import BulkBroadcasterModal from '../components/admin/BulkBroadcasterModal'; 
import AdminStudentDrawer from '../components/admin/AdminStudentDrawer';
import AssignmentTab from '../components/admin/AssignmentTab';
import SupervisorsTab from '../components/admin/SupervisorsTab';
import AddAdminModal from '../components/admin/AddAdminModal';
import AdminDocumentsTab from '../components/admin/AdminDocumentsTab';
import * as api from '../api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState(
    () => sessionStorage.getItem('adminTab') || 'overview'
  );
  // Persist tab selection within the browser session so refresh returns to same tab
  const setTab = (tab) => { sessionStorage.setItem('adminTab', tab); setActiveTab(tab); setIsSidebarOpen(false); };
  const [searchTerm, setSearchTerm] = useState(""); 
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isAddCompanyModalOpen, setIsAddCompanyModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false); // New State
  const [isAddLecturerModalOpen, setIsAddLecturerModalOpen] = useState(false);
  const [isBroadcasterOpen, setIsBroadcasterOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false);


  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null); 
  const [showNotifications, setShowNotifications] = useState(false);

  const [selectedStudentManage, setSelectedStudentManage] = useState(null);
  const [isStudentDrawerOpen, setIsStudentDrawerOpen] = useState(false);
  
 const { logout } = useAuth();
 const handleLogout = () => logout()

  // ── Real data from API ──────────────────────────────────────────
  const [companies, setCompanies] = useState([]);
  const [students, setStudents] = useState([]);
  const [placementRequests, setPlacementRequests] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loadError,   setLoadError]   = useState('');
  const [supervisors, setSupervisors] = useState([]);
  const [filterSupervisor, setFilterSupervisor] = useState('');   // supervisor ID filter for students
  const [editingSupervisor, setEditingSupervisor] = useState(null); // supervisor being inline-edited
  const [placementFilter, setPlacementFilter]   = useState('all'); // 'all' | 'placed' | 'unplaced'
  const [studentSortBy, setStudentSortBy]       = useState('name'); // 'name' | 'index' | 'dept'
  const [grades, setGrades]           = useState([]);
  const [settings, setSettings]       = useState(null);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState('');
  const [newDeptInput, setNewDeptInput] = useState(''); // for dept add field
  const [actionMsg, setActionMsg] = useState({ text: '', type: '' }); // type: 'success'|'error'

  const flashMsg = (text, type = 'success') => {
    setActionMsg({ text, type });
    setTimeout(() => setActionMsg({ text: '', type: '' }), 5000);
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [companiesRes, studentsRes, placementsRes, supsRes, gradesRes, settingsRes] = await Promise.all([
          api.getCompanies(),
          api.getStudents(),
          api.getPlacementRequests({ status: 'Pending' }),
          api.getSupervisors(),
          api.getGrades(),
          api.getSettings(),
        ]);
        const toArray = (res) => {
          if (Array.isArray(res)) return res;
          if (res && Array.isArray(res.data)) return res.data;
          if (res && Array.isArray(res.companies)) return res.companies;
          if (res && Array.isArray(res.students)) return res.students;
          if (res && Array.isArray(res.placements)) return res.placements;
          return [];
        };
        const companiesArr = toArray(companiesRes);
        setCompanies(companiesArr);
        setStudents(toArray(studentsRes));
        setPlacementRequests(toArray(placementsRes));
        setSupervisors(toArray(supsRes));
        setGrades(toArray(gradesRes));
        const sData = settingsRes?.data || settingsRes || null;
        if (sData) setSettings(sData);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setLoadError(err.message || 'Failed to load dashboard. Please refresh the page.');
      } finally {
        setLoadingData(false);
      }
    };
    fetchAll();
  }, []);

  const handleReject = async (request) => {
    const studentName = request.student?.name || request.studentName || 'this student';
    if (window.confirm(`Decline placement request for ${studentName}?`)) {
      try {
        await api.declinePlacement((request._id || request.id).toString());
        // Re-fetch pending queue so list always reflects server state
        const fresh = await api.getPlacementRequests({ status: 'Pending' });
        const toArr = (r) => Array.isArray(r) ? r : Array.isArray(r?.data) ? r.data : [];
        setPlacementRequests(toArr(fresh));
      } catch (err) {
        console.error('Failed to decline placement:', err);
        flashMsg(`Failed to decline: ${err.message}`, 'error');
      }
    }
  };

  // handleApproveWithFeedback is passed to VerificationModal as onApprove
  const handleApproveWithFeedback = async (studentData, lecturerId) => {
    const placementId = (studentData._id || studentData.id || '').toString();
    const studentUserId = (studentData.student?._id || studentData.student?.id || studentData.studentId || '').toString();
    try {
      const approveRes = await api.approvePlacement(placementId);
      if (studentUserId && lecturerId) {
        await api.assignStudent(studentUserId, { academicSupervisorId: lecturerId.toString() });
      }
      // Show email feedback
      const note = approveRes?.emailNote || approveRes?.data?.emailNote || '';
      const sent = approveRes?.emailSent ?? approveRes?.data?.emailSent;
      if (note) {
        flashMsg(note, sent === false ? 'error' : 'success');
      }
    } catch (err) {
      flashMsg(`Approval failed: ${err.message}`, 'error');
    } finally {
      try {
        const fresh = await api.getPlacementRequests({ status: 'Pending' });
        const toArr = (r) => Array.isArray(r) ? r : Array.isArray(r?.data) ? r.data : [];
        setPlacementRequests(toArr(fresh));
      } catch (_) {}
    }
  };

  const lecturers = supervisors
    .filter(s => s.role === 'academic')
    .map(s => ({
      _id:        s._id || s.id,
      id:         s._id || s.id,
      name:       s.name,
      department: s.department || s.dept || '',
      staffId:    s.staffId || '',
    }));

  const [notifications] = useState([]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleOpenVerify = (request) => {
    // Normalise so VerificationModal always gets flat string fields
    setSelectedRequest({
      ...request,
      studentName:  request.student?.name        || request.studentName  || '',
      indexNumber:  request.student?.indexNumber  || request.indexNumber  || '',
      studentId:    request.student?._id          || request.student?.id  || request.studentId || '',
    });
    setIsVerifyModalOpen(true);
  };

  const handleViewInterns = (company) => {
    setSelectedCompany({ ...company, interns: company.interns || [] });
    setIsProfileModalOpen(true);
  };

  // ── Company CRUD (API-backed) ─────────────────────────────────
  const [editingCompany, setEditingCompany] = useState(null);

  const handleAddCompany = async (newCompany) => {
    try {
      const res = await api.createCompany(newCompany);
      const created = (res && res.data && res.data._id) ? res.data
        : (res && res._id) ? res
        : { ...newCompany, _id: Date.now().toString() };
      setCompanies(prev => [...prev, { ...newCompany, ...created }]);

      if (newCompany.supervisorEmail) {
        if (res?.warning) {
          flashMsg(`Company registered. Note: ${res.warning}`, 'error');
        } else {
          flashMsg(`Company registered. Credentials sent to ${newCompany.supervisorEmail}.`);
        }
      } else {
        flashMsg('Company registered successfully.');
      }
    } catch (err) {
      flashMsg(`Failed to register company: ${err.message}`, 'error');
    }
  };

  const handleDeleteCompany = async (id) => {
    if (window.confirm('Remove this partner company?')) {
      try {
        await api.deleteCompany(id);
        setCompanies(prev => prev.filter(c => (c._id || c.id) !== id));
      } catch (err) {
        console.error('Failed to delete company:', err);
      }
    }
  };

  const handleDeleteSupervisor = async (id, name) => {
    if (!window.confirm(`Remove ${name} from the system?`)) return;
    try {
      await api.deleteSupervisor(id);
      setSupervisors(prev => prev.filter(s => (s._id||s.id) !== id));
    } catch (err) { console.error('Failed to remove supervisor:', err); }
  };

  // FIX: accepts payload param from SupervisorsTab (which manages its own edit state)
  // falls back to editingSupervisor for any legacy callers
  const handleSaveSupervisor = async (id, payload) => {
    try {
      const data = payload || { ...editingSupervisor };
      await api.updateSupervisor(id, data);
      setSupervisors(prev => prev.map(s => (s._id||s.id) === id ? { ...s, ...data } : s));
      setEditingSupervisor(null);
    } catch (err) { console.error('Failed to update supervisor:', err); }
  };

  const handleEditCompany = (company) => setEditingCompany({ ...company });

  const handleSaveEdit = async (id) => {
    try {
      const payload = { ...editingCompany, slots: Number(editingCompany.slots) || 0 };
      // Update local state immediately with the payload so it never resets
      setCompanies(prev => prev.map(c => (c._id || c.id) === id ? { ...c, ...payload } : c));
      setEditingCompany(null);
      // Then persist to DB in background
      await api.updateCompany(id, payload);
    } catch (err) {
      console.error('Failed to update company:', err);
    }
  };

  const handleEditChange = (field, value) =>
    setEditingCompany(prev => ({ ...prev, [field]: value }));

  // Filter Logic for Companies & Students
  const filteredCompanies = companies.filter(c => 
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.location || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStudents = students
    .filter(s => {
      const matchSearch = (s.name||'').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.indexNumber||s.index||'').toLowerCase().includes(searchTerm.toLowerCase());
      const matchPlacement = placementFilter === 'all' ? true
        : placementFilter === 'placed'   ? (s.placementStatus === 'Active' || s.status === 'Placed')
        : (s.placementStatus !== 'Active' && s.status !== 'Placed');
      const matchSup = !filterSupervisor ? true
        : (s.academicSupervisor === filterSupervisor || (s.academicSupervisor?._id || s.academicSupervisor) === filterSupervisor);
      return matchSearch && matchPlacement && matchSup;
    })
    .sort((a, b) => {
      if (studentSortBy === 'name')  return (a.name||'').localeCompare(b.name||'');
      if (studentSortBy === 'index') return (a.indexNumber||a.index||'').localeCompare(b.indexNumber||b.index||'');
      if (studentSortBy === 'dept')  return (a.department||a.dept||'').localeCompare(b.department||b.dept||'');
      return 0;
    });

  const renderContent = () => {
    switch (activeTab) {
      case 'pending-placements':
        return (
          <div className="fade-in" style={{ maxWidth:'960px', margin:'0 auto', display:'flex', flexDirection:'column', gap:'16px' }}>
            <style>{`
              .plq-header { display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; }
              .plq-card-grid { display:grid; grid-template-columns:auto 1fr 1fr 1fr auto; gap:20px; align-items:center; }
              .plq-actions { display:flex; flex-direction:column; gap:8px; flex-shrink:0; }
              @media (max-width:768px) {
                .plq-card-grid { grid-template-columns:auto 1fr; gap:12px; }
                .plq-col-company, .plq-col-sup { grid-column:1/-1; padding-top:0; border-top:1px solid #f1f5f9; padding-top:10px; }
                .plq-actions { flex-direction:row; grid-column:1/-1; border-top:1px solid #f1f5f9; padding-top:10px; }
                .plq-actions button { flex:1; justify-content:center; }
                .plq-search { width:100% !important; }
              }
            `}</style>

            {/* Header banner */}
            <div style={{ background:'linear-gradient(135deg,#03256c,#1768ac)', borderRadius:'16px', padding:'20px 22px', display:'flex', flexDirection:'column', gap:'14px' }}>
              <div className="plq-header">
                <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                  <div style={{ width:'44px', height:'44px', background:'rgba(255,255,255,0.15)', borderRadius:'11px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <ClipboardCheck size={21} color="#fff" />
                  </div>
                  <div>
                    <h2 style={{ margin:0, fontSize:'1rem', fontWeight:800, color:'#fff' }}>Self-Placement Verification Queue</h2>
                    <p style={{ margin:'2px 0 0', fontSize:'11.5px', color:'rgba(255,255,255,0.6)' }}>Review and approve student-submitted placement requests</p>
                  </div>
                </div>
                {placementRequests.length > 0 && (
                  <div style={{ background:'rgba(251,191,36,0.2)', border:'1px solid rgba(251,191,36,0.4)', borderRadius:'20px', padding:'4px 14px', fontSize:'12px', fontWeight:700, color:'#fbbf24', flexShrink:0 }}>
                    {placementRequests.length} pending
                  </div>
                )}
              </div>
              {/* Search always full-width on its own row */}
              <div style={{ position:'relative' }}>
                <Search size={14} style={{ position:'absolute', left:'11px', top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.5)', pointerEvents:'none' }} />
                <input
                  type="text"
                  placeholder="Filter by student or company…"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="plq-search"
                  style={{ padding:'9px 14px 9px 32px', background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'8px', fontSize:'12.5px', color:'#fff', outline:'none', width:'260px', fontFamily:'inherit', boxSizing:'border-box' }}
                  onFocus={e => { e.target.style.background='rgba(255,255,255,0.2)'; e.target.style.borderColor='rgba(255,255,255,0.5)'; }}
                  onBlur={e =>  { e.target.style.background='rgba(255,255,255,0.12)'; e.target.style.borderColor='rgba(255,255,255,0.2)'; }}
                />
              </div>
            </div>

            {/* Empty state */}
            {placementRequests.filter(req => {
              const q = searchTerm.toLowerCase();
              return !q || (req.student?.name||req.studentName||'').toLowerCase().includes(q) || (req.companyName||'').toLowerCase().includes(q);
            }).length === 0 && (
              <div style={{ background:'#fff', border:'2px dashed #e2e8f0', borderRadius:'14px', padding:'48px 24px', textAlign:'center' }}>
                <div style={{ width:'56px', height:'56px', background:'#f0fdf4', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
                  <CheckCircle2 size={26} color="#86efac" />
                </div>
                <p style={{ fontWeight:700, color:'#64748b', fontSize:'14px', margin:'0 0 4px' }}>
                  {searchTerm ? `No requests matching "${searchTerm}"` : 'All caught up!'}
                </p>
                <p style={{ fontSize:'13px', color:'#94a3b8', margin:0 }}>
                  {searchTerm ? 'Try a different search.' : 'No pending placement requests at the moment.'}
                </p>
              </div>
            )}

            {/* Request cards */}
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {placementRequests
                .filter(req => {
                  const q = searchTerm.toLowerCase();
                  return !q || (req.student?.name||req.studentName||'').toLowerCase().includes(q) || (req.companyName||'').toLowerCase().includes(q);
                })
                .map(req => {
                  const studentName = req.student?.name || req.studentName || '—';
                  const indexNo     = req.student?.indexNumber || req.indexNumber || '—';
                  const initials    = studentName.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase();
                  const hasGps      = req.lat && req.long;
                  return (
                    <div key={req._id || req.id} style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:'14px', padding:'18px 20px', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
                      <div className="plq-card-grid">

                        {/* Avatar */}
                        <div style={{ width:'42px', height:'42px', borderRadius:'50%', background:'linear-gradient(135deg,#03256c,#1768ac)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:800, color:'#fff', flexShrink:0 }}>
                          {initials}
                        </div>

                        {/* Student */}
                        <div>
                          <p style={{ fontWeight:700, color:'#1e293b', fontSize:'14px', margin:'0 0 4px' }}>{studentName}</p>
                          <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', fontSize:'11px', color:'#64748b', background:'#f1f5f9', padding:'2px 8px', borderRadius:'20px', fontFamily:'monospace' }}>
                            {indexNo}
                          </span>
                        </div>

                        {/* Company */}
                        <div className="plq-col-company">
                          <p style={{ fontSize:'10px', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.5px', color:'#94a3b8', margin:'0 0 4px' }}>Company</p>
                          <p style={{ fontWeight:700, color:'#1e293b', fontSize:'13px', margin:'0 0 2px' }}>{req.companyName || '—'}</p>
                          {req.industry && <p style={{ fontSize:'11.5px', color:'#64748b', margin:0 }}>{req.industry}</p>}
                        </div>

                        {/* Supervisor + GPS */}
                        <div className="plq-col-sup">
                          <p style={{ fontSize:'10px', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.5px', color:'#94a3b8', margin:'0 0 6px' }}>Supervisor</p>
                          {req.supervisorEmail && (
                            <p style={{ fontSize:'12px', color:'#475569', margin:'0 0 3px', display:'flex', alignItems:'center', gap:'5px' }}>
                              <Mail size={11} color="#94a3b8" />{req.supervisorEmail}
                            </p>
                          )}
                          {req.supervisorPhone && (
                            <p style={{ fontSize:'12px', color:'#475569', margin:'0 0 6px', display:'flex', alignItems:'center', gap:'5px' }}>
                              <Phone size={11} color="#94a3b8" />{req.supervisorPhone}
                            </p>
                          )}
                          {hasGps && (
                            <button
                              onClick={() => window.open(`https://www.google.com/maps?q=${req.lat},${req.long}`, '_blank')}
                              style={{ display:'inline-flex', alignItems:'center', gap:'4px', fontSize:'11px', color:'#d97706', background:'#fffbeb', border:'1px solid #fcd34d', borderRadius:'6px', padding:'3px 8px', cursor:'pointer', fontWeight:600 }}
                            >
                              <MapPin size={10} />{parseFloat(req.lat).toFixed(4)}, {parseFloat(req.long).toFixed(4)} — Map
                            </button>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="plq-actions">
                          <button
                            onClick={() => handleOpenVerify(req)}
                            style={{ padding:'9px 18px', background:'linear-gradient(135deg,#03256c,#1768ac)', color:'#fff', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:'6px', whiteSpace:'nowrap' }}
                          >
                            <CheckCircle2 size={14} /> Approve
                          </button>
                          <button
                            onClick={() => handleReject(req)}
                            style={{ padding:'9px 18px', background:'#fff', color:'#ef4444', border:'1.5px solid #fca5a5', borderRadius:'8px', fontSize:'13px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:'6px', whiteSpace:'nowrap' }}
                            onMouseEnter={e => { e.currentTarget.style.background='#fef2f2'; }}
                            onMouseLeave={e => { e.currentTarget.style.background='#fff'; }}
                          >
                            <X size={14} /> Decline
                          </button>
                        </div>

                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        );

      case 'companies':
        return (
          <div className="content-card fade-in">
            <div className="card-header-actions">
              <h3>Partner Companies & Slot Allocation</h3>
              <div className="search-wrapper-inline">
                <Search size={16} />
                <input 
                  type="text" 
                  placeholder="Search partners..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="primary-btn" onClick={() => setIsAddCompanyModalOpen(true)}>
                <PlusCircle size={18}/> Add Partner
              </button>
            </div>
            <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Company Name</th>
                  <th>Location</th>
                  <th>Category</th>
                  <th style={{textAlign: 'center'}}>Available Slots</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.length > 0 ? (
                  filteredCompanies.map(company => {
                    const companyId = company._id || company.id;
                    const isEditing = editingCompany && (editingCompany._id || editingCompany.id) === companyId;
                    return (
                      <React.Fragment key={companyId}>
                        <tr>
                          <td><strong>{company.name}</strong></td>
                          <td>{company.location}</td>
                          <td>{company.category}</td>
                          <td style={{textAlign: 'center'}}>
                            <span className="slot-badge">{company.slots ?? 0}</span>
                          </td>
                          <td>
                            <div className="action-group-sm">
                              <button className="text-link-btn" onClick={() => handleViewInterns(company)}>View Interns</button>
                              <button className="text-link-btn-secondary" onClick={() => handleEditCompany(company)}>Edit</button>
                              <button className="btn-reject-outline" style={{fontSize:'12px', padding:'4px 10px'}} onClick={() => handleDeleteCompany(companyId)}>Delete</button>
                            </div>
                          </td>
                        </tr>
                        {isEditing && (
                          <tr>
                            <td colSpan="5" style={{padding: '0', background: '#f8fafc', borderBottom: '2px solid #3b82f6'}}>
                              <div style={{padding: '16px 20px'}}>
                                <p style={{fontSize: '12px', fontWeight: '700', color: '#3b82f6', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                                  Editing: {company.name}
                                </p>
                                <div className="form-grid-2" style={{marginBottom: '10px'}}>
                                  <div className="input-group">
                                    <label>Company Name</label>
                                    <input className="admin-input-select-sm" value={editingCompany.name || ''} onChange={e => handleEditChange('name', e.target.value)} />
                                  </div>
                                  <div className="input-group">
                                    <label>Category</label>
                                    <select className="admin-input-select-sm" value={editingCompany.category || ''} onChange={e => handleEditChange('category', e.target.value)}>
                                      <option>Engineering</option>
                                      <option>Software/IT</option>
                                      <option>Business</option>
                                      <option>Electrical</option>
                                      <option>Network Eng.</option>
                                    </select>
                                  </div>
                                </div>
                                <div className="form-grid-2" style={{marginBottom: '10px'}}>
                                  <div className="input-group">
                                    <label>City / Address</label>
                                    <input className="admin-input-select-sm" value={editingCompany.location || ''} onChange={e => handleEditChange('location', e.target.value)} />
                                  </div>
                                  <div className="input-group">
                                    <label>Internship Slots</label>
                                    <input type="number" min="0" className="admin-input-select-sm" value={editingCompany.slots ?? ''} onChange={e => handleEditChange('slots', e.target.value)} />
                                  </div>
                                </div>
                                <div style={{display:'flex', gap:'10px', alignItems:'flex-end', marginBottom:'12px', background:'#fffbeb', border:'1px solid #fcd34d', borderRadius:'8px', padding:'12px'}}>
                                  <MapPin size={14} style={{color:'#d97706', flexShrink:0, marginBottom:'4px'}} />
                                  <div style={{flex:1}}>
                                    <p style={{fontSize:'11px', fontWeight:'700', color:'#92400e', marginBottom:'8px'}}>GPS Geofence</p>
                                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px'}}>
                                      <div className="input-group">
                                        <label>Latitude</label>
                                        <input type="number" step="any" className="admin-input-select-sm" placeholder="5.60" value={editingCompany.lat ?? ''} onChange={e => handleEditChange('lat', e.target.value)} />
                                      </div>
                                      <div className="input-group">
                                        <label>Longitude</label>
                                        <input type="number" step="any" className="admin-input-select-sm" placeholder="-0.18" value={editingCompany.long ?? ''} onChange={e => handleEditChange('long', e.target.value)} />
                                      </div>
                                      <div className="input-group">
                                        <label>Radius</label>
                                        <select className="admin-input-select-sm" value={editingCompany.radius || '150'} onChange={e => handleEditChange('radius', e.target.value)}>
                                          <option value="50">50m</option>
                                          <option value="150">150m</option>
                                          <option value="500">500m</option>
                                        </select>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                {/* Industrial Supervisor */}
                                <div style={{marginBottom:'12px', background:'#f0f9ff', border:'1px solid #bae6fd', borderRadius:'8px', padding:'12px'}}>
                                  <p style={{fontSize:'11px', fontWeight:'700', color:'#0284c7', marginBottom:'8px', display:'flex', alignItems:'center', gap:'4px'}}>
                                    <User size={13} /> Industrial Supervisor
                                  </p>
                                  <div className="form-grid-2" style={{marginBottom:'8px'}}>
                                    <div className="input-group">
                                      <label>Supervisor Name</label>
                                      <input className="admin-input-select-sm" placeholder="Mr. Kofi Mensah" value={editingCompany.supervisorName || ''} onChange={e => handleEditChange('supervisorName', e.target.value)} />
                                    </div>
                                    <div className="input-group">
                                      <label>Phone</label>
                                      <input type="tel" className="admin-input-select-sm" placeholder="024XXXXXXX" value={editingCompany.supervisorPhone || ''} onChange={e => handleEditChange('supervisorPhone', e.target.value)} />
                                    </div>
                                  </div>
                                  <div className="input-group">
                                    <label>Email</label>
                                    <input type="email" className="admin-input-select-sm" placeholder="supervisor@company.com" value={editingCompany.supervisorEmail || ''} onChange={e => handleEditChange('supervisorEmail', e.target.value)} />
                                  </div>
                                </div>
                                <div style={{display:'flex', gap:'8px', justifyContent:'flex-end'}}>
                                  <button className="cancel-btn" onClick={() => setEditingCompany(null)}>Cancel</button>
                                  <button className="btn-verify-confirm" onClick={() => handleSaveEdit(companyId)}>Save Changes</button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr><td colSpan="5" className="no-results">{loadingData ? 'Loading companies…' : `No companies found matching "${searchTerm}"`}</td></tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        );

      case 'students':
  return (
    <div className="content-card fade-in">
      <div className="card-header-actions">
        <div>
          <h3>Student Master List</h3>
          <p className="sub-text-sm">
            Showing {filteredStudents.length} of {students.length} students
            {filterSupervisor ? ' · Filtered by supervisor' : ''}
          </p>
        </div>
        <div className="action-group-sm">
          {filterSupervisor && (
            <button className="btn-reject-outline" style={{fontSize:'12px'}} onClick={() => setFilterSupervisor('')}>
              Clear Filter ×
            </button>
          )}
          <button className="btn-outline-blue" onClick={() => setIsBroadcasterOpen(true)}>
            <Bell size={18}/> Announce
          </button>
          <button className="primary-btn" onClick={() => setIsAddStudentModalOpen(true)}>
            <PlusCircle size={18}/> Add Student
          </button>
        </div>
      </div>
      {/* Filter + Sort bar */}
      <div style={{display:'flex', gap:'10px', flexWrap:'wrap', marginBottom:'12px', alignItems:'center'}}>
        <select className="admin-input-select-sm" value={placementFilter} onChange={e => setPlacementFilter(e.target.value)} style={{width:'auto'}}>
          <option value="all">All Students</option>
          <option value="placed">Placed Only</option>
          <option value="unplaced">Unplaced Only</option>
        </select>
        <select className="admin-input-select-sm" value={studentSortBy} onChange={e => setStudentSortBy(e.target.value)} style={{width:'auto'}}>
          <option value="name">Sort: Name</option>
          <option value="index">Sort: Index No.</option>
          <option value="dept">Sort: Department</option>
        </select>
      </div>

            <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Index No.</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Current Company</th>
                 <th style={{textAlign: 'right'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr><td colSpan="6" className="no-results">{loadingData ? 'Loading students…' : 'No students match the current filter.'}</td></tr>
                ) : filteredStudents.map(s => {
                  const sid = s._id || s.id;
                  // Resolve company name — try populated object first, then lookup, then stored strings
                  const companyName = (typeof s.companyId === 'object' && s.companyId?.name)
                    ? s.companyId.name
                    : s.companyName
                    || (() => {
                        const cid = (typeof s.companyId === 'object' ? s.companyId?._id : s.companyId);
                        const found = cid ? companies.find(co => (co._id||co.id)?.toString() === cid?.toString()) : null;
                        return found?.name;
                      })()
                    || (typeof s.company === 'string' ? s.company : s.company?.name)
                    || '—';
                  const isPlaced = s.placementStatus === 'Active' || s.status === 'Placed';
                  return (
                    <tr key={sid}>
                      <td><strong>{s.name}</strong></td>
                      <td>{s.indexNumber || s.index || '—'}</td>
                      <td>{s.department || s.dept || '—'}</td>
                      <td><span className={`badge-pill-${isPlaced ? 'green' : 'amber'}`}>{s.placementStatus || s.status || 'Unplaced'}</span></td>
                      <td>{companyName}</td>
                      <td style={{textAlign:'right'}}>
                        <div className="action-group-sm" style={{justifyContent:'flex-end'}}>
                          <button className="btn-manage-student" onClick={() => { setSelectedStudentManage(s); setIsStudentDrawerOpen(true); }}>
                            Manage <Settings size={14} />
                          </button>
                          {filterSupervisor && (s.academicSupervisor) && (
                            <button
                              className="btn-outline-amber"
                              style={{fontSize:'12px', padding:'4px 10px'}}
                              title="Remove supervisor assignment"
                              onClick={async () => {
                                if (!window.confirm(`Unassign supervisor from ${s.name}?`)) return;
                                try {
                                  const res = await api.unassignStudent(sid);
                                  const updated = res?.data || res;
                                  setStudents(prev => prev.map(st =>
                                    (st._id||st.id).toString() === sid.toString()
                                      ? { ...st, academicSupervisor: null }
                                      : st
                                  ));
                                } catch (err) { console.error('Unassign failed:', err); }
                              }}
                            >
                              Unassign
                            </button>
                          )}
                          <button
                            className="btn-reject-outline"
                            style={{fontSize:'12px', padding:'4px 10px'}}
                            onClick={async () => {
                              if (!window.confirm(`Delete ${s.name}? This cannot be undone.`)) return;
                              try {
                                await api.deleteStudent(sid);
                                setStudents(prev => prev.filter(st => (st._id||st.id).toString() !== sid.toString()));
                              } catch (err) { console.error('Delete failed:', err); }
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
            {/* 🚀 THE MANAGEMENT DRAWER */}
      {isStudentDrawerOpen && selectedStudentManage && (
        <AdminStudentDrawer
          student={selectedStudentManage}
          onClose={() => setIsStudentDrawerOpen(false)}
          onStudentUpdated={(id, patch) => {
            setStudents(prev => prev.map(s => (s._id === id || s.id === id) ? { ...s, ...patch } : s));
          }}
          onStudentDeleted={(id) => {
            setStudents(prev => prev.filter(s => (s._id||'').toString() !== id.toString() && (s.id||'').toString() !== id.toString()));
            setIsStudentDrawerOpen(false);
          }}
        />
      )}
          </div>
        );

      case 'documents':
        return <AdminDocumentsTab />;

case 'supervisors':
  return (
    <SupervisorsTab
      supervisors={supervisors}
      students={students}
      loadingData={loadingData}
      onAddLecturer={() => setIsAddLecturerModalOpen(true)}
      onSave={handleSaveSupervisor}
      onDelete={handleDeleteSupervisor}
      onViewStudents={(supId) => { setFilterSupervisor(supId); setTab('students'); }}
    />
  );

     /* Inside AdminDashboard.js switch case 'assignments' */

case 'assignments':
  return <AssignmentTab />;

      case 'overview':
default:
  return (
    <div className="overview-container fade-in">
      
      {(() => {
        const totalStudents   = students.length;
        const placedStudents  = students.filter(s => s.placementStatus === 'Active' || s.status === 'Placed').length;
        const gradedStudents  = students.filter(s => s.gradeStatus === 'Graded' || s.status === 'Graded').length;
        const totalSlots      = companies.reduce((sum, co) => sum + (Number(co.slots) || 0), 0);
        const assignedSups    = supervisors.filter(s => (s.studentCount || 0) > 0).length;
        const staffCovPct     = supervisors.length > 0 ? Math.round((assignedSups / supervisors.length) * 100) : 0;

        // Progress bar percentages
        const placedPct  = totalStudents > 0 ? Math.round((placedStudents  / totalStudents) * 100) : 0;
        const gradedPct  = totalStudents > 0 ? Math.round((gradedStudents  / totalStudents) * 100) : 0;

        // Students who have submitted at least one log
        const studentsWithLogs = new Set(grades.map(g => (g.student?._id || g.student || '').toString()));
        const logbookPct = totalStudents > 0 ? Math.round((studentsWithLogs.size / totalStudents) * 100) : 0;

        return (
          <>
            <div className="overview-grid">
              <div className="stat-card">
                <div className="stat-header"><Users size={20} className="text-blue" /></div>
                <div className="stat-body">
                  <p className="stat-label">Total Interns</p>
                  <h3>{totalStudents}</h3>
                </div>
                <small>Registered Students</small>
              </div>

              <div className="stat-card">
                <div className="stat-header"><Building2 size={20} className="text-emerald" /></div>
                <div className="stat-body">
                  <p className="stat-label">Partner Slots</p>
                  <h3>{totalSlots}</h3>
                </div>
                <small>Across {companies.length} Firms</small>
              </div>

              <div className="stat-card alert-border">
                <div className="stat-header">
                  <ClipboardCheck size={20} className="text-amber" />
                  {placementRequests.length > 0 && <div className="pulse-dot"></div>}
                </div>
                <div className="stat-body">
                  <p className="stat-label">Pending Requests</p>
                  <h3 className="text-amber">{placementRequests.length}</h3>
                </div>
                <button className="text-link-btn-sm" onClick={() => setTab('pending-placements')}>Review Now →</button>
              </div>

              <div className="stat-card">
                <div className="stat-header"><UserCheck size={20} className="text-indigo" /></div>
                <div className="stat-body">
                  <p className="stat-label">Staff Coverage</p>
                  <h3>{staffCovPct}%</h3>
                </div>
                <small>{assignedSups} of {supervisors.length} Lecturers Assigned</small>
              </div>
            </div>

            {/* Progress bars */}
            <div className="overview-middle-row" style={{ marginTop: '25px' }}>
              <div className="content-card flex-2">
                <h4>Placement Progress</h4>
                <div className="progress-analysis">
                  {[
                    { label: 'Students Placed',    pct: placedPct,  color: '#10b981' },
                    { label: 'Logbooks / Graded',  pct: logbookPct, color: '#3b82f6' },
                    { label: 'Grading Completed',  pct: gradedPct,  color: '#6366f1' },
                  ].map(({ label, pct, color }) => (
                    <div className="progress-item" key={label}>
                      <div className="progress-label"><span>{label}</span><span>{pct}%</span></div>
                      <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="content-card flex-1">
                <h4>Season Info</h4>
                <div className="health-stats">
                  <div className="health-item">
                    <span className="dot online" /> <strong>Year:</strong> <span>{settings?.academicYear || '—'}</span>
                  </div>
                  <div className="health-item">
                    <span className="dot online" /> <strong>Semester:</strong> <span>{settings?.semester || '—'}</span>
                  </div>
                  <div className="health-item">
                    <span className="dot online" /> <strong>Duration:</strong> <span>{settings?.totalWeeks || '—'} weeks</span>
                  </div>
                  <div className="health-item">
                    <span className={`dot ${settings?.allowSelfPlacement ? 'online' : 'warning'}`} />
                    <strong>Self-Placement:</strong>
                    <span className={settings?.allowSelfPlacement ? 'text-emerald' : 'text-amber'}>
                      {settings?.allowSelfPlacement ? 'Open' : 'Closed'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
      case 'settings': {
        const sForm = settings || {};

        const handleSettingsSave = async () => {
          setSettingsSaving(true);
          setSettingsMsg('');
          try {
            const res = await api.updateSettings({
              academicYear:             sForm.academicYear,
              semester:                 sForm.semester,
              portalOpenDate:           sForm.portalOpenDate || null,
              submissionDeadline:       sForm.submissionDeadline || null,
              totalWeeks:               Number(sForm.totalWeeks)       || 6,
              weightIndustrial:         Number(sForm.weightIndustrial) || 40,
              weightAcademic:           Number(sForm.weightAcademic)   || 30,
              weightLogbook:            Number(sForm.weightLogbook)    || 30,
              geofenceEnabled:          sForm.geofenceEnabled !== false,
              geofenceRadius:           Number(sForm.geofenceRadius)   || 150,
              attendanceMode:           sForm.attendanceMode,
              strictTimeWindow:         !!sForm.strictTimeWindow,
              allowSelfPlacement:       !!sForm.allowSelfPlacement,
              industrialPortalEnabled:  !!sForm.industrialPortalEnabled,
            });
            setSettings(res?.data || res);
            setSettingsMsg('✅ Settings saved successfully.');
          } catch (err) {
            setSettingsMsg('❌ ' + (err.message || 'Failed to save.'));
          } finally {
            setSettingsSaving(false);
          }
        };

        const handleAddDept = async (name) => {
          if (!name.trim()) return;
          try {
            const res = await api.addDepartment(name.trim());
            const newDepts = res?.data || res;
            setSettings(prev => ({ ...prev, departments: newDepts }));
          } catch (err) {
            setSettingsMsg('❌ ' + (err.message || 'Failed to add department.'));
          }
        };

        const handleRemoveDept = async (name) => {
          try {
            const res = await api.removeDepartment(name);
            const newDepts = res?.data || res;
            setSettings(prev => ({ ...prev, departments: newDepts }));
          } catch (err) {
            setSettingsMsg('❌ ' + (err.message || 'Failed to remove department.'));
          }
        };

        const setSField = (k, v) => setSettings(prev => ({ ...prev, [k]: v }));

        // Convert a date value (ISO string or Date object) to YYYY-MM-DD
        // using LOCAL timezone so date inputs never show the wrong day
        const toLocalDateStr = (val) => {
          if (!val) return '';
          const d = new Date(val);
          if (isNaN(d)) return '';
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${y}-${m}-${day}`;
        };
        const weightsTotal = (Number(sForm.weightIndustrial)||0) + (Number(sForm.weightAcademic)||0) + (Number(sForm.weightLogbook)||0);

        return (
          <div className="content-card fade-in">
            <div className="card-header-actions">
              <div>
                <h3>System Configuration</h3>
                <p className="sub-text-sm">Global control panel for the {sForm.academicYear || '—'} internship season.</p>
              </div>
              <button className="primary-btn" onClick={() => setIsAddAdminModalOpen(true)}>
                <PlusCircle size={16} /> Add Admin User
              </button>
            </div>

            {settingsMsg && (
              <div style={{padding:'10px 14px', borderRadius:'8px', marginBottom:'16px', fontSize:'13px',
                background: settingsMsg.startsWith('✅') ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${settingsMsg.startsWith('✅') ? '#86efac' : '#fca5a5'}`,
                color: settingsMsg.startsWith('✅') ? '#15803d' : '#dc2626'}}>
                {settingsMsg}
              </div>
            )}

            {!settings ? (
              <div style={{display:'flex', alignItems:'center', gap:'8px', color:'#94a3b8', padding:'20px 0'}}>
                <Loader size={18} style={{animation:'spin 1s linear infinite'}} /> Loading settings…
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
            ) : (
              <div className="settings-container-scroll">
                <div className="settings-grid">

                  {/* ── SECTION 1: SEASON ── */}
                  <div className="settings-section">
                    <h4 className="settings-title"><Calendar size={18} /> Internship Season</h4>
                    <div className="form-grid-2">
                      <div className="input-group">
                        <label>Academic Year</label>
                        <input type="text" className="admin-input-select" value={sForm.academicYear || ''} onChange={e => setSField('academicYear', e.target.value)} />
                      </div>
                      <div className="input-group">
                        <label>Semester</label>
                        <select className="admin-input-select" value={sForm.semester || 'Semester 1'} onChange={e => setSField('semester', e.target.value)}>
                          <option>Semester 1</option>
                          <option>Semester 2</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-grid-2" style={{marginTop:'15px'}}>
                      <div className="input-group">
                        <label>Portal Opening Date</label>
                        <input type="date" className="admin-input-select"
                          value={sForm.portalOpenDate ? toLocalDateStr(sForm.portalOpenDate) : ''}
                          onChange={e => setSField('portalOpenDate', e.target.value)} />
                      </div>
                      <div className="input-group">
                        <label>Final Submission Deadline</label>
                        <input type="date" className="admin-input-select"
                          value={sForm.submissionDeadline ? toLocalDateStr(sForm.submissionDeadline) : ''}
                          onChange={e => setSField('submissionDeadline', e.target.value)} />
                      </div>
                    </div>
                    <div className="input-group" style={{marginTop:'15px'}}>
                      <label>Internship Duration (Weeks)</label>
                      <select className="admin-input-select" value={sForm.totalWeeks || 6} onChange={e => setSField('totalWeeks', Number(e.target.value))}>
                        {[4,6,8,10,12].map(w => <option key={w} value={w}>{w} Weeks</option>)}
                      </select>
                    </div>
                  </div>

                  {/* ── SECTION 2: GRADING WEIGHTS ── */}
                  <div className="settings-section">
                    <h4 className="settings-title"><ShieldCheck size={18} /> Score Distribution</h4>
                    <p className="helper-text-sm">Configure how the final 100% grade is calculated.
                      <strong style={{marginLeft:'6px', color: weightsTotal !== 100 ? '#dc2626' : '#10b981'}}>
                        Total: {weightsTotal}%
                      </strong>
                    </p>
                    <div className="weight-stack">
                      {[
                        { label: 'Industrial Supervisor', key: 'weightIndustrial' },
                        { label: 'Academic Supervisor',   key: 'weightAcademic' },
                        { label: 'Logbook & Final Report',key: 'weightLogbook' },
                      ].map(({ label, key }) => (
                        <div className="weight-input-item" key={key}>
                          <span>{label}</span>
                          <div className="input-with-unit">
                            <input type="number" min="0" max="100" className="weight-field"
                              value={sForm[key] ?? ''}
                              onChange={e => setSField(key, Number(e.target.value))} />
                            <span className="unit">%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── SECTION 3: GEOFENCING ── */}
                  <div className="settings-section">
                    <h4 className="settings-title"><MapPin size={18} /> Geofencing Parameters</h4>
                    <div className="input-group">
                      <label>Verification Radius — <strong>{sForm.geofenceRadius || 150}m</strong></label>
                      <input type="range" min="50" max="500" step="50" className="admin-slider"
                        value={sForm.geofenceRadius || 150}
                        onChange={e => setSField('geofenceRadius', Number(e.target.value))} />
                      <div className="slider-labels">
                        <span>50m (Strict)</span>
                        <span>500m (Relaxed)</span>
                      </div>
                    </div>
                    <div className="input-group" style={{marginTop:'20px'}}>
                      <label>Attendance Mode</label>
                      <select className="admin-input-select" value={sForm.attendanceMode || 'gps+timestamp'} onChange={e => setSField('attendanceMode', e.target.value)}>
                        <option value="gps+timestamp">GPS + Timestamp (Recommended)</option>
                        <option value="gps+selfie">GPS + Selfie Upload</option>
                        <option value="manual">Manual (No GPS)</option>
                      </select>
                    </div>
                    <div style={{display:'flex', alignItems:'center', gap:'12px', marginTop:'16px'}}>
                      <label className="ui-switch">
                        <input type="checkbox" checked={sForm.geofenceEnabled !== false} onChange={e => setSField('geofenceEnabled', e.target.checked)} />
                        <span className="slider-round" />
                      </label>
                      <div>
                        <strong style={{fontSize:'13px'}}>Enable GPS Geofencing</strong>
                        <p style={{fontSize:'12px', color:'#64748b', margin:0}}>Disable to allow log submission from any location (useful during testing).</p>
                      </div>
                    </div>
                    <div style={{display:'flex', alignItems:'center', gap:'12px', marginTop:'16px'}}>
                      <label className="ui-switch">
                        <input type="checkbox" checked={!!sForm.strictTimeWindow} onChange={e => setSField('strictTimeWindow', e.target.checked)} />
                        <span className="slider-round" />
                      </label>
                      <div>
                        <strong style={{fontSize:'13px'}}>Strict Time Window</strong>
                        <p style={{fontSize:'12px', color:'#64748b', margin:0}}>Only allow log submissions between 07:00 and 18:00 GMT.</p>
                      </div>
                    </div>
                  </div>

                  {/* ── SECTION 4: DEPARTMENTS ── */}
                  <div className="settings-section">
                    <h4 className="settings-title"><Building2 size={18} /> Active Departments</h4>
                    <p className="helper-text-sm" style={{marginBottom:'12px'}}>These appear in student registration and assignment dropdowns.</p>
                    <div className="dept-tags-grid">
                      {(sForm.departments || []).map(dept => (
                        <div key={dept} className="dept-pill">
                          {dept}
                          <button style={{background:'none', border:'none', cursor:'pointer', padding:'0 2px', display:'flex', alignItems:'center'}}
                            title={`Remove ${dept}`}
                            onClick={() => handleRemoveDept(dept)}>
                            <X size={14} className="remove-pill" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div style={{display:'flex', gap:'8px', marginTop:'12px'}}>
                      <input
                        type="text"
                        className="admin-input-select"
                        placeholder="New department name…"
                        style={{flex:1, fontSize:'13px'}}
                        value={newDeptInput}
                        onChange={e => setNewDeptInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { handleAddDept(newDeptInput); setNewDeptInput(''); }}}
                      />
                      <button className="primary-btn" style={{whiteSpace:'nowrap'}}
                        onClick={() => { handleAddDept(newDeptInput); setNewDeptInput(''); }}>
                        <PlusCircle size={14} /> Add
                      </button>
                    </div>
                  </div>

                  {/* ── SECTION 5: PORTAL ACCESS ── */}
                  <div className="settings-section full-width">
                    <h4 className="settings-title"><Settings size={18} /> Portal Access Control</h4>
                    <div className="portal-switches">
                      {[
                        { key:'allowSelfPlacement',      label:'Student Self-Placement Request', desc:'Allow students to submit companies not in the market.' },
                        { key:'industrialPortalEnabled',  label:'Industrial Supervisor Portal',   desc:'Enable/Disable external manager logbook grading.' },
                      ].map(({ key, label, desc }) => (
                        <div className="switch-row" key={key}>
                          <div className="switch-info">
                            <strong>{label}</strong>
                            <p>{desc}</p>
                          </div>
                          <label className="ui-switch">
                            <input type="checkbox" checked={!!sForm[key]} onChange={e => setSField(key, e.target.checked)} />
                            <span className="slider-round" />
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            )}

            <div className="settings-action-footer">
              <p className="sub-text-sm">
                {settings?.updatedAt ? `Last saved: ${new Date(settings.updatedAt).toLocaleString()}` : ''}
              </p>
              <button className="primary-btn" onClick={handleSettingsSave} disabled={settingsSaving || weightsTotal !== 100}>
                {settingsSaving ? <><Loader size={14} style={{animation:'spin 1s linear infinite'}} /> Saving…</> : 'Save Global Configuration'}
              </button>
            </div>
          </div>
        );
      }
    }
  };

  // Full-screen loading state on first load
  if (loadingData) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', gap:'16px', background:'#f8fafc', fontFamily:'Inter, sans-serif' }}>
        <div style={{ width:'40px', height:'40px', border:'4px solid #e2e8f0', borderTopColor:'#3b82f6', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        <p style={{ color:'#64748b', fontSize:'15px', fontWeight:500 }}>Loading InternTrack…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', gap:'16px', background:'#f8fafc', fontFamily:'Inter, sans-serif' }}>
        <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:'12px', padding:'32px 40px', textAlign:'center', maxWidth:'480px' }}>
          <p style={{ fontSize:'24px', marginBottom:'8px' }}>⚠️</p>
          <h3 style={{ color:'#dc2626', margin:'0 0 8px' }}>Dashboard Failed to Load</h3>
          <p style={{ color:'#64748b', fontSize:'14px', margin:'0 0 20px' }}>{loadError}</p>
          <button onClick={() => window.location.reload()}
            style={{ background:'#3b82f6', color:'#fff', border:'none', borderRadius:'8px', padding:'10px 24px', fontWeight:600, cursor:'pointer', fontSize:'14px' }}>
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-wrapper">
      {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />}
      <aside className={`sidebar${isSidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-top">
          <div className="sidebar-brand" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span>InternTrack Admin</span>
            <button className="mobile-close-btn" onClick={() => setIsSidebarOpen(false)}><X size={20} /></button>
          </div>
          <nav className="sidebar-nav">
            <div className="nav-group">
              <label>MAIN MENU</label>
              <ul style={{listStyle:'none',padding:0,margin:0}}>
                <li className={activeTab === 'overview'           ? 'active' : ''} onClick={() => setTab('overview')}><LayoutDashboard size={20} /> Overview</li>
                <li className={activeTab === 'pending-placements' ? 'active' : ''} onClick={() => setTab('pending-placements')}><ClipboardCheck size={20} /> Placement Requests</li>
                <li className={activeTab === 'companies'          ? 'active' : ''} onClick={() => setTab('companies')}><Building2 size={20} /> Company Slots</li>
                <li className={activeTab === 'documents'          ? 'active' : ''} onClick={() => setTab('documents')}><FileDown size={20} /> Attachment Letters</li>
                <li className={activeTab === 'assignments'        ? 'active' : ''} onClick={() => setTab('assignments')}><Link2 size={20} /> Assignments</li>
                <li className={activeTab === 'supervisors'        ? 'active' : ''} onClick={() => setTab('supervisors')}><UserCheck size={20} /> Supervisors</li>
                <li className={activeTab === 'students'           ? 'active' : ''} onClick={() => setTab('students')}><Users size={20} /> Students</li>
                <li className={activeTab === 'settings'           ? 'active' : ''} onClick={() => setTab('settings')}><Settings size={20} /> Settings</li>
              </ul>
            </div>
          </nav>
        </div>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}><LogOut size={20} /> Logout</button>
        </div>
      </aside>

      <main className="main-area">
        <header className="top-nav">
          <div className="top-nav-left">
            <button className="mobile-menu-toggle" onClick={() => setIsSidebarOpen(true)}><Menu size={22} /></button>
            <div className="breadcrumb">Admin / {activeTab.replace('-', ' ').toUpperCase()}</div>
          </div>
          <div className="top-nav-search">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search across portal..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          <div className="top-nav-right">
            <div className="notification-wrapper">
              <div className="bell-trigger" onClick={() => setShowNotifications(!showNotifications)}>
                <Bell size={20} />
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
              </div>
              {showNotifications && (
                <div className="notification-dropdown fade-in">
                  <div className="notif-header">
                    <span>Notifications</span>
                    <button className="text-link-btn-sm" onClick={() => setShowNotifications(false)}>Close</button>
                  </div>
                  <div className="notif-list">
                    {notifications.map(n => (
                      <div key={n.id} className="notif-item">
                        <div className="notif-content">
                          <p><strong>{n.student}</strong> {n.msg}</p>
                          <small>{n.time}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="admin-avatar">AD</div>
          </div>
        </header>

        {/* Global action toast — replaces alert() */}
        {actionMsg.text && (
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            gap:'10px', padding:'12px 20px', fontSize:'13px', fontWeight:500,
            background: actionMsg.type === 'error' ? '#fef2f2' : '#f0fdf4',
            borderBottom: `1px solid ${actionMsg.type === 'error' ? '#fca5a5' : '#86efac'}`,
            color: actionMsg.type === 'error' ? '#dc2626' : '#15803d',
          }}>
            <span>{actionMsg.text}</span>
            <button onClick={() => setActionMsg({ text:'', type:'' })}
              style={{ background:'none', border:'none', cursor:'pointer', color:'inherit', fontSize:'16px', lineHeight:1, padding:0 }}>×</button>
          </div>
        )}

        <section className="page-content">{renderContent()}</section>
      </main>

      {/* MODALS */}
      {isVerifyModalOpen && selectedRequest && <VerificationModal isOpen={isVerifyModalOpen} onClose={() => setIsVerifyModalOpen(false)} studentData={selectedRequest} lecturers={lecturers} onApprove={handleApproveWithFeedback} />}
      <AddCompanyModal isOpen={isAddCompanyModalOpen} onClose={() => setIsAddCompanyModalOpen(false)} onAdd={handleAddCompany} />
      {isProfileModalOpen && selectedCompany && <CompanyProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        company={selectedCompany}
        students={students}
        onViewStudent={(s) => { setSelectedStudentManage(s); setIsStudentDrawerOpen(true); setIsProfileModalOpen(false); }}
      />}
      <AddStudentModal
        isOpen={isAddStudentModalOpen}
        onClose={() => setIsAddStudentModalOpen(false)}
        onStudentAdded={(s) => { if (s) setStudents(prev => [s, ...prev]); }}
      />
      <AddLecturerModal
        isOpen={isAddLecturerModalOpen}
        onClose={() => setIsAddLecturerModalOpen(false)}
        onLecturerAdded={(s) => { if (s) setSupervisors(prev => [s, ...prev]); }}
        onSupervisorAdded={(sup) => setSupervisors(prev => [sup, ...prev])}
      />
      <BulkBroadcasterModal isOpen={isBroadcasterOpen}onClose={() => setIsBroadcasterOpen(false)}studentCount={students.length}academicCount={supervisors.filter(s => s.role === 'academic').length}industrialCount={supervisors.filter(s => s.role === 'industrial').length}/>
      <ExportRegistryModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} students={students} />
      <AddAdminModal isOpen={isAddAdminModalOpen} onClose={() => setIsAddAdminModalOpen(false)} onAdminAdded={() => {}} />
    </div>
  );
};

export default AdminDashboard;