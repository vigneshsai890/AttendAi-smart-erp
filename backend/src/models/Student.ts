import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  rollNumber: { type: String, required: true, unique: true },
  regNumber: { type: String, required: true },
  year: { type: Number, default: 1 },
  semester: { type: Number, default: 1 },
  batchYear: { type: Number, default: () => new Date().getFullYear() },
  sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
}, { timestamps: true });

studentSchema.index({ departmentId: 1 });
studentSchema.index({ sectionId: 1 });
studentSchema.index({ userId: 1 });

export const Student = mongoose.model('Student', studentSchema);
