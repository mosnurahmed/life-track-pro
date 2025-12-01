/**
 * Category Routes
 * 
 * Purpose: Define API endpoints for categories
 */

import { Router } from 'express';
import * as categoryController from './category.controller';
import { validate } from '../../shared/middlewares/validate.middleware';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';
import {
  createCategorySchema,
  updateCategorySchema
} from './category.validator';

const router = Router();

/**
 * All category routes require authentication
 */
router.use(authMiddleware);

/**
 * Create category
 */
router.post(
  '/',
  validate(createCategorySchema),
  categoryController.createCategory
);

/**
 * Get all categories
 */
router.get(
  '/',
  categoryController.getCategories
);

/**
 * Reorder categories
 * Note: This must be before /:id route
 */
router.put(
  '/reorder',
  categoryController.reorderCategories
);

/**
 * Get single category
 */
router.get(
  '/:id',
  categoryController.getCategoryById
);

/**
 * Update category
 */
router.put(
  '/:id',
  validate(updateCategorySchema),
  categoryController.updateCategory
);

/**
 * Delete category
 */
/**
 * Check if category can be deleted
 */
router.get(
  '/:id/delete-check',
  categoryController.checkCategoryDeletion
);

/**
 * Delete category
 */
router.delete(
  '/:id',
  categoryController.deleteCategory
);
export default router;