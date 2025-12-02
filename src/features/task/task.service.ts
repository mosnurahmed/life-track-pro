/**
 * Task Service
 */

import Task, { ITask } from './task.model';
import { NotFoundError, BadRequestError } from '../../shared/utils/error.util';
import mongoose from 'mongoose';

/**
 * Create Task DTO
 */
export interface CreateTaskDTO {
  title: string;
  description?: string;
  priority?: 'urgent' | 'high' | 'medium' | 'low';
  status?: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  dueDate?: Date;
  reminder?: {
    enabled: boolean;
    time: Date;
  };
  repeat?: {
    enabled: boolean;
    interval: 'daily' | 'weekly' | 'monthly';
    endDate?: Date;
  };
  tags?: string[];
}

/**
 * Update Task DTO
 */
export interface UpdateTaskDTO extends Partial<CreateTaskDTO> {}

/**
 * Task Filters
 */
export interface TaskFilters {
  status?: string;
  priority?: string;
  tags?: string;
  dueDate?: string;  // 'today', 'upcoming', 'overdue'
  search?: string;
}

/**
 * Create Task
 */
export const createTask = async (
  userId: string,
  data: CreateTaskDTO
): Promise<ITask> => {
  const task = await Task.create({
    ...data,
    userId: new mongoose.Types.ObjectId(userId)
  });
  
  return task;
};

/**
 * Get Tasks with Filters
 */
export const getTasks = async (
  userId: string,
  filters: TaskFilters = {}
): Promise<ITask[]> => {
  const query: any = {
    userId: new mongoose.Types.ObjectId(userId)
  };
  
  // Status filter
  if (filters.status) {
    query.status = filters.status;
  }
  
  // Priority filter
  if (filters.priority) {
    query.priority = filters.priority;
  }
  
  // Tags filter
  if (filters.tags) {
    const tagArray = filters.tags.split(',').map(t => t.trim());
    query.tags = { $in: tagArray };
  }
  
  // Due date filter
  if (filters.dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    switch (filters.dueDate) {
      case 'today':
        query.dueDate = {
          $gte: today,
          $lt: tomorrow
        };
        break;
      
      case 'upcoming':
        query.dueDate = { $gte: today };
        query.status = { $ne: 'completed' };
        break;
      
      case 'overdue':
        query.dueDate = { $lt: today };
        query.status = { $nin: ['completed', 'cancelled'] };
        break;
    }
  }
  
  // Search filter (title or description)
  if (filters.search) {
    query.$or = [
      { title: { $regex: filters.search, $options: 'i' } },
      { description: { $regex: filters.search, $options: 'i' } }
    ];
  }
  
  // Sort: Priority (urgent first) → Due date (nearest first) → Created (newest first)
  const tasks = await Task.find(query)
    .sort({
      priority: 1,      // urgent=1, high=2, medium=3, low=4 (alphabetical)
      dueDate: 1,       // Nearest first
      createdAt: -1     // Newest first
    });
  
  return tasks;
};

/**
 * Get Single Task
 */
export const getTaskById = async (
  userId: string,
  taskId: string
): Promise<ITask> => {
  const task = await Task.findOne({
    _id: new mongoose.Types.ObjectId(taskId),
    userId: new mongoose.Types.ObjectId(userId)
  });
  
  if (!task) {
    throw new NotFoundError('Task not found');
  }
  
  return task;
};

/**
 * Update Task
 */
export const updateTask = async (
  userId: string,
  taskId: string,
  data: UpdateTaskDTO
): Promise<ITask> => {
  const task = await Task.findOne({
    _id: new mongoose.Types.ObjectId(taskId),
    userId: new mongoose.Types.ObjectId(userId)
  });
  
  if (!task) {
    throw new NotFoundError('Task not found');
  }
  
  Object.assign(task, data);
  await task.save();
  
  return task;
};

/**
 * Delete Task
 */
export const deleteTask = async (
  userId: string,
  taskId: string
): Promise<void> => {
  const task = await Task.findOne({
    _id: new mongoose.Types.ObjectId(taskId),
    userId: new mongoose.Types.ObjectId(userId)
  });
  
  if (!task) {
    throw new NotFoundError('Task not found');
  }
  
  await task.deleteOne();
};

/**
 * Update Task Status
 */
export const updateTaskStatus = async (
  userId: string,
  taskId: string,
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled'
): Promise<ITask> => {
  const task = await Task.findOne({
    _id: new mongoose.Types.ObjectId(taskId),
    userId: new mongoose.Types.ObjectId(userId)
  });
  
  if (!task) {
    throw new NotFoundError('Task not found');
  }
  
  task.status = status;
  await task.save();  // Pre-save hook handles completedAt
  
  return task;
};

/**
 * Add Subtask
 */
export const addSubtask = async (
  userId: string,
  taskId: string,
  title: string
): Promise<ITask> => {
  const task = await Task.findOne({
    _id: new mongoose.Types.ObjectId(taskId),
    userId: new mongoose.Types.ObjectId(userId)
  });
  
  if (!task) {
    throw new NotFoundError('Task not found');
  }
  
  task.subtasks.push({
    _id: new mongoose.Types.ObjectId(),
    title,
    completed: false
  });
  
  await task.save();
  
  return task;
};

/**
 * Update Subtask
 */

export const updateSubtask = async (
  userId: string,
  taskId: string,
  subtaskId: string,
  data: { title?: string; completed?: boolean }
): Promise<ITask> => {
  const task = await Task.findOne({
    _id: new mongoose.Types.ObjectId(taskId),
    userId: new mongoose.Types.ObjectId(userId)
  });
  
  if (!task) {
    throw new NotFoundError('Task not found');
  }
  
  // ✅ Find subtask (not index)
  const subtask = task.subtasks.find(
    s => s._id.toString() === subtaskId
  );
  
  if (!subtask) {
    throw new NotFoundError('Subtask not found');
  }
  
  // ✅ Update fields (not delete!)
  if (data.title !== undefined) subtask.title = data.title;
  if (data.completed !== undefined) subtask.completed = data.completed;
  
  // ✅ Save once
  await task.save();
  
  return task;
};

/**
 * Delete Subtask
 */
export const deleteSubtask = async (
  userId: string,
  taskId: string,
  subtaskId: string
): Promise<ITask> => {
  const task = await Task.findOne({
    _id: new mongoose.Types.ObjectId(taskId),
    userId: new mongoose.Types.ObjectId(userId)
  });
  
  if (!task) {
    throw new NotFoundError('Task not found');
  }
  
  // Remove subtask using Mongoose array methods
  const subtaskIndex = task.subtasks.findIndex(
    s => s._id.toString() === subtaskId
  );
  
  if (subtaskIndex === -1) {
    throw new NotFoundError('Subtask not found');
  }
  
  task.subtasks.splice(subtaskIndex, 1);
  await task.save();
  
  return task;
};

/**
 * Get Task Statistics
 */
export const getTaskStats = async (userId: string) => {
  const tasks = await Task.find({
    userId: new mongoose.Types.ObjectId(userId)
  });
  
  const now = new Date();
  
  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    cancelled: tasks.filter(t => t.status === 'cancelled').length,
    overdue: tasks.filter(t => 
      t.dueDate && 
      t.dueDate < now && 
      t.status !== 'completed' && 
      t.status !== 'cancelled'
    ).length,
    dueToday: tasks.filter(t => {
      if (!t.dueDate) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return t.dueDate >= today && t.dueDate < tomorrow;
    }).length
  };
  
  return stats;
};