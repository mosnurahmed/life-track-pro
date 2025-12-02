/**
 * Budget Validators
 */

import Joi from 'joi';

/**
 * Update Budget Schema
 */
export const updateBudgetSchema = Joi.object({
  budget: Joi.number()
    .min(0)
    .allow(null)
    .required()
    .messages({
      'number.min': 'Budget cannot be negative',
      'any.required': 'Budget is required'
    })
});