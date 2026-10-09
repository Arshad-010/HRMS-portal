import express from 'express';
import { login, getMe, changePassword, uploadProfilePicture, googleLogin, activateAccount } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/google', googleLogin);
router.post('/activate/:token', activateAccount);
router.get('/me', protect, getMe);
router.post('/change-password', protect, changePassword);
router.post('/profile-picture', protect, uploadProfilePicture);

export default router;
