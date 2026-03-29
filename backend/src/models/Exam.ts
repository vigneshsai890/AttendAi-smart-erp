import mongoose from 'mongoose';

const examSchema = new mongoose.Schema({
  name: { type: String, required: true },
  courseCode: { type: String, required: true },
  maxMarks: { type: Number, required: true },
  date: { type: Date, default: null },
}, { timestamps: true });

export const Exam = mongoose.model('Exam', examSchema);
