
import { Request, Response } from 'express';
import { Types } from 'mongoose';
import * as categoryService from './category.service';
import { sendSuccess } from '../../shared/utils/response.util';

interface AuthRequest extends Request {
    user?:{
        userId:Types.ObjectId;
        email:string;
        name:string;

    }

} 
/**
 * Create Category
 * 
 * Route: POST /api/categories
 * Body: { name, icon, color, monthlyBudget? }
 */
export const createCategory  = async (req:Request, res:Response): Promise<Response> => {
    const authReq = req as AuthRequest;
    const userId = authReq.user!.userId.toString();
    const category = await categoryService.createCategory(userId,authReq.body);

     return sendSuccess(
        res,
        category,
        'Category created successfully',
        201
    );
}

/**
 * Get All Categories
 * 
 * Route: GET /api/categories
 */
export const getCategories = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  
  const categories = await categoryService.getUserCategories(userId);
  
  return sendSuccess(res, categories);
};
/**
 * Get Single Category
 * 
 * Route: GET /api/categories/:id
 */
export const getCategoryById = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  const categoryId = req.params.id;
  
  const category = await categoryService.getCategoryById(userId, categoryId);
  
  return sendSuccess(res, category);
};
/**
 * Update Category
 * 
 * Route: PUT /api/categories/:id
 * Body: { name?, icon?, color?, monthlyBudget? }
 */
export const updateCategory = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  const categoryId = req.params.id;
  
  const category = await categoryService.updateCategory(userId, categoryId, req.body);
  
  return sendSuccess(
    res,
    category,
    'Category updated successfully'
  );
};
/**
 * Check Category Deletion Status
 * 
 * Route: GET /api/categories/:id/delete-check
 * 
 * Purpose: Check if category can be deleted and get info
 */
export const checkCategoryDeletion = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  const categoryId = req.params.id;
  
  const result = await categoryService.checkCategoryDeletion(userId, categoryId);
  
  return sendSuccess(res, result);
};

/**
 * Delete Category
 * 
 * Route: DELETE /api/categories/:id
 * Query: ?confirm=true (optional)
 */
export const deleteCategory = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  const categoryId = req.params.id;
  const confirmed = req.query.confirm === 'true';
  
  const result = await categoryService.deleteCategory(userId, categoryId, confirmed);
  
  // Build message based on result
  let message = 'Category deleted successfully';
  if (result.deletedExpenses > 0) {
    message += `. ${result.deletedExpenses} expense(s) also deleted`;
  }
  
  return sendSuccess(res, result, message);
};
/**
 * Reorder Categories
 * 
 * Route: PUT /api/categories/reorder
 * Body: { categories: [{ id, order }] }
 */
export const reorderCategories = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  
  await categoryService.reorderCategories(userId, req.body.categories);
  
  return sendSuccess(
    res,
    null,
    'Categories reordered successfully'
  );
};