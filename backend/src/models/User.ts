import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, default: null },
  registrationId: { type: String, unique: true, sparse: true },
  role: { type: String, enum: ['ADMIN', 'FACULTY', 'STUDENT'], required: true },
  passwordHash: { type: String, required: true },
  avatar: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String, default: null },
}, { timestamps: true });

userSchema.index({ role: 1 });

export const User = mongoose.model('User', userSchema);
