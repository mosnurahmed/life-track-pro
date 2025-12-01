/**
 * Custom Error Classes
 * 
 * Purpose: Create meaningful error types for better error handling
 * Benefits:
 * - Type-safe errors
 * - Consistent error responses
 * - Easy to handle different error types
 */

/**
 * Base Application Error
 * All custom errors extend this class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Operational = expected error (not programming error)

    // Maintains proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 Bad Request
 * Use when: Client sends invalid data
 */
export class BadRequestError extends AppError {
  constructor(message: string = 'Bad Request') {
    super(message, 400);
  }
}

/**
 * 401 Unauthorized
 * Use when: User not authenticated (no token or invalid token)
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

/**
 * 403 Forbidden
 * Use when: User authenticated but doesn't have permission
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

/**
 * 404 Not Found
 * Use when: Resource doesn't exist
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

/**
 * 409 Conflict
 * Use when: Duplicate resource (e.g., email already exists)
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409);
  }
}

/**
 * 422 Unprocessable Entity
 * Use when: Validation fails
 */
export class ValidationError extends AppError {
  public readonly errors: Record<string, string>;

  constructor(message: string = 'Validation failed', errors: Record<string, string> = {}) {
    super(message, 422);
    this.errors = errors;
  }
}