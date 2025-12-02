/**
 * Note Controller
 */

import { Request, Response } from 'express';
import * as noteService from './note.service';
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
 * Create Note
 * 
 * Route: POST /api/notes
 */
export const createNote = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  
  const note = await noteService.createNote(userId, req.body);
  
  return sendSuccess(
    res,
    note,
    'Note created successfully',
    201
  );
};

/**
 * Get All Notes
 * 
 * Route: GET /api/notes?tags=work&search=meeting&isArchived=false
 */
export const getNotes = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  
  const filters = {
    tags: req.query.tags as string,
    isPinned: req.query.isPinned === 'true' ? true : undefined,
    isArchived: req.query.isArchived === 'true' ? true : 
                req.query.isArchived === 'false' ? false : undefined,
    search: req.query.search as string,
    color: req.query.color as string
  };
  
  const notes = await noteService.getNotes(userId, filters);
  
  return sendSuccess(res, notes);
};

/**
 * Get Single Note
 * 
 * Route: GET /api/notes/:id
 */
export const getNoteById = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  const noteId = req.params.id;
  
  const note = await noteService.getNoteById(userId, noteId);
  
  return sendSuccess(res, note);
};

/**
 * Update Note
 * 
 * Route: PUT /api/notes/:id
 */
export const updateNote = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  const noteId = req.params.id;
  
  const note = await noteService.updateNote(userId, noteId, req.body);
  
  return sendSuccess(
    res,
    note,
    'Note updated successfully'
  );
};

/**
 * Delete Note
 * 
 * Route: DELETE /api/notes/:id
 */
export const deleteNote = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  const noteId = req.params.id;
  
  await noteService.deleteNote(userId, noteId);
  
  return sendSuccess(
    res,
    null,
    'Note deleted successfully'
  );
};

/**
 * Toggle Pin
 * 
 * Route: PATCH /api/notes/:id/pin
 */
export const togglePin = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  const noteId = req.params.id;
  
  const note = await noteService.togglePin(userId, noteId);
  
  const message = note.isPinned ? 'Note pinned' : 'Note unpinned';
  
  return sendSuccess(res, note, message);
};

/**
 * Toggle Archive
 * 
 * Route: PATCH /api/notes/:id/archive
 */
export const toggleArchive = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  const noteId = req.params.id;
  
  const note = await noteService.toggleArchive(userId, noteId);
  
  const message = note.isArchived ? 'Note archived' : 'Note unarchived';
  
  return sendSuccess(res, note, message);
};

/**
 * Get Note Statistics
 * 
 * Route: GET /api/notes/stats
 */
export const getNoteStats = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  
  const stats = await noteService.getNoteStats(userId);
  
  return sendSuccess(res, stats);
};

/**
 * Get All Tags
 * 
 * Route: GET /api/notes/tags
 */
export const getAllTags = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId.toString();
  
  const tags = await noteService.getAllTags(userId);
  
  return sendSuccess(res, tags);
};