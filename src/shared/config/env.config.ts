/**
 * Environment Configuration
 * 
 * Purpose: Centralized environment variable access with type safety
 * Benefits:
 * - Type-safe environment variables
 * - Single source of truth
 * - Validation on startup
 * - Auto-completion in IDE
 */

import dotenv from 'dotenv';

// Load .env file
dotenv.config();

/**
 * Interface for environment variables
 * This provides TypeScript intellisense and type checking
 */
interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  MONGODB_URI: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  ALLOWED_ORIGINS: string[];
}

/**
 * Validate and parse environment variables
 * 
 * @throws Error if required variables are missing
 */
const getEnvConfig = (): EnvConfig => {
  // Required variables
  const required = [
    'MONGODB_URI',
    'JWT_SECRET'
  ];

  // Check if all required variables exist
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  return {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '5000', 10),
    MONGODB_URI: process.env.MONGODB_URI!,
    JWT_SECRET: process.env.JWT_SECRET!,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']
  };
};

// Export validated config
export const env = getEnvConfig();

// Export helper for checking environment
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';