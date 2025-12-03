/**
 * Bazar Validators
 */

import Joi from 'joi';

/**
 * Create Shopping List Schema
 */
export const createBazarSchema = Joi.object({
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
    .allow(''),
  
  totalBudget: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.min': 'Budget cannot be negative'
    })
});

/**
 * Update Shopping List Schema
 */
export const updateBazarSchema = Joi.object({
  title: Joi.string().min(2).max(100).trim().optional(),
  description: Joi.string().max(500).trim().optional().allow(''),
  totalBudget: Joi.number().min(0).optional(),
  isCompleted: Joi.boolean().optional()
}).min(1);

/**
 * Add Item Schema
 */
export const addItemSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(100)
    .required()
    .trim()
    .messages({
      'string.min': 'Item name is required',
      'string.max': 'Item name cannot exceed 100 characters',
      'any.required': 'Item name is required'
    }),
  
  category: Joi.string()
    .trim()
    .optional()
    .default('Other'),
  
  quantity: Joi.number()
    .min(0.01)
    .required()
    .messages({
      'number.min': 'Quantity must be greater than 0',
      'any.required': 'Quantity is required'
    }),
  
  unit: Joi.string()
    .required()
    .default('pcs')
    .messages({
      'any.required': 'Unit is required'
    }),
  
  estimatedPrice: Joi.number()
    .min(0)
    .optional(),
  
  notes: Joi.string()
    .max(200)
    .trim()
    .optional()
    .allow('')
});

/**
 * Update Item Schema
 */
export const updateItemSchema = Joi.object({
  name: Joi.string().min(1).max(100).trim().optional(),
  category: Joi.string().trim().optional(),
  quantity: Joi.number().min(0.01).optional(),
  unit: Joi.string().optional(),
  estimatedPrice: Joi.number().min(0).optional(),
  actualPrice: Joi.number().min(0).optional(),
  isPurchased: Joi.boolean().optional(),
  notes: Joi.string().max(200).trim().optional().allow('')
}).min(1);