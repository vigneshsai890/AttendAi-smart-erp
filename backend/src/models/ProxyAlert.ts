import mongoose from 'mongoose';

const proxyAlertSchema = new mongoose.Schema({
  recordId: { type: mongoose.Schema.Types.ObjectId, ref: 'AttendanceRecord', required: true },
  alertType: { type: String, enum: ['TIMING', 'LOCATION', 'BUDDY_PATTERN', 'DEVICE', 'VELOCITY'], required: true },
  severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
  description: { type: String, default: '' },
  status: { type: String, enum: ['PENDING', 'REVIEWED', 'DISMISSED'], default: 'PENDING' },
}, { timestamps: true });

proxyAlertSchema.index({ recordId: 1 });

export const ProxyAlert = mongoose.model('ProxyAlert', proxyAlertSchema);
