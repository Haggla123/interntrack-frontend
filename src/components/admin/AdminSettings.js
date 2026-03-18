// src/components/admin/AdminSettings.js
// FIX: The old AdminSettings.js used defaultValue (uncontrolled inputs)
// and a Save button that called nothing — changes were silently discarded.
//
// The REAL, fully-working settings form already lives inside AdminDashboard.js
// (the 'settings' case of renderContent). Rather than duplicate it here,
// this component is intentionally left as a redirect notice.
//
// ACTION: In AdminDashboard.js, find the 'settings' case in renderContent()
// and keep it rendering inline as it already does. The AdminSidebar's
// "Settings" tab already points to that tab — no change needed there.
//
// This file is now SAFE TO DELETE. It is no longer imported anywhere once
// AdminDashboard.js renders the settings tab inline (which it already does).
//
// If you ever need a standalone AdminSettings component (e.g. for a separate
// route), extract the 'settings' case from AdminDashboard's renderContent()
// into this file and import the necessary api calls and state from props.

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