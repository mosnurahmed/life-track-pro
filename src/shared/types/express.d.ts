/**
 * Express TypeScript Type Extensions
 * 
 * Purpose: Add custom properties to Express Request object
 * This allows us to attach user info to request after authentication
 */

import { Types } from 'mongoose';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      /**
       * User information attached by auth middleware
       * Available after JWT verification
       */
      user?: {
        userId: Types.ObjectId;
        email: string;
        name: string;
      };
    }
  }
}

export {};