import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({
  sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  dayOfWeek: { type: Number, required: true }, // 0-6 (Sunday-Saturday)
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  room: { type: String, default: '' },
}, { timestamps: true });

scheduleSchema.index({ sectionId: 1, dayOfWeek: 1 });

export const Schedule = mongoose.model('Schedule', scheduleSchema);
