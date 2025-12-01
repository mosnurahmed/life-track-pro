/**
 * Expense Service
 * 
 * Purpose: Business logic for expense management
 * 
 * Advanced Features:
 * 1. Pagination with filtering
 * 2. Complex queries (date range, amount range, etc.)
 * 3. Statistics & analytics
 * 4. Budget tracking
 */

import Expense, { IExpense } from './expense.model';
import Category from '../category/category.model';
import { NotFoundError, BadRequestError } from '../../shared/utils/error.util';
import mongoose from 'mongoose';
import { PaginatedResponse } from '../../shared/types/common.types';

/**
 * Create Expense DTO
 */
export interface CreateExpenseDTO {
  categoryId: string;
  amount: number;
  description?: string;
  date?: Date;
  paymentMethod?: string;
  tags?: string[];
  receiptImage?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  isRecurring?: boolean;
  recurringConfig?: {
    interval: 'daily' | 'weekly' | 'monthly' | 'yearly';
    endDate?: Date;
  };
}

/**
 * Update Expense DTO
 */
export interface UpdateExpenseDTO extends Partial<CreateExpenseDTO> {}

/**
 * Expense Query Filters
 */
export interface ExpenseFilters {
  page?: number;
  limit?: number;
  categoryId?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  paymentMethod?: string;
  tags?: string;
  sortBy?: 'date' | 'amount' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Create Expense
 * 
 * @param userId - User ID
 * @param data - Expense data
 * @returns Created expense with populated category
 */
export const createExpense = async (
  userId: string,
  data: CreateExpenseDTO
): Promise<IExpense> => {
  // Verify category exists and belongs to user
  const category = await Category.findOne({
    _id: new mongoose.Types.ObjectId(data.categoryId),
    userId: new mongoose.Types.ObjectId(userId)
  });
  
  if (!category) {
    throw new NotFoundError('Category not found');
  }
  
  // Create expense
  const expense = await Expense.create({
    ...data,
    userId: new mongoose.Types.ObjectId(userId),
    categoryId: new mongoose.Types.ObjectId(data.categoryId),
    date: data.date || new Date()
  });
  
  // Populate category details
  await expense.populate('category');
  
  return expense;
};

/**
 * Get Expenses with Filters & Pagination
 * 
 * This is the most complex function - handles:
 * 1. Multiple filters
 * 2. Pagination
 * 3. Sorting
 * 4. Category population
 * 
 * @param userId - User ID
 * @param filters - Query filters
 * @returns Paginated expenses
 */
export const getExpenses = async (
  userId: string,
  filters: ExpenseFilters
): Promise<PaginatedResponse<IExpense>> => {
  const {
    page = 1,
    limit = 20,
    categoryId,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    paymentMethod,
    tags,
    sortBy = 'date',
    sortOrder = 'desc'
  } = filters;
  
  // Build query object
  const query: any = {
    userId: new mongoose.Types.ObjectId(userId)
  };
  
  // Category filter
  if (categoryId) {
    query.categoryId = new mongoose.Types.ObjectId(categoryId);
  }
  
  // Date range filter
  if (startDate || endDate) {
    query.date = {};
    if (startDate) {
      query.date.$gte = new Date(startDate);
    }
    if (endDate) {
      query.date.$lte = new Date(endDate);
    }
  }
  
  // Amount range filter
  if (minAmount !== undefined || maxAmount !== undefined) {
    query.amount = {};
    if (minAmount !== undefined) {
      query.amount.$gte = minAmount;
    }
    if (maxAmount !== undefined) {
      query.amount.$lte = maxAmount;
    }
  }
  
  // Payment method filter
  if (paymentMethod) {
    query.paymentMethod = paymentMethod;
  }
  
  // Tags filter (match any of provided tags)
  if (tags) {
    const tagArray = tags.split(',').map(t => t.trim());
    query.tags = { $in: tagArray };
  }
  
  // Calculate pagination
  const skip = (page - 1) * limit;
  
  // Sort order
  const sort: any = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
  
  // Execute queries in parallel for performance
  const [expenses, total] = await Promise.all([
    Expense.find(query)
      .populate('category')  // Get category details
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),  // Convert to plain JavaScript object (faster)
    
    Expense.countDocuments(query)  // Total count for pagination
  ]);
  
  // Calculate pagination info
  const totalPages = Math.ceil(total / limit);
  
  return {
    data: expenses as IExpense[],
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
 * Get Single Expense
 * 
 * @param userId - User ID
 * @param expenseId - Expense ID
 * @returns Expense with populated category
 */
export const getExpenseById = async (
  userId: string,
  expenseId: string
): Promise<IExpense> => {
  const expense = await Expense.findOne({
    _id: new mongoose.Types.ObjectId(expenseId),
    userId: new mongoose.Types.ObjectId(userId)
  }).populate('category');
  
  if (!expense) {
    throw new NotFoundError('Expense not found');
  }
  
  return expense;
};

/**
 * Update Expense
 * 
 * @param userId - User ID
 * @param expenseId - Expense ID
 * @param data - Update data
 * @returns Updated expense
 */
export const updateExpense = async (
  userId: string,
  expenseId: string,
  data: UpdateExpenseDTO
): Promise<IExpense> => {
  // Find expense
  const expense = await Expense.findOne({
    _id: new mongoose.Types.ObjectId(expenseId),
    userId: new mongoose.Types.ObjectId(userId)
  });
  
  if (!expense) {
    throw new NotFoundError('Expense not found');
  }
  
  // If category is being changed, verify it belongs to user
  if (data.categoryId && data.categoryId !== expense.categoryId.toString()) {
    const category = await Category.findOne({
      _id: new mongoose.Types.ObjectId(data.categoryId),
      userId: new mongoose.Types.ObjectId(userId)
    });
    
    if (!category) {
      throw new NotFoundError('Category not found');
    }
  }
  
  // Update fields
  Object.assign(expense, data);
  
  await expense.save();
  await expense.populate('category');
  
  return expense;
};

/**
 * Delete Expense
 * 
 * @param userId - User ID
 * @param expenseId - Expense ID
 */
export const deleteExpense = async (
  userId: string,
  expenseId: string
): Promise<void> => {
  const expense = await Expense.findOne({
    _id: new mongoose.Types.ObjectId(expenseId),
    userId: new mongoose.Types.ObjectId(userId)
  });
  
  if (!expense) {
    throw new NotFoundError('Expense not found');
  }
  
  await expense.deleteOne();
};

/**
 * Get Expense Statistics
 * 
 * Purpose: Analytics for dashboard
 * Uses MongoDB Aggregation Pipeline
 * 
 * Returns:
 * - Total expenses (this month, last month, all time)
 * - Category-wise breakdown
 * - Daily average
 * - Spending trends
 * 
 * @param userId - User ID
 * @returns Statistics object
 */
export const getExpenseStats = async (userId: string) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  
  // Aggregation pipeline for statistics
  const stats = await Expense.aggregate([
    {
      // Match user's expenses
      $match: {
        userId: new mongoose.Types.ObjectId(userId)
      }
    },
    {
      // Group and calculate
      $facet: {
        // This month total
        thisMonth: [
          {
            $match: {
              date: { $gte: startOfMonth }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          }
        ],
        
        // Last month total
        lastMonth: [
          {
            $match: {
              date: {
                $gte: startOfLastMonth,
                $lte: endOfLastMonth
              }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          }
        ],
        
        // Category breakdown (this month)
        categoryBreakdown: [
          {
            $match: {
              date: { $gte: startOfMonth }
            }
          },
          {
            $group: {
              _id: '$categoryId',
              total: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          },
          {
            $lookup: {
              from: 'categories',
              localField: '_id',
              foreignField: '_id',
              as: 'category'
            }
          },
          {
            $unwind: '$category'
          },
          {
            $project: {
              categoryId: '$_id',
              categoryName: '$category.name',
              categoryIcon: '$category.icon',
              categoryColor: '$category.color',
              categoryBudget: '$category.monthlyBudget',
              total: 1,
              count: 1
            }
          },
          {
            $sort: { total: -1 }
          }
        ],
        
        // All-time total
        allTime: [
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          }
        ]
      }
    }
  ]);
  
  const result = stats[0];
  
  // Calculate percentages for category breakdown
  const thisMonthTotal = result.thisMonth[0]?.total || 0;
  const categoryBreakdown = result.categoryBreakdown.map((cat: any) => ({
    ...cat,
    percentage: thisMonthTotal > 0 ? (cat.total / thisMonthTotal) * 100 : 0,
    budgetStatus: cat.categoryBudget
      ? {
          budget: cat.categoryBudget,
          spent: cat.total,
          remaining: cat.categoryBudget - cat.total,
          percentage: (cat.total / cat.categoryBudget) * 100
        }
      : null
  }));
  
  // Calculate daily average
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  const dailyAverage = thisMonthTotal / currentDay;
  
  // Projected monthly total
  const projectedMonthlyTotal = dailyAverage * daysInMonth;
  
  return {
    thisMonth: {
      total: result.thisMonth[0]?.total || 0,
      count: result.thisMonth[0]?.count || 0,
      average: dailyAverage,
      projected: projectedMonthlyTotal
    },
    lastMonth: {
      total: result.lastMonth[0]?.total || 0,
      count: result.lastMonth[0]?.count || 0
    },
    allTime: {
      total: result.allTime[0]?.total || 0,
      count: result.allTime[0]?.count || 0
    },
    categoryBreakdown,
    comparison: {
      percentageChange: result.lastMonth[0]?.total
        ? ((thisMonthTotal - result.lastMonth[0].total) / result.lastMonth[0].total) * 100
        : 0
    }
  };
};

/**
 * Get Daily Expenses (for chart)
 * 
 * @param userId - User ID
 * @param days - Number of days (default 30)
 * @returns Daily expense data
 */
export const getDailyExpenses = async (
  userId: string,
  days: number = 30
) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const dailyExpenses = await Expense.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        date: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$date'
          }
        },
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    },
    {
      $project: {
        date: '$_id',
        total: 1,
        count: 1,
        _id: 0
      }
    }
  ]);
  
  return dailyExpenses;
};