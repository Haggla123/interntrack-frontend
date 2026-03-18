import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import './Sidebar.css';

const Sidebar = ({ roles, userName }) => {
  const { logout } = useAuth();
  const location   = useLocation();

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="side-nav">
      <div className="nav-brand">
        <span>InternTrack</span>
      </div>

      <div className="nav-user">
        <p className="user-welcome">Welcome,</p>
        <p className="user-name">{userName}</p>
      </div>

      <ul className="nav-links">
        {roles.map((item, index) => (
          <li
            key={index}
            className={isActive(item.path)}
            onClick={() => window.location.href = item.path}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </li>
        ))}
        {/* calls logout() — clears token + user before redirecting */}
        <li className="nav-logout" onClick={() => logout()}>
          <span className="nav-icon">🚪</span> Logout
        </li>
      </ul>
    </nav>
  );
};

export default Sidebar;