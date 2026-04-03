import express from 'express';
import { Session } from '../models/Session.js';
import { Course } from '../models/Course.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secure-qr-key';

// 1. Get real courses
router.get('/courses', async (req, res) => {
  try {
    const courses = await Course.find().sort({ name: 1 });
    res.json({ success: true, courses });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// 2. Create a session
router.post('/create', async (req, res) => {
  try {
    const { courseName, facultyId } = req.body;
    // ULTRAMAX: Using consolidated status field
    const session = await Session.create({
      courseName,
      facultyId,
      status: 'ACTIVE'
    });
    res.status(201).json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// 3. Generate a dynamic QR code token
router.get('/generate-qr/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findById(sessionId);
    if (!session || session.status !== 'ACTIVE') {
      return res.status(400).json({ success: false, error: 'Session is inactive or not found' });
    }

    // Sign a token that expires in 15 seconds (to prevent proxy)
    const timestamp = Date.now();
    const token = jwt.sign(
      { sessionId, timestamp },
      JWT_SECRET,
      { expiresIn: '15s' }
    );

    res.json({ success: true, token, sessionId });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// 4. End Session
router.post('/end/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        // ULTRAMAX: Update status to CLOSED
        const session = await Session.findByIdAndUpdate(
          sessionId,
          { status: 'CLOSED' },
          { new: true }
        );
        res.json({ success: true, session });
    } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
    }
});

export const sessionRouter = router;
