import mongoose from 'mongoose';

const courseAssignmentSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true },
  academicYear: { type: Number, required: true },
  semester: { type: Number, required: true },
}, { timestamps: true });

courseAssignmentSchema.index({ courseId: 1, facultyId: 1 });

export const CourseAssignment = mongoose.model('CourseAssignment', courseAssignmentSchema);
