/**
 * Message Model
 * 
 * Purpose: Store chat messages between users
 * 
 * Features:
 * 1. One-to-one messaging
 * 2. Read receipts
 * 3. Message status tracking
 * 4. Timestamp tracking
 */

import mongoose, { Document, Schema } from 'mongoose';

/**
 * Message Interface
 */
export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  message: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Message Schema
 */
const MessageSchema = new Schema<IMessage>(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      minlength: [1, 'Message cannot be empty'],
      maxlength: [5000, 'Message cannot exceed 5000 characters']
    },
    
    isRead: {
      type: Boolean,
      default: false
    },
    
    readAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

/**
 * Virtual: Populate Sender Info
 */
MessageSchema.virtual('senderInfo', {
  ref: 'User',
  localField: 'senderId',
  foreignField: '_id',
  justOne: true
});

/**
 * Virtual: Populate Receiver Info
 */
MessageSchema.virtual('receiverInfo', {
  ref: 'User',
  localField: 'receiverId',
  foreignField: '_id',
  justOne: true
});

/**
 * Pre-save Hook
 * 
 * Purpose: Set readAt when isRead changes to true
 */
MessageSchema.pre('save', function() {
  if (this.isModified('isRead') && this.isRead && !this.readAt) {
    this.readAt = new Date();
  }
});

/**
 * Indexes for Performance
 * 
 * ✅ NO DUPLICATES - Each index defined only ONCE
 */
MessageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
MessageSchema.index({ receiverId: 1, isRead: 1 });

const Message = mongoose.model<IMessage>('Message', MessageSchema);

export default Message;
export { MessageSchema };