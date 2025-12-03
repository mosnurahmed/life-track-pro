/**
 * Bazar (Shopping List) Model
 * 
 * Purpose: Manage shopping lists with items and budget tracking
 * 
 * Features:
 * 1. Shopping lists with multiple items
 * 2. Item categories
 * 3. Price & quantity tracking
 * 4. Completion status
 * 5. Budget tracking
 * 6. Statistics
 */

import mongoose, { Document, Schema } from 'mongoose';

/**
 * Shopping Item Interface
 */
export interface IShoppingItem {
  _id: mongoose.Types.ObjectId;
  name: string;
  category?: string;
  quantity: number;
  unit: string;
  estimatedPrice?: number;
  actualPrice?: number;
  isPurchased: boolean;
  purchasedAt?: Date;
  notes?: string;
}

/**
 * Shopping List Interface
 */
export interface IBazar extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  items: IShoppingItem[];
  totalBudget?: number;
  isCompleted: boolean;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual properties
  totalItems: number;
  completedItems: number;
  completionPercentage: number;
  totalEstimatedCost: number;
  totalActualCost: number;
  budgetRemaining: number;
}

/**
 * Shopping Item Schema (Embedded)
 */
const ShoppingItemSchema = new Schema<IShoppingItem>(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      maxlength: [100, 'Item name cannot exceed 100 characters']
    },
    
    category: {
      type: String,
      trim: true,
      default: 'Other'
    },
    
    quantity: {
      type: Number,
      required: true,
      min: [0.01, 'Quantity must be greater than 0'],
      default: 1
    },
    
    unit: {
      type: String,
      required: true,
      default: 'pcs',
      trim: true
    },
    
    estimatedPrice: {
      type: Number,
      min: [0, 'Price cannot be negative']
    },
    
    actualPrice: {
      type: Number,
      min: [0, 'Price cannot be negative']
    },
    
    isPurchased: {
      type: Boolean,
      default: false
    },
    
    purchasedAt: {
      type: Date,
      default: null
    },
    
    notes: {
      type: String,
      trim: true,
      maxlength: [200, 'Notes cannot exceed 200 characters']
    }
  },
  {
    _id: true
  }
);

/**
 * Shopping List Schema
 */
const BazarSchema = new Schema<IBazar>(
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
    
    items: {
      type: [ShoppingItemSchema],
      default: []
    },
    
    totalBudget: {
      type: Number,
      min: [0, 'Budget cannot be negative']
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
 * Virtual: Total Items Count
 */
BazarSchema.virtual('totalItems').get(function() {
  return this.items.length;
});

/**
 * Virtual: Completed Items Count
 */
BazarSchema.virtual('completedItems').get(function() {
  return this.items.filter(item => item.isPurchased).length;
});

/**
 * Virtual: Completion Percentage
 */
BazarSchema.virtual('completionPercentage').get(function() {
  if (this.items.length === 0) return 0;
  return Math.round((this.completedItems / this.totalItems) * 100);
});

/**
 * Virtual: Total Estimated Cost
 */
BazarSchema.virtual('totalEstimatedCost').get(function() {
  return this.items.reduce((sum, item) => {
    return sum + ((item.estimatedPrice || 0) * item.quantity);
  }, 0);
});

/**
 * Virtual: Total Actual Cost (only purchased items)
 */
BazarSchema.virtual('totalActualCost').get(function() {
  return this.items
    .filter(item => item.isPurchased)
    .reduce((sum, item) => {
      return sum + ((item.actualPrice || 0) * item.quantity);
    }, 0);
});

/**
 * Virtual: Budget Remaining
 */
BazarSchema.virtual('budgetRemaining').get(function() {
  if (!this.totalBudget) return 0;
  return this.totalBudget - this.totalActualCost;
});

/**
 * Pre-save Hook
 * 
 * Purpose: Auto-complete list when all items purchased
 */
BazarSchema.pre('save', function() {
  // Check if all items are purchased
  if (this.items.length > 0) {
    const allPurchased = this.items.every(item => item.isPurchased);
    
    if (allPurchased && !this.isCompleted) {
      this.isCompleted = true;
      this.completedAt = new Date();
    } else if (!allPurchased && this.isCompleted) {
      this.isCompleted = false;
      this.completedAt = null;
    }
  }
  
  // Update purchasedAt for items
  this.items.forEach(item => {
    if (item.isPurchased && !item.purchasedAt) {
      item.purchasedAt = new Date();
    } else if (!item.isPurchased) {
      item.purchasedAt = undefined;
    }
  });
});

/**
 * Indexes
 */
BazarSchema.index({ userId: 1, isCompleted: 1 });
BazarSchema.index({ userId: 1, createdAt: -1 });

const Bazar = mongoose.model<IBazar>('Bazar', BazarSchema);

export default Bazar;
