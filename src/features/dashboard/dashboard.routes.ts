/**
 * Dashboard Routes
 */

import { Router } from 'express';
import * as dashboardController from './dashboard.controller';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * Get complete dashboard data
 */
router.get(
  '/',
  dashboardController.getDashboard
);

/**
 * Get financial summary (quick)
 */
router.get(
  '/financial-summary',
  dashboardController.getFinancialSummary
);

export default router;