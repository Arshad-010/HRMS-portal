import express from 'express';
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from '../controllers/employeeController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getEmployees)
  .post(authorize('ADMIN', 'HR'), createEmployee);

router
  .route('/:id')
  .get(getEmployeeById)
  .put(updateEmployee)
  .delete(authorize('ADMIN'), deleteEmployee);

export default router;
