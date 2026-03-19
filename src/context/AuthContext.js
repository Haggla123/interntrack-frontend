// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const decodeToken = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
};

const isExpired = (token) => {
  const decoded = decodeToken(token);
  if (!decoded?.exp) return true;
  return decoded.exp * 1000 < Date.now();
};


const getStoredToken = () =>
  localStorage.getItem('token') || sessionStorage.getItem('token');

const getStoredUser = () =>
  localStorage.getItem('user') || sessionStorage.getItem('user');

function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);
  const [ready, setReady] = useState(false);

  // Hydrate from whichever storage has the token
  useEffect(() => {
    const token  = getStoredToken();
    const stored = getStoredUser();
    if (token && stored && !isExpired(token)) {
      try { setUser(JSON.parse(stored)); } catch { /* corrupted */ }
    } else if (token) {
      // Token exists but expired or user record missing — clean both storages
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
    }
    setReady(true);
  }, []);

  // Check token expiry every 60 seconds — must watch both storages
  useEffect(() => {
    const id = setInterval(() => {
      const token = getStoredToken();
      if (token && isExpired(token)) logout('expired');
    }, 60_000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback((token, userData, rememberMe = true) => {
    // Write to the correct storage in one step — no two-step cleanup needed
    const storage = rememberMe ? localStorage : sessionStorage;
    // Clear the OTHER storage first to avoid stale tokens
    const other = rememberMe ? sessionStorage : localStorage;
    other.removeItem('token');
    other.removeItem('user');
    storage.setItem('token', token);
    storage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  // logout clears BOTH storages.

  const logout = useCallback((reason = 'manual') => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('studentPlacement');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setUser(null);
    if (reason === 'expired') sessionStorage.setItem('authExpired', '1');
    window.location.replace('/login');
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => {
      const next = { ...prev, ...updates };
      // Write back to whichever storage currently holds the user
      if (localStorage.getItem('token')) {
        localStorage.setItem('user', JSON.stringify(next));
      } else {
        sessionStorage.setItem('user', JSON.stringify(next));
      }
      return next;
    });
  }, []);


  const refreshUser = useCallback(async () => {
    const token = getStoredToken();
    if (!token || isExpired(token)) return;
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/me`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) return;
      const data  = await res.json();
      const fresh = data.user || data;

      // Write to whichever storage holds the active session
      if (localStorage.getItem('token')) {
        localStorage.setItem('user', JSON.stringify(fresh));
      } else {
        sessionStorage.setItem('user', JSON.stringify(fresh));
      }
      setUser(fresh);
    } catch { /* silent */ }
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready, login, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export { AuthProvider, useAuth };