/**
 * Savings Goal Validators
 */

import Joi from 'joi';

/**
 * Create Savings Goal Schema
 */
export const createSavingsGoalSchema = Joi.object({
  title: Joi.string()
    .min(2)
    .max(100)
    .required()
    .trim()
    .messages({
      'string.min': 'Title must be at least 2 characters',
      'string.max': 'Title cannot exceed 100 characters',
      'any.required': 'Title is required'
    }),
  
  description: Joi.string()
    .max(500)
    .trim()
    .optional()
    .allow('')
    .messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),
  
  targetAmount: Joi.number()
    .min(1)
    .max(1000000000)
    .required()
    .messages({
      'number.min': 'Target amount must be at least 1',
      'number.max': 'Target amount too large',
      'any.required': 'Target amount is required'
    }),
  
  targetDate: Joi.date()
    .min('now')
    .optional()
    .allow(null)
    .messages({
      'date.min': 'Target date cannot be in the past'
    }),
  
  icon: Joi.string()
    .optional()
    .default('savings'),
  
  color: Joi.string()
    .pattern(/^#[0-9A-F]{6}$/i)
    .optional()
    .default('#2ECC71')
    .messages({
      'string.pattern.base': 'Please provide valid hex color'
    }),
  
  priority: Joi.string()
    .valid('high', 'medium', 'low')
    .optional()
    .default('medium')
});

/**
 * Update Savings Goal Schema
 */
export const updateSavingsGoalSchema = Joi.object({
  title: Joi.string().min(2).max(100).trim().optional(),
  description: Joi.string().max(500).trim().optional().allow(''),
  targetAmount: Joi.number().min(1).max(1000000000).optional(),
  targetDate: Joi.date().min('now').optional().allow(null),
  icon: Joi.string().optional(),
  color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional(),
  priority: Joi.string().valid('high', 'medium', 'low').optional()
}).min(1);

/**
 * Add Contribution Schema
 */
export const addContributionSchema = Joi.object({
  amount: Joi.number()
    .min(0.01)
    .required()
    .messages({
      'number.min': 'Amount must be greater than 0',
      'any.required': 'Amount is required'
    }),
  
  note: Joi.string()
    .max(200)
    .trim()
    .optional()
    .allow('')
    .messages({
      'string.max': 'Note cannot exceed 200 characters'
    })
});