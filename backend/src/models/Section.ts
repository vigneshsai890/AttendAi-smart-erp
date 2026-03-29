import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  year: { type: Number, default: 1 },
  batchYear: { type: Number, default: () => new Date().getFullYear() },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
}, { timestamps: true });

sectionSchema.index({ departmentId: 1 });

export const Section = mongoose.model('Section', sectionSchema);
