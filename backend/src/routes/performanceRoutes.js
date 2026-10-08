import express from 'express';
import {
  getReviewCycles,
  createReviewCycle,
  getPerformanceOverview,
  getReviews,
  updateReview
} from '../controllers/performanceController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/cycles', getReviewCycles);
router.post('/cycles', authorize('ADMIN', 'HR'), createReviewCycle);
router.get('/overview', getPerformanceOverview);
router.get('/reviews', getReviews);
router.put('/reviews/:id', updateReview);

export default router;
