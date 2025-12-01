/**
 * Common TypeScript Types & Interfaces
 * 
 * Purpose: Reusable types across the application
 */

import { Types } from 'mongoose';

/**
 * Standard API Response Format
 * 
 * All API responses will follow this structure for consistency
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Record<string, string>; // For validation errors
}

/**
 * Pagination Parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

/**
 * Paginated Response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * MongoDB Document with timestamps
 */
export interface TimestampedDocument {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User reference type (used in models)
 */
export type UserRef = Types.ObjectId;