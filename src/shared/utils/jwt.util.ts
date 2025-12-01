/**
 * JWT Utility Functions
 */

import jwt from 'jsonwebtoken';
import { env } from '../config/env.config';
import { Types } from 'mongoose';

/**
 * Token Payload Interface
 */
export interface TokenPayload {
  userId: Types.ObjectId;
  email: string;
  name: string;
}

/**
 * Generate Access Token
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  const jwtPayload = {
    userId: payload.userId.toString(),
    email: payload.email,
    name: payload.name
  };

  // ✅ Cast to any to bypass type checking
  const options: any = {
    expiresIn: env.JWT_EXPIRES_IN,
    issuer: 'lifetrack-api',
    audience: 'lifetrack-app'
  };

  return jwt.sign(jwtPayload, env.JWT_SECRET, options);
};

/**
 * Generate Refresh Token
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
  const jwtPayload = {
    userId: payload.userId.toString(),
    email: payload.email,
    name: payload.name
  };

  // ✅ Cast to any
  const options: any = {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    issuer: 'lifetrack-api',
    audience: 'lifetrack-app'
  };

  return jwt.sign(jwtPayload, env.JWT_SECRET, options);
};

/**
 * Verify Token
 */
export const verifyToken = (token: string): any => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      issuer: 'lifetrack-api',
      audience: 'lifetrack-app'
    });
    
    return decoded;
  } catch (error) {
    throw error;
  }
};

/**
 * Generate Token Pair
 */
export const generateTokenPair = (payload: TokenPayload) => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload)
  };
};