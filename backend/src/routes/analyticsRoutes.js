import express from 'express';
import {
  getAnalyticsOverview,
  getAttendanceTrend,
  getHeadcountByDepartment,
  getPerformanceDistribution,
  getLeaveAnalytics,
  getTaskStatusAnalytics,
  getHiringTrend
} from '../controllers/analyticsController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
// Allowed for ADMIN, HR, and MANAGER
router.use(authorize('ADMIN', 'HR', 'MANAGER'));

router.get('/overview', getAnalyticsOverview);
router.get('/attendance-trend', getAttendanceTrend);
router.get('/headcount-by-department', getHeadcountByDepartment);
router.get('/performance-distribution', getPerformanceDistribution);
router.get('/leave-breakdown', getLeaveAnalytics);
router.get('/task-status', getTaskStatusAnalytics);
router.get('/hiring-trend', getHiringTrend);

export default router;
