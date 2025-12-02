/**
 * Task Model
 * 
 * Purpose: Todo list with priorities, status tracking, and reminders
 * 
 * Features:
 * 1. Priority levels (urgent/high/medium/low)
 * 2. Status workflow (todo → in_progress → completed/cancelled)
 * 3. Due dates and reminders
 * 4. Subtasks (embedded)
 * 5. Recurring tasks
 * 6. Tags for organization
 */

import mongoose, { Document, Schema, Model } from 'mongoose';

/**
 * Subtask Interface
 */
export interface ISubtask {
  _id: mongoose.Types.ObjectId;
  title: string;
  completed: boolean;
  completedAt?: Date;
}

/**
 * Reminder Interface
 */
export interface IReminder {
  enabled: boolean;
  time: Date;
  sent: boolean;
}

/**
 * Repeat/Recurring Config
 */
export interface IRepeat {
  enabled: boolean;
  interval: 'daily' | 'weekly' | 'monthly';
  endDate?: Date;
}

/**
 * Task Interface
 */
export interface ITask extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  dueDate?: Date;
  completedAt?: Date | null;
  reminder?: IReminder;
  repeat?: IRepeat;
  subtasks: ISubtask[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual properties
  isOverdue: boolean;
  subtaskProgress: number;
}

/**
 * Subtask Schema (Embedded)
 */
const SubtaskSchema = new Schema<ISubtask>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, 'Subtask title cannot exceed 200 characters']
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    _id: true,
    timestamps: false
  }
);

/**
 * Task Schema
 */
const TaskSchema = new Schema<ITask>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    
    priority: {
      type: String,
      enum: ['urgent', 'high', 'medium', 'low'],
      default: 'medium',
      index: true
    },
    
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'completed', 'cancelled'],
      default: 'todo',
      index: true
    },
    
    dueDate: {
      type: Date,
      default: null,
      index: true
    },
    
    completedAt: {
      type: Date,
      default: null
    },
    
    reminder: {
      enabled: { type: Boolean, default: false },
      time: { type: Date },
      sent: { type: Boolean, default: false }
    },
    
    repeat: {
      enabled: { type: Boolean, default: false },
      interval: {
        type: String,
        enum: ['daily', 'weekly', 'monthly']
      },
      endDate: { type: Date }
    },
    
    subtasks: {
      type: [SubtaskSchema],
      default: []
    },
    
    tags: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

/**
 * Virtual: Is Overdue
 * 
 * Checks if task is past due date and not completed
 */
TaskSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate) return false;
  if (this.status === 'completed' || this.status === 'cancelled') return false;
  
  return new Date() > this.dueDate;
});

/**
 * Virtual: Subtask Progress
 * 
 * Percentage of completed subtasks
 */
TaskSchema.virtual('subtaskProgress').get(function() {
  if (this.subtasks.length === 0) return 0;
  
  const completedCount = this.subtasks.filter(s => s.completed).length;
  return Math.round((completedCount / this.subtasks.length) * 100);
});

/**
 * Pre-save Hook
 * 
 * Purpose: 
 * 1. Auto-set completedAt when status changes to completed
 * 2. Auto-update subtask completedAt
 */
TaskSchema.pre('save', function() {
  // Set completedAt when task completed
  if (this.isModified('status')) {
    if (this.status === 'completed' && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status !== 'completed') {
      this.completedAt = null;
    }
  }
  
  // Update subtask completedAt
  if (this.isModified('subtasks')) {
    this.subtasks.forEach(subtask => {
      if (subtask.completed && !subtask.completedAt) {
        subtask.completedAt = new Date();
      } else if (!subtask.completed) {
        subtask.completedAt = undefined;
      }
    });
  }
});

/**
 * Indexes for Performance
 */
TaskSchema.index({ userId: 1, status: 1, priority: 1 });
TaskSchema.index({ userId: 1, dueDate: 1 });
TaskSchema.index({ userId: 1, createdAt: -1 });
TaskSchema.index({ userId: 1, tags: 1 });

const Task = mongoose.model<ITask>('Task', TaskSchema);

export default Task;
