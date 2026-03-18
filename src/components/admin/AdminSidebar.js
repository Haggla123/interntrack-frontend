import React from 'react';
import { 
  LayoutDashboard, Users, UserCheck, Building2, ClipboardCheck,
  Settings, LogOut, Link2, FileDown, X
} from 'lucide-react';


const AdminSidebar = ({ activeTab, setActiveTab, handleLogout, isOpen, closeSidebar }) => {
  
  // Combines tab change + drawer close for mobile UX
  const handleNav = (tab) => {
    setActiveTab(tab);
    if (typeof closeSidebar === 'function') closeSidebar();
  };

  const menuItems = [
    { id: 'overview',           label: 'Overview',           icon: <LayoutDashboard size={20} /> },
    { id: 'pending-placements', label: 'Placement Requests', icon: <ClipboardCheck size={20} /> },
    { id: 'companies',          label: 'Company Slots',      icon: <Building2 size={20} /> },
    { id: 'documents',          label: 'Attachment Letters', icon: <FileDown size={20} /> },
    { id: 'assignments',        label: 'Assignments',        icon: <Link2 size={20} /> },
    { id: 'supervisors',        label: 'Supervisors',        icon: <UserCheck size={20} /> },
    { id: 'students',           label: 'Students',           icon: <Users size={20} /> },
    { id: 'settings',           label: 'Settings',           icon: <Settings size={20} /> },
  ];

  return (
    
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>

      <div className="sidebar-top">
        {/* Wrapped brand + close button in a flex header row */}
        <div className="sidebar-brand-header">
          <div className="sidebar-brand">
            <span>InternTrack</span>
            <small>Admin</small>
          </div>

          {/* Mobile close button — hidden on desktop via CSS (.mobile-close-btn) */}
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
                 
                  onClick={() => handleNav(item.id)}
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
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={20} /> Logout
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;