import mongoose from 'mongoose';

const examResultSchema = new mongoose.Schema({
  studentRoll: { type: String, required: true },
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  marks: { type: Number, required: true },
  grade: { type: String, default: null },
}, { timestamps: true });

examResultSchema.index({ studentRoll: 1 });
examResultSchema.index({ examId: 1 });

export const ExamResult = mongoose.model('ExamResult', examResultSchema);
