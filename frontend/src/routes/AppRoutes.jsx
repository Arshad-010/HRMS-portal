import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LandingPage from '../pages/LandingPage';
import Login from '../pages/Login';
import DashboardOverview from '../pages/DashboardOverview';
import Attendance from '../pages/Attendance';
import Leaves from '../pages/Leaves';
import Tasks from '../pages/Tasks';
import Departments from '../pages/Departments';
import Employees from '../pages/Employees';
import EmployeeDetails from '../pages/EmployeeDetails';
import Notifications from '../pages/Notifications';
import Activity from '../pages/Activity';
import Profile from '../pages/Profile';
import Settings from '../pages/Settings';
import HealthCheck from '../pages/HealthCheck';
import Unauthorized from '../pages/Unauthorized';
import Analytics from '../pages/Analytics';
import Performance from '../pages/Performance';
import Chat from '../pages/Chat';
import ProtectedRoute from '../components/common/ProtectedRoute';
import ActivateAccount from '../pages/ActivateAccount';

import {
  AboutPage,
  FeaturesPage,
  PublicAttendancePage,
  PublicLeavePage,
  PublicTasksPage,
  PrivacyPage,
  TermsPage,
  ContactPage,
  HelpPage
} from '../pages/PublicInfoPages';

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
            <LandingPage />
          )
        }
      />

      {/* Public Info Routes */}
      <Route path="/features" element={<FeaturesPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/help" element={<HelpPage />} />
      <Route path="/leave" element={<PublicLeavePage />} />

      {/* Mixed Public / Protected Routes */}
      <Route
        path="/attendance"
        element={
          isAuthenticated ? (
            <ProtectedRoute>
              <Attendance />
            </ProtectedRoute>
          ) : (
            <PublicAttendancePage />
          )
        }
      />

      <Route
        path="/tasks"
        element={
          isAuthenticated ? (
            <ProtectedRoute>
              <Tasks />
            </ProtectedRoute>
          ) : (
            <PublicTasksPage />
          )
        }
      />

      {/* Public Authentication Route */}
      <Route path="/login" element={<Login />} />
      <Route path="/activate/:token" element={<ActivateAccount />} />

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
        path="/leaves"
        element={
          <ProtectedRoute>
            <Leaves />
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

      <Route
        path="/performance"
        element={
          <ProtectedRoute>
            <Performance />
          </ProtectedRoute>
        }
      />

      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        }
      />

      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        }
      />

      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        }
      />

      <Route
        path="/activity"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
            <Activity />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
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
