import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function getLocalUser() {
  try {
    const saved = localStorage.getItem('capacity_connect_user');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const localUser = !user ? getLocalUser() : null;
  const effectiveUser = user || localUser;

  if (loading && !effectiveUser) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="spinner"></div>
        <p className="loading-text ml-4">Loading...</p>
      </div>
    );
  }

  if (!effectiveUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(effectiveUser?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
