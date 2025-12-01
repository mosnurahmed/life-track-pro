/**
 * Request Logger Middleware
 * 
 * Purpose: Log all incoming requests
 * Helps in debugging and monitoring
 */

import morgan from 'morgan';
import { isDevelopment } from '../config/env.config';

/**
 * Morgan configuration
 * 
 * Formats:
 * - dev: Colored output for development
 * - combined: Apache combined log format for production
 */
export const requestLogger = morgan(
  isDevelopment ? 'dev' : 'combined'
);

/**
 * Example output (dev format):
 * GET /api/expenses 200 15.234 ms - 1024
 * 
 * Explanation:
 * - GET: HTTP method
 * - /api/expenses: Route
 * - 200: Status code
 * - 15.234 ms: Response time
 * - 1024: Response size (bytes)
 */