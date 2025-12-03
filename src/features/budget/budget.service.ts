/**
 * Budget Service
 * 
 * Purpose: Calculate budget status and track spending
 * 
 * Key Concepts:
 * 1. Budget stored in Category model (monthlyBudget field)
 * 2. Calculate actual spending from Expenses
 * 3. Compare planned vs actual
 * 4. Generate alerts and statistics
 */

import Category from '../category/category.model';
import Expense from '../expense/expense.model';
import { NotFoundError } from '../../shared/utils/error.util';
import mongoose from 'mongoose';
import { sendBudgetAlert } from '../notification/notification.service';
/**
 * Budget Status Interface
 */
export interface BudgetStatus {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  budget: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: 'safe' | 'warning' | 'exceeded';
  color: string;
}

/**
 * Overall Budget Summary
 */
export interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  overallPercentage: number;
  categoriesWithBudget: number;
  categoriesOverBudget: number;
  categories: BudgetStatus[];
}

/**
 * Get Current Month Date Range
 * 
 * Helper function to get start and end of current month
 */
const getCurrentMonthRange = () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  
  return { startOfMonth, endOfMonth };
};

/**
 * Calculate Budget Status for Single Category
 * 
 * @param userId - User ID
 * @param categoryId - Category ID
 * @returns Budget status with spending details
 */
export const getCategoryBudgetStatus = async (
  userId: string,
  categoryId: string
): Promise<BudgetStatus> => {
  // Find category
  const category = await Category.findOne({
    _id: new mongoose.Types.ObjectId(categoryId),
    userId: new mongoose.Types.ObjectId(userId)
  });
  
  if (!category) {
    throw new NotFoundError('Category not found');
  }
  
  if (!category.monthlyBudget) {
    throw new NotFoundError('Category has no budget set');
  }
  
  // Get current month range
  const { startOfMonth, endOfMonth } = getCurrentMonthRange();
  
  // Calculate total spent this month
  const expenses = await Expense.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        categoryId: new mongoose.Types.ObjectId(categoryId),
        date: {
          $gte: startOfMonth,
          $lte: endOfMonth
        }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);
  
  const spent = expenses[0]?.total || 0;
  const budget = category.monthlyBudget;
  const remaining = budget - spent;
  const percentage = budget > 0 ? (spent / budget) * 100 : 0;
  
  // Determine status and color
  let status: 'safe' | 'warning' | 'exceeded';
  let color: string;
  
  if (percentage >= 100) {
    status = 'exceeded';
    color = '#E74C3C';  // Red
  } else if (percentage >= 80) {
    status = 'warning';
    color = '#F39C12';  // Orange
  } else {
    status = 'safe';
    color = '#27AE60';  // Green
  }
    if (percentage >= 80) {
    sendBudgetAlert(userId, category.name, percentage).catch(err => {
      console.error('Failed to send budget alert:', err);
    });
  }
  return {
    categoryId: category._id.toString(),
    categoryName: category.name,
    categoryColor: category.color,
    categoryIcon: category.icon,
    budget,
    spent,
    remaining,
    percentage: Math.round(percentage * 100) / 100,  // Round to 2 decimals
    status,
    color
  };
};

/**
 * Get Overall Budget Summary (All Categories)
 * 
 * @param userId - User ID
 * @returns Complete budget overview
 */
export const getBudgetSummary = async (
  userId: string
): Promise<BudgetSummary> => {
  // Get all categories with budget
  const categories = await Category.find({
    userId: new mongoose.Types.ObjectId(userId),
    monthlyBudget: { $ne: null, $gt: 0 }
  });
  
  if (categories.length === 0) {
    return {
      totalBudget: 0,
      totalSpent: 0,
      totalRemaining: 0,
      overallPercentage: 0,
      categoriesWithBudget: 0,
      categoriesOverBudget: 0,
      categories: []
    };
  }
  
  const { startOfMonth, endOfMonth } = getCurrentMonthRange();
  
  // Get spending for all categories in one query (efficient!)
  const categoryIds = categories.map(cat => cat._id);
  
  const spendingByCategory = await Expense.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        categoryId: { $in: categoryIds },
        date: {
          $gte: startOfMonth,
          $lte: endOfMonth
        }
      }
    },
    {
      $group: {
        _id: '$categoryId',
        total: { $sum: '$amount' }
      }
    }
  ]);
  
  // Create spending map for quick lookup
  const spendingMap = new Map();
  spendingByCategory.forEach(item => {
    spendingMap.set(item._id.toString(), item.total);
  });
  
  // Calculate status for each category
  const categoryStatuses: BudgetStatus[] = categories.map(category => {
    const spent = spendingMap.get(category._id.toString()) || 0;
    const budget = category.monthlyBudget!;
    const remaining = budget - spent;
    const percentage = budget > 0 ? (spent / budget) * 100 : 0;
    
    let status: 'safe' | 'warning' | 'exceeded';
    let color: string;
    
    if (percentage >= 100) {
      status = 'exceeded';
      color = '#E74C3C';
    } else if (percentage >= 80) {
      status = 'warning';
      color = '#F39C12';
    } else {
      status = 'safe';
      color = '#27AE60';
    }
    
    return {
      categoryId: category._id.toString(),
      categoryName: category.name,
      categoryColor: category.color,
      categoryIcon: category.icon,
      budget,
      spent,
      remaining,
      percentage: Math.round(percentage * 100) / 100,
      status,
      color
    };
  });
  
  // Calculate totals
  const totalBudget = categoryStatuses.reduce((sum, cat) => sum + cat.budget, 0);
  const totalSpent = categoryStatuses.reduce((sum, cat) => sum + cat.spent, 0);
  const totalRemaining = totalBudget - totalSpent;
  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const categoriesOverBudget = categoryStatuses.filter(cat => cat.status === 'exceeded').length;
  
  // Sort by percentage (highest first - most concerning)
  categoryStatuses.sort((a, b) => b.percentage - a.percentage);
  
  return {
    totalBudget,
    totalSpent,
    totalRemaining,
    overallPercentage: Math.round(overallPercentage * 100) / 100,
    categoriesWithBudget: categories.length,
    categoriesOverBudget,
    categories: categoryStatuses
  };
};

/**
 * Update Category Budget
 * 
 * @param userId - User ID
 * @param categoryId - Category ID
 * @param budget - New budget amount
 * @returns Updated category
 */
export const updateCategoryBudget = async (
  userId: string,
  categoryId: string,
  budget: number | null
): Promise<any> => {
  const category = await Category.findOne({
    _id: new mongoose.Types.ObjectId(categoryId),
    userId: new mongoose.Types.ObjectId(userId)
  });
  
  if (!category) {
    throw new NotFoundError('Category not found');
  }
  
  category.monthlyBudget = budget as number;
  await category.save();
  
  return category;
};

/**
 * Get Budget Alerts
 * 
 * Returns categories that are over budget or near limit
 * 
 * @param userId - User ID
 * @returns Array of budget alerts
 */
export const getBudgetAlerts = async (userId: string) => {
  const summary = await getBudgetSummary(userId);
  
  // Filter categories with warnings or exceeded
  const alerts = summary.categories.filter(
    cat => cat.status === 'warning' || cat.status === 'exceeded'
  );
  
  return alerts;
};