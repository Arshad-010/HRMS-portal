import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HealthCheck from '../pages/HealthCheck';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HealthCheck />} />
      <Route path="/health" element={<HealthCheck />} />
      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
