/**
 * Bazar Routes
 */

import { Router } from 'express';
import * as bazarController from './bazar.controller';
import { validate } from '../../shared/middlewares/validate.middleware';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';
import {
  createBazarSchema,
  updateBazarSchema,
  addItemSchema,
  updateItemSchema
} from './bazar.validator';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * Get statistics (must be before /:id)
 */
router.get(
  '/stats',
  bazarController.getBazarStats
);

/**
 * Create shopping list
 */
router.post(
  '/',
  validate(createBazarSchema),
  bazarController.createBazar
);

/**
 * Get all shopping lists
 */
router.get(
  '/',
  bazarController.getBazars
);

/**
 * Get single shopping list
 */
router.get(
  '/:id',
  bazarController.getBazarById
);

/**
 * Update shopping list
 */
router.put(
  '/:id',
  validate(updateBazarSchema),
  bazarController.updateBazar
);

/**
 * Delete shopping list
 */
router.delete(
  '/:id',
  bazarController.deleteBazar
);

/**
 * Add item to shopping list
 */
router.post(
  '/:id/items',
  validate(addItemSchema),
  bazarController.addItem
);

/**
 * Update item
 */
router.put(
  '/:id/items/:itemId',
  validate(updateItemSchema),
  bazarController.updateItem
);

/**
 * Delete item
 */
router.delete(
  '/:id/items/:itemId',
  bazarController.deleteItem
);

/**
 * Toggle item purchase status
 */
router.patch(
  '/:id/items/:itemId/toggle',
  bazarController.toggleItemPurchase
);

export default router;