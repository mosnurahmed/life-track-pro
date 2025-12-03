/**
 * Task Reminder Scheduler
 * 
 * Purpose: Check for upcoming tasks and send reminders
 */

import Task from './task.model';
import { sendTaskReminder } from '../notification/notification.service';

/**
 * Check and Send Task Reminders
 * 
 * Runs every hour to check for tasks with reminders
 */
export const checkTaskReminders = async (): Promise<void> => {
  try {
    const now = new Date();
    
    // Find tasks with reminders due now
    const tasks = await Task.find({
      'reminder.enabled': true,
      'reminder.sent': false,
      'reminder.time': { $lte: now },
      status: { $in: ['todo', 'in_progress'] }
    }).populate('userId', 'deviceTokens');
    
    console.log(`📋 Found ${tasks.length} task(s) with due reminders`);
    
    for (const task of tasks) {
      if (task.userId && task.dueDate) {
        await sendTaskReminder(
          task.userId.toString(),
          task.title,
          task.dueDate
        );
        
        // Mark reminder as sent
        task.reminder!.sent = true;
        await task.save();
        
        console.log(`✅ Reminder sent for task: ${task.title}`);
      }
    }
  } catch (error) {
    console.error('❌ Task reminder check error:', error);
  }
};

/**
 * Start Task Reminder Scheduler
 * 
 * Checks every hour
 */
export const startTaskReminderScheduler = (): void => {
  console.log('⏰ Task reminder scheduler started');
  
  // Run immediately on start
  checkTaskReminders();
  
  // Then run every hour
  setInterval(() => {
    checkTaskReminders();
  }, 60 * 60 * 1000);  // 1 hour
};