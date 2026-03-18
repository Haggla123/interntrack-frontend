// src/pages/ForgotAccessModal.js
// FIX: URL was built as `${REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/forgot-password`
// If REACT_APP_API_URL = 'http://localhost:5000/api' (the standard value set in the
// frontend .env), the URL became http://localhost:5000/api/api/auth/forgot-password — a 404.
// Fixed to use the same BASE_URL pattern as api.js so both always agree.
import React, { useState } from 'react';
import { X, Send, Mail, ShieldAlert } from 'lucide-react';

// Same fallback as api.js — includes /api so the path below doesn't double it
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ForgotAccessModal = ({ isOpen, onClose, currentRole }) => {
  const [email,   setEmail]   = useState('');
  const [isSent,  setIsSent]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  if (!isOpen) return null;

  const handleResetRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // FIX: was `${REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/forgot-password`
      // which produced a double /api when REACT_APP_API_URL already ends in /api
      const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Request failed.');
      setIsSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail(''); setIsSent(false); setError(''); setLoading(false);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="login-card-glass modal-content scale-in" style={{ maxWidth: '400px', padding: '30px' }}>
        <button className="close-x" onClick={handleClose}><X /></button>

        {!isSent ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div className="icon-circle-bg" style={{ background: '#eff6ff', margin: '0 auto 15px' }}>
                <ShieldAlert size={30} color="#2563eb" />
              </div>
              <h3>Recover Access</h3>
              <p className="sub-text-sm">
                Enter your registered email to receive a temporary password for the <strong>{currentRole}</strong> portal.
              </p>
            </div>

            <form onSubmit={handleResetRequest}>
              <div className="input-group-bento">
                <label className="input-label-sm">Registered Email</label>
                <div className="input-wrapper-glass">
                  <Mail className="input-icon" size={18} />
                  <input
                    type="email"
                    placeholder="name@university.edu.gh"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    required
                  />
                </div>
              </div>

              {error && (
                <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '10px', textAlign: 'center' }}>{error}</p>
              )}

              <button type="submit" className="btn-login-submit" style={{ marginTop: '20px' }} disabled={loading}>
                {loading ? 'Sending…' : <><Send size={16} /> Send Recovery Password</>}
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📬</div>
            <h4>Check your Inbox</h4>
            <p className="sub-text-sm">
              If an account exists for <strong>{email}</strong>, a temporary password has been sent.
              Use it to log in — you'll be asked to set a new password immediately.
            </p>
            <button className="btn-outline-lite" onClick={handleClose} style={{ marginTop: '20px', width: '100%' }}>
              Return to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotAccessModal;