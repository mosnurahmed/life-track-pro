import Joi from "joi";

/**
 * Create Category Schema
 */

export const createCategorySchema = Joi.object({
    name: Joi.string().
    min(2).
    max(30).
    required().
    trim().
    messages({
      'string.min': 'Category name must be at least 2 characters',
      'string.max': 'Category name cannot exceed 30 characters',
      'any.required': 'Category name is required'
    }),
    icon: Joi.string().
    required().
    messages({
        'any.required': 'Category icon is required'
    }),
     color: Joi.string()
    .pattern(/^#[0-9A-F]{6}$/i)
    .required()
    .messages({
      'string.pattern.base': 'Please provide valid hex color (e.g., #FF6B6B)',
      'any.required': 'Color is required'
    }),
      monthlyBudget: Joi.number()
    .min(0)
    .allow(null)
    .optional()
    .messages({
      'number.min': 'Budget cannot be negative'
    })
});

/**
 * Update Category Schema
 * 
 * Note: All fields optional (partial update)
 */

export const updateCategorySchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(30)
    .trim()
    .optional(),
  
  icon: Joi.string()
    .optional(),
  
  color: Joi.string()
    .pattern(/^#[0-9A-F]{6}$/i)
    .optional()
    .messages({
      'string.pattern.base': 'Please provide valid hex color'
    }),
  
  monthlyBudget: Joi.number()
    .min(0)
    .allow(null)
    .optional(),
  
  order: Joi.number()
    .integer()
    .min(0)
    .optional()
}).min(1);  