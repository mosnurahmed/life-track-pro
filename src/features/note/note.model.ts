/**
 * Note Model
 * 
 * Purpose: Store text notes with organization features
 * 
 * Features:
 * 1. Rich text content
 * 2. Tag-based categorization
 * 3. Color coding for visual organization
 * 4. Pin important notes
 * 5. Archive old notes
 * 6. Search capabilities
 */

import mongoose, { Document, Schema } from 'mongoose';

/**
 * Note Interface
 */
export interface INote extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  tags: string[];
  color: string;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Note Schema
 */
const NoteSchema = new Schema<INote>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [1, 'Title must be at least 1 character'],
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    
    content: {
      type: String,
      required: [true, 'Content is required'],
      maxlength: [50000, 'Content cannot exceed 50,000 characters']
    },
    
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function(tags: string[]) {
          return tags.length <= 20;
        },
        message: 'Maximum 20 tags allowed'
      }
    },
    
    color: {
      type: String,
      default: '#FFFFFF',
      match: [/^#[0-9A-F]{6}$/i, 'Please provide valid hex color']
    },
    
    isPinned: {
      type: Boolean,
      default: false,
      index: true
    },
    
    isArchived: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

/**
 * Indexes for Performance
 * 
 * Purpose:
 * 1. User + pinned/archived for filtering
 * 2. Tags for tag-based search
 * 3. Text index for full-text search
 */
NoteSchema.index({ userId: 1, isPinned: -1, createdAt: -1 });
NoteSchema.index({ userId: 1, isArchived: 1 });
NoteSchema.index({ userId: 1, tags: 1 });

// Text index for searching title and content
NoteSchema.index({ title: 'text', content: 'text' });

const Note = mongoose.model<INote>('Note', NoteSchema);

export default Note;
