import mongoose from 'mongoose';

const attendanceRecordSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AttendanceSession', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Legacy field
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: { type: String, enum: ['PRESENT', 'ABSENT', 'LATE', 'PROXY'], default: 'PRESENT' },
  markedAt: { type: Date, default: Date.now },
  deviceFingerprint: { type: String, default: null },
  ipAddress: { type: String, default: null },
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  riskScore: { type: Number, default: 0 },
  flagged: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

attendanceRecordSchema.index({ sessionId: 1, userId: 1 }, { unique: true });
attendanceRecordSchema.index({ userId: 1 });
attendanceRecordSchema.index({ sessionId: 1 });

export const AttendanceRecord = mongoose.model('AttendanceRecord', attendanceRecordSchema);
// Keep backward compat alias
export const Attendance = AttendanceRecord;
