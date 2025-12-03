/**
 * Dashboard Controller
 */

import { Request, Response } from 'express';
import * as dashboardService from './dashboard.service';
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
 * Get Dashboard Data
 * 
 * Route: GET /api/dashboard
 */
export const getDashboard = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  
  const data = await dashboardService.getDashboardData(userId);
  
  return sendSuccess(res, data);
};

/**
 * Get Financial Summary
 * 
 * Route: GET /api/dashboard/financial-summary
 */
export const getFinancialSummary = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  
  const summary = await dashboardService.getFinancialSummary(userId);
  
  return sendSuccess(res, summary);
};