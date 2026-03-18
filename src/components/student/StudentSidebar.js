import React from 'react';
import { LayoutDashboard, Briefcase, FileText, BookOpen, History, Settings, LogOut, X } from 'lucide-react';

const StudentSidebar = ({ activeTab, setActiveTab, handleLogout, studentName, isOpen, closeSidebar, isPlaced }) => {
  const menuItems = [
    { id: 'overview',      label: 'Overview',             icon: <LayoutDashboard size={20} />, locked: false },
    { id: 'daily-log',     label: 'Daily Log',            icon: <BookOpen size={20} />,        locked: !isPlaced },
    { id: 'history',       label: 'Logbook History',      icon: <History size={20} />,         locked: !isPlaced },
    { id: 'final-report',  label: 'Final Report',         icon: <FileText size={20} />,        locked: !isPlaced },
    { id: 'placements',    label: 'Available Placements',  icon: <Briefcase size={20} />,      locked: false },
    { id: 'documents',     label: 'Attachment Letters',    icon: <FileText size={20} />,       locked: false },
    { id: 'settings',      label: 'Settings',              icon: <Settings size={20} />,       locked: false },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-top">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-text">
              <span>InternTrack</span>
              <small>Student Portal</small>
            </div>
          </div>
          
          <button className="mobile-close-btn" onClick={closeSidebar}>
            <X size={24} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-group">
            <label>MAIN MENU</label>
            <ul>
              {menuItems.map(item => (
                <li
                  key={item.id}
                  className={activeTab === item.id ? 'active' : ''}
                  style={item.locked ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (!item.locked) closeSidebar();
                  }}
                >
                  <div className="nav-icon-label">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-user-display">
        </div>
        <button className="logout-action-btn" onClick={handleLogout}>
          <LogOut size={18} /> <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default StudentSidebar;