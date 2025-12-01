/**
 * Expense Input Validators
 */

import Joi from 'joi';

/**
 * Create Expense Schema
 */
export const createExpenseSchema = Joi.object({
  categoryId: Joi.string()
    .required()
    .messages({
      'any.required': 'Category is required'
    }),
  
  amount: Joi.number()
    .min(0.01)
    .max(10000000)
    .required()
    .messages({
      'number.min': 'Amount must be greater than 0',
      'number.max': 'Amount too large',
      'any.required': 'Amount is required'
    }),
  
  description: Joi.string()
    .max(200)
    .trim()
    .optional()
    .allow('')
    .messages({
      'string.max': 'Description cannot exceed 200 characters'
    }),
  
  date: Joi.date()
    .optional()
    .default(() => new Date()),
  
  paymentMethod: Joi.string()
    .valid('cash', 'card', 'mobile_banking', 'bank_transfer', 'other')
    .optional(),
  
  tags: Joi.array()
    .items(Joi.string().max(20))
    .max(10)
    .optional()
    .messages({
      'array.max': 'Maximum 10 tags allowed'
    }),
  
  receiptImage: Joi.string()
    .uri()
    .optional()
    .allow(null),
  
  location: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    address: Joi.string().optional()
  }).optional(),
  
  isRecurring: Joi.boolean()
    .optional()
    .default(false),
  
  recurringConfig: Joi.object({
    interval: Joi.string()
      .valid('daily', 'weekly', 'monthly', 'yearly')
      .required(),
    endDate: Joi.date().optional()
  }).when('isRecurring', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.forbidden()
  })
});

/**
 * Update Expense Schema
 */
export const updateExpenseSchema = Joi.object({
  categoryId: Joi.string().optional(),
  amount: Joi.number().min(0.01).max(10000000).optional(),
  description: Joi.string().max(200).trim().optional().allow(''),
  date: Joi.date().optional(),
  paymentMethod: Joi.string()
    .valid('cash', 'card', 'mobile_banking', 'bank_transfer', 'other')
    .optional(),
  tags: Joi.array().items(Joi.string().max(20)).max(10).optional(),
  receiptImage: Joi.string().uri().optional().allow(null),
  location: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    address: Joi.string().optional()
  }).optional(),
  isRecurring: Joi.boolean().optional(),
  recurringConfig: Joi.object({
    interval: Joi.string()
      .valid('daily', 'weekly', 'monthly', 'yearly')
      .required(),
    endDate: Joi.date().optional()
  }).optional()
}).min(1);

/**
 * Query/Filter Schema
 */
export const expenseQuerySchema = Joi.object({
  page: Joi.number().min(1).optional().default(1),
  limit: Joi.number().min(1).max(100).optional().default(20),
  categoryId: Joi.string().optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  minAmount: Joi.number().min(0).optional(),
  maxAmount: Joi.number().optional(),
  paymentMethod: Joi.string()
    .valid('cash', 'card', 'mobile_banking', 'bank_transfer', 'other')
    .optional(),
  tags: Joi.string().optional(),  // Comma-separated
  sortBy: Joi.string()
    .valid('date', 'amount', 'createdAt')
    .optional()
    .default('date'),
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .optional()
    .default('desc')
});