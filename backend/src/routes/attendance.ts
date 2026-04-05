import express, { Request, Response } from 'express';
import { Session } from '../models/Session.js';
import { Attendance } from '../models/Attendance.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-qr-key';

// Socket.io reference – set externally via setIo()
let io: any;
export const setIo = (socketIo: any) => {
  io = socketIo;
};

// ---------------------------------------------------------------------------
// Haversine distance (meters)
// ---------------------------------------------------------------------------
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// POST /scan-attendance
router.post('/scan-attendance', async (req: Request, res: Response) => {
  try {
    const { token, studentId, latitude, longitude, deviceFingerprint } = req.body;

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ success: false, error: 'QR Code Expired or Invalid' });
    }

    const { sessionId } = decoded;

    const session = await Session.findById(sessionId);
    if (!session || session.status !== 'ACTIVE') {
      return res.status(400).json({ success: false, error: 'Session is inactive or not found' });
    }

    // 1. Check for Duplicate Attendance
    const existing = await Attendance.findOne({ sessionId, studentId });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Attendance already marked' });
    }

    // 2. Geo-fencing Check
    let status = 'PRESENT';
    let flagged = false;
    let riskScore = 0;

    if (session.latitude && session.longitude) {
      if (!latitude || !longitude) {
        return res.status(400).json({ success: false, error: 'Location data is required for this session' });
      }

      const distance = getDistance(session.latitude, session.longitude, latitude, longitude);
      if (distance > (session.geoRadius || 100)) {
        flagged = true;
        riskScore += 50;
        status = 'PROXY'; // Mark as proxy if way off
      }
    }

    // 3. Device Fingerprinting Check (preventing multiple students using same device)
    if (deviceFingerprint) {
      const sameDevice = await Attendance.findOne({ sessionId, deviceFingerprint });
      if (sameDevice) {
        flagged = true;
        riskScore += 40;
        // status = 'PROXY'; // Still let them mark, but flag it
      }
    }

    const attendance = await Attendance.create({
      sessionId,
      studentId,
      userId: studentId, // Ensure userId is populated for the model
      status,
      latitude,
      longitude,
      deviceFingerprint,
      flagged,
      riskScore,
      markedAt: new Date()
    });

    await attendance.populate('studentId', 'name email role');

    if (io) {
      io.to(sessionId.toString()).emit('attendance_marked', attendance);
    }

    res.status(200).json({
      success: true,
      message: status === 'PROXY' ? 'Attendance marked (FLAGGED)' : 'Attendance recorded successfully!',
      attendance
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// GET /attendance-live/:sessionId
router.get('/live/:sessionId', async (req: Request, res: Response) => {
  try {
    // Limit to 500 records to prevent payload crash if 5k students check in, sort by most recent
    const records = await Attendance.find({ sessionId: req.params.sessionId })
        .populate('studentId', 'name email role')
        .sort({ timestamp: -1 })
        .limit(500);
    res.json({ success: true, records });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export const attendanceRouter = router;
