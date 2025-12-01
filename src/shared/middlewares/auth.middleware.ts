/**
 * Authentication Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.util';
import { UnauthorizedError } from '../utils/error.util';
import { Types } from 'mongoose';

// ✅ Define custom interface here
interface AuthRequest extends Request {
  user?: {
    userId: Types.ObjectId;
    email: string;
    name: string;
  };
}

/**
 * Authentication Middleware
 */
export const authMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw new UnauthorizedError('No token provided');
    }
    
    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Invalid token format');
    }
    
    const token = authHeader.substring(7);
    
    if (!token) {
      throw new UnauthorizedError('No token provided');
    }
    
    const decoded = verifyToken(token);
    
    // ✅ Use type assertion
    (req as AuthRequest).user = {
      userId: new Types.ObjectId(decoded.userId),
      email: decoded.email,
      name: decoded.name
    };
    
    next();
    
  } catch (error) {
    next(error);
  }
};

/**
 * Optional Authentication Middleware
 */
export const optionalAuth = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    const token = authHeader.substring(7);
    
    if (!token) {
      return next();
    }
    
    const decoded = verifyToken(token);
    
    // ✅ Use type assertion
    (req as AuthRequest).user = {
      userId: new Types.ObjectId(decoded.userId),
      email: decoded.email,
      name: decoded.name
    };
    
    next();
    
  } catch (error) {
    next();
  }
};