import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Screen1Auth from './components/Screen1Auth';
import Screen2Dashboard from './components/Screen2Dashboard';
import Page3Catalog from './components/Page3Catalog';
import Page4Detail from './components/Page4Detail';
import Page5Player from './components/Page5Player';
import Screen6Certificate from './components/Screen6Certificate';
import Screen7Admin from './components/Screen7Admin';
import Screen8SkillGap from './components/Screen8SkillGap';
import Screen9Trainer from './components/Screen9Trainer';
import Screen10CourseMaterials from './components/Screen10CourseMaterials';
import EditProfile from './components/EditProfile';
import Screen12Quiz from './components/Screen12Quiz';

import PublicHomepage from './components/PublicHomepage';

export default function App() {
  const { user, loading, logout } = useAuth();
  const [selectedCourseId, setSelectedCourseId] = useState(1);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p className="loading-text">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<PublicHomepage onNavigateToAuth={() => navigate('/login')} />} />
        <Route path="/login" element={<Screen1Auth onLogin={(u) => {
          if (u?.role === 'admin') navigate('/admin');
          else navigate('/dashboard');
        }} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Layout user={user} onLogout={logout} />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={
          user?.role === 'admin' ? <Navigate to="/admin" replace /> :
          user?.role === 'trainer' ? <Screen9Trainer userId={user.id} onNavigate={(screen) => navigate(screen)} /> :
          <Screen2Dashboard
            userId={user.id}
            onOpenCourse={(id) => { setSelectedCourseId(id); navigate('/player'); }}
            onOpenCertificate={(uId, cId) => { setSelectedCourseId(cId); navigate('/certificates'); }}
            onOpenCatalog={() => navigate('/catalog')}
          />
        } />
        <Route path="admin" element={
          user?.role === 'admin' ? <Screen7Admin onBackToDashboard={() => navigate('/dashboard')} /> : <Navigate to="/dashboard" replace />
        } />
        <Route path="trainer" element={
          user?.role === 'trainer' ? <Screen9Trainer userId={user.id} onNavigate={(screen) => navigate(screen)} /> : <Navigate to="/dashboard" replace />
        } />
        <Route path="catalog" element={
          <Page3Catalog
            onSelectCourse={(id) => { setSelectedCourseId(id); navigate('/detail'); }}
            onLaunchPlayer={(id) => { setSelectedCourseId(id); navigate('/player'); }}
          />
        } />
        <Route path="detail" element={
          <Page4Detail
            courseId={selectedCourseId}
            onBackToCatalog={() => navigate('/catalog')}
            onLaunchPlayer={(id) => { setSelectedCourseId(id); navigate('/player'); }}
          />
        } />
        <Route path="player" element={
          <Page5Player
            courseId={selectedCourseId}
            onBackToCatalog={() => navigate('/catalog')}
            onBackToDetail={() => navigate('/detail')}
          />
        } />
        <Route path="certificates" element={
          <Screen6Certificate
            userId={user.id}
            courseId={selectedCourseId}
            onBackToDashboard={() => navigate('/dashboard')}
          />
        } />
        <Route path="admin" element={
          <Screen7Admin
            onBackToDashboard={() => navigate('/dashboard')}
          />
        } />
        <Route path="skill-gap" element={
          <Screen8SkillGap
            userId={user.id}
            onBackToDashboard={() => navigate('/dashboard')}
            onEnrollCourse={(courseId) => setSelectedCourseId(courseId)}
          />
        } />
        <Route path="trainer" element={
          <Screen9Trainer
            userId={user.id}
            onNavigate={(screen) => navigate(screen)}
          />
        } />
        <Route path="materials" element={
          <Screen10CourseMaterials
            userId={user.id}
            courseId={selectedCourseId}
            onBackToDashboard={() => navigate('/dashboard')}
          />
        } />
        <Route path="profile" element={
          <EditProfile
            user={user}
            onBackToDashboard={() => navigate('/dashboard')}
          />
        } />
        <Route path="quiz" element={
          <Screen12Quiz
            user={user}
            onBackToDashboard={() => navigate('/dashboard')}
          />
        } />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
