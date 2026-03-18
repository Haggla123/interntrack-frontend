// src/App.js
import React from 'react';
import './design-system.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';

import Home                from './pages/Home';
import Login               from './Login';
import AdminDashboard      from './pages/AdminDashboard';
import AcademicDashboard   from './pages/AcademicDashboard';
import StudentDashboard    from './pages/StudentDashboard';
import IndustrialDashboard from './pages/IndustrialDashboard';
import ChangePassword      from './pages/ChangePassword';
import LogbookHistory      from './components/student/LogbookHistory';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>

          {/* Public */}
          <Route path="/"      element={<Home />} />
          <Route path="/login" element={<Login />} />

          {/* Admin */}
          <Route path="/admin" element={
            <PrivateRoute roles={['admin']}>
              <AdminDashboard />
            </PrivateRoute>
          } />

          {/* Academic supervisor */}
          <Route path="/academic" element={
            <PrivateRoute roles={['academic']}>
              <AcademicDashboard />
            </PrivateRoute>
          } />

          {/* Student */}
          <Route path="/student" element={
            <PrivateRoute roles={['student']}>
              <StudentDashboard />
            </PrivateRoute>
          } />
          <Route path="/student/history" element={
            <PrivateRoute roles={['student']}>
              <LogbookHistory />
            </PrivateRoute>
          } />

          {/* FIX: /change-password now requires authentication.
              Previously it had no PrivateRoute wrapper — anyone could visit it. */}
          <Route path="/change-password" element={
            <PrivateRoute roles={['admin', 'student', 'academic', 'industrial']}>
              <ChangePassword />
            </PrivateRoute>
          } />

          {/* Industrial supervisor — FIX: removed 'industry' alias, backend uses 'industrial' */}
          <Route path="/industrial" element={
            <PrivateRoute roles={['industrial']}>
              <IndustrialDashboard />
            </PrivateRoute>
          } />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;