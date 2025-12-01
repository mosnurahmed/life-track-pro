/**
 * Validation Middleware
 * 
 * Purpose: Validate request body against Joi schema
 * Automatically returns error if validation fails
 */

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from '../utils/error.util';

/**
 * Validate Request Body
 * 
 * Usage:
 * app.post('/register', validate(registerSchema), controller)
 * 
 * @param schema - Joi validation schema
 * @returns Express middleware function
 */
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    // Validate request body
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,  // Return all errors, not just first one
      stripUnknown: true   // Remove unknown fields
    });
    
    if (error) {
      // Format error messages
      const errors: Record<string, string> = {};
      
      error.details.forEach((detail) => {
        const key = detail.path.join('.');
        errors[key] = detail.message;
      });
      
      throw new ValidationError('Validation failed', errors);
    }
    
    // Replace req.body with validated & sanitized data
    req.body = value;
    
    next();
  };
};