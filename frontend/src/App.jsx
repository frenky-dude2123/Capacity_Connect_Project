import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
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
import ProtectedRoute from './components/ProtectedRoute';
import PublicHomepage from './components/PublicHomepage';

export default function App() {
  const { user } = useAuth();
  const [selectedCourseId, setSelectedCourseId] = useState(1);

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <PublicHomepage />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Screen1Auth onLogin={(u) => {
        if (u?.role === 'admin') window.location.href = '/admin';
        else window.location.href = '/dashboard';
      }} />} />
      {user && (
        <>
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['trainee', 'trainer', 'admin']}>
              <Screen2Dashboard
                userId={user?.id}
                onOpenCourse={(id) => { setSelectedCourseId(id); window.location.href = '/player'; }}
                onOpenCertificate={(uId, cId) => { setSelectedCourseId(cId); window.location.href = '/certificates'; }}
                onOpenCatalog={() => window.location.href = '/catalog'}
              />
            </ProtectedRoute>
          } />
          <Route path="/catalog" element={
            <ProtectedRoute>
              <Page3Catalog
                onSelectCourse={(id) => { setSelectedCourseId(id); window.location.href = '/detail'; }}
                onLaunchPlayer={(id) => { setSelectedCourseId(id); window.location.href = '/player'; }}
              />
            </ProtectedRoute>
          } />
          <Route path="/detail" element={
            <ProtectedRoute>
              <Page4Detail
                courseId={selectedCourseId}
                onBackToCatalog={() => window.location.href = '/catalog'}
                onLaunchPlayer={(id) => { setSelectedCourseId(id); window.location.href = '/player'; }}
              />
            </ProtectedRoute>
          } />
          <Route path="/player" element={
            <ProtectedRoute>
              <Page5Player
                courseId={selectedCourseId}
                onBackToCatalog={() => window.location.href = '/catalog'}
                onBackToDetail={() => window.location.href = '/detail'}
              />
            </ProtectedRoute>
          } />
          <Route path="/certificates" element={
            <ProtectedRoute>
              <Screen6Certificate
                userId={user?.id}
                courseId={selectedCourseId}
                onBackToDashboard={() => window.location.href = '/dashboard'}
              />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Screen7Admin onBackToDashboard={() => window.location.href = '/dashboard'} />
            </ProtectedRoute>
          } />
          <Route path="/skill-gap" element={
            <ProtectedRoute allowedRoles={['trainee', 'trainer']}>
              <Screen8SkillGap
                userId={user?.id}
                onBackToDashboard={() => window.location.href = '/dashboard'}
                onEnrollCourse={(courseId) => setSelectedCourseId(courseId)}
              />
            </ProtectedRoute>
          } />
          <Route path="/trainer" element={
            <ProtectedRoute allowedRoles={['trainer']}>
              <Screen9Trainer
                userId={user?.id}
                onNavigate={(screen) => window.location.href = `/${screen}`}
              />
            </ProtectedRoute>
          } />
          <Route path="/materials" element={
            <ProtectedRoute allowedRoles={['trainee', 'trainer']}>
              <Screen10CourseMaterials
                userId={user?.id}
                courseId={selectedCourseId}
                onBackToDashboard={() => window.location.href = '/dashboard'}
              />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <EditProfile
                user={user}
                onBackToDashboard={() => window.location.href = '/dashboard'}
              />
            </ProtectedRoute>
          } />
          <Route path="/quiz" element={
            <ProtectedRoute>
              <Screen12Quiz
                user={user}
                onBackToDashboard={() => window.location.href = '/dashboard'}
              />
            </ProtectedRoute>
          } />
        </>
      )}
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}
