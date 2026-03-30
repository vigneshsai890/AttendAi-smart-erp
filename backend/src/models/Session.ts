import mongoose from 'mongoose';

const attendanceSessionSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: false, index: true },
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true, index: true },
  sessionDate: { type: Date, default: Date.now, index: true },
  startTime: { type: String, default: '' },
  endTime: { type: String, default: '' },
  department: { type: String, default: '' },
  section: { type: String, default: '' },
  period: { type: String, default: '' },
  qrCode: { type: String, default: null, index: true },
  qrExpiry: { type: Date, default: null },
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  geoRadius: { type: Number, default: 100 },
  status: { type: String, enum: ['ACTIVE', 'CLOSED'], default: 'ACTIVE', index: true },
  courseName: { type: String, default: '' },
}, { timestamps: true });

attendanceSessionSchema.index({ courseId: 1, status: 1 });

export const AttendanceSession = mongoose.model('AttendanceSession', attendanceSessionSchema);
// Keep backward compat alias
export const Session = AttendanceSession;
