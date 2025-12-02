/**
 * Savings Goal Routes
 */

import { Router } from 'express';
import * as savingsController from './savings.controller';
import { validate } from '../../shared/middlewares/validate.middleware';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';
import {
  createSavingsGoalSchema,
  updateSavingsGoalSchema,
  addContributionSchema
} from './savings.validator';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * Get statistics (must be before /:id)
 */
router.get(
  '/stats',
  savingsController.getSavingsStats
);

/**
 * Create savings goal
 */
router.post(
  '/',
  validate(createSavingsGoalSchema),
  savingsController.createSavingsGoal
);

/**
 * Get all savings goals
 */
router.get(
  '/',
  savingsController.getSavingsGoals
);

/**
 * Get single savings goal
 */
router.get(
  '/:id',
  savingsController.getSavingsGoalById
);

/**
 * Update savings goal
 */
router.put(
  '/:id',
  validate(updateSavingsGoalSchema),
  savingsController.updateSavingsGoal
);

/**
 * Delete savings goal
 */
router.delete(
  '/:id',
  savingsController.deleteSavingsGoal
);

/**
 * Add contribution
 */
router.post(
  '/:id/contribute',
  validate(addContributionSchema),
  savingsController.addContribution
);

/**
 * Get contribution history
 */
router.get(
  '/:id/contributions',
  savingsController.getContributions
);

export default router;