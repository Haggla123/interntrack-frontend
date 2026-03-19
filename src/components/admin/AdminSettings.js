import React from 'react';
import { Settings } from 'lucide-react';

const AdminSettings = () => (
  <div className="content-card fade-in" style={{ textAlign: 'center', padding: '60px 20px' }}>
    <Settings size={40} color="#94a3b8" style={{ marginBottom: '16px' }} />
    <h3 style={{ margin: '0 0 8px', color: '#1e293b' }}>Settings are managed in the Admin Dashboard</h3>
    <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '440px', margin: '0 auto' }}>
      This component is no longer used. System configuration (geofence, grading weights,
      departments, internship duration) is handled directly inside AdminDashboard.js
      under the Settings tab.
    </p>
  </div>
);

export default AdminSettings;