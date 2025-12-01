/**
 * Authentication Controller
 */

import { Request, Response } from 'express';
import * as authService from './auth.service';
import { sendSuccess } from '../../shared/utils/response.util';
import { Types } from 'mongoose';

// ✅ Create custom interface
interface AuthenticatedRequest extends Request {
  user?: {
    userId: Types.ObjectId;
    email: string;
    name: string;
  };
}

/**
 * Get User Profile
 */
export const getProfile = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthenticatedRequest;  // ✅ Type assertion
  const userId = authReq.user!.userId.toString();
  
  const profile = await authService.getUserProfile(userId);
  
  return sendSuccess(res, profile);
};

/**
 * Update User Profile
 */
export const updateProfile = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthenticatedRequest;  // ✅ Type assertion
  const userId = authReq.user!.userId.toString();
  
  const updatedUser = await authService.updateUserProfile(userId, req.body);
  
  return sendSuccess(
    res,
    updatedUser,
    'Profile updated successfully'
  );
};

/**
 * Logout User
 */
export const logout = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthenticatedRequest;  // ✅ Type assertion
  
  if (req.body.deviceToken) {
    const userId = authReq.user!.userId.toString();
    await authService.removeDeviceToken(userId, req.body.deviceToken);
  }
  
  return sendSuccess(
    res,
    null,
    'Logout successful'
  );
};

/**
 * Add Device Token
 */
export const addDeviceToken = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthenticatedRequest;  // ✅ Type assertion
  const userId = authReq.user!.userId.toString();
  
  const result = await authService.addDeviceToken(userId, req.body.token);
  
  return sendSuccess(res, result);
};

/**
 * Remove Device Token
 */
export const removeDeviceToken = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthenticatedRequest;  // ✅ Type assertion
  const userId = authReq.user!.userId.toString();
  
  const result = await authService.removeDeviceToken(userId, req.body.token);
  
  return sendSuccess(res, result);
};

/**
 * Refresh Access Token
 */
export const refreshToken = async (req: Request, res: Response): Promise<Response> => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return sendSuccess(res, null, 'Refresh token required', 400);
  }
  
  const decoded = await import('../../shared/utils/jwt.util').then(m => m.verifyToken(refreshToken));
  
  const { generateAccessToken } = await import('../../shared/utils/jwt.util');
  
  const newAccessToken = generateAccessToken({
    userId: decoded.userId,
    email: decoded.email,
    name: decoded.name
  });
  
  return sendSuccess(
    res,
    { accessToken: newAccessToken },
    'Token refreshed successfully'
  );
};

// Keep register and login as they were (no auth needed)
export const register = async (req: Request, res: Response): Promise<Response> => {
  const result = await authService.registerUser(req.body);
  
  return sendSuccess(
    res,
    result,
    'User registered successfully',
    201
  );
};

export const login = async (req: Request, res: Response): Promise<Response> => {
  const result = await authService.loginUser(req.body);
  
  return sendSuccess(
    res,
    result,
    'Login successful'
  );
};