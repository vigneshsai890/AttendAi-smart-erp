import mongoose from 'mongoose';

const attendanceSessionSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: false }, // Relaxed for custom subjects
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true },
  sessionDate: { type: Date, default: Date.now },
  startTime: { type: String, default: '' },
  endTime: { type: String, default: '' },
  department: { type: String, default: '' },
  section: { type: String, default: '' },
  period: { type: String, default: '' },
  qrCode: { type: String, default: null },
  qrExpiry: { type: Date, default: null },
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  geoRadius: { type: Number, default: 100 },
  status: { type: String, enum: ['ACTIVE', 'CLOSED'], default: 'ACTIVE' },
  // Legacy field for backward compat with old Session model
  courseName: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

attendanceSessionSchema.index({ courseId: 1, status: 1 });
attendanceSessionSchema.index({ facultyId: 1 });

export const AttendanceSession = mongoose.model('AttendanceSession', attendanceSessionSchema);
// Keep backward compat alias
export const Session = AttendanceSession;
