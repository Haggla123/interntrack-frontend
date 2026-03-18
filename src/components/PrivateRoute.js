// src/components/PrivateRoute.js
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * <PrivateRoute roles={['admin']} />
 *
 * - Not logged in           → /login (with ?next= so they land back after login)
 * - Logged in, wrong role   → their correct dashboard (prevents URL-guessing)
 * - Logged in, correct role → renders children
 */

const ROLE_HOME = {
  admin:      '/admin',
  student:    '/student',
  academic:   '/academic',
  industrial: '/industrial',
  // backend uses 'industry' for the role value in some places
  industry:   '/industrial',
};

const PrivateRoute = ({ children, roles }) => {
  const { user, ready } = useAuth();
  const location = useLocation();

  // Wait until localStorage has been checked before deciding
  if (!ready) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', flexDirection: 'column', gap: '12px',
        fontFamily: 'Inter, sans-serif', color: '#64748b',
      }}>
        <div style={{
          width: '36px', height: '36px', border: '3px solid #e2e8f0',
          borderTopColor: '#3b82f6', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ fontSize: '14px' }}>Loading…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Not authenticated at all
  if (!user) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Authenticated but wrong role — send them to their own dashboard
  if (roles && !roles.includes(user.role)) {
    const home = ROLE_HOME[user.role] || '/login';
    return <Navigate to={home} replace />;
  }

  // Force password change before accessing any protected route
  if (user.needsPasswordChange && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  return children;
};

export default PrivateRoute;