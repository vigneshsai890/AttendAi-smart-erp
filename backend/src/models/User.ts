import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['ADMIN', 'FACULTY', 'STUDENT'], required: true },
  passwordHash: { type: String, required: true },
});

userSchema.index({ role: 1 }); // Optimize queries filtering by role

export const User = mongoose.model('User', userSchema);
