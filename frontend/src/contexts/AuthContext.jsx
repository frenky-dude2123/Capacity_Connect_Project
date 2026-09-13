import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const API_BASE = 'http://localhost:5000/api';

async function checkApprovalStatus(userId) {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('capacity_connect_token')}` }
    });
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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('capacity_connect_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('capacity_connect_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token && user) {
      checkApprovalStatus(user.id).then(result => {
        if (!result.approved) {
          localStorage.removeItem('capacity_connect_token');
          localStorage.removeItem('capacity_connect_user');
          setToken(null);
          setUser(null);
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [token, user.id]);

  const login = async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}: Login failed`);
    }
    const data = await res.json();
    const userData = data.user || { email, role: 'trainee', name: email };
    const userToken = data.token || `mock-jwt-token-${userData.id || Date.now()}-${userData.role || 'trainee'}-${Date.now()}`;
    
    localStorage.setItem('capacity_connect_token', userToken);
    localStorage.setItem('capacity_connect_user', JSON.stringify(userData));
    setToken(userToken);
    setUser(userData);
    return userData;
  };

  const register = async (name, email, password, role) => {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}: Registration failed`);
    }
    const data = await res.json();
    if (data.status === 'pending') {
      return { pending: true, message: data.message || 'Account pending admin approval' };
    }
    const userData = data.user || { name, email, role };
    const userToken = data.token || `mock-jwt-token-${userData.id || Date.now()}-${userData.role || 'trainee'}-${Date.now()}`;
    
    localStorage.setItem('capacity_connect_token', userToken);
    localStorage.setItem('capacity_connect_user', JSON.stringify(userData));
    setToken(userToken);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('capacity_connect_token');
    localStorage.removeItem('capacity_connect_user');
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
