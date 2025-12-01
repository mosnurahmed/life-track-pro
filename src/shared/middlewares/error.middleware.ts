/**
 * Global Error Handler Middleware
 * 
 * Purpose: Catch all errors and send consistent error responses
 * This is the last middleware in the chain
 * 
 * Flow:
 * Request → Routes → Controllers → [Error thrown] → This middleware → Response
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/error.util';
import { sendError } from '../utils/response.util';
import { isDevelopment } from '../config/env.config';

/**
 * Error Handler Middleware
 * 
 * Express recognizes this as error handler because it has 4 parameters
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  
  // Log error in development
  if (isDevelopment) {
    console.error('❌ Error:', err);
  }

  // Handle AppError (our custom errors)
  if (err instanceof AppError) {
    const appError = err as any; // ✅ Type assertion
    
    return sendError(
      res,
      err.message,
      err.statusCode,
      'errors' in appError ? appError.errors : undefined
    );
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    return sendError(res, 'Validation failed', 400);
  }

  // Handle Mongoose Duplicate Key Error
  if (err.name === 'MongoServerError' && 'code' in err && err.code === 11000) {
    return sendError(res, 'Duplicate value entered', 409);
  }

  // Handle JWT Error
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Token expired', 401);
  }

  // Default error (500 Internal Server Error)
  return sendError(
    res,
    isDevelopment ? err.message : 'Internal server error',
    500
  );
};

/**
 * 404 Not Found Handler
 * 
 * Purpose: Handle routes that don't exist
 * This should be added before error handler
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  return sendError(
    res,
    `Route ${req.originalUrl} not found`,
    404
  );
};