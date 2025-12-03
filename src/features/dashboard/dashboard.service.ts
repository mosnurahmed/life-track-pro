/**
 * Dashboard Service
 * 
 * Purpose: Provide consolidated data for home screen
 */

import mongoose from 'mongoose';
import Expense from '../expense/expense.model';
import Category from '../category/category.model';
import Task from '../task/task.model';
import SavingsGoal from '../savings/savings.model';
import Note from '../note/note.model';
import Bazar from '../bazar/bazar.model';
import Message from '../chat/chat.model';

/**
 * Get Dashboard Data
 * 
 * Returns complete overview for home screen
 */
export const getDashboardData = async (userId: string) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  
  // Get current month range
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  
  // Get today range
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  
  // Get last 7 days range
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // ===== FINANCIAL OVERVIEW =====
  
  // Total expenses this month
  const monthlyExpenses = await Expense.aggregate([
    {
      $match: {
        userId: userObjectId,
        date: { $gte: startOfMonth, $lte: endOfMonth }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  const totalExpensesThisMonth = monthlyExpenses[0]?.total || 0;
  const expenseCountThisMonth = monthlyExpenses[0]?.count || 0;
  
  // Budget overview
  const categories = await Category.find({
    userId: userObjectId,
    monthlyBudget: { $exists: true, $ne: null }
  });
  
  let totalBudget = 0;
  let totalSpent = 0;
  
  for (const category of categories) {
    totalBudget += category.monthlyBudget || 0;
    
    const categoryExpenses = await Expense.aggregate([
      {
        $match: {
          userId: userObjectId,
          categoryId: category._id,
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    totalSpent += categoryExpenses[0]?.total || 0;
  }
  
  const budgetPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  
  // Savings overview
  const savingsGoals = await SavingsGoal.find({ 
    userId: userObjectId,
    isCompleted: false 
  });
  
  const totalSavingsTarget = savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalSavingsCurrent = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
  const savingsProgress = totalSavingsTarget > 0 
    ? (totalSavingsCurrent / totalSavingsTarget) * 100 
    : 0;
  
  // Top spending categories (this month)
  const topCategories = await Expense.aggregate([
    {
      $match: {
        userId: userObjectId,
        date: { $gte: startOfMonth, $lte: endOfMonth }
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
      $sort: { total: -1 }
    },
    {
      $limit: 5
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
        categoryColor: '$category.color',
        categoryIcon: '$category.icon',
        totalSpent: '$total',
        transactionCount: '$count'
      }
    }
  ]);
  
  // ===== TASKS OVERVIEW =====
  
  // Tasks due today
  const tasksDueToday = await Task.countDocuments({
    userId: userObjectId,
    dueDate: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['todo', 'in_progress'] }
  });
  
  // Overdue tasks
  const overdueTasks = await Task.countDocuments({
    userId: userObjectId,
    dueDate: { $lt: startOfDay },
    status: { $in: ['todo', 'in_progress'] }
  });
  
  // Completed this week
  const completedThisWeek = await Task.countDocuments({
    userId: userObjectId,
    status: 'completed',
    completedAt: { $gte: last7Days }
  });
  
  // Total active tasks
  const activeTasks = await Task.countDocuments({
    userId: userObjectId,
    status: { $in: ['todo', 'in_progress'] }
  });
  
  // ===== RECENT ACTIVITY =====
  
  // Recent expenses (last 5)
  const recentExpenses = await Expense.find({
    userId: userObjectId
  })
    .populate('categoryId', 'name color icon')
    .sort({ date: -1 })
    .limit(5)
    .lean();
  
  // Recent savings contributions (last 5)
  const recentSavings = await SavingsGoal.aggregate([
    {
      $match: { userId: userObjectId }
    },
    {
      $unwind: '$contributions'
    },
    {
      $sort: { 'contributions.date': -1 }
    },
    {
      $limit: 5
    },
    {
      $project: {
        goalTitle: '$title',
        amount: '$contributions.amount',
        date: '$contributions.date',
        note: '$contributions.note'
      }
    }
  ]);
  
  // Recent tasks (last 5 active)
  const recentTasks = await Task.find({
    userId: userObjectId,
    status: { $in: ['todo', 'in_progress'] }
  })
    .sort({ dueDate: 1 })
    .limit(5)
    .lean();
  
  // ===== QUICK STATS =====
  
  // Unread messages
  const unreadMessages = await Message.countDocuments({
    receiverId: userObjectId,
    isRead: false
  });
  
  // Active shopping lists
  const activeShoppingLists = await Bazar.countDocuments({
    userId: userObjectId,
    isCompleted: false
  });
  
  // Total notes
  const totalNotes = await Note.countDocuments({
    userId: userObjectId,
    isArchived: false
  });
  
  // ===== EXPENSE TRENDS (Last 7 days) =====
  
  const expenseTrends = await Expense.aggregate([
    {
      $match: {
        userId: userObjectId,
        date: { $gte: last7Days }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$date' }
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
        amount: '$total',
        count: '$count',
        _id: 0
      }
    }
  ]);
  
  // Fill missing dates with 0
  const trendMap = new Map(expenseTrends.map(t => [t.date, t]));
  const completeTrends = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    
    completeTrends.push(
      trendMap.get(dateStr) || { date: dateStr, amount: 0, count: 0 }
    );
  }
  
  // ===== CATEGORY-WISE SPENDING (This month) =====
  
  const categorySpending = await Expense.aggregate([
    {
      $match: {
        userId: userObjectId,
        date: { $gte: startOfMonth, $lte: endOfMonth }
      }
    },
    {
      $group: {
        _id: '$categoryId',
        total: { $sum: '$amount' }
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
        categoryName: '$category.name',
        categoryColor: '$category.color',
        amount: '$total',
        percentage: {
          $multiply: [
            { $divide: ['$total', totalExpensesThisMonth || 1] },
            100
          ]
        }
      }
    },
    {
      $sort: { amount: -1 }
    }
  ]);
  
  // ===== ASSEMBLE RESPONSE =====
  
  return {
    // Financial Overview
    financial: {
      totalExpensesThisMonth,
      expenseCountThisMonth,
      totalBudget,
      totalSpent,
      budgetRemaining: totalBudget - totalSpent,
      budgetPercentage: Math.round(budgetPercentage * 100) / 100,
      budgetStatus: budgetPercentage >= 100 ? 'exceeded' : 
                    budgetPercentage >= 80 ? 'warning' : 'safe',
      savings: {
        totalTarget: totalSavingsTarget,
        totalCurrent: totalSavingsCurrent,
        progress: Math.round(savingsProgress * 100) / 100,
        activeGoals: savingsGoals.length
      },
      topCategories
    },
    
    // Tasks Overview
    tasks: {
      dueToday: tasksDueToday,
      overdue: overdueTasks,
      completedThisWeek,
      active: activeTasks
    },
    
    // Recent Activity
    recentActivity: {
      expenses: recentExpenses,
      savings: recentSavings,
      tasks: recentTasks
    },
    
    // Quick Stats
    quickStats: {
      unreadMessages,
      activeShoppingLists,
      totalNotes
    },
    
    // Charts Data
    charts: {
      expenseTrends: completeTrends,
      categorySpending
    }
  };
};

/**
 * Get Financial Summary (Quick version for widgets)
 */
export const getFinancialSummary = async (userId: string) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  
  // This month expenses
  const thisMonthExpenses = await Expense.aggregate([
    {
      $match: {
        userId: userObjectId,
        date: { $gte: startOfMonth, $lte: endOfMonth }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);
  
  // Last month expenses
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  
  const lastMonthExpenses = await Expense.aggregate([
    {
      $match: {
        userId: userObjectId,
        date: { $gte: startOfLastMonth, $lte: endOfLastMonth }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);
  
  const thisMonth = thisMonthExpenses[0]?.total || 0;
  const lastMonth = lastMonthExpenses[0]?.total || 0;
  
  const change = lastMonth > 0 
    ? ((thisMonth - lastMonth) / lastMonth) * 100 
    : 0;
  
  return {
    thisMonth,
    lastMonth,
    change: Math.round(change * 100) / 100,
    changeType: change > 0 ? 'increase' : change < 0 ? 'decrease' : 'same'
  };
};