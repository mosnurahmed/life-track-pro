/**
 * Authentication Routes
 * 
 * Purpose: Define API endpoints for authentication
 * Maps URLs to controllers with middleware
 */

import { Router } from 'express';
import * as authController from './auth.controller';
import { validate } from '../../shared/middlewares/validate.middleware';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  deviceTokenSchema
} from './auth.validator';

const router = Router();

/**
 * Public Routes (No authentication required)
 */

// Register new user
router.post(
  '/register',
  validate(registerSchema),  // Validate input
  authController.register    // Handle request
);

// Login user
router.post(
  '/login',
  validate(loginSchema),
  authController.login
);

// Refresh access token
router.post(
  '/refresh',
  authController.refreshToken
);

/**
 * Protected Routes (Authentication required)
 * All routes below require valid JWT token
 */

// Get user profile
router.get(
  '/profile',
  authMiddleware,  // Verify token first
  authController.getProfile
);

// Update user profile
router.put(
  '/profile',
  authMiddleware,
  validate(updateProfileSchema),
  authController.updateProfile
);

// Logout user
router.post(
  '/logout',
  authMiddleware,
  authController.logout
);

// Add device token for push notifications
router.post(
  '/device-token',
  authMiddleware,
  validate(deviceTokenSchema),
  authController.addDeviceToken
);

// Remove device token
router.delete(
  '/device-token',
  authMiddleware,
  validate(deviceTokenSchema),
  authController.removeDeviceToken
);

export default router;