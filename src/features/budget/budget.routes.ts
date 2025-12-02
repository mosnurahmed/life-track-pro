/**
 * Budget Routes
 */

import { Router } from 'express';
import * as budgetController from './budget.controller';
import { validate } from '../../shared/middlewares/validate.middleware';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';
import { updateBudgetSchema } from './budget.validator';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * Get budget summary (all categories)
 */
router.get(
  '/summary',
  budgetController.getBudgetSummary
);

/**
 * Get budget alerts
 */
router.get(
  '/alerts',
  budgetController.getBudgetAlerts
);

/**
 * Get single category budget status
 */
router.get(
  '/category/:categoryId',
  budgetController.getCategoryBudgetStatus
);

/**
 * Update category budget
 */
router.put(
  '/category/:categoryId',
  validate(updateBudgetSchema),
  budgetController.updateCategoryBudget
);

export default router;