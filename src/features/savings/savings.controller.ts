/**
 * Savings Goal Controller
 */

import { Request, Response } from 'express';
import * as savingsService from './savings.service';
import { sendSuccess } from '../../shared/utils/response.util';
import { Types } from 'mongoose';

interface AuthRequest extends Request {
  user?: {
    userId: Types.ObjectId;
    email: string;
    name: string;
  };
}

/**
 * Create Savings Goal
 * 
 * Route: POST /api/savings
 */
export const createSavingsGoal = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  
  const goal = await savingsService.createSavingsGoal(userId, req.body);
  
  return sendSuccess(
    res,
    goal,
    'Savings goal created successfully',
    201
  );
};

/**
 * Get All Savings Goals
 * 
 * Route: GET /api/savings?includeCompleted=true
 */
export const getSavingsGoals = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  const includeCompleted = req.query.includeCompleted !== 'false';  // Default true
  
  const goals = await savingsService.getSavingsGoals(userId, includeCompleted);
  
  return sendSuccess(res, goals);
};

/**
 * Get Single Savings Goal
 * 
 * Route: GET /api/savings/:id
 */
export const getSavingsGoalById = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  const goalId = req.params.id;
  
  const goal = await savingsService.getSavingsGoalById(userId, goalId);
  
  return sendSuccess(res, goal);
};

/**
 * Update Savings Goal
 * 
 * Route: PUT /api/savings/:id
 */
export const updateSavingsGoal = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  const goalId = req.params.id;
  
  const goal = await savingsService.updateSavingsGoal(userId, goalId, req.body);
  
  return sendSuccess(
    res,
    goal,
    'Savings goal updated successfully'
  );
};

/**
 * Delete Savings Goal
 * 
 * Route: DELETE /api/savings/:id
 */
export const deleteSavingsGoal = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  const goalId = req.params.id;
  
  await savingsService.deleteSavingsGoal(userId, goalId);
  
  return sendSuccess(
    res,
    null,
    'Savings goal deleted successfully'
  );
};

/**
 * Add Contribution
 * 
 * Route: POST /api/savings/:id/contribute
 */
export const addContribution = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  const goalId = req.params.id;
  
  const goal = await savingsService.addContribution(userId, goalId, req.body);
  
  return sendSuccess(
    res,
    goal,
    'Contribution added successfully'
  );
};

/**
 * Get Contribution History
 * 
 * Route: GET /api/savings/:id/contributions
 */
export const getContributions = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  const goalId = req.params.id;
  
  const contributions = await savingsService.getContributions(userId, goalId);
  
  return sendSuccess(res, contributions);
};

/**
 * Get Savings Statistics
 * 
 * Route: GET /api/savings/stats
 */
export const getSavingsStats = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  
  const stats = await savingsService.getSavingsStats(userId);
  
  return sendSuccess(res, stats);
};