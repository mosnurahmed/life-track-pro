/**
 * Authentication Input Validators
 * 
 * Purpose: Validate user input before processing
 * Uses Joi for schema validation
 * 
 * Benefits:
 * - Catches invalid data early
 * - Provides clear error messages
 * - Prevents database errors
 * - Security (prevents injection attacks)
 */

import Joi from 'joi';

/**
 * Register Validation Schema
 * 
 * Defines rules for registration data
 */
export const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .lowercase()
    .trim()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .min(6)
    .max(50)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters',
      'string.max': 'Password cannot exceed 50 characters',
      'any.required': 'Password is required'
    }),
  
  name: Joi.string()
    .min(2)
    .max(50)
    .required()
    .trim()
    .messages({
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name cannot exceed 50 characters',
      'any.required': 'Name is required'
    }),
  
  phoneNumber: Joi.string()
    .pattern(/^[0-9]{11}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Phone number must be 11 digits'
    })
});

/**
 * Login Validation Schema
 */
export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .lowercase()
    .trim()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

/**
 * Update Profile Validation Schema
 */
export const updateProfileSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(50)
    .trim()
    .optional(),
  
  phoneNumber: Joi.string()
    .pattern(/^[0-9]{11}$/)
    .allow(null, '')
    .optional(),
  
  avatar: Joi.string()
    .uri()
    .allow(null, '')
    .optional(),
  
  currency: Joi.string()
    .valid('BDT', 'USD', 'EUR', 'INR', 'GBP')
    .optional(),
  
  monthlyBudget: Joi.number()
    .min(0)
    .allow(null)
    .optional()
});

/**
 * Device Token Validation Schema
 */
export const deviceTokenSchema = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'any.required': 'Device token is required'
    })
});