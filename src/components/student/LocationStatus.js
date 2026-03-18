// src/components/student/LocationStatus.js
import React, { useState } from 'react';
import { MapPin, RefreshCw, CheckCircle2, AlertTriangle, Navigation } from 'lucide-react';
import './LocationStatus.css';

const LocationStatus = ({ targetLat, targetLon, radius, onVerificationChange }) => {
  const [loading,  setLoading]  = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [status,   setStatus]   = useState('pending'); // 'pending' | 'verified' | 'failed'
  const [distance, setDistance] = useState(null);

  const calcDistance = (lat1, lon1, lat2, lon2) => {
    const R    = 6371000;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a    = Math.sin(dLat / 2) ** 2 +
                 Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                 Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const verify = () => {
    setLoading(true);
    setErrorMsg('');

    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by this browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const dist = calcDistance(
          pos.coords.latitude, pos.coords.longitude,
          targetLat, targetLon
        );
        setDistance(Math.round(dist));
        if (dist <= radius) {
          setStatus('verified');
          onVerificationChange(true);
        } else {
          setStatus('failed');
          setErrorMsg(`You are ${Math.round(dist)}m away — need to be within ${radius}m.`);
          onVerificationChange(false);
        }
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        setStatus('failed');
        const msgs = {
          [err.PERMISSION_DENIED]:    'Location permission denied. Enable it in browser settings.',
          [err.POSITION_UNAVAILABLE]: 'Location unavailable. Try again.',
          [err.TIMEOUT]:              'Location request timed out. Try again.',
        };
        setErrorMsg(msgs[err.code] || 'Could not get location.');
        onVerificationChange(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className={`ls-root ls-${status}`}>
      <div className="ls-icon-col">
        {status === 'verified' ? (
          <div className="ls-icon-ring ls-ring-green">
            <CheckCircle2 size={20} />
          </div>
        ) : status === 'failed' ? (
          <div className="ls-icon-ring ls-ring-red">
            <AlertTriangle size={20} />
          </div>
        ) : (
          <div className="ls-icon-ring ls-ring-blue">
            <Navigation size={20} />
          </div>
        )}
      </div>

      <div className="ls-body">
        <div className="ls-label">Presence Verification</div>
        {status === 'pending' && (
          <p className="ls-msg">Confirm you are on-site before logging today's work.</p>
        )}
        {status === 'verified' && (
          <p className="ls-msg ls-msg-green">
            <CheckCircle2 size={13} style={{ display:'inline', marginRight:'4px' }} />
            Location confirmed — you're within {radius}m of the office.
            {distance != null && ` (${distance}m away)`}
          </p>
        )}
        {status === 'failed' && (
          <p className="ls-msg ls-msg-red">
            <AlertTriangle size={13} style={{ display:'inline', marginRight:'4px' }} />
            {errorMsg}
          </p>
        )}
      </div>

      <button
        className={`ls-btn ${status === 'verified' ? 'ls-btn-done' : ''}`}
        onClick={verify}
        disabled={loading || status === 'verified'}
      >
        {loading ? (
          <><RefreshCw size={15} className="ls-spin" /> Locating…</>
        ) : status === 'verified' ? (
          <><CheckCircle2 size={15} /> Verified</>
        ) : (
          <><MapPin size={15} /> Check My Location</>
        )}
      </button>
    </div>
  );
};

export default LocationStatus;