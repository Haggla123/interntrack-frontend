import React from 'react';
import { LayoutDashboard, Star, Users, CheckSquare, Settings, LogOut, X } from 'lucide-react';

const IndustrialSidebar = ({ 
  activeTab, 
  setActiveTab, 
  handleLogout, 
  companyName, 
  isOpen,         // Added prop for mobile state
  closeSidebar    // Added prop to close menu
}) => {
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={20} /> },
    { id: 'interns', label: 'My Interns', icon: <Users size={20} /> },
    { id: 'approvals', label: 'Pending Approvals', icon: <CheckSquare size={20} /> },
    { id: 'evaluate', label: 'Evaluate', icon: <Star size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-top">
        <div className="sidebar-brand-header">
          <div className="sidebar-brand">
            <div className="brand-text">
              <span>InternTrack</span>
              <small>Industrial Portal</small>
            </div>
          </div>
          
          {/* Add mobile-only close button */}
          <button className="mobile-close-btn" onClick={closeSidebar}>
            <X size={24} />
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <div className="nav-group">
            <label>{companyName}</label>
            <ul>
              {menuItems.map((item) => (
                <li 
                  key={item.id}
                  className={activeTab === item.id ? 'active' : ''} 
                  onClick={() => {
                    setActiveTab(item.id);
                    closeSidebar(); // Auto-close drawer on selection for better mobile UX
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
        <button className="logout-action-btn" onClick={handleLogout}>
          <LogOut size={18} /> 
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default IndustrialSidebar;