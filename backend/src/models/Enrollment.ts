import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  academicYear: { type: Number, default: () => new Date().getFullYear() },
  semester: { type: Number, default: 1 },
  status: { type: String, enum: ['ACTIVE', 'COMPLETED', 'DROPPED'], default: 'ACTIVE' },
  grade: { type: String, default: null },
}, { timestamps: true });

enrollmentSchema.index({ courseId: 1, studentId: 1 }, { unique: true });
enrollmentSchema.index({ studentId: 1 });

export const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
