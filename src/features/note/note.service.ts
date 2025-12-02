/**
 * Note Service
 */

import Note, { INote } from './note.model';
import { NotFoundError } from '../../shared/utils/error.util';
import mongoose from 'mongoose';

/**
 * Create Note DTO
 */
export interface CreateNoteDTO {
  title: string;
  content: string;
  tags?: string[];
  color?: string;
  isPinned?: boolean;
  isArchived?: boolean;
}

/**
 * Update Note DTO
 */
export interface UpdateNoteDTO extends Partial<CreateNoteDTO> {}

/**
 * Note Filters
 */
export interface NoteFilters {
  tags?: string;
  isPinned?: boolean;
  isArchived?: boolean;
  search?: string;
  color?: string;
}

/**
 * Create Note
 */
export const createNote = async (
  userId: string,
  data: CreateNoteDTO
): Promise<INote> => {
  const note = await Note.create({
    ...data,
    userId: new mongoose.Types.ObjectId(userId)
  });
  
  return note;
};

/**
 * Get Notes with Filters
 * 
 * Purpose: 
 * 1. Filter by archived status
 * 2. Filter by tags
 * 3. Search in title/content
 * 4. Sort: Pinned first, then by date
 */
export const getNotes = async (
  userId: string,
  filters: NoteFilters = {}
): Promise<INote[]> => {
  const query: any = {
    userId: new mongoose.Types.ObjectId(userId)
  };
  
  // Archived filter (default: show only active)
  if (filters.isArchived !== undefined) {
    query.isArchived = filters.isArchived;
  } else {
    query.isArchived = false;  // Default: exclude archived
  }
  
  // Pinned filter
  if (filters.isPinned !== undefined) {
    query.isPinned = filters.isPinned;
  }
  
  // Tags filter
  if (filters.tags) {
    const tagArray = filters.tags.split(',').map(t => t.trim());
    query.tags = { $in: tagArray };
  }
  
  // Color filter
  if (filters.color) {
    query.color = filters.color;
  }
  
  // Text search (uses text index)
  if (filters.search) {
    query.$text = { $search: filters.search };
  }
  
  // Sort: Pinned first, then by date (newest first)
  const notes = await Note.find(query)
    .sort({ isPinned: -1, createdAt: -1 });
  
  return notes;
};

/**
 * Get Single Note
 */
export const getNoteById = async (
  userId: string,
  noteId: string
): Promise<INote> => {
  const note = await Note.findOne({
    _id: new mongoose.Types.ObjectId(noteId),
    userId: new mongoose.Types.ObjectId(userId)
  });
  
  if (!note) {
    throw new NotFoundError('Note not found');
  }
  
  return note;
};

/**
 * Update Note
 */
export const updateNote = async (
  userId: string,
  noteId: string,
  data: UpdateNoteDTO
): Promise<INote> => {
  const note = await Note.findOne({
    _id: new mongoose.Types.ObjectId(noteId),
    userId: new mongoose.Types.ObjectId(userId)
  });
  
  if (!note) {
    throw new NotFoundError('Note not found');
  }
  
  Object.assign(note, data);
  await note.save();
  
  return note;
};

/**
 * Delete Note
 */
export const deleteNote = async (
  userId: string,
  noteId: string
): Promise<void> => {
  const note = await Note.findOne({
    _id: new mongoose.Types.ObjectId(noteId),
    userId: new mongoose.Types.ObjectId(userId)
  });
  
  if (!note) {
    throw new NotFoundError('Note not found');
  }
  
  await note.deleteOne();
};

/**
 * Toggle Pin
 * 
 * Quick action to pin/unpin note
 */
export const togglePin = async (
  userId: string,
  noteId: string
): Promise<INote> => {
  const note = await Note.findOne({
    _id: new mongoose.Types.ObjectId(noteId),
    userId: new mongoose.Types.ObjectId(userId)
  });
  
  if (!note) {
    throw new NotFoundError('Note not found');
  }
  
  note.isPinned = !note.isPinned;
  await note.save();
  
  return note;
};

/**
 * Toggle Archive
 * 
 * Quick action to archive/unarchive note
 */
export const toggleArchive = async (
  userId: string,
  noteId: string
): Promise<INote> => {
  const note = await Note.findOne({
    _id: new mongoose.Types.ObjectId(noteId),
    userId: new mongoose.Types.ObjectId(userId)
  });
  
  if (!note) {
    throw new NotFoundError('Note not found');
  }
  
  note.isArchived = !note.isArchived;
  
  // If archiving, also unpin
  if (note.isArchived) {
    note.isPinned = false;
  }
  
  await note.save();
  
  return note;
};

/**
 * Get Note Statistics
 */
export const getNoteStats = async (userId: string) => {
  const notes = await Note.find({
    userId: new mongoose.Types.ObjectId(userId)
  });
  
  // Get unique tags
  const allTags = notes.flatMap(note => note.tags);
  const uniqueTags = [...new Set(allTags)];
  
  // Tag frequency
  const tagFrequency: { [key: string]: number } = {};
  allTags.forEach(tag => {
    tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
  });
  
  // Sort tags by frequency
  const popularTags = Object.entries(tagFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));
  
  const stats = {
    total: notes.length,
    active: notes.filter(n => !n.isArchived).length,
    archived: notes.filter(n => n.isArchived).length,
    pinned: notes.filter(n => n.isPinned).length,
    totalTags: uniqueTags.length,
    popularTags
  };
  
  return stats;
};

/**
 * Get All Tags
 * 
 * Returns all unique tags used by user
 */
export const getAllTags = async (userId: string): Promise<string[]> => {
  const notes = await Note.find({
    userId: new mongoose.Types.ObjectId(userId)
  }).select('tags');
  
  const allTags = notes.flatMap(note => note.tags);
  const uniqueTags = [...new Set(allTags)];
  
  return uniqueTags.sort();
};