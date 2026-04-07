import mongoose from 'mongoose';

export interface IUser extends mongoose.Document {
  firebaseUid?: string;
  name: string;
  email: string;
  phoneNumber?: string;
  registrationId?: string;
  role: 'ADMIN' | 'FACULTY' | 'STUDENT';
  passwordHash?: string;
  avatar?: string;
  isActive: boolean;
  isProfileComplete: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, unique: true, sparse: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, default: null },
  registrationId: { type: String, unique: true, sparse: true },
  role: { type: String, enum: ['ADMIN', 'FACULTY', 'STUDENT'], required: true },
  passwordHash: { type: String, default: null }, // Made optional for Firebase users
  avatar: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  isProfileComplete: { type: Boolean, default: false },
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String, default: null },
}, { timestamps: true });

userSchema.index({ role: 1 });

export const User = mongoose.model<IUser>('User', userSchema, 'user');
