import express from 'express';
import {
  createTask,
  getTasks,
  getMyTasks,
  getTaskById,
  updateTask,
  deleteTask,
  updateTaskStatus,
  assignTask,
  getTeamTaskSummary,
} from '../controllers/taskController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// Self-service endpoint for employees
router.get('/my', getMyTasks);
router.get('/team-summary', getTeamTaskSummary);

// Specific task action endpoints
router.patch('/:id/status', updateTaskStatus);
router.patch('/:id/assign', authorize('ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'), assignTask);

// Primary task collection routes
router
  .route('/')
  .get(getTasks)
  .post(authorize('ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'), createTask);

// Individual task routes
router
  .route('/:id')
  .get(getTaskById)
  .put(authorize('ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'), updateTask)
  .delete(authorize('ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'), deleteTask);

export default router;
