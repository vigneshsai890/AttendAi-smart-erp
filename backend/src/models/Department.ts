import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
}, { timestamps: true });

export const Department = mongoose.model('Department', departmentSchema);
