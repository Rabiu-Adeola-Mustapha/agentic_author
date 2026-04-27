import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  isVerified: boolean;
  createdAt: Date;
  subscription: {
    plan: 'free' | 'pro';
    status: 'active' | 'inactive';
    expiresAt?: Date;
  };
  passwordResetToken?: string;
  passwordResetExpires?: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    subscription: {
      plan: {
        type: String,
        enum: ['free', 'pro'],
        default: 'free',
      },
      status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'inactive',
      },
      expiresAt: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    passwordResetToken: {
      type: String,
      default: null,
    },
    passwordResetExpires: {
      type: Date,
      default: null,
    },
  },
  { timestamps: false }
);

// Redundant index removed

export const UserModel =
  mongoose.models.User ||
  mongoose.model<IUser>('User', userSchema);
