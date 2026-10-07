import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Login from '../pages/Login';
import DashboardOverview from '../pages/DashboardOverview';
import HealthCheck from '../pages/HealthCheck';
import Unauthorized from '../pages/Unauthorized';
import ProtectedRoute from '../components/common/ProtectedRoute';

export const AppRoutes = () => {
  const { isAuthenticated, loading } = useAuth();

  return (
    <Routes>
      {/* Root redirect depending on auth state */}
      <Route
        path="/"
        element={
          loading ? (
            <div className="min-h-[50vh]" />
          ) : isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Public Authentication Route */}
      <Route path="/login" element={<Login />} />

      {/* Protected Application Shell */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardOverview />
          </ProtectedRoute>
        }
      />

      {/* System Diagnostics Route */}
      <Route path="/health" element={<HealthCheck />} />

      {/* 403 Access Denied Route */}
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
