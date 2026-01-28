import mongoose, { Schema, Document, Model } from 'mongoose';
import type { UserRole } from '@/lib/auth';

/**
 * User document interface
 */
export interface IUser extends Document {
  email: string;
  name?: string;
  role: UserRole;
  addresses: mongoose.Types.ObjectId[];
  wishlist: mongoose.Types.ObjectId[];
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User schema definition
 */
const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['admin', 'customer'],
      required: true,
      default: 'customer',
    },
    addresses: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Address',
      },
    ],
    wishlist: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    passwordHash: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Export User model safely for Next.js
 * Prevents recompilation issues in development
 */
const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
