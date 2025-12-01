/**
 * Expense Routes
 */

import { Router } from 'express';
import * as expenseController from './expense.controller';
import { validate } from '../../shared/middlewares/validate.middleware';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';
import {
  createExpenseSchema,
  updateExpenseSchema,
  expenseQuerySchema
} from './expense.validator';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * Statistics routes (before /:id)
 */
router.get('/stats', expenseController.getExpenseStats);
router.get('/daily', expenseController.getDailyExpenses);

/**
 * CRUD routes
 */
router.post(
  '/',
  validate(createExpenseSchema),
  expenseController.createExpense
);

router.get(
  '/',
  validate(expenseQuerySchema),
  expenseController.getExpenses
);

router.get(
  '/:id',
  expenseController.getExpenseById
);

router.put(
  '/:id',
  validate(updateExpenseSchema),
  expenseController.updateExpense
);

router.delete(
  '/:id',
  expenseController.deleteExpense
);

export default router;