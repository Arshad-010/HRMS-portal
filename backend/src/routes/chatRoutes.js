import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getConversations,
  getMessages,
  sendMessage,
  createOrGetDirectConversation,
  markAsRead
} from '../controllers/chatController.js';

const router = express.Router();

router.use(protect); // All chat routes require authentication

router.route('/conversations')
  .get(getConversations)
  .post(createOrGetDirectConversation);

router.route('/conversations/:id/messages')
  .get(getMessages)
  .post(sendMessage);

router.put('/conversations/:id/read', markAsRead);

export default router;
