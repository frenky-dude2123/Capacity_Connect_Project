import React, { createContext, useContext, useState, useEffect } from 'react';
import { findUserByEmail, addUser, initMockDb } from '../lib/mockDb';

export const AuthContext = createContext(null);

const API_BASE = (import.meta.env?.VITE_API_URL || 'https://capacity-connect-project.onrender.com').replace(/\/$/, '') + '/api';

initMockDb();

function saveSession(user, token) {
  localStorage.setItem('capacity_connect_user', JSON.stringify(user));
  localStorage.setItem('capacity_connect_token', token);
}

function clearSession() {
  localStorage.removeItem('capacity_connect_user');
  localStorage.removeItem('capacity_connect_token');
}

function getSavedUser() {
  try {
    const saved = localStorage.getItem('capacity_connect_user');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function getSavedToken() {
  return localStorage.getItem('capacity_connect_token');
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getSavedUser);
  const [token, setToken] = useState(getSavedToken);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const fallbackUser = findUserByEmail(email);
    const userToLogin = fallbackUser || { id: `demo-${Date.now()}`, email, role: 'trainee', name: email };
    const userToken = `mock-jwt-token-${userToLogin.id}-${userToLogin.role}-${Date.now()}`;

    saveSession(userToLogin, userToken);
    setToken(userToken);
    setUser(userToLogin);

    fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    }).catch(() => {});

    return { success: true, isDemo: !fallbackUser, user: userToLogin, token: userToken };
  };

  const register = async (name, email, password, role) => {
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

    fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    }).catch(() => {});

    return { success: true, isDemo: true, user: newUser, token: userToken };
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
