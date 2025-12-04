/**
 * Authentication Service
 * 
 * Purpose: Handle authentication business logic
 * This is where the actual work happens
 * 
 * Separation of Concerns:
 * - Controller: Handle HTTP requests/responses
 * - Service: Business logic (this file)
 * - Model: Database operations
 */

import User, { IUser } from './auth.model';
import { ConflictError, UnauthorizedError, NotFoundError } from '../../shared/utils/error.util';
import { generateTokenPair, TokenPayload } from '../../shared/utils/jwt.util';
import * as categoryService from '../category/category.service';
/**
 * Register User DTO (Data Transfer Object)
 * 
 * Defines the shape of registration data
 */
export interface RegisterDTO {
  email: string;
  password: string;
  name: string;
  phoneNumber?: string;
}

/**
 * Login User DTO
 */
export interface LoginDTO {
  email: string;
  password: string;
}

/**
 * Auth Response
 * 
 * What we send back after successful login/register
 */
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    currency: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

/**
 * Register New User
 * 
 * Flow:
 * 1. Check if email already exists
 * 2. Create user (password auto-hashed by pre-save hook)
 * 3. Generate JWT tokens
 * 4. Return user data and tokens
 * 
 * @param data - Registration data
 * @returns User info and tokens
 * @throws ConflictError if email exists
 */
export const registerUser = async (data: RegisterDTO): Promise<AuthResponse> => {
  const { email, password, name, phoneNumber } = data;
  
  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ConflictError('Email already registered');
  }
  
  // Create new user
  const user = await User.create({
    email,
    password,  // Will be hashed by pre-save hook
    name,
    phoneNumber
  });
   // ✅ Create default categories for new user
  try {
    // Dynamic import to avoid circular dependency

    await categoryService.createDefaultCategories(user._id.toString());
  } catch (error) {
    console.error('❌ Failed to create default categories:', error);
    // Continue even if category creation fails
  }
  // Generate tokens
  const tokenPayload: TokenPayload = {
    userId: user._id,
    email: user.email,
    name: user.name
  };
  
  const tokens = generateTokenPair(tokenPayload);
  
  // Return response
  return {
    user: {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      currency: user.currency
    },
    tokens
  };
};

/**
 * Login User
 * 
 * Flow:
 * 1. Find user by email (include password)
 * 2. Verify password
 * 3. Update last login time
 * 4. Generate tokens
 * 5. Return user data and tokens
 * 
 * @param data - Login credentials
 * @returns User info and tokens
 * @throws UnauthorizedError if credentials invalid
 */
export const loginUser = async (data: LoginDTO): Promise<AuthResponse> => {
  const { email, password } = data;
  
  // Find user and include password field
  const user = await User.findOne({ email }).select('+password');
  
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }
  
  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid email or password');
  }
  
  // Update last login
  user.lastLogin = new Date();
  await user.save();
  
  // Generate tokens
  const tokenPayload: TokenPayload = {
    userId: user._id,
    email: user.email,
    name: user.name
  };
  
  const tokens = generateTokenPair(tokenPayload);
  
  // Return response
  return {
    user: {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      currency: user.currency
    },
    tokens
  };
};

/**
 * Get User Profile
 * 
 * @param userId - User ID from JWT token
 * @returns User profile data
 * @throws NotFoundError if user not found
 */
export const getUserProfile = async (userId: string) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    phoneNumber: user.phoneNumber,
    currency: user.currency,
    monthlyBudget: user.monthlyBudget,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin
  };
};

/**
 * Update User Profile
 * 
 * @param userId - User ID
 * @param data - Fields to update
 * @returns Updated user data
 */
export const updateUserProfile = async (
  userId: string,
  data: Partial<{
    name: string;
    phoneNumber: string;
    avatar: string;
    currency: string;
    monthlyBudget: number;
  }>
) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  // Update only provided fields
  if (data.name) user.name = data.name;
  if (data.phoneNumber !== undefined) user.phoneNumber = data.phoneNumber;
  if (data.avatar !== undefined) user.avatar = data.avatar;
  if (data.currency) user.currency = data.currency;
  if (data.monthlyBudget !== undefined) user.monthlyBudget = data.monthlyBudget;
  
  await user.save();
  
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    phoneNumber: user.phoneNumber,
    currency: user.currency,
    monthlyBudget: user.monthlyBudget
  };
};

/**
 * Add Device Token (for push notifications)
 * 
 * @param userId - User ID
 * @param token - FCM device token
 */
export const addDeviceToken = async (userId: string, token: string) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  // Add token if not already exists
  if (!user.deviceTokens.includes(token)) {
    user.deviceTokens.push(token);
    await user.save();
  }
  
  return { message: 'Device token added successfully' };
};

/**
 * Remove Device Token
 * 
 * @param userId - User ID
 * @param token - FCM device token to remove
 */
export const removeDeviceToken = async (userId: string, token: string) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  user.deviceTokens = user.deviceTokens.filter(t => t !== token);
  await user.save();
  
  return { message: 'Device token removed successfully' };
};
/**
 * Get User Device Tokens
 * 
 * Purpose: Get all tokens for sending notifications
 */
export const getUserDeviceTokens = async (
  userId: string
): Promise<string[]> => {
  const user = await User.findById(userId).select('deviceTokens');
  
  if (!user) {
    return [];
  }
  
  return user.deviceTokens;
};