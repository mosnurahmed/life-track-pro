/**
 * Chat Validators
 */

import Joi from 'joi';

/**
 * Send Message Schema
 */
export const sendMessageSchema = Joi.object({
  receiverId: Joi.string()
    .required()
    .messages({
      'any.required': 'Receiver ID is required'
    }),
  
  message: Joi.string()
    .min(1)
    .max(5000)
    .required()
    .trim()
    .messages({
      'string.min': 'Message cannot be empty',
      'string.max': 'Message cannot exceed 5000 characters',
      'any.required': 'Message is required'
    })
});