import express from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import departmentRoutes from './departmentRoutes.js';
import employeeRoutes from './employeeRoutes.js';
import attendanceRoutes from './attendanceRoutes.js';
import leaveRoutes from './leaveRoutes.js';

const router = express.Router();

// Mount routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/departments', departmentRoutes);
router.use('/employees', employeeRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/leaves', leaveRoutes);

export default router;
