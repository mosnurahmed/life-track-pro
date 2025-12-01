/**
 * Expense Controller
 */

import { Request, Response } from 'express';
import * as expenseService from './expense.service';
import { sendSuccess, sendPaginated } from '../../shared/utils/response.util';
import { Types } from 'mongoose';

interface AuthRequest extends Request {
  user?: {
    userId: Types.ObjectId;
    email: string;
    name: string;
  };
}

/**
 * Create Expense
 */
export const createExpense = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  
  const expense = await expenseService.createExpense(userId, req.body);
  
  return sendSuccess(
    res,
    expense,
    'Expense created successfully',
    201
  );
};

/**
 * Get Expenses (with filters & pagination)
 */
export const getExpenses = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  
  const result = await expenseService.getExpenses(userId, req.query);
  
  return sendPaginated(res, result);
};

/**
 * Get Single Expense
 */
export const getExpenseById = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  const expenseId = req.params.id;
  
  const expense = await expenseService.getExpenseById(userId, expenseId);
  
  return sendSuccess(res, expense);
};

/**
 * Update Expense
 */
export const updateExpense = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  const expenseId = req.params.id;
  
  const expense = await expenseService.updateExpense(userId, expenseId, req.body);
  
  return sendSuccess(
    res,
    expense,
    'Expense updated successfully'
  );
};

/**
 * Delete Expense
 */
export const deleteExpense = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  const expenseId = req.params.id;
  
  await expenseService.deleteExpense(userId, expenseId);
  
  return sendSuccess(
    res,
    null,
    'Expense deleted successfully'
  );
};

/**
 * Get Expense Statistics
 */
export const getExpenseStats = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  
  const stats = await expenseService.getExpenseStats(userId);
  
  return sendSuccess(res, stats);
};

/**
 * Get Daily Expenses (for charts)
 */
export const getDailyExpenses = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  const days = parseInt(req.query.days as string) || 30;
  
  const dailyExpenses = await expenseService.getDailyExpenses(userId, days);
  
  return sendSuccess(res, dailyExpenses);
};