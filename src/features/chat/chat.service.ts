/**
 * Chat Service
 */

import Message, { IMessage } from './chat.model';
import User from '../auth/auth.model';
import { NotFoundError, BadRequestError } from '../../shared/utils/error.util';
import mongoose from 'mongoose';
import { PaginatedResponse } from '../../shared/types/common.types';

/**
 * Send Message DTO
 */
export interface SendMessageDTO {
  receiverId: string;
  message: string;
}

/**
 * Conversation Info
 */
export interface ConversationInfo {
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  isOnline?: boolean;
}

/**
 * Send Message
 * 
 * @param senderId - Sender user ID
 * @param data - Message data
 * @returns Created message
 */
export const sendMessage = async (
  senderId: string,
  data: SendMessageDTO
): Promise<IMessage> => {
  // Verify receiver exists
  const receiver = await User.findById(data.receiverId);
  
  if (!receiver) {
    throw new NotFoundError('Receiver not found');
  }
  
  // Cannot send message to self
  if (senderId === data.receiverId) {
    throw new BadRequestError('Cannot send message to yourself');
  }
  
  // Create message
  const message = await Message.create({
    senderId: new mongoose.Types.ObjectId(senderId),
    receiverId: new mongoose.Types.ObjectId(data.receiverId),
    message: data.message
  });
  
  // Populate sender and receiver info
  await message.populate('senderInfo', 'name email avatar');
  await message.populate('receiverInfo', 'name email avatar');
  
  return message;
};

/**
 * Get Conversation
 * 
 * Purpose: Get all messages between two users
 * 
 * @param userId - Current user ID
 * @param otherUserId - Other user ID
 * @param page - Page number (default: 1)
 * @param limit - Messages per page (default: 50)
 * @returns Paginated messages
 */
export const getConversation = async (
  userId: string,
  otherUserId: string,
  page: number = 1,
  limit: number = 50
): Promise<PaginatedResponse<IMessage>> => {
  // Verify other user exists
  const otherUser = await User.findById(otherUserId);
  
  if (!otherUser) {
    throw new NotFoundError('User not found');
  }
  
  // Build query: messages between these two users
  const query = {
    $or: [
      {
        senderId: new mongoose.Types.ObjectId(userId),
        receiverId: new mongoose.Types.ObjectId(otherUserId)
      },
      {
        senderId: new mongoose.Types.ObjectId(otherUserId),
        receiverId: new mongoose.Types.ObjectId(userId)
      }
    ]
  };
  
  // Calculate pagination
  const skip = (page - 1) * limit;
  
  // Execute queries
  const [messages, total] = await Promise.all([
    Message.find(query)
      .populate('senderInfo', 'name email avatar')
      .populate('receiverInfo', 'name email avatar')
      .sort({ createdAt: -1 })  // Newest first
      .skip(skip)
      .limit(limit)
      .lean(),
    
    Message.countDocuments(query)
  ]);
  
  const totalPages = Math.ceil(total / limit);
  
  return {
    data: messages.reverse() as IMessage[],  // Reverse to show oldest first in UI
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
};

/**
 * Get All Conversations
 * 
 * Purpose: Get list of users with whom current user has chatted
 * Shows latest message and unread count for each
 * 
 * @param userId - Current user ID
 * @returns Array of conversation info
 */
export const getAllConversations = async (
  userId: string
): Promise<ConversationInfo[]> => {
  // Get all unique users who have chatted with current user
  const messages = await Message.aggregate([
    {
      $match: {
        $or: [
          { senderId: new mongoose.Types.ObjectId(userId) },
          { receiverId: new mongoose.Types.ObjectId(userId) }
        ]
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ['$senderId', new mongoose.Types.ObjectId(userId)] },
            '$receiverId',
            '$senderId'
          ]
        },
        lastMessage: { $first: '$message' },
        lastMessageTime: { $first: '$createdAt' },
        lastMessageSender: { $first: '$senderId' }
      }
    }
  ]);
  
  // Get user details and unread count for each conversation
  const conversations = await Promise.all(
    messages.map(async (msg) => {
      const otherUserId = msg._id;
      
      // Get user info
      const user = await User.findById(otherUserId).select('name email avatar');
      
      if (!user) {
        return null;
      }
      
      // Get unread count (messages sent to current user that are unread)
      const unreadCount = await Message.countDocuments({
        senderId: otherUserId,
        receiverId: new mongoose.Types.ObjectId(userId),
        isRead: false
      });
      
      return {
        userId: user._id.toString(),
        userName: user.name,
        userEmail: user.email,
        userAvatar: user.avatar,
        lastMessage: msg.lastMessage,
        lastMessageTime: msg.lastMessageTime,
        unreadCount
      };
    })
  );
  
  // Filter out null values and sort by last message time
  return conversations
    .filter(conv => conv !== null)
    .sort((a, b) => 
      (b!.lastMessageTime?.getTime() || 0) - (a!.lastMessageTime?.getTime() || 0)
    ) as ConversationInfo[];
};

/**
 * Mark Messages as Read
 * 
 * Purpose: Mark all messages from a user as read
 * 
 * @param userId - Current user ID (receiver)
 * @param senderId - Other user ID (sender)
 * @returns Number of messages marked as read
 */
export const markMessagesAsRead = async (
  userId: string,
  senderId: string
): Promise<number> => {
  const result = await Message.updateMany(
    {
      senderId: new mongoose.Types.ObjectId(senderId),
      receiverId: new mongoose.Types.ObjectId(userId),
      isRead: false
    },
    {
      isRead: true,
      readAt: new Date()
    }
  );
  
  return result.modifiedCount;
};

/**
 * Get Unread Messages Count
 * 
 * @param userId - Current user ID
 * @returns Total unread messages count
 */
export const getUnreadCount = async (userId: string): Promise<number> => {
  const count = await Message.countDocuments({
    receiverId: new mongoose.Types.ObjectId(userId),
    isRead: false
  });
  
  return count;
};

/**
 * Delete Message
 * 
 * Purpose: Delete own message (within 5 minutes)
 * 
 * @param userId - Current user ID
 * @param messageId - Message ID
 */
export const deleteMessage = async (
  userId: string,
  messageId: string
): Promise<void> => {
  const message = await Message.findById(messageId);
  
  if (!message) {
    throw new NotFoundError('Message not found');
  }
  
  // Can only delete own messages
  if (message.senderId.toString() !== userId) {
    throw new BadRequestError('You can only delete your own messages');
  }
  
  // Check if message is within 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  
  if (message.createdAt < fiveMinutesAgo) {
    throw new BadRequestError('Cannot delete messages older than 5 minutes');
  }
  
  await message.deleteOne();
};

/**
 * Search Messages
 * 
 * Purpose: Search messages in a conversation
 * 
 * @param userId - Current user ID
 * @param otherUserId - Other user ID
 * @param searchQuery - Search text
 * @returns Matching messages
 */
export const searchMessages = async (
  userId: string,
  otherUserId: string,
  searchQuery: string
): Promise<IMessage[]> => {
  const messages = await Message.find({
    $or: [
      {
        senderId: new mongoose.Types.ObjectId(userId),
        receiverId: new mongoose.Types.ObjectId(otherUserId)
      },
      {
        senderId: new mongoose.Types.ObjectId(otherUserId),
        receiverId: new mongoose.Types.ObjectId(userId)
      }
    ],
    message: { $regex: searchQuery, $options: 'i' }
  })
    .populate('senderInfo', 'name email avatar')
    .populate('receiverInfo', 'name email avatar')
    .sort({ createdAt: -1 })
    .limit(50);
  
  return messages;
};