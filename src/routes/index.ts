/**
 * Main Routes Index
 */

import { Router } from 'express';
import authRoutes from '../features/auth/auth.routes';
import categoryRoutes from '../features/category/category.routes';
import expenseRoutes from '../features/expense/expense.routes';
import budgetRoutes from '../features/budget/budget.routes';
import savingsRoutes from '../features/savings/savings.routes';
import taskRoutes from '../features/task/task.routes';
import noteRoutes from '../features/note/note.routes';
import chatRoutes from '../features/chat/chat.routes';
import bazarRoutes from '../features/bazar/bazar.routes';
import dashboardRoutes from '../features/dashboard/dashboard.routes';


const router = Router();

// Auth routes
router.use('/auth', authRoutes);

// Category routes
router.use('/categories', categoryRoutes);

// Expense routes
router.use('/expenses', expenseRoutes);

// Budget routes
router.use('/budget', budgetRoutes);

// Savings routes
router.use('/savings', savingsRoutes);

// Tasks routes
router.use('/tasks', taskRoutes);

// Notes routes
router.use('/notes', noteRoutes);

// Chat routes
router.use('/chat', chatRoutes);

// Bazar routes
router.use('/bazar', bazarRoutes);

// Dashboard routes
router.use('/dashboard', dashboardRoutes);


// API info
router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'LifeTrack Pro API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      categories: '/api/categories',
      expenses: '/api/expenses',
      health: '/health'
    }
  });
});

export default router;