/**
 * Expense Model
 * 
 * Purpose: Track individual expenses
 * 
 * Advanced Features:
 * 1. Category reference (populate support)
 * 2. Recurring expenses
 * 3. Receipt image storage
 * 4. Location tracking (optional)
 * 5. Tags for better organization
 */

import mongoose, { Document, Schema, Model } from 'mongoose';

/**
 * Expense Interface
 */
export interface IExpense extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  amount: number;
  description?: string;
  date: Date;
  paymentMethod?: string;
  tags: string[];
  receiptImage?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  isRecurring: boolean;
  recurringConfig?: {
    interval: 'daily' | 'weekly' | 'monthly' | 'yearly';
    endDate?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Expense Schema
 */
const ExpenseSchema = new Schema<IExpense>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
      index: true
    },
    
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
      max: [10000000, 'Amount too large']
    },
    
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters']
    },
    
    date: {
      type: Date,
      required: true,
      default: Date.now,
      index: true
    },
    
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'mobile_banking', 'bank_transfer', 'other'],
      default: 'cash'
    },
    
    tags: {
      type: [String],
      default: []
    },
    
    receiptImage: {
      type: String,
      default: null
    },
    
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
      address: { type: String }
    },
    
    isRecurring: {
      type: Boolean,
      default: false
    },
    
    recurringConfig: {
      interval: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'yearly']
      },
      endDate: { type: Date }
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,  // Include virtual properties
      transform: function(_doc, ret) {
        const result = ret as any;
        delete result.__v;
        return result;
      }
    },
    toObject: { virtuals: true }
  }
);

/**
 * Indexes for Performance
 * 
 * Why multiple indexes?
 * - userId + date: Get user's expenses in date range (most common query)
 * - userId + categoryId: Get all expenses for a category
 * - userId + date (descending): Latest expenses first
 */
ExpenseSchema.index({ userId: 1, date: -1 });
ExpenseSchema.index({ userId: 1, categoryId: 1 });
ExpenseSchema.index({ userId: 1, createdAt: -1 });

/**
 * Virtual: category
 * 
 * Purpose: Auto-populate category details
 * Instead of just categoryId, get full category object
 */
ExpenseSchema.virtual('category', {
  ref: 'Category',
  localField: 'categoryId',
  foreignField: '_id',
  justOne: true  // One-to-one relationship
});

/**
 * Pre-save Hook
 * 
 * Purpose: Validate category belongs to user
 * Security: User can't assign expense to another user's category
 */
ExpenseSchema.pre('save', async function() {
  if (this.isNew || this.isModified('categoryId')) {
    const Category = mongoose.model('Category');
    
    const category = await Category.findOne({
      _id: this.categoryId,
      userId: this.userId
    });
    
    if (!category) {
      throw new Error('Invalid category or category does not belong to user');
    }
  }
  

});

const Expense = mongoose.model<IExpense>('Expense', ExpenseSchema);

export default Expense;
