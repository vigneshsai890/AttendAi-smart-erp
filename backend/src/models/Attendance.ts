import mongoose from 'mongoose';

const attendanceRecordSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AttendanceSession', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  status: { type: String, enum: ['PRESENT', 'ABSENT', 'LATE', 'PROXY'], default: 'PRESENT', index: true },
  markedAt: { type: Date, default: Date.now, index: true },
  deviceFingerprint: { type: String, default: null },
  ipAddress: { type: String, default: null },
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  riskScore: { type: Number, default: 0, index: true },
  flagged: { type: Boolean, default: false, index: true },
}, { timestamps: true });

attendanceRecordSchema.index({ sessionId: 1, userId: 1 }, { unique: true });

export const AttendanceRecord = mongoose.model('AttendanceRecord', attendanceRecordSchema);
// Keep backward compat alias
export const Attendance = AttendanceRecord;
