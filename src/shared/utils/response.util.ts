/**
 * API Response Formatter
 * 
 * Purpose: Consistent API response structure
 * All API responses use these helper functions
 */

import { Response } from 'express';
import { ApiResponse, PaginatedResponse } from '../types/common.types';

/**
 * Success Response
 * 
 * @param res - Express response object
 * @param data - Data to send
 * @param message - Success message
 * @param statusCode - HTTP status code (default: 200)
 */
export const sendSuccess = <T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode: number = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data
  };

  return res.status(statusCode).json(response);
};

/**
 * Error Response
 * 
 * @param res - Express response object
 * @param message - Error message
 * @param statusCode - HTTP status code (default: 500)
 * @param errors - Validation errors (optional)
 */
export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 500,
  errors?: Record<string, string>
): Response => {
  const response: ApiResponse = {
    success: false,
    error: message,
    errors
  };

  return res.status(statusCode).json(response);
};

/**
 * Paginated Response
 * 
 * @param res - Express response object
 * @param data - Paginated data
 * @param message - Success message
 */
export const sendPaginated = <T>(
  res: Response,
  data: PaginatedResponse<T>,
  message?: string
): Response => {
  const response = {
    success: true,
    message,
    ...data
  };

  return res.status(200).json(response);
};