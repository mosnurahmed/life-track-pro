/**
 * Main Routes Index
 */

import { Router } from 'express';
import authRoutes from '../features/auth/auth.routes';
import categoryRoutes from '../features/category/category.routes';
import expenseRoutes from '../features/expense/expense.routes';

const router = Router();

// Auth routes
router.use('/auth', authRoutes);

// Category routes
router.use('/categories', categoryRoutes);

// Expense routes
router.use('/expenses', expenseRoutes);

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