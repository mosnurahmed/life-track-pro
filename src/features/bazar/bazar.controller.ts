/**
 * Bazar Controller
 */

import { Request, Response } from 'express';
import * as bazarService from './bazar.service';
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
 * Create Shopping List
 * 
 * Route: POST /api/bazar
 */
export const createBazar = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  
  const bazar = await bazarService.createBazar(userId, req.body);
  
  return sendSuccess(
    res,
    bazar,
    'Shopping list created successfully',
    201
  );
};

/**
 * Get All Shopping Lists
 * 
 * Route: GET /api/bazar?isCompleted=false&search=grocery
 */
export const getBazars = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  
  const filters = {
    isCompleted: req.query.isCompleted === 'true' ? true :
                 req.query.isCompleted === 'false' ? false : undefined,
    search: req.query.search as string
  };
  
  const bazars = await bazarService.getBazars(userId, filters);
  
  return sendSuccess(res, bazars);
};

/**
 * Get Single Shopping List
 * 
 * Route: GET /api/bazar/:id
 */
export const getBazarById = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  const bazarId = req.params.id;
  
  const bazar = await bazarService.getBazarById(userId, bazarId);
  
  return sendSuccess(res, bazar);
};

/**
 * Update Shopping List
 * 
 * Route: PUT /api/bazar/:id
 */
export const updateBazar = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  const bazarId = req.params.id;
  
  const bazar = await bazarService.updateBazar(userId, bazarId, req.body);
  
  return sendSuccess(
    res,
    bazar,
    'Shopping list updated successfully'
  );
};

/**
 * Delete Shopping List
 * 
 * Route: DELETE /api/bazar/:id
 */
export const deleteBazar = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  const bazarId = req.params.id;
  
  await bazarService.deleteBazar(userId, bazarId);
  
  return sendSuccess(
    res,
    null,
    'Shopping list deleted successfully'
  );
};

/**
 * Add Item to Shopping List
 * 
 * Route: POST /api/bazar/:id/items
 */
export const addItem = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  const bazarId = req.params.id;
  
  const bazar = await bazarService.addItem(userId, bazarId, req.body);
  
  return sendSuccess(
    res,
    bazar,
    'Item added successfully'
  );
};

/**
 * Update Item
 * 
 * Route: PUT /api/bazar/:id/items/:itemId
 */
export const updateItem = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  const bazarId = req.params.id;
  const itemId = req.params.itemId;
  
  const bazar = await bazarService.updateItem(userId, bazarId, itemId, req.body);
  
  return sendSuccess(
    res,
    bazar,
    'Item updated successfully'
  );
};

/**
 * Delete Item
 * 
 * Route: DELETE /api/bazar/:id/items/:itemId
 */
export const deleteItem = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  const bazarId = req.params.id;
  const itemId = req.params.itemId;
  
  const bazar = await bazarService.deleteItem(userId, bazarId, itemId);
  
  return sendSuccess(
    res,
    bazar,
    'Item deleted successfully'
  );
};

/**
 * Toggle Item Purchase Status
 * 
 * Route: PATCH /api/bazar/:id/items/:itemId/toggle
 */
export const toggleItemPurchase = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  const bazarId = req.params.id;
  const itemId = req.params.itemId;
  
  const bazar = await bazarService.toggleItemPurchase(userId, bazarId, itemId);
  
  const item = bazar.items.find(i => i._id.toString() === itemId);
  const message = item?.isPurchased ? 'Item marked as purchased' : 'Item marked as unpurchased';
  
  return sendSuccess(res, bazar, message);
};

/**
 * Get Statistics
 * 
 * Route: GET /api/bazar/stats
 */
export const getBazarStats = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  
  const stats = await bazarService.getBazarStats(userId);
  
  return sendSuccess(res, stats);
};