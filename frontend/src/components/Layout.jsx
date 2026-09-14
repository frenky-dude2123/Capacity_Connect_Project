import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const SIDEBAR_ITEMS = {
  trainee: [
    { icon: '📊', label: 'Dashboard', path: '/dashboard' },
    { icon: '📚', label: 'Catalog', path: '/catalog' },
    { icon: '📝', label: 'Materials', path: '/materials' },
    { icon: '🧠', label: 'AI Skill Gap', path: '/skill-gap' },
    { icon: '🏆', label: 'Certificates', path: '/certificates' },
    { icon: '📋', label: 'Profile', path: '/profile' },
  ],
  trainer: [
    { icon: '📊', label: 'Dashboard', path: '/dashboard' },
    { icon: '👥', label: 'Student Roster', path: '/roster' },
    { icon: '📤', label: 'Upload Content', path: '/upload' },
    { icon: '📁', label: 'My Materials', path: '/materials' },
    { icon: '❓', label: 'Quiz Questions', path: '/quiz-questions' },
    { icon: '📋', label: 'Profile', path: '/profile' },
  ],
  admin: [
    { icon: '📊', label: 'Dashboard', path: '/dashboard' },
    { icon: '⏳', label: 'Pending Approvals', path: '/approvals' },
    { icon: '👥', label: 'All Users', path: '/users' },
    { icon: '📖', label: 'Directory', path: '/directory' },
    { icon: '💬', label: 'Feedback', path: '/feedback' },
    { icon: '📈', label: 'Analytics', path: '/analytics' },
  ],
};

export default function Layout({ user, onLogout }) {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const role = user?.role || 'trainee';
  const items = SIDEBAR_ITEMS[role] || [];

  const bgClass = role === 'trainer' ? 'meadow-bg-trainer' : role === 'admin' ? 'meadow-bg-admin' : 'meadow-bg';

  return (
    <div className={`app-layout theme-meadow ${bgClass}`}>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">CC</div>
          <div>
            <div className="brand-text">Capacity Connect</div>
            <div className="brand-sub">{role} Portal</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button onClick={onLogout} className="nav-item">
            <span className="nav-icon">🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="main-wrapper">
        <header className="top-nav">
          <div className="nav-left">
            <span className="page-title">
              {location.pathname.replace('/', '') || 'dashboard'}
            </span>
          </div>
          <div className="nav-right">
            <button onClick={toggleTheme} className="theme-toggle">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <div className="user-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </div>
        </header>
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
