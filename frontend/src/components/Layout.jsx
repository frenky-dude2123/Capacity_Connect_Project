import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import Icon from './Icons';

import meadowLight from '../assets/backgrounds/meadow-light.jpg';
import meadowDark from '../assets/backgrounds/meadow-dark.jpg';
import goldenField from '../assets/backgrounds/golden-field.jpg';
import forestCanopy from '../assets/backgrounds/forest-canopy.jpg';
import mountainLake from '../assets/backgrounds/mountain-lake.jpg';
import riverValley from '../assets/backgrounds/river-valley.jpg';

const SIDEBAR_ITEMS = {
  trainee: [
    { icon: 'dashboard', label: 'Dashboard', path: '/dashboard' },
    { icon: 'catalog', label: 'Catalog', path: '/catalog' },
    { icon: 'materials', label: 'Materials', path: '/materials' },
    { icon: 'sparkles', label: 'AI Skill Gap', path: '/skill-gap' },
    { icon: 'award', label: 'Certificates', path: '/certificates' },
    { icon: 'user', label: 'Profile', path: '/profile' },
  ],
  trainer: [
    { icon: 'dashboard', label: 'Dashboard', path: '/dashboard' },
    { icon: 'users', label: 'Trainer hub', path: '/trainer' },
    { icon: 'materials', label: 'Materials', path: '/materials' },
    { icon: 'help', label: 'Quiz', path: '/quiz' },
    { icon: 'sparkles', label: 'AI Skill Gap', path: '/skill-gap' },
    { icon: 'user', label: 'Profile', path: '/profile' },
  ],
  admin: [
    { icon: 'dashboard', label: 'Dashboard', path: '/dashboard' },
    { icon: 'clock', label: 'Pending', path: '/admin?tab=pending', tab: 'pending' },
    { icon: 'users', label: 'All users', path: '/admin?tab=all', tab: 'all' },
    { icon: 'directory', label: 'Directory', path: '/admin?tab=directory', tab: 'directory' },
    { icon: 'message', label: 'Feedback', path: '/admin?tab=feedback', tab: 'feedback' },
    { icon: 'chart', label: 'Analytics', path: '/admin?tab=stats', tab: 'stats' },
  ],
};

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/catalog': 'Catalog',
  '/detail': 'Course detail',
  '/player': 'Lesson player',
  '/materials': 'Materials',
  '/skill-gap': 'AI Skill Gap',
  '/certificates': 'Certificates',
  '/profile': 'Profile',
  '/admin': 'Admin Control',
  '/trainer': 'Trainer Hub',
  '/quiz': 'Quiz & Assessment',
};

const SCENES = {
  trainee: {
    light: meadowLight,
    dark: meadowDark,
    alt: 'Sunlit green meadow with rolling wildflowers',
  },
  trainer: {
    light: goldenField,
    dark: forestCanopy,
    alt: 'Warm golden fields under a wide sunlit sky',
  },
  admin: {
    light: mountainLake,
    dark: riverValley,
    alt: 'Serene glacial mountain lake and valley',
  },
};

export default function Layout({ user: userProp, onLogout, children }) {
  const { theme, toggleTheme } = useTheme();
  const { user: ctxUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const user = userProp || ctxUser;
  const role = user?.role || 'trainee';
  const items = SIDEBAR_ITEMS[role] || SIDEBAR_ITEMS.trainee;
  const scene = SCENES[role] || SCENES.trainee;
  const pageTitle = PAGE_TITLES[location.pathname] || location.pathname.replace('/', '') || 'Dashboard';
  const mobileItems = items.slice(0, 5);
  const currentTab = new URLSearchParams(location.search).get('tab');

  const isItemActive = (item) => {
    if (item.tab) {
      const tab = currentTab || 'pending';
      return location.pathname === '/admin' && tab === item.tab;
    }
    return location.pathname === item.path;
  };

  const handleLogout = () => {
    if (onLogout) onLogout();
    else logout();
    navigate('/login');
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className={`app-layout theme-meadow role-${role}`}>
      <div className="scene-layer">
        <img className="scene-img scene-light" src={scene.light} alt={scene.alt} />
        <img className="scene-img scene-dark" src={scene.dark} alt={scene.alt} />
      </div>
      <div className="bg-scrim" />

      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`} aria-label="Main navigation">
        <div className="sidebar-brand">
          <div className="brand-icon" aria-hidden="true">CC</div>
          <div className="brand-titles">
            <div className="brand-text">Capacity Connect</div>
            <div className="brand-sub">
              <span className="brand-role-pill">{role}</span> portal
            </div>
          </div>
          <button
            type="button"
            className="sidebar-close btn-icon"
            onClick={closeMobile}
            aria-label="Close navigation"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
        <nav className="sidebar-nav">
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={() => `nav-item ${isItemActive(item) ? 'active' : ''}`}
              onClick={closeMobile}
            >
              <span className="nav-icon"><Icon name={item.icon} size={20} /></span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button
            type="button"
            onClick={toggleTheme}
            className="nav-item theme-switch-btn"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span className="nav-icon"><Icon name={theme === 'dark' ? 'sun' : 'moon'} size={20} /></span>
            <span className="nav-label">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button type="button" onClick={handleLogout} className="nav-item logout-btn">
            <span className="nav-icon"><Icon name="logout" size={20} /></span>
            <span className="nav-label">Sign Out</span>
          </button>
        </div>
      </aside>
      <button
        type="button"
        className={`sidebar-overlay ${mobileOpen ? 'is-visible' : ''}`}
        aria-label="Close navigation overlay"
        onClick={closeMobile}
      />

      <div className="main-wrapper">
        <header className="top-nav">
          <div className="nav-left">
            <button
              type="button"
              className="menu-toggle btn-icon"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Icon name="menu" size={20} />
            </button>
            <span className="page-title">{pageTitle}</span>
          </div>
          <div className="nav-right">
            <button
              type="button"
              onClick={toggleTheme}
              className="theme-toggle"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
            </button>
            <div className="user-avatar" title={user?.name || 'User'}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </div>
        </header>
        <main id="main-content" className="main-content">
          {children || <Outlet />}
        </main>
      </div>

      <nav className="bottom-nav" aria-label="Mobile navigation">
        {mobileItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={() => `bottom-nav-item ${isItemActive(item) ? 'active' : ''}`}
          >
            <Icon name={item.icon} size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
