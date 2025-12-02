/**
 * Savings Goal Model
 * 
 * Purpose: Track savings goals with contributions
 * 
 * Features:
 * 1. Target amount tracking
 * 2. Contribution history (embedded)
 * 3. Progress calculation
 * 4. Target date (optional)
 * 5. Priority levels
 * 6. Completion status
 */

import mongoose, { Document, Schema, Model } from 'mongoose';

/**
 * Contribution Interface
 * 
 * Individual contribution to savings goal
 */
export interface IContribution {
  amount: number;
  date: Date;
  note?: string;
}

/**
 * Savings Goal Interface
 */
export interface ISavingsGoal extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: Date;
  icon: string;
  color: string;
  priority: 'high' | 'medium' | 'low';
  contributions: IContribution[];
  isCompleted: boolean;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual properties (calculated)
  progress: number;          // Percentage
  remainingAmount: number;   // Target - Current
}

/**
 * Contribution Schema (Embedded)
 */
const ContributionSchema = new Schema<IContribution>(
  {
    amount: {
      type: Number,
      required: true,
      min: [0.01, 'Contribution must be greater than 0']
    },
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    note: {
      type: String,
      trim: true,
      maxlength: [200, 'Note cannot exceed 200 characters']
    }
  },
  {
    _id: true  // Give each contribution its own ID
  }
);

/**
 * Savings Goal Schema
 */
const SavingsGoalSchema = new Schema<ISavingsGoal>(
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
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    
    targetAmount: {
      type: Number,
      required: [true, 'Target amount is required'],
      min: [1, 'Target amount must be at least 1'],
      max: [1000000000, 'Target amount too large']
    },
    
    currentAmount: {
      type: Number,
      default: 0,
      min: [0, 'Current amount cannot be negative']
    },
    
    targetDate: {
      type: Date,
      default: null
    },
    
    icon: {
      type: String,
      required: [true, 'Icon is required'],
      default: 'savings'
    },
    
    color: {
      type: String,
      required: [true, 'Color is required'],
      match: [/^#[0-9A-F]{6}$/i, 'Please provide valid hex color'],
      default: '#2ECC71'
    },
    
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium'
    },
    
    contributions: {
      type: [ContributionSchema],
      default: []
    },
    
    isCompleted: {
      type: Boolean,
      default: false
    },
    
    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

/**
 * Virtual: Progress Percentage
 * 
 * Calculates how much of the goal is achieved
 */
SavingsGoalSchema.virtual('progress').get(function() {
  if (this.targetAmount === 0) return 0;
  const progress = (this.currentAmount / this.targetAmount) * 100;
  return Math.min(Math.round(progress * 100) / 100, 100);  // Cap at 100%
});

/**
 * Virtual: Remaining Amount
 * 
 * How much more needed to reach goal
 */
SavingsGoalSchema.virtual('remainingAmount').get(function() {
  return Math.max(this.targetAmount - this.currentAmount, 0);
});

/**
 * Pre-save Hook
 * 
 * Purpose: Auto-complete goal when target reached
 */
SavingsGoalSchema.pre('save', function() {
  // Check if goal is reached
  if (this.currentAmount >= this.targetAmount && !this.isCompleted) {
    this.isCompleted = true;
    this.completedAt = new Date();
  }
  
  // If goal was completed but amount reduced, mark incomplete
  if (this.currentAmount < this.targetAmount && this.isCompleted) {
    this.isCompleted = false;
    this.completedAt = null;
  }
});

/**
 * Indexes
 */
SavingsGoalSchema.index({ userId: 1, isCompleted: 1 });
SavingsGoalSchema.index({ userId: 1, priority: 1 });
SavingsGoalSchema.index({ userId: 1, createdAt: -1 });

const SavingsGoal = mongoose.model<ISavingsGoal>('SavingsGoal', SavingsGoalSchema);

export default SavingsGoal;
