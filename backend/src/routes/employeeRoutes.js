import express from 'express';
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  bulkImportEmployees,
  resendInvitationEmail,
} from '../controllers/employeeController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getEmployees)
  .post(authorize('ADMIN', 'HR'), createEmployee);

router.post('/bulk-import', authorize('ADMIN', 'HR'), bulkImportEmployees);

router
  .route('/:id')
  .get(getEmployeeById)
  .put(updateEmployee)
  .delete(authorize('ADMIN'), deleteEmployee);

router.post('/:id/resend-invite', authorize('ADMIN', 'HR'), resendInvitationEmail);

export default router;
