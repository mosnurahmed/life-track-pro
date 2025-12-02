/**
 * Task Validators
 */

import Joi from 'joi';

/**
 * Create Task Schema
 */
export const createTaskSchema = Joi.object({
  title: Joi.string()
    .min(2)
    .max(200)
    .required()
    .trim()
    .messages({
      'string.min': 'Title must be at least 2 characters',
      'string.max': 'Title cannot exceed 200 characters',
      'any.required': 'Title is required'
    }),
  
  description: Joi.string()
    .max(1000)
    .trim()
    .optional()
    .allow(''),
  
  priority: Joi.string()
    .valid('urgent', 'high', 'medium', 'low')
    .optional()
    .default('medium'),
  
  status: Joi.string()
    .valid('todo', 'in_progress', 'completed', 'cancelled')
    .optional()
    .default('todo'),
  
  dueDate: Joi.date()
    .optional()
    .allow(null),
  
  reminder: Joi.object({
    enabled: Joi.boolean().required(),
    time: Joi.date().when('enabled', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional()
    })
  }).optional(),
  
  repeat: Joi.object({
    enabled: Joi.boolean().required(),
    interval: Joi.string()
      .valid('daily', 'weekly', 'monthly')
      .when('enabled', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.optional()
      }),
    endDate: Joi.date().optional()
  }).optional(),
  
  tags: Joi.array()
    .items(Joi.string().max(30))
    .max(10)
    .optional()
    .messages({
      'array.max': 'Maximum 10 tags allowed'
    })
});

/**
 * Update Task Schema
 */
export const updateTaskSchema = Joi.object({
  title: Joi.string().min(2).max(200).trim().optional(),
  description: Joi.string().max(1000).trim().optional().allow(''),
  priority: Joi.string().valid('urgent', 'high', 'medium', 'low').optional(),
  status: Joi.string().valid('todo', 'in_progress', 'completed', 'cancelled').optional(),
  dueDate: Joi.date().optional().allow(null),
  reminder: Joi.object({
    enabled: Joi.boolean(),
    time: Joi.date(),
    sent: Joi.boolean()
  }).optional(),
  repeat: Joi.object({
    enabled: Joi.boolean(),
    interval: Joi.string().valid('daily', 'weekly', 'monthly'),
    endDate: Joi.date()
  }).optional(),
  tags: Joi.array().items(Joi.string().max(30)).max(10).optional()
}).min(1);

/**
 * Add Subtask Schema
 */
export const addSubtaskSchema = Joi.object({
  title: Joi.string()
    .min(2)
    .max(200)
    .required()
    .trim()
    .messages({
      'string.min': 'Subtask title must be at least 2 characters',
      'string.max': 'Subtask title cannot exceed 200 characters',
      'any.required': 'Subtask title is required'
    })
});

/**
 * Update Subtask Schema
 */
export const updateSubtaskSchema = Joi.object({
  title: Joi.string().min(2).max(200).trim().optional(),
  completed: Joi.boolean().optional()
}).min(1);