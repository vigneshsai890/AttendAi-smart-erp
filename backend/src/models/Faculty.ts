import mongoose from 'mongoose';

const facultySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  employeeId: { type: String, required: true, unique: true },
  designation: { type: String, default: 'Assistant Professor' },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
}, { timestamps: true });

facultySchema.index({ departmentId: 1 });
facultySchema.index({ userId: 1 });

export const Faculty = mongoose.model('Faculty', facultySchema);
