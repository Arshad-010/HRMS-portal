import express from 'express';
import { getAuthUrl, googleCallback, createMeeting } from '../controllers/meetController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/auth', protect, getAuthUrl);
router.get('/callback', googleCallback); // This route doesn't use standard JWT protect since Google redirects here directly
router.post('/create', protect, createMeeting);

export default router;
