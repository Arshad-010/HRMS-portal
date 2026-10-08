import express from 'express';
import {
  checkIn,
  checkOut,
  getMyAttendance,
  getAttendanceSummary,
  getAttendance,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getEmployeeAttendance,
  startBreak,
  endBreak,
} from '../controllers/attendanceController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// Self-service employee endpoints
router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.post('/break/start', startBreak);
router.post('/break/end', endBreak);
router.get('/my', getMyAttendance);

// Summary & specific employee endpoints
router.get('/summary', getAttendanceSummary);
router.get('/employee/:employeeId', getEmployeeAttendance);

// General listing & management endpoints
router
  .route('/')
  .get(getAttendance)
  .post(authorize('ADMIN', 'HR', 'MANAGER'), createAttendance);

router
  .route('/:id')
  .get(getAttendanceById)
  .put(authorize('ADMIN', 'HR', 'MANAGER'), updateAttendance)
  .delete(authorize('ADMIN'), deleteAttendance);

export default router;
