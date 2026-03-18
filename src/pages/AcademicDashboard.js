// src/pages/AcademicDashboard.js
// FIX: Replaced N+1 API calls (2 per student) with a single batch stats
// call to GET /api/students/stats. With 30 students the old code made 61
// HTTP requests on every load; the new code makes exactly 3 total:
//   1. getStudents()
//   2. getStudentStats(allIds, totalWeeks)
//   3. getVisits()
import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import AcademicSidebar   from '../components/academic/AcademicSidebar';
import AcademicOverview  from '../components/academic/AcademicOverview';
import AssignedStudents  from '../components/academic/AssignedStudents';
import GradingSection    from '../components/academic/GradingSection';
import AcademicSettings  from '../components/academic/AcademicSettings';
import VisitScheduler    from '../components/academic/VisitScheduler';
import LogbookViewer     from '../components/academic/LogbookViewer';
import ReportReviewer    from '../components/academic/ReportReviewer';
import { useAuth }       from '../context/AuthContext';
import { getStudents, getStudentStats, getVisits } from '../api';
import '../styles/AcademicDashboard.css';

// Normalise API student shape → shape child components expect
const norm = (s, stats) => {
  const sid = (s._id || s.id || '').toString();
  const st  = stats[sid] || {};
  return {
    id:         s._id || s.id,
    _id:        s._id || s.id,
    name:       s.name        || 'Unknown',
    index:      s.indexNumber || s.index || '',
    department: s.department  || '',
    email:      s.email       || '',
    phone:      s.phone       || '',
    company:         s.companyName || s.companyId?.name || (typeof s.company === 'string' ? s.company : '') || 'Not placed',
    location:        s.companyId?.location || s.location || '',
    category:        s.companyId?.category || s.category || '',
    supervisor:      s.companyId?.supervisorName || s.supervisorName || s.supervisor || '',
    supervisorEmail: s.companyId?.supervisorEmail || s.supervisorEmail || '',
    supervisorPhone: s.companyId?.supervisorPhone || s.supervisorPhone || '',
    // Pull from batch stats if available, fall back to student record values
    progress:   st.progress   ?? s.progress    ?? 0,
    weeks:      st.weeks      ?? s.weeks        ?? 0,
    indusScore: st.indusScore ?? s.indusScore   ?? s.industrialScore ?? 0,
    status:     (st.gradeId || s.gradeStatus === 'Graded') ? 'Graded' : 'Pending Grading',
    finalGrade: st.finalGrade !== '-' ? st.finalGrade : (s.finalGrade || '-'),
    gradeId:    st.gradeId    ?? s.gradeId    ?? null,
    lastVisit:  s.lastVisit   || 'None',
    placementStatus: s.placementStatus || s.status || 'Unplaced',
  };
};

const AcademicDashboard = () => {
  const { user, logout }            = useAuth();
  const [activeTab, setActiveTab]   = useState('overview');
  const [isSidebarOpen, setSidebar] = useState(false);
  const [nextVisit, setNextVisit]   = useState(null);
  const [visitedStudentIds, setVisitedIds] = useState(new Set());
  const [selectedStudent, setSelected]     = useState(null);
  const [students, setStudents]     = useState([]);
  const [loading, setLoading]       = useState(true);

  const supervisorName = user?.name || 'Academic Supervisor';

  const loadStudents = async () => {
    setLoading(true);
    try {
      // Step 1 — fetch students (already scoped to this supervisor server-side)
      const res = await getStudents();
      const arr = Array.isArray(res) ? res
        : Array.isArray(res.data) ? res.data
        : Array.isArray(res.students) ? res.students : [];

      if (!arr.length) {
        setStudents([]);
        return;
      }

      // Step 2 — batch stats: 2 aggregations in 1 request instead of 2N
      // Graceful fallback: if /stats route isn't deployed yet, use an
      // empty map so norm() falls back to the values on the student record.
      let statsMap = {};
      try {
        const ids        = arr.map(s => (s._id || s.id).toString());
        const totalWeeks = arr[0]?.totalWeeks || 6;
        const statsRes   = await getStudentStats(ids, totalWeeks);
        statsMap = statsRes?.data || statsRes || {};
      } catch {
        // /stats not available yet — students still display with 0% progress
        // until the route is deployed; no crash
      }

      setStudents(arr.map(s => norm(s, statsMap)));
    } catch { /* silent — leave previous students in place */ }
    finally { setLoading(false); }
  };

  // Load next visit and build visitedStudentIds set on mount
  useEffect(() => {
    getVisits()
      .then(res => {
        const arr = Array.isArray(res) ? res : Array.isArray(res.data) ? res.data : [];
        const upcoming = arr
          .filter(v => v.status !== 'Completed' && v.status !== 'Cancelled' && new Date(v.date) >= new Date())
          .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
        if (upcoming) setNextVisit(upcoming);
        const handledIds = new Set(
          arr
            .filter(v =>
              v.status === 'Completed' ||
              (v.status === 'Scheduled' && new Date(v.date) >= new Date())
            )
            .map(v => (v.student?._id || v.student || '').toString())
            .filter(Boolean)
        );
        setVisitedIds(handledIds);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadStudents();
    const handleVisible = () => { if (document.visibilityState === 'visible') loadStudents(); };
    document.addEventListener('visibilitychange', handleVisible);
    return () => document.removeEventListener('visibilitychange', handleVisible);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGradeUpdate = (studentId, grade) => {
    setStudents(prev =>
      prev.map(s => (s.id === studentId || s._id === studentId)
        ? { ...s, finalGrade: grade, status: 'Graded' } : s)
    );
  };

  const go = (tab) => { setActiveTab(tab); setSidebar(false); };

  const renderContent = () => {
    if (loading) return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', flexDirection:'column', gap:'12px', color:'#64748b' }}>
        <div style={{ width:'32px', height:'32px', border:'3px solid #e2e8f0', borderTopColor:'#3b82f6', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ fontSize:'14px' }}>Loading student data…</p>
      </div>
    );

    switch (activeTab) {
      case 'view-logbook': return <LogbookViewer student={selectedStudent} onBack={() => go('grading')} />;
      case 'view-report':  return <ReportReviewer student={selectedStudent} onBack={() => go('grading')} onGradeUpdate={handleGradeUpdate} />;
      case 'assigned':     return (
        <AssignedStudents
          students={students}
          visitedStudentIds={visitedStudentIds}
          onViewLogbook={(s) => { setSelected(s); go('view-logbook'); }}
          setActiveTab={go}
        />
      );
      case 'grading': return (
        <GradingSection
          students={students}
          setStudents={setStudents}
          setActiveTab={go}
          onViewLogbook={(s) => { setSelected(s); go('view-logbook'); }}
          onViewReport={(s)  => { setSelected(s); go('view-report');  }}
          onGradeUpdate={handleGradeUpdate}
        />
      );
      case 'visits':   return <VisitScheduler students={students} setNextVisit={setNextVisit} visitedStudentIds={visitedStudentIds} />;
      case 'settings': return <AcademicSettings handleLogout={() => logout()} />;
      default:         return (
        <AcademicOverview
          students={students}
          nextVisit={nextVisit}
          visitedStudentIds={visitedStudentIds}
          setActiveTab={go}
        />
      );
    }
  };

  return (
    <div className="admin-wrapper">
      {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebar(false)} />}

      <AcademicSidebar
        activeTab={['view-logbook','view-report'].includes(activeTab) ? 'grading' : activeTab}
        setActiveTab={go}
        handleLogout={() => logout()}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setSidebar}
      />

      <main className="main-area">
        <header className="top-nav">
          <div className="top-nav-left">
            <button className="mobile-menu-toggle" onClick={() => setSidebar(true)}><Menu size={24} /></button>
            <div className="breadcrumb">
              University / <span className="active-breadcrumb">
                {activeTab === 'view-logbook' ? 'LOGBOOK REVIEW'
                  : activeTab === 'view-report' ? 'FINAL REPORT REVIEW'
                  : activeTab.toUpperCase()}
              </span>
            </div>
          </div>
          <div className="admin-profile-pill">
            <span>{supervisorName}</span>
            <div className="admin-avatar academic">{supervisorName.charAt(0).toUpperCase()}</div>
          </div>
        </header>

        <section className="page-content">{renderContent()}</section>
      </main>
    </div>
  );
};

export default AcademicDashboard;