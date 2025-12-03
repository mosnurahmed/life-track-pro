/**
 * Notification Service
 * 
 * Purpose: Send push notifications via Firebase FCM
 */

import admin from 'firebase-admin';
import { isFirebaseInitialized } from '../../config/firebase';
import User from '../auth/auth.model';
import mongoose from 'mongoose';

/**
 * Notification Types
 */
export enum NotificationType {
  BUDGET_WARNING = 'budget_warning',
  BUDGET_EXCEEDED = 'budget_exceeded',
  TASK_REMINDER = 'task_reminder',
  TASK_DUE_TODAY = 'task_due_today',
  SAVINGS_MILESTONE = 'savings_milestone',
  SAVINGS_COMPLETED = 'savings_completed',
  CHAT_MESSAGE = 'chat_message'
}

/**
 * Notification Data
 */
export interface NotificationData {
  type: NotificationType;
  title: string;
  body: string;
  data?: { [key: string]: string };
}

/**
 * Send Notification to User
 * 
 * @param userId - User ID
 * @param notification - Notification data
 * @returns Success status
 */
export const sendNotificationToUser = async (
  userId: string,
  notification: NotificationData
): Promise<{ success: boolean; sentCount: number }> => {
  // Check if Firebase is initialized
  if (!isFirebaseInitialized()) {
    console.warn('⚠️ Firebase not initialized. Notification not sent.');
    return { success: false, sentCount: 0 };
  }
  
  try {
    // Get user's device tokens
    const user = await User.findById(userId).select('deviceTokens');
    
    if (!user || !user.deviceTokens || user.deviceTokens.length === 0) {
      console.log(`ℹ️ User ${userId} has no device tokens`);
      return { success: false, sentCount: 0 };
    }
    
    // Prepare FCM message
    const message = {
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: {
        type: notification.type,
        ...notification.data
      },
      tokens: user.deviceTokens
    };
    
    // Send to all devices
    const response = await admin.messaging().sendEachForMulticast(message);
    
    console.log(`✅ Notification sent: ${response.successCount}/${user.deviceTokens.length}`);
    
    // Remove invalid tokens
    if (response.failureCount > 0) {
      const tokensToRemove: string[] = [];
      
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          tokensToRemove.push(user.deviceTokens[idx]);
        }
      });
      
      if (tokensToRemove.length > 0) {
        await User.findByIdAndUpdate(userId, {
          $pull: { deviceTokens: { $in: tokensToRemove } }
        });
        
        console.log(`🗑️ Removed ${tokensToRemove.length} invalid tokens`);
      }
    }
    
    return {
      success: response.successCount > 0,
      sentCount: response.successCount
    };
    
  } catch (error) {
    console.error('❌ Notification send error:', error);
    return { success: false, sentCount: 0 };
  }
};

/**
 * Send Notification to Multiple Users
 * 
 * @param userIds - Array of user IDs
 * @param notification - Notification data
 */
export const sendNotificationToMultipleUsers = async (
  userIds: string[],
  notification: NotificationData
): Promise<void> => {
  const promises = userIds.map(userId => 
    sendNotificationToUser(userId, notification)
  );
  
  await Promise.all(promises);
};

/**
 * Send Budget Alert
 * 
 * @param userId - User ID
 * @param categoryName - Category name
 * @param percentage - Budget used percentage
 */
export const sendBudgetAlert = async (
  userId: string,
  categoryName: string,
  percentage: number
): Promise<void> => {
  let type: NotificationType;
  let title: string;
  let emoji: string;
  
  if (percentage >= 100) {
    type = NotificationType.BUDGET_EXCEEDED;
    title = 'Budget Exceeded!';
    emoji = '🚨';
  } else {
    type = NotificationType.BUDGET_WARNING;
    title = 'Budget Warning';
    emoji = '⚠️';
  }
  
  await sendNotificationToUser(userId, {
    type,
    title,
    body: `${emoji} ${categoryName}: ${percentage.toFixed(0)}% of budget used`,
    data: {
      categoryName,
      percentage: percentage.toString()
    }
  });
};

/**
 * Send Task Reminder
 * 
 * @param userId - User ID
 * @param taskTitle - Task title
 * @param dueDate - Due date
 */
export const sendTaskReminder = async (
  userId: string,
  taskTitle: string,
  dueDate: Date
): Promise<void> => {
  const now = new Date();
  const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  let type: NotificationType;
  let body: string;
  
  if (hoursUntilDue <= 24) {
    type = NotificationType.TASK_DUE_TODAY;
    body = `🔔 Task due today: ${taskTitle}`;
  } else {
    type = NotificationType.TASK_REMINDER;
    const days = Math.ceil(hoursUntilDue / 24);
    body = `🔔 Reminder: ${taskTitle} - Due in ${days} days`;
  }
  
  await sendNotificationToUser(userId, {
    type,
    title: 'Task Reminder',
    body,
    data: {
      taskTitle,
      dueDate: dueDate.toISOString()
    }
  });
};

/**
 * Send Savings Milestone
 * 
 * @param userId - User ID
 * @param goalTitle - Goal title
 * @param percentage - Progress percentage
 */
export const sendSavingsMilestone = async (
  userId: string,
  goalTitle: string,
  percentage: number
): Promise<void> => {
  let type: NotificationType;
  let title: string;
  let emoji: string;
  
  if (percentage >= 100) {
    type = NotificationType.SAVINGS_COMPLETED;
    title = 'Goal Completed!';
    emoji = '🎉';
  } else {
    type = NotificationType.SAVINGS_MILESTONE;
    title = 'Savings Milestone';
    emoji = '🎯';
  }
  
  await sendNotificationToUser(userId, {
    type,
    title,
    body: `${emoji} ${goalTitle}: ${percentage.toFixed(0)}% achieved!`,
    data: {
      goalTitle,
      percentage: percentage.toString()
    }
  });
};

/**
 * Send Chat Message Notification
 * 
 * @param userId - Receiver user ID
 * @param senderName - Sender name
 * @param message - Message preview
 */
export const sendChatNotification = async (
  userId: string,
  senderName: string,
  message: string
): Promise<void> => {
  // Truncate long messages
  const preview = message.length > 50 
    ? message.substring(0, 50) + '...'
    : message;
  
  await sendNotificationToUser(userId, {
    type: NotificationType.CHAT_MESSAGE,
    title: `💬 ${senderName}`,
    body: preview,
    data: {
      senderName
    }
  });
};