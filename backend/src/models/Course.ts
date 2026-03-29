import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  credits: { type: Number, default: 3 },
  courseType: { type: String, enum: ['LECTURE', 'LAB', 'TUTORIAL', 'PRACTICAL', 'WORKSHOP', 'STUDIO'], default: 'LECTURE' },
  department: { type: String, required: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  semester: { type: Number, default: 1 },
}, { timestamps: true });

export const Course = mongoose.model('Course', courseSchema);
