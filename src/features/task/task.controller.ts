/**
 * Task Controller
 */

import { Request, Response } from 'express';
import * as taskService from './task.service';
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
 * Create Task
 * 
 * Route: POST /api/tasks
 */
export const createTask = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  
  const task = await taskService.createTask(userId, req.body);
  
  return sendSuccess(
    res,
    task,
    'Task created successfully',
    201
  );
};

/**
 * Get All Tasks
 * 
 * Route: GET /api/tasks?status=todo&priority=high&dueDate=today&tags=work&search=meeting
 */
export const getTasks = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  
  const filters = {
    status: req.query.status as string,
    priority: req.query.priority as string,
    tags: req.query.tags as string,
    dueDate: req.query.dueDate as string,
    search: req.query.search as string
  };
  
  const tasks = await taskService.getTasks(userId, filters);
  
  return sendSuccess(res, tasks);
};

/**
 * Get Single Task
 * 
 * Route: GET /api/tasks/:id
 */
export const getTaskById = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  const taskId = req.params.id;
  
  const task = await taskService.getTaskById(userId, taskId);
  
  return sendSuccess(res, task);
};

/**
 * Update Task
 * 
 * Route: PUT /api/tasks/:id
 */
export const updateTask = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  const taskId = req.params.id;
  
  const task = await taskService.updateTask(userId, taskId, req.body);
  
  return sendSuccess(
    res,
    task,
    'Task updated successfully'
  );
};

/**
 * Delete Task
 * 
 * Route: DELETE /api/tasks/:id
 */
export const deleteTask = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  const taskId = req.params.id;
  
  await taskService.deleteTask(userId, taskId);
  
  return sendSuccess(
    res,
    null,
    'Task deleted successfully'
  );
};

/**
 * Update Task Status
 * 
 * Route: PATCH /api/tasks/:id/status
 * Body: { status: "completed" }
 */
export const updateTaskStatus = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  const taskId = req.params.id;
  const { status } = req.body;
  
  const task = await taskService.updateTaskStatus(userId, taskId, status);
  
  return sendSuccess(
    res,
    task,
    `Task marked as ${status}`
  );
};

/**
 * Add Subtask
 * 
 * Route: POST /api/tasks/:id/subtasks
 * Body: { title: "Subtask title" }
 */
export const addSubtask = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  const taskId = req.params.id;
  const { title } = req.body;
  
  const task = await taskService.addSubtask(userId, taskId, title);
  
  return sendSuccess(
    res,
    task,
    'Subtask added successfully'
  );
};

/**
 * Update Subtask
 * 
 * Route: PUT /api/tasks/:id/subtasks/:subtaskId
 * Body: { title?: "New title", completed?: true }
 */
export const updateSubtask = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  const taskId = req.params.id;
  const subtaskId = req.params.subtaskId;
  
  const task = await taskService.updateSubtask(userId, taskId, subtaskId, req.body);
  
  return sendSuccess(
    res,
    task,
    'Subtask updated successfully'
  );
};

/**
 * Delete Subtask
 * 
 * Route: DELETE /api/tasks/:id/subtasks/:subtaskId
 */
export const deleteSubtask = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  const taskId = req.params.id;
  const subtaskId = req.params.subtaskId;
  
  const task = await taskService.deleteSubtask(userId, taskId, subtaskId);
  
  return sendSuccess(
    res,
    task,
    'Subtask deleted successfully'
  );
};

/**
 * Get Task Statistics
 * 
 * Route: GET /api/tasks/stats
 */
export const getTaskStats = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  
  const stats = await taskService.getTaskStats(userId);
  
  return sendSuccess(res, stats);
};