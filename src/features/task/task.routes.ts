/**
 * Task Routes
 */

import { Router } from 'express';
import * as taskController from './task.controller';
import { validate } from '../../shared/middlewares/validate.middleware';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';
import {
  createTaskSchema,
  updateTaskSchema,
  addSubtaskSchema,
  updateSubtaskSchema
} from './task.validator';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * Get statistics (must be before /:id)
 */
router.get(
  '/stats',
  taskController.getTaskStats
);

/**
 * Create task
 */
router.post(
  '/',
  validate(createTaskSchema),
  taskController.createTask
);

/**
 * Get all tasks (with filters)
 */
router.get(
  '/',
  taskController.getTasks
);

/**
 * Get single task
 */
router.get(
  '/:id',
  taskController.getTaskById
);

/**
 * Update task
 */
router.put(
  '/:id',
  validate(updateTaskSchema),
  taskController.updateTask
);

/**
 * Delete task
 */
router.delete(
  '/:id',
  taskController.deleteTask
);

/**
 * Update task status
 */
router.patch(
  '/:id/status',
  taskController.updateTaskStatus
);

/**
 * Add subtask
 */
router.post(
  '/:id/subtasks',
  validate(addSubtaskSchema),
  taskController.addSubtask
);

/**
 * Update subtask
 */
router.put(
  '/:id/subtasks/:subtaskId',
  validate(updateSubtaskSchema),
  taskController.updateSubtask
);

/**
 * Delete subtask
 */
router.delete(
  '/:id/subtasks/:subtaskId',
  taskController.deleteSubtask
);

export default router;