import express from 'express';
import { Session } from '../models/Session';
import { Attendance } from '../models/Attendance';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-qr-key';

let io: any;
export const setIo = (socketIo: any) => {
  io = socketIo;
};

// POST /scan-attendance
router.post('/scan-attendance', async (req, res) => {
  try {
    const { token, studentId } = req.body;
    
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ success: false, error: 'QR Code Expired or Invalid' });
    }

    const { sessionId } = decoded;

    const session = await Session.findById(sessionId);
    if (!session || !session.isActive) {
      return res.status(400).json({ success: false, error: 'Session is inactive or not found' });
    }

    const existing = await Attendance.findOne({ sessionId, studentId });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Attendance already marked' });
    }

    const attendance = await Attendance.create({
      sessionId,
      studentId,
      status: 'PRESENT'
    });

    await attendance.populate('studentId', 'name email role');

    if (io) {
      io.to(sessionId.toString()).emit('attendance_marked', attendance);
    }

    res.status(200).json({ success: true, message: 'Attendance recorded successfully!', attendance });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// GET /attendance-live/:sessionId
router.get('/live/:sessionId', async (req, res) => {
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
