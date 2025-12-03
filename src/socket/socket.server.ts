/**
 * Socket.io Server Configuration
 * 
 * Purpose: Real-time WebSocket communication
 * 
 * Features:
 * 1. Authentication with JWT
 * 2. User connection management
 * 3. Room-based messaging
 * 4. Online status tracking
 * 5. Typing indicators
 */

import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../shared/config/env.config';
const { JWT_SECRET } = env;

/**
 * Connected Users Map
 * 
 * Structure: { userId: socketId }
 * Purpose: Track who's online and their socket ID
 */
const connectedUsers = new Map<string, string>();

/**
 * Socket.io Server Instance
 */
let io: Server;

/**
 * JWT Payload Interface
 */
interface JWTPayload {
  userId: string;
  email: string;
  name: string;
}

/**
 * Socket with User Data
 */
interface AuthenticatedSocket extends Socket {
  userId?: string;
  userName?: string;
  userEmail?: string;
}

/**
 * Initialize Socket.io Server
 * 
 * @param httpServer - HTTP server instance
 */
export const initializeSocketServer = (httpServer: HTTPServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: '*', // Update in production to specific domains
      methods: ['GET', 'POST']
    }
  });
  
  /**
   * Authentication Middleware
   * 
   * Purpose: Verify JWT token before allowing connection
   */
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      
      // Attach user info to socket
      socket.userId = decoded.userId;
      socket.userName = decoded.name;
      socket.userEmail = decoded.email;
      
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });
  
  /**
   * Connection Handler
   */
  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    
    console.log(`✅ User connected: ${socket.userName} (${userId})`);
    
    // Store user's socket ID
    connectedUsers.set(userId, socket.id);
    
    // Notify others that user is online
    socket.broadcast.emit('user_online', { userId, userName: socket.userName });
    
    /**
     * Join Private Chat Room
     * 
     * Room naming: Sort user IDs to create consistent room name
     * Example: user1 + user2 → "chat_user1_user2"
     */
    socket.on('join_chat', ({ otherUserId }: { otherUserId: string }) => {
      const roomName = [userId, otherUserId].sort().join('_');
      socket.join(roomName);
      
      console.log(`💬 ${socket.userName} joined room: ${roomName}`);
    });
    
    /**
     * Send Message
     * 
     * Purpose: Deliver message to specific user
     */
    socket.on('send_message', ({ receiverId, message }: { 
      receiverId: string; 
      message: string;
    }) => {
      const roomName = [userId, receiverId].sort().join('_');
      
      const messageData = {
        senderId: userId,
        senderName: socket.userName,
        message,
        timestamp: new Date()
      };
      
      // Send to room (both users)
      io.to(roomName).emit('receive_message', messageData);
      
      console.log(`📨 Message from ${socket.userName} to room ${roomName}`);
    });
    
    /**
     * Typing Indicator
     * 
     * Purpose: Show "User is typing..." to other user
     */
    socket.on('typing_start', ({ receiverId }: { receiverId: string }) => {
      const receiverSocketId = connectedUsers.get(receiverId);
      
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('user_typing', {
          userId,
          userName: socket.userName,
          isTyping: true
        });
      }
    });
    
    socket.on('typing_stop', ({ receiverId }: { receiverId: string }) => {
      const receiverSocketId = connectedUsers.get(receiverId);
      
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('user_typing', {
          userId,
          userName: socket.userName,
          isTyping: false
        });
      }
    });
    
    /**
     * Mark Message as Read
     */
    socket.on('mark_read', ({ messageId }: { messageId: string }) => {
      // Will be handled by database in message service
      socket.emit('message_read', { messageId });
    });
    
    /**
     * Get Online Users
     */
    socket.on('get_online_users', () => {
      const onlineUserIds = Array.from(connectedUsers.keys());
      socket.emit('online_users_list', onlineUserIds);
    });
    
    /**
     * Disconnect Handler
     */
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.userName} (${userId})`);
      
      // Remove from connected users
      connectedUsers.delete(userId);
      
      // Notify others that user is offline
      socket.broadcast.emit('user_offline', { userId });
    });
  });
  
  return io;
};

/**
 * Get Socket.io Server Instance
 */
export const getSocketServer = (): Server => {
  if (!io) {
    throw new Error('Socket.io server not initialized');
  }
  return io;
};

/**
 * Send Notification to User
 * 
 * Purpose: Send any notification to a specific user
 * Used by: Budget alerts, task reminders, etc.
 */
export const sendNotificationToUser = (
  userId: string,
  notification: {
    type: string;
    title: string;
    message: string;
    data?: any;
  }
) => {
  const socketId = connectedUsers.get(userId);
  
  if (socketId && io) {
    io.to(socketId).emit('notification', notification);
    console.log(`🔔 Notification sent to ${userId}`);
  }
};

/**
 * Check if User is Online
 */
export const isUserOnline = (userId: string): boolean => {
  return connectedUsers.has(userId);
};

/**
 * Get All Online Users
 */
export const getOnlineUsers = (): string[] => {
  return Array.from(connectedUsers.keys());
};