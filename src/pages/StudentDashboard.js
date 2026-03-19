import React, { useState, useEffect } from 'react';
import { Menu, MapPin, BookOpen, CheckCircle2, AlertCircle, Phone, Mail } from 'lucide-react';
import { getMyLogs } from '../api';
import * as api from '../api';
import { useAuth } from '../context/AuthContext';
import StudentSidebar from '../components/student/StudentSidebar';
import LogEntryForm from '../components/student/LogEntryForm';
import LogbookHistory from '../components/student/LogbookHistory';
import LocationStatus from '../components/student/LocationStatus';
import StudentSettings from '../components/student/StudentSettings';
import AvailablePlacements from '../components/student/AvailablePlacements';
import AttachmentLetters from '../components/student/AttachmentLetters';
import FinalReport from '../components/student/FinalReport';
import '../styles/StudentDashboard.css';

const getPlacement = (userId) => {
  try {
    const raw = localStorage.getItem('studentPlacement') || sessionStorage.getItem('studentPlacement');
    const stored = raw ? JSON.parse(raw) : null;
    // Ignore stale placement from a different user session
    if (stored && userId && stored._userId && stored._userId !== userId) {
      localStorage.removeItem('studentPlacement');
      sessionStorage.removeItem('studentPlacement');
      return null;
    }
    return stored;
  } catch { return null; }
};

const StudentDashboard = () => {
  const { user, logout, refreshUser } = useAuth(); 
  const [activeTab, setActiveTab] = useState('overview');
  const [isVerified, setIsVerified] = useState(false);
  const [geofenceEnabled, setGeofenceEnabled] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [placement, setPlacement] = useState(() => getPlacement(user?._id));
  const [logStats, setLogStats] = useState({ completedWeeks: 0, totalWeeks: 6, totalLogs: 0 });
  const [systemTotalWeeks, setSystemTotalWeeks] = useState(6);
  const [settings, setSettings] = useState(null);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  useEffect(() => { refreshUser(); }, [refreshUser]);


  useEffect(() => {
    if (!user) return;

    // only consider a student "placed" if placementStatus is Active AND
    // they actually have a populated companyId object.

    const isPlaced = user.placementStatus === 'Active'
      && user.companyId
      && typeof user.companyId === 'object'
      && user.companyId._id;

    if (!isPlaced) {
      // Clear stale placement data if the user is not actually placed
      if (placement) {
        localStorage.removeItem('studentPlacement');
        sessionStorage.removeItem('studentPlacement');
        setPlacement(null);
      }
      return;
    }

    const derived = {
      _userId: user._id,  // tag with user id to prevent cross-session leaks
      companyId: user.companyId._id || null,
      companyName: user.companyName || user.companyId.name || '',
      lat: user.companyId.lat || null,
      long: user.companyId.long || null,
      radius: user.companyId.radius || 150,
      location: user.companyId.location || '',
      category: user.companyId.category || '',
      supervisorName: user.companyId.supervisorName || '',
      supervisorEmail: user.companyId.supervisorEmail || '',
      supervisorPhone: user.companyId.supervisorPhone || '',
    };
    const storage = localStorage.getItem('token') ? localStorage : sessionStorage;
    storage.setItem('studentPlacement', JSON.stringify(derived));
    setPlacement(derived);
  }, [user]);

  // Load system settings
  useEffect(() => {
    api.getSettings()
      .then(res => {
        const data = res?.data || res || {};
        setSystemTotalWeeks(data.totalWeeks || 6);
        if (data.geofenceEnabled === false) setGeofenceEnabled(false);
        setSettings(data);
      })
      .catch(() => { });
  }, []);

  // Load log stats
  useEffect(() => {
    if (!placement) return;
    getMyLogs()
      .then(res => {
        const logs = Array.isArray(res) ? res : Array.isArray(res.data) ? res.data : [];
        const approved = logs.filter(l => l.status === 'Approved');
        if (!approved.length) return;
        const completedWeeks = Math.floor(approved.length / 5);
        setLogStats({
          completedWeeks: Math.min(completedWeeks, systemTotalWeeks),
          totalWeeks: systemTotalWeeks,
          totalLogs: logs.length,
        });
      })
      .catch(() => { });
  }, [placement, systemTotalWeeks]);

  const studentInfo = {
    name: user?.name || 'Student',
    indexNumber: user?.indexNumber || '',
    completedWeeks: logStats.completedWeeks,
    totalWeeks: logStats.totalWeeks,
    totalLogs: logStats.totalLogs,
  };

  // Use AuthContext logout — clears token, user, studentPlacement, redirects
  const handleLogout = () => logout();

  const handlePlacementAccepted = (newPlacement) => {
    setPlacement(newPlacement);
    setActiveTab('daily-log');
  };

  const handleTabChange = (tab) => {
    if ((tab === 'daily-log' || tab === 'history') && !placement) {
      setActiveTab('placements');
      return;
    }
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  const companyLocation = placement
    ? { lat: parseFloat(placement.lat) || 0, lon: parseFloat(placement.long) || 0, radius: Number(placement.radius) || 150 }
    : { lat: 0, lon: 0, radius: 150 };

  const renderContent = () => {
    switch (activeTab) {
      case 'placements':
        return <AvailablePlacements onPlacementAccepted={handlePlacementAccepted} />;

      case 'documents':
        return <AttachmentLetters />;

      case 'final-report':
        // Pass systemTotalWeeks so eligibility threshold matches admin config
        return (
          <FinalReport
            completedWeeks={studentInfo.completedWeeks}
            totalWeeks={systemTotalWeeks}
          />
        );

      case 'daily-log':
        if (!placement) return <PlacementRequired onGoToMarket={() => setActiveTab('placements')} />;
        return (
          <>
            {geofenceEnabled && companyLocation.lat !== 0 && companyLocation.lon !== 0 && (
              <LocationStatus
                targetLat={companyLocation.lat}
                targetLon={companyLocation.lon}
                radius={companyLocation.radius}
                onVerificationChange={setIsVerified}
              />
            )}
            <LogEntryForm
              isLocationVerified={!geofenceEnabled || companyLocation.lat === 0 || isVerified}
            />
          </>
        );

      case 'history':
        if (!placement) return <PlacementRequired onGoToMarket={() => setActiveTab('placements')} />;
        return <LogbookHistory />;

      case 'settings':
        return <StudentSettings />;

      case 'overview':
      default:
        return (
          <div className="bento-container fade-in">
            <div className="bento-row main-stats">
              <div className="bento-item welcome-box">
                <div className="badge-pill">Academic Year {settings?.academicYear || '2025/2026'}</div>
                <h1>{greeting}, {studentInfo.name.split(' ')[0]}</h1>
                {placement
                  ? <p>You are placed at <strong>{placement.companyName}</strong>. Keep logging your work!</p>
                  : <p>You don't have a placement yet. Browse the market to get placed instantly.</p>}
                <div className="bento-actions">
                  {placement
                    ? <button className="btn-primary-lite" onClick={() => setActiveTab('daily-log')}>Log Today's Work</button>
                    : <>
                      <button className="btn-primary-lite" onClick={() => setActiveTab('placements')}>Find a Placement →</button>
                      <button className="btn-outline-lite" style={{ marginLeft: '10px' }} onClick={() => setActiveTab('documents')}>Download Letter →</button>
                    </>}
                </div>
              </div>

              <div className="bento-item progress-box">
                <div className="box-header">
                  <label>Program Completion</label>
                  <span> </span>
                  <span className="percentage-text">
                    {placement ? Math.round((studentInfo.completedWeeks / studentInfo.totalWeeks) * 100) : 0}%
                  </span>
                </div>
                <div className="linear-progress-track">
                  <div
                    className="linear-progress-bar"
                    style={{ width: placement ? `${(studentInfo.completedWeeks / studentInfo.totalWeeks) * 100}%` : '0%' }}
                  />
                </div>
                <div className="progress-footer">
                  <span>{placement ? `Week ${studentInfo.completedWeeks}` : 'Not started'}</span>
                  <span> / </span>
                  <span>{studentInfo.totalWeeks} Weeks Total</span>
                </div>
              </div>
            </div>

            <div className="bento-grid-3">
              {/* Host Organization */}
              <div className="bento-item info-card">
                <label>Host Organization</label>
                {placement ? (
                  <>
                    <h4>{placement.companyName}</h4>
                    <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                      <MapPin size={12} style={{ display: 'inline', marginRight: '3px' }} />
                      {placement.location} • {placement.category}
                    </p>
                    <span className="badge-pill-green" style={{ marginTop: '8px', display: 'inline-block' }}>Active</span>
                  </>
                ) : (
                  <div className="status-warning-mini">
                    <h4 style={{ color: '#d97706' }}>No Placement Yet</h4>
                    <p style={{ cursor: 'pointer', color: '#3b82f6', fontSize: '13px', marginTop: '4px' }} onClick={() => setActiveTab('placements')}>
                      Browse available slots →
                    </p>
                  </div>
                )}
              </div>

              {/* Industrial Supervisor — show always if placed OR if supervisor assigned */}
              {(placement || user?.industrialSupervisor) && (() => {
                
                const indSup = user?.industrialSupervisor;
                const name = placement?.supervisorName || indSup?.name || '';
                const email = placement?.supervisorEmail || indSup?.email || '';
                const phone = placement?.supervisorPhone || indSup?.phone || '';
                const org = indSup?.companyOrg || placement?.companyName || '';
                return (
                  <div className="bento-item info-card">
                    <label>Industrial Supervisor</label>
                    {name ? (
                      <>
                        <h4 style={{ marginTop: '6px' }}>{name}</h4>
                        {org && <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', fontStyle: 'italic' }}>{org}</p>}
                        {phone && (
                          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                            <Phone size={12} style={{ display: 'inline', marginRight: '4px' }} />{phone}
                          </p>
                        )}
                        {email && (
                          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '3px' }}>
                            <Mail size={12} style={{ display: 'inline', marginRight: '4px' }} />{email}
                          </p>
                        )}
                      </>
                    ) : (
                      <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>No supervisor assigned yet.</p>
                    )}
                  </div>
                );
              })()}

              {/* Academic Supervisor */}
              {(() => {
                const acSup = user?.academicSupervisor;
                return (
                  <div className="bento-item info-card">
                    <label>Academic Supervisor</label>
                    {acSup ? (
                      <>
                        <h4 style={{ marginTop: '6px' }}>{acSup.name}</h4>
                        {acSup.department && <p style={{ fontSize: '12px', color: '#64748b', marginTop: '3px', fontStyle: 'italic' }}>{acSup.department}</p>}
                        {acSup.phone && <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}><Phone size={12} style={{ display: 'inline', marginRight: '4px' }} />{acSup.phone}</p>}
                        {acSup.email && <p style={{ fontSize: '13px', color: '#64748b', marginTop: '3px' }}><Mail size={12} style={{ display: 'inline', marginRight: '4px' }} />{acSup.email}</p>}
                      </>
                    ) : (
                      <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>No academic supervisor assigned yet.</p>
                    )}
                  </div>
                );
              })()}

              {/* Quick Links */}
              <div className="bento-item info-card">
                <label>Quick Access</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                  <button
                    className={placement ? 'text-link-btn' : 'btn-disabled-market'}
                    style={{ textAlign: 'left', fontSize: '13px', padding: '6px 0' }}
                    disabled={!placement}
                    onClick={() => placement && setActiveTab('daily-log')}
                  >
                    <BookOpen size={14} style={{ display: 'inline', marginRight: '6px' }} />
                    Daily Log {!placement && '(place first)'}
                  </button>
                  <button
                    className={placement ? 'text-link-btn' : 'btn-disabled-market'}
                    style={{ textAlign: 'left', fontSize: '13px', padding: '6px 0' }}
                    disabled={!placement}
                    onClick={() => placement && setActiveTab('history')}
                  >
                    <CheckCircle2 size={14} style={{ display: 'inline', marginRight: '6px' }} />
                    Logbook History {!placement && '(place first)'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="admin-wrapper">
      {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />}

      <StudentSidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        handleLogout={handleLogout}
        studentName={studentInfo.name}
        isOpen={isSidebarOpen}
        closeSidebar={() => setIsSidebarOpen(false)}
        isPlaced={!!placement}
      />

      <main className="main-area">
        <header className="top-nav">
          <div className="top-nav-left">
            <button className="mobile-menu-toggle" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <div className="breadcrumb">Student / {activeTab.replace('-', ' ').toUpperCase()}</div>
          </div>
          <div className="top-nav-right">
            <div className="admin-profile-pill">
              <span>{studentInfo.name}</span>
              <div className="admin-avatar">{studentInfo.name.charAt(0)}</div>
            </div>
          </div>
        </header>
        <section className="page-content">{renderContent()}</section>
      </main>
    </div>
  );
};

const PlacementRequired = ({ onGoToMarket }) => (
  <div className="bento-container fade-in">
    <div className="bento-item welcome-box" style={{ textAlign: 'center', padding: '48px 24px' }}>
      <AlertCircle size={48} style={{ color: '#f59e0b', marginBottom: '16px' }} />
      <div className="badge-pill" style={{ background: '#fef3c7', color: '#92400e' }}>Placement Required</div>
      <h3 style={{ marginTop: '12px' }}>You need a placement first</h3>
      <p style={{ color: '#64748b', marginTop: '8px', fontSize: '14px' }}>
        Browse the available company slots and apply to get instantly placed.<br />
        Once placed, your logbook and history will be unlocked.
      </p>
      <button className="btn-approve-full" style={{ marginTop: '24px', padding: '12px 32px', fontSize: '15px' }} onClick={onGoToMarket}>
        Browse Placements →
      </button>
    </div>
  </div>
);

export default StudentDashboard;