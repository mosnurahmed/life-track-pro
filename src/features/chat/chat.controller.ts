/**
 * Chat Controller
 */

import { Request, Response } from 'express';
import * as chatService from './chat.service';
import { sendSuccess, sendPaginated } from '../../shared/utils/response.util';
import { Types } from 'mongoose';
import { sendNotificationToUser } from '../../socket/socket.server';
import { sendChatNotification } from '../notification/notification.service'; 

interface AuthRequest extends Request {
  user?: {
    userId: Types.ObjectId;
    email: string;
    name: string;
  };
}

/**
 * Send Message
 * 
 * Route: POST /api/chat/send
 * Body: { receiverId: string, message: string }
 * 
 * Note: This stores message in database
 * Real-time delivery is handled by Socket.io
 */
export const sendMessage = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const senderId = authReq.user!.userId.toString();
  
  const message = await chatService.sendMessage(senderId, req.body);

    sendChatNotification(
    req.body.receiverId,
    authReq.user!.name,
    req.body.message
  ).catch(err => {
    console.error('Failed to send chat notification:', err);
  });
  
  // Send notification to receiver (if online)
  sendNotificationToUser(req.body.receiverId, {
    type: 'new_message',
    title: 'New Message',
    message: `${authReq.user!.name}: ${req.body.message.substring(0, 50)}...`,
    data: {
      senderId,
      senderName: authReq.user!.name,
      messageId: message._id
    }
  });
  
  return sendSuccess(
    res,
    message,
    'Message sent successfully',
    201
  );
};

/**
 * Get Conversation
 * 
 * Route: GET /api/chat/conversation/:userId?page=1&limit=50
 * 
 * Returns paginated messages between current user and specified user
 */
export const getConversation = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const currentUserId = authReq.user!.userId.toString();
  const otherUserId = req.params.userId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  
  const result = await chatService.getConversation(
    currentUserId,
    otherUserId,
    page,
    limit
  );
  
  return sendPaginated(res, result);
};

/**
 * Get All Conversations
 * 
 * Route: GET /api/chat/conversations
 * 
 * Returns list of all users with whom current user has chatted
 */
export const getAllConversations = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  
  const conversations = await chatService.getAllConversations(userId);
  
  return sendSuccess(res, conversations);
};

/**
 * Mark Messages as Read
 * 
 * Route: PUT /api/chat/read/:userId
 * 
 * Marks all messages from specified user as read
 */
export const markMessagesAsRead = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const currentUserId = authReq.user!.userId.toString();
  const otherUserId = req.params.userId;
  
  const count = await chatService.markMessagesAsRead(currentUserId, otherUserId);
  
  return sendSuccess(
    res,
    { markedCount: count },
    `${count} message(s) marked as read`
  );
};

/**
 * Get Unread Count
 * 
 * Route: GET /api/chat/unread-count
 * 
 * Returns total number of unread messages
 */
export const getUnreadCount = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  
  const count = await chatService.getUnreadCount(userId);
  
  return sendSuccess(res, { unreadCount: count });
};

/**
 * Delete Message
 * 
 * Route: DELETE /api/chat/message/:messageId
 * 
 * Deletes own message (within 5 minutes)
 */
export const deleteMessage = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  const messageId = req.params.messageId;
  
  await chatService.deleteMessage(userId, messageId);
  
  return sendSuccess(
    res,
    null,
    'Message deleted successfully'
  );
};

/**
 * Search Messages
 * 
 * Route: GET /api/chat/search/:userId?q=searchQuery
 * 
 * Searches messages in a conversation
 */
export const searchMessages = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const currentUserId = authReq.user!.userId.toString();
  const otherUserId = req.params.userId;
  const searchQuery = req.query.q as string;
  
  if (!searchQuery) {
    return sendSuccess(res, []);
  }
  
  const messages = await chatService.searchMessages(
    currentUserId,
    otherUserId,
    searchQuery
  );
  
  return sendSuccess(res, messages);
};