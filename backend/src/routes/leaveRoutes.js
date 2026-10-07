import express from 'express';
import {
  applyLeave,
  getMyLeaves,
  getLeaveBalance,
  getLeaves,
  getLeaveById,
  approveLeave,
  rejectLeave,
  cancelLeave,
  updateLeave,
  deleteLeave,
} from '../controllers/leaveController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// Self-service & specific query routes (must be mounted before /:id)
router.get('/my', getMyLeaves);
router.get('/balance', getLeaveBalance);
router.get('/balance/:employeeId', getLeaveBalance);

// Approvals & reviews
router.patch('/:id/approve', authorize('ADMIN', 'HR', 'MANAGER'), approveLeave);
router.patch('/:id/reject', authorize('ADMIN', 'HR', 'MANAGER'), rejectLeave);

// Cancellation
router.post('/:id/cancel', cancelLeave);

// Base CRUD routes
router.route('/').get(getLeaves).post(applyLeave);

router.route('/:id').get(getLeaveById).put(updateLeave).delete(deleteLeave);

export default router;
