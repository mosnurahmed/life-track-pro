/**
 * User Model
 */

import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * User Interface
 */
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  name: string;
  avatar?: string;
  phoneNumber?: string;
  currency: string;
  monthlyBudget?: number;
  deviceTokens: string[];
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
}

/**
 * User Schema Definition
 */
const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email'
      ]
    },
    
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
    },
    
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters']
    },
    
    avatar: {
      type: String,
      default: null
    },
    
    phoneNumber: {
      type: String,
      default: null
    },
    
    currency: {
      type: String,
      default: 'BDT',
      enum: ['BDT', 'USD', 'EUR', 'INR', 'GBP']
    },
    
    monthlyBudget: {
      type: Number,
      default: null,
      min: [0, 'Budget cannot be negative']
    },
    
    deviceTokens: {
      type: [String],
      default: []
    },
    
    lastLogin: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function(_doc, ret) {
        const result = ret as any;
        delete result.password;
        delete result.__v;
        return result;
      }
    }
  }
);

/**
 * Pre-save Middleware
 * ✅ Fix: Don't use next() with async functions
 */
UserSchema.pre('save', async function() {
  // Only hash password if it's modified
  if (!this.isModified('password')) {
    return;  // ✅ Just return, no next()
  }
  
  // Hash password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Password Comparison Method
 */
UserSchema.methods.comparePassword = async function(
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

/**
 * Indexes
 */
UserSchema.index({ email: 1 });

/**
 * Create and export User model
 */
const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);

export default User;