/**
 * Chat Routes
 */

import { Router } from 'express';
import * as chatController from './chat.controller';
import { validate } from '../../shared/middlewares/validate.middleware';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';
import { sendMessageSchema } from './chat.validator';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * Send message
 */
router.post(
  '/send',
  validate(sendMessageSchema),
  chatController.sendMessage
);

/**
 * Get all conversations
 */
router.get(
  '/conversations',
  chatController.getAllConversations
);

/**
 * Get unread count
 */
router.get(
  '/unread-count',
  chatController.getUnreadCount
);

/**
 * Get conversation with specific user
 */
router.get(
  '/conversation/:userId',
  chatController.getConversation
);

/**
 * Mark messages as read
 */
router.put(
  '/read/:userId',
  chatController.markMessagesAsRead
);

/**
 * Delete message
 */
router.delete(
  '/message/:messageId',
  chatController.deleteMessage
);

/**
 * Search messages
 */
router.get(
  '/search/:userId',
  chatController.searchMessages
);

export default router;