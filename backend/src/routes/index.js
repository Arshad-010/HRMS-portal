import express from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import departmentRoutes from './departmentRoutes.js';
import employeeRoutes from './employeeRoutes.js';
import attendanceRoutes from './attendanceRoutes.js';
import leaveRoutes from './leaveRoutes.js';
import taskRoutes from './taskRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import activityRoutes from './activityRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import performanceRoutes from './performanceRoutes.js';

const router = express.Router();

// Mount routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/departments', departmentRoutes);
router.use('/employees', employeeRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/leaves', leaveRoutes);
router.use('/tasks', taskRoutes);
router.use('/notifications', notificationRoutes);
router.use('/activity', activityRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/performance', performanceRoutes);

export default router;
