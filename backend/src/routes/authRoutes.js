import express from 'express';
import { login, getMe, changePassword, uploadProfilePicture, googleLogin, activateAccount } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { seedInitialAdmin } from '../services/seedService.js';

const router = express.Router();

router.get('/debug-seed', async (req, res) => {
  try {
    await seedInitialAdmin();
    res.json({ success: true, message: 'Seed executed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, stack: error.stack });
  }
});

import User from '../models/User.js';
import crypto from 'crypto';

router.get('/debug-token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    const allUsers = await User.find({}).select('+activationToken +activationTokenExpire');
    
    const matches = allUsers.map(u => ({
      email: u.email,
      hasToken: !!u.activationToken,
      tokenMatches: u.activationToken === hashedToken,
      dbToken: u.activationToken,
      hashedProvided: hashedToken,
      expire: u.activationTokenExpire,
      now: new Date(),
      isNotExpired: u.activationTokenExpire > new Date()
    }));
    
    res.json({ success: true, token, hashedToken, matches });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/login', login);
router.post('/google', googleLogin);
router.post('/activate/:token', activateAccount);
router.get('/me', protect, getMe);
router.post('/change-password', protect, changePassword);
router.post('/profile-picture', protect, uploadProfilePicture);

export default router;
