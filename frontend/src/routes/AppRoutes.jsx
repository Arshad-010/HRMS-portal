import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Login from '../pages/Login';
import DashboardOverview from '../pages/DashboardOverview';
import Departments from '../pages/Departments';
import Employees from '../pages/Employees';
import EmployeeDetails from '../pages/EmployeeDetails';
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

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardOverview />
          </ProtectedRoute>
        }
      />

      <Route
        path="/departments"
        element={
          <ProtectedRoute>
            <Departments />
          </ProtectedRoute>
        }
      />

      <Route
        path="/employees"
        element={
          <ProtectedRoute>
            <Employees />
          </ProtectedRoute>
        }
      />

      <Route
        path="/employees/:id"
        element={
          <ProtectedRoute>
            <EmployeeDetails />
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
