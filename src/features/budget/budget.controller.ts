/**
 * Budget Controller
 */

import { Request, Response } from 'express';
import * as budgetService from './budget.service';
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
 * Get Budget Summary
 * 
 * Route: GET /api/budget/summary
 */
export const getBudgetSummary = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  
  const summary = await budgetService.getBudgetSummary(userId);
  
  return sendSuccess(res, summary);
};

/**
 * Get Category Budget Status
 * 
 * Route: GET /api/budget/category/:categoryId
 */
export const getCategoryBudgetStatus = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  const categoryId = req.params.categoryId;
  
  const status = await budgetService.getCategoryBudgetStatus(userId, categoryId);
  
  return sendSuccess(res, status);
};

/**
 * Update Category Budget
 * 
 * Route: PUT /api/budget/category/:categoryId
 * Body: { budget: number | null }
 */
export const updateCategoryBudget = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  const categoryId = req.params.categoryId;
  const { budget } = req.body;
  
  const category = await budgetService.updateCategoryBudget(userId, categoryId, budget);
  
  return sendSuccess(
    res,
    category,
    'Budget updated successfully'
  );
};

/**
 * Get Budget Alerts
 * 
 * Route: GET /api/budget/alerts
 */
export const getBudgetAlerts = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  
  const alerts = await budgetService.getBudgetAlerts(userId);
  
  return sendSuccess(res, alerts);
};