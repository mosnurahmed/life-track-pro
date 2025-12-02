/**
 * Note Validators
 */

import Joi from 'joi';

/**
 * Create Note Schema
 */
export const createNoteSchema = Joi.object({
  title: Joi.string()
    .min(1)
    .max(200)
    .required()
    .trim()
    .messages({
      'string.min': 'Title must be at least 1 character',
      'string.max': 'Title cannot exceed 200 characters',
      'any.required': 'Title is required'
    }),
  
  content: Joi.string()
    .required()
    .max(50000)
    .messages({
      'any.required': 'Content is required',
      'string.max': 'Content cannot exceed 50,000 characters'
    }),
  
  tags: Joi.array()
    .items(Joi.string().max(30))
    .max(20)
    .optional()
    .default([])
    .messages({
      'array.max': 'Maximum 20 tags allowed'
    }),
  
  color: Joi.string()
    .pattern(/^#[0-9A-F]{6}$/i)
    .optional()
    .default('#FFFFFF')
    .messages({
      'string.pattern.base': 'Please provide valid hex color'
    }),
  
  isPinned: Joi.boolean()
    .optional()
    .default(false),
  
  isArchived: Joi.boolean()
    .optional()
    .default(false)
});

/**
 * Update Note Schema
 */
export const updateNoteSchema = Joi.object({
  title: Joi.string().min(1).max(200).trim().optional(),
  content: Joi.string().max(50000).optional(),
  tags: Joi.array().items(Joi.string().max(30)).max(20).optional(),
  color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional(),
  isPinned: Joi.boolean().optional(),
  isArchived: Joi.boolean().optional()
}).min(1);