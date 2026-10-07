import express from 'express';
import {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../controllers/departmentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All department routes require authentication
router.use(protect);

router
  .route('/')
  .get(getDepartments)
  .post(authorize('ADMIN', 'HR'), createDepartment);

router
  .route('/:id')
  .get(getDepartmentById)
  .put(authorize('ADMIN', 'HR'), updateDepartment)
  .delete(authorize('ADMIN'), deleteDepartment);

export default router;
