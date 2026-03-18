import React from 'react';
import { LayoutDashboard, Users, GraduationCap, Calendar, Settings, LogOut, X } from 'lucide-react';

const AcademicSidebar = ({ activeTab, setActiveTab, handleLogout, isSidebarOpen, setIsSidebarOpen }) => {
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={20} /> },
    { id: 'assigned', label: 'Assigned Students', icon: <Users size={20} /> },
    { id: 'grading', label: 'Grading Center', icon: <GraduationCap size={20} /> },
    { id: 'visits', label: 'Site Visits', icon: <Calendar size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  return (
    <aside className={`sidebar academic-sidebar ${isSidebarOpen ? 'open' : ''}`}>
      <div className="sidebar-top">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-text">
              <span>InternTrack</span>
              <small>Academic Supervisor</small>
            </div>
          </div>
          
          {/* MOBILE CLOSE BUTTON: Only visible via CSS on mobile */}
          <button className="mobile-close-btn" onClick={() => setIsSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <div className="nav-group">
            <label>University Oversight</label>
            <ul>
              {menuItems.map((item) => (
                <li 
                  key={item.id}
                  className={activeTab === item.id ? 'active' : ''} 
                  /* Automatically close sidebar on mobile after clicking a link */
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsSidebarOpen(false);
                  }}
                >
                  {item.icon} 
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>

      <div className="sidebar-footer">
        <div className="user-mini-card">
        </div>
        <button className="logout-action-btn" onClick={handleLogout}>
          <LogOut size={18} /> 
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default AcademicSidebar;