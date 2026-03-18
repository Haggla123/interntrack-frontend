// src/pages/IndustrialDashboard.js
import React, { useState, useEffect } from 'react';
import IndustrialSidebar  from '../components/industrial/IndustrialSidebar';
import PendingApprovals   from '../components/industrial/PendingApprovals';
import MyInterns          from '../components/industrial/MyInterns';
import SupervisorSettings from '../components/industrial/SupervisorSettings';
import InternEvaluation   from '../components/industrial/InternEvaluation';
import { Clock, Calendar, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getPendingLogs, getVisits, getStudents } from '../api';
import '../styles/IndustrialDashboard.css';

const IndustrialDashboard = () => {
  const { user, logout, refreshUser } = useAuth();
  const [activeTab, setActiveTab]     = useState('overview');
  const [isSidebarOpen, setSidebar]   = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [nextVisit, setNextVisit]       = useState(null);
  const [acSup,     setAcSup]           = useState(null); // academic supervisor details

  const supervisorName = user?.name     || 'Supervisor';
  const companyName    = user?.companyId?.name || user?.companyOrg || 'Your Organisation';

  useEffect(() => { refreshUser(); }, [refreshUser]);

  // Load academic supervisor from assigned students
  useEffect(() => {
    getStudents()
      .then(res => {
        const arr = Array.isArray(res) ? res : Array.isArray(res.data) ? res.data : [];
        // Find first student with an academicSupervisor populated
        const sup = arr.map(s => s.academicSupervisor).find(s => s && s.name);
        if (sup) setAcSup(sup);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    getPendingLogs()
      .then(res => {
        const arr = Array.isArray(res) ? res : Array.isArray(res.data) ? res.data : [];
        setPendingCount(arr.length);
      })
      .catch(() => {});

    getVisits()
      .then(res => {
        const arr = Array.isArray(res) ? res : Array.isArray(res.data) ? res.data : [];
        const upcoming = arr
          .filter(v => v.status !== 'Completed' && v.status !== 'Cancelled' && new Date(v.date) >= new Date())
          .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
        setNextVisit(upcoming || null);
      })
      .catch(() => {});
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'interns':   return <MyInterns />;
      case 'evaluate':  return <InternEvaluation />;
      case 'approvals': return <PendingApprovals />;
      case 'settings':  return <SupervisorSettings />;
      case 'overview':
      default:
        return (
          <div className="bento-container fade-in">
            <div className="bento-row main-stats">
              <div className="bento-item welcome-box hero-gradient">
                <div className="badge-pill">Industrial Portal</div>
                <h1>Welcome back, {supervisorName.split(' ')[0]}</h1>
                <p>You have active interns under your supervision{companyName ? ` at ${companyName}` : ''}.</p>
                <div className="hero-actions">
                  <button className="btn-primary-lite" onClick={() => setActiveTab('evaluate')}>
                    Submit Evaluation
                  </button>
                </div>
              </div>

              <div className={`bento-item status-box ${pendingCount > 0 ? 'warning-alert' : ''}`}>
                <div className="pulse-header">
                  <label>{pendingCount > 0 ? 'Action Required' : 'All Clear'}</label>
                  {pendingCount > 0 && <div className="pulse-dot" />}
                </div>
                <div className="big-stat urgent-count">{String(pendingCount).padStart(2, '0')}</div>
                <p>Pending Logbook {pendingCount === 1 ? 'Approval' : 'Approvals'}</p>
                <button className="alert-action-btn" onClick={() => setActiveTab('approvals')} disabled={pendingCount === 0}>
                  {pendingCount > 0 ? 'Review Queue Now →' : 'Nothing to review'}
                </button>
              </div>
            </div>

            <div className="bento-grid-3">
              <div className="bento-item info-card">
                <label>Quick Actions</label>
                <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginTop:'10px' }}>
                  <button className="btn-primary-lite" style={{ fontSize:'13px' }} onClick={() => setActiveTab('interns')}>
                    View My Interns
                  </button>
                  <button className="btn-primary-lite" style={{ fontSize:'13px', background:'#f1f5f9', color:'#334155' }} onClick={() => setActiveTab('approvals')}>
                    Pending Approvals ({pendingCount})
                  </button>
                </div>
              </div>

              <div className="bento-item info-card">
                <label>Your Organisation</label>
                <h4 style={{ marginTop:'8px' }}>{companyName}</h4>
                <p className="sub-text" style={{ marginTop:'4px' }}>{supervisorName}</p>
                <p className="sub-text" style={{ fontSize:'12px', color:'#94a3b8' }}>{user?.email || ''}</p>
              </div>

              <div className="bento-item info-card academic-liaison">
                <div className="progress-meta">
                  <label>Academic Partner</label>
                  <Clock size={14} />
                </div>
                <div className="liaison-identity">
                  <h4 style={{ color:'#fff', fontWeight:800 }}>
                    {acSup ? acSup.name : 'UENR Supervisor'}
                  </h4>
                  <p style={{ color:'rgba(255,255,255,0.65)', fontSize:'12px' }}>
                    {acSup ? (acSup.department || 'Academic Supervisor') : 'University Liaison'}
                  </p>
                  {acSup?.email && (
                    <p style={{ color:'rgba(255,255,255,0.55)', fontSize:'11px', marginTop:'2px' }}>
                      {acSup.email}
                    </p>
                  )}
                  {acSup?.staffId && (
                    <p style={{ color:'rgba(255,255,255,0.45)', fontSize:'10px', fontFamily:'var(--font-mono)', marginTop:'2px' }}>
                      ID: {acSup.staffId}
                    </p>
                  )}
                </div>
                <div className="site-visit-badge">
                  <div className="visit-header">
                    <Calendar size={12} />
                    <span className="visit-label">Next Site Visit</span>
                  </div>
                  {nextVisit ? (
                    <div>
                      <span className="visit-date">
                        {new Date(nextVisit.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {nextVisit.time ? ` • ${nextVisit.time}` : ''}
                      </span>
                      {nextVisit.studentName && (
                        <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0 0' }}>
                          For: {nextVisit.studentName}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="visit-date">To be scheduled</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="admin-wrapper">
      {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebar(false)} />}

      <IndustrialSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleLogout={() => logout()}
        companyName={companyName}
        isOpen={isSidebarOpen}
        closeSidebar={() => setSidebar(false)}
      />

      <main className="main-area">
        <header className="top-nav">
          <div className="top-nav-left">
            <button className="mobile-menu-toggle" onClick={() => setSidebar(true)}><Menu size={24} /></button>
            <div className="breadcrumb">
              Industrial / <span className="active-breadcrumb">{activeTab.toUpperCase()}</span>
            </div>
          </div>
          <div className="top-nav-right">
            <div className="admin-profile-pill">
              <span>{supervisorName}</span>
              <div className="admin-avatar">{supervisorName.charAt(0).toUpperCase()}</div>
            </div>
          </div>
        </header>

        <section className="page-content">{renderContent()}</section>
      </main>
    </div>
  );
};

export default IndustrialDashboard;