/**
 * Note Routes
 */

import { Router } from 'express';
import * as noteController from './note.controller';
import { validate } from '../../shared/middlewares/validate.middleware';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';
import {
  createNoteSchema,
  updateNoteSchema
} from './note.validator';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * Get statistics (must be before /:id)
 */
router.get(
  '/stats',
  noteController.getNoteStats
);

/**
 * Get all tags (must be before /:id)
 */
router.get(
  '/tags',
  noteController.getAllTags
);

/**
 * Create note
 */
router.post(
  '/',
  validate(createNoteSchema),
  noteController.createNote
);

/**
 * Get all notes (with filters)
 */
router.get(
  '/',
  noteController.getNotes
);

/**
 * Get single note
 */
router.get(
  '/:id',
  noteController.getNoteById
);

/**
 * Update note
 */
router.put(
  '/:id',
  validate(updateNoteSchema),
  noteController.updateNote
);

/**
 * Delete note
 */
router.delete(
  '/:id',
  noteController.deleteNote
);

/**
 * Toggle pin
 */
router.patch(
  '/:id/pin',
  noteController.togglePin
);

/**
 * Toggle archive
 */
router.patch(
  '/:id/archive',
  noteController.toggleArchive
);

export default router;