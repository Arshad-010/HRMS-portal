import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getConversations,
  getMessages,
  sendMessage,
  createOrGetDirectConversation,
  markAsRead,
  getChatUsers,
  editMessage,
  deleteMessage,
  reactToMessage
} from '../controllers/chatController.js';

const router = express.Router();

router.use(protect); // All chat routes require authentication

router.get('/users', getChatUsers);

router.route('/conversations')
  .get(getConversations)
  .post(createOrGetDirectConversation);

router.route('/conversations/:id/messages')
  .get(getMessages)
  .post(sendMessage);

router.route('/conversations/:id/messages/:msgId')
  .put(editMessage)
  .delete(deleteMessage);

router.post('/conversations/:id/messages/:msgId/react', reactToMessage);

router.put('/conversations/:id/read', markAsRead);

export default router;
