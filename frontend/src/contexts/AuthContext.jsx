import React, { createContext, useContext, useState, useEffect } from 'react';
import { findUserByEmail, addUser } from '../lib/mockDb';

export const AuthContext = createContext(null);

const API_BASE = (import.meta.env?.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '') + '/api';

async function withTimeout(promise, ms = 5000) {
  const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), ms));
  return Promise.race([promise, timeout]);
}

async function checkApprovalStatus(userId) {
  try {
    const res = await withTimeout(fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('capacity_connect_token')}` }
    }));
    if (!res.ok) return { approved: false, reason: 'session_invalid' };
    const data = await res.json();
    if (data.user) {
      if (data.user.status === 'pending') return { approved: false, reason: 'pending' };
      if (data.user.status === 'rejected') return { approved: false, reason: 'rejected' };
      return { approved: true, user: data.user };
    }
    return { approved: false, reason: 'no_user' };
  } catch {
    return { approved: false, reason: 'network_error' };
  }
}

function createDemoUser(email, role) {
  const names = { trainee: 'Jane Doe', trainer: 'Elena Rostova', admin: 'Admin User' };
  return { email, role, name: names[role] || 'Demo User', id: `demo-${Date.now()}` };
}

function saveSession(user, token) {
  localStorage.setItem('capacity_connect_user', JSON.stringify(user));
  localStorage.setItem('capacity_connect_token', token);
}

function clearSession() {
  localStorage.removeItem('capacity_connect_user');
  localStorage.removeItem('capacity_connect_token');
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('capacity_connect_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('capacity_connect_token'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token && user) {
      checkApprovalStatus(user?.id).then(result => {
        if (!result.approved) {
          clearSession();
          setToken(null);
          setUser(null);
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [token, user?.id]);

  const login = async (email, password) => {
    try {
      const res = await withTimeout(fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      }));
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${res.status}: Login failed`);
      }
      const data = await res.json();
      const userData = data.user || { email, role: 'trainee', name: email };
      const userToken = data.token || `mock-jwt-token-${userData.id || Date.now()}-${userData.role || 'trainee'}-${Date.now()}`;
      saveSession(userData, userToken);
      setToken(userToken);
      setUser(userData);
      return { success: true, isDemo: false, user: userData, token: userToken };
    } catch (err) {
      console.warn('[Auth] Login fallback to local DB:', err.message);
      const localUser = findUserByEmail(email);
      if (localUser) {
        const userToken = `mock-jwt-token-${localUser.id}-${localUser.role}-${Date.now()}`;
        saveSession(localUser, userToken);
        setToken(userToken);
        setUser(localUser);
        return { success: true, isDemo: true, user: localUser, token: userToken };
      }
      const demoUser = createDemoUser(email, 'trainee');
      const demoToken = `mock-jwt-token-${demoUser.id}-trainee-${Date.now()}`;
      saveSession(demoUser, demoToken);
      setToken(demoToken);
      setUser(demoUser);
      return { success: true, isDemo: true, user: demoUser, token: demoToken };
    }
  };

  const register = async (name, email, password, role) => {
    try {
      const res = await withTimeout(fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      }));
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 403) {
          return { success: false, pending: true, message: err.message || 'Account pending admin approval' };
        }
        throw new Error(err.message || `HTTP ${res.status}: Registration failed`);
      }
      const data = await res.json();
      const userData = data.user || { name, email, role };
      const userToken = data.token || `mock-jwt-token-${userData.id || Date.now()}-${userData.role || 'trainee'}-${Date.now()}`;
      saveSession(userData, userToken);
      setToken(userToken);
      setUser(userData);
      return { success: true, isDemo: false, user: userData, token: userToken };
    } catch (err) {
      console.warn('[Auth] Signup fallback to local DB:', err.message);
      const existing = findUserByEmail(email);
      if (existing) {
        return { success: false, message: 'A user with this email already exists.' };
      }
      const newUser = {
        id: `local-${Date.now()}`,
        email,
        password,
        name: name || email,
        role: role || 'trainee',
        status: 'approved',
        department: 'Enterprise Learning',
        qualification: null,
        skills: null,
        subjects: null,
        created_at: new Date().toISOString()
      };
      addUser(newUser);
      const userToken = `mock-jwt-token-${newUser.id}-${newUser.role}-${Date.now()}`;
      saveSession(newUser, userToken);
      setToken(userToken);
      setUser(newUser);
      return { success: true, isDemo: true, user: newUser, token: userToken };
    }
  };

  const logout = () => {
    clearSession();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
