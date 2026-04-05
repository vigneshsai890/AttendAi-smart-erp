import express, { Request, Response } from 'express';
import { AttendanceSession } from '../models/Session.js';
import { AttendanceRecord } from '../models/Attendance.js';
import { Faculty } from '../models/Faculty.js';
import { Student } from '../models/Student.js';
import { Enrollment } from '../models/Enrollment.js';
import { Course } from '../models/Course.js';
import { User } from '../models/User.js';
import { ProxyAlert } from '../models/ProxyAlert.js';
import { Notification } from '../models/Notification.js';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import mongoose from 'mongoose';

const router = express.Router();

// ULTRAMAX Sanitizers
const isValidId = (id: any) => typeof id === 'string' && mongoose.Types.ObjectId.isValid(id);
const cleanStr = (str: any) => (typeof str === 'string' ? str : '');

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

// ---------------------------------------------------------------------------
// Helper: current time as HH:MM
// ---------------------------------------------------------------------------
function nowHHMM(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

// ========================== SESSION ROUTES =================================

// ---------------------------------------------------------------------------
// POST /session/create
// ---------------------------------------------------------------------------
router.post('/session/create', async (req: Request, res: Response) => {
  try {
    const { courseId, facultyUserId, latitude, longitude, geoRadius, department, section, period, courseName } = req.body;

    const faculty = await Faculty.findOne({ userId: facultyUserId });
    if (!faculty) {
      return res.status(404).json({ error: 'Faculty not found for this user' });
    }

    const session = await AttendanceSession.create({
      courseId: courseId || null,
      facultyId: faculty._id,
      sessionDate: new Date(),
      startTime: nowHHMM(),
      endTime: '',
      department: department || '',
      section: section || '',
      period: period || '',
      courseName: courseName || '',
      qrCode: uuidv4(),
      qrExpiry: new Date(Date.now() + 15 * 1000),
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      geoRadius: geoRadius ?? 100,
      status: 'ACTIVE',
    });

    return res.status(201).json({ success: true, session });
  } catch (error) {
    return res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ---------------------------------------------------------------------------
// PATCH /session/update
// ---------------------------------------------------------------------------
router.patch('/session/update', async (req: Request, res: Response) => {
  try {
    const { sessionId, action } = req.body;

    if (!sessionId || !action) {
      return res.status(400).json({ error: 'sessionId and action are required' });
    }

    const session = await AttendanceSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (action === 'REFRESH_QR') {
      session.qrCode = uuidv4();
      session.qrExpiry = new Date(Date.now() + 15 * 1000);
      await session.save();

      return res.json({
        success: true,
        qrCode: session.qrCode,
        qrExpiry: session.qrExpiry,
      });
    }

    if (action === 'CLOSE') {
      session.status = 'CLOSED';
      session.endTime = nowHHMM();
      session.qrCode = null as any;
      session.qrExpiry = null as any;
      await session.save();

      return res.json({ success: true, message: 'Session closed', session });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });
  } catch (error) {
    return res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ---------------------------------------------------------------------------
// POST /session/start
// ---------------------------------------------------------------------------
router.post('/session/start', async (req: Request, res: Response) => {
  try {
    const { courseId, facultyUserId, latitude, longitude, geoRadius } = req.body;

    const faculty = await Faculty.findOne({ userId: facultyUserId });
    if (!faculty) {
      return res.status(403).json({ error: 'Faculty profile not found for this user' });
    }

    // Ensure no active session already exists for this faculty + course
    const existingSession = await AttendanceSession.findOne({
      facultyId: faculty._id,
      courseId,
      status: 'ACTIVE',
    });
    if (existingSession) {
      return res.status(409).json({
        error: 'An active session already exists for this course',
        sessionId: existingSession._id,
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const qrToken = crypto.randomBytes(16).toString('hex');
    const qrExpiry = new Date(Date.now() + 60 * 1000);

    const session = await AttendanceSession.create({
      courseId,
      facultyId: faculty._id,
      sessionDate: new Date(),
      startTime: nowHHMM(),
      endTime: '',
      qrCode: qrToken,
      qrExpiry,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      geoRadius: geoRadius ?? 100,
      status: 'ACTIVE',
      courseName: course.name,
    });

    return res.status(201).json({
      success: true,
      sessionId: session._id,
      qrToken,
      qrExpiry,
      courseName: course.name,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ---------------------------------------------------------------------------
// POST /session/end
// ---------------------------------------------------------------------------
router.post('/session/end', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;

    const session = await AttendanceSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Get enrolled students for this course (ACTIVE enrollments)
    const enrollments = await Enrollment.find({
      courseId: session.courseId,
      status: 'ACTIVE',
    }).populate('studentId');

    // Get existing attendance records for this session
    const existingRecords = await AttendanceRecord.find({ sessionId: session._id });
    const markedUserIds = new Set(existingRecords.map((r) => r.userId?.toString()));

    // Mark absent students who have not been recorded yet
    const absentRecords: any[] = [];
    for (const enrollment of enrollments) {
      const student = enrollment.studentId as any;
      if (!student || !student.userId) continue;

      const studentUserId = student.userId.toString();
      if (!markedUserIds.has(studentUserId)) {
        absentRecords.push({
          sessionId: session._id,
          userId: student.userId,
          studentId: student.userId,
          status: 'ABSENT',
          markedAt: new Date(),
          riskScore: 0,
          flagged: false,
        });
      }
    }

    if (absentRecords.length > 0) {
      await AttendanceRecord.insertMany(absentRecords, { ordered: false }).catch(() => {
        // Ignore duplicate key errors for edge cases
      });
    }

    // Close session
    session.status = 'CLOSED';
    session.endTime = nowHHMM();
    session.qrCode = null as any;
    session.qrExpiry = null as any;
    await session.save();

    const totalEnrolled = enrollments.length;
    const presentCount = existingRecords.filter(
      (r) => r.status === 'PRESENT' || r.status === 'LATE' || r.status === 'PROXY'
    ).length;
    const absentCount = totalEnrolled - presentCount;

    return res.json({
      success: true,
      summary: {
        total: totalEnrolled,
        present: presentCount,
        absent: absentCount,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ---------------------------------------------------------------------------
// POST /session/rotate
// ---------------------------------------------------------------------------
router.post('/session/rotate', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;

    const session = await AttendanceSession.findById(sessionId);
    if (!session || session.status !== 'ACTIVE') {
      return res.status(404).json({ error: 'Active session not found' });
    }

    const qrToken = crypto.randomBytes(16).toString('hex');
    const qrExpiry = new Date(Date.now() + 60 * 1000);

    session.qrCode = qrToken;
    session.qrExpiry = qrExpiry;
    await session.save();

    return res.json({ success: true, qrToken, qrExpiry });
  } catch (error) {
    return res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ---------------------------------------------------------------------------
// GET /session/:id/qr
// ---------------------------------------------------------------------------
router.get('/session/:id/qr', async (req: Request, res: Response) => {
  try {
    const session = await AttendanceSession.findById(req.params.id).populate('courseId');
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Session is not active' });
    }

    if (!session.qrCode) {
      return res.status(400).json({ error: 'No active QR code for this session' });
    }

    const payload = JSON.stringify({
      sessionId: session._id,
      token: session.qrCode,
      exp: session.qrExpiry,
      subject: session.courseName || '',
      period: session.period || '',
      department: session.department || '',
      section: session.section || '',
    });

    const qrDataUrl = await QRCode.toDataURL(payload);

    return res.json({
      success: true,
      qrDataUrl,
      sessionId: session._id,
      token: session.qrCode,
      expiresAt: session.qrExpiry,
      courseName: session.courseName || '',
      period: session.period || '',
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ======================== MARK ATTENDANCE ==================================

// ---------------------------------------------------------------------------
// POST /mark
// ---------------------------------------------------------------------------
router.post('/mark', async (req: Request, res: Response) => {
  try {
    const { sessionId, qrToken, userId, latitude, longitude, deviceFingerprint, ip } = req.body;

    // Find session
    const session = await AttendanceSession.findById(sessionId).populate('courseId');
    if (!session || session.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Session is not active or not found' });
    }

    // Validate QR token
    if (session.qrCode !== qrToken) {
      return res.status(400).json({ error: 'Invalid QR token' });
    }

    // Check expiry
    if (session.qrExpiry && new Date() > new Date(session.qrExpiry)) {
      return res.status(400).json({ error: 'QR code has expired' });
    }

    // Check duplicate
    const existing = await AttendanceRecord.findOne({ sessionId: session._id, userId });
    if (existing) {
      return res.status(409).json({ error: 'Attendance already marked for this session' });
    }

    // ---- Proxy detection (STRICT) ----
    let riskScore = 0;
    const flags: string[] = [];

    // 1. Geo check - HARD FAIL if way off, FLAG if slightly off
    if (
      session.latitude != null &&
      session.longitude != null &&
      latitude != null &&
      longitude != null
    ) {
      const distance = getDistance(session.latitude, session.longitude, latitude, longitude);
      const radius = session.geoRadius ?? 100;

      if (distance > 2000) { // HARD FAIL: > 2km away
        return res.status(403).json({
          error: 'Location verification failed: You are too far from the classroom.',
          distance: Math.round(distance)
        });
      }

      if (distance > radius) {
        riskScore += 45;
        flags.push(`LOCATION: ${Math.round(distance)}m away (radius ${radius}m)`);
      }
    } else if (session.latitude != null) {
      // Require location if session has it set
      return res.status(400).json({ error: 'Location data is required for this session.' });
    }

    // 2. Device check – Strict binding: One device per student per session
    if (deviceFingerprint) {
      const deviceCount = await AttendanceRecord.countDocuments({
        sessionId: session._id,
        deviceFingerprint,
      });
      
      if (deviceCount >= 2) {
        riskScore += 80; // CRITICAL THREAT
        flags.push(`DEVICE_REUSE: This device (ID: ${deviceFingerprint.slice(0,8)}) has been used for ${deviceCount + 1} scans.`);
      } else if (deviceCount === 1) {
        riskScore += 40;
        flags.push('DEVICE_SHARING: Device already used by another student.');
      }
    } else {
      riskScore += 20;
      flags.push('SECURITY: Device fingerprint missing');
    }

    // 3. IP clustering – STRICT: Flag if IP is used more than twice
    if (ip && ip !== 'unknown') {
      const ipCount = await AttendanceRecord.countDocuments({
        sessionId: session._id,
        ipAddress: ip,
      });
      if (ipCount >= 2) {
        riskScore += 50;
        flags.push(`IP_EXCESSIVE: Multiple scans (${ipCount + 1}) from IP ${ip}. Possible hotspot proxy.`);
      }
    }

    // 4. QR timing – marked in the last 5 seconds before expiry
    if (session.qrExpiry) {
      const timeToExpiry = new Date(session.qrExpiry).getTime() - Date.now();
      if (timeToExpiry >= 0 && timeToExpiry <= 5000) {
        riskScore += 15;
        flags.push('TIMING: Marked in final 5 seconds before QR expiry');
      }
    }

    const isFlagged = riskScore >= 50;
    const status = isFlagged ? 'PROXY' : 'PRESENT';

    // Create attendance record
    const record = await AttendanceRecord.create({
      sessionId: session._id,
      userId,
      studentId: userId,
      status,
      markedAt: new Date(),
      deviceFingerprint: deviceFingerprint ?? null,
      ipAddress: ip ?? null,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      riskScore,
      flagged: isFlagged,
    });

    // Create proxy alerts if flagged
    if (isFlagged) {
      const alertDocs: any[] = [];
      for (const flag of flags) {
        let alertType: string = 'TIMING';
        let severity: string = 'MEDIUM';

        if (flag.startsWith('LOCATION')) {
          alertType = 'LOCATION';
          severity = 'HIGH';
        } else if (flag.startsWith('DEVICE')) {
          alertType = 'DEVICE';
          severity = 'HIGH';
        } else if (flag.startsWith('IP_CLUSTER')) {
          alertType = 'BUDDY_PATTERN';
          severity = 'MEDIUM';
        } else if (flag.startsWith('TIMING')) {
          alertType = 'TIMING';
          severity = 'LOW';
        }

        alertDocs.push({
          recordId: record._id,
          alertType,
          severity,
          description: flag,
          status: 'PENDING',
        });
      }
      if (alertDocs.length > 0) {
        await ProxyAlert.insertMany(alertDocs);
      }
    }

    // Fetch user info for socket emission
    const user = await User.findById(userId, 'name email role');
    if (io) {
      io.to(sessionId.toString()).emit('attendance_marked', {
        _id: record._id,
        sessionId: record.sessionId,
        userId: record.userId,
        status: record.status,
        riskScore: record.riskScore,
        flagged: record.flagged,
        markedAt: record.markedAt,
        flags: flags || [],
        user: user ? { name: user.name, email: user.email, role: user.role } : null,
      });
    }

    const course = session.courseId as any;
    const courseName = course?.name ?? session.courseName ?? '';

    return res.status(201).json({
      success: true,
      status,
      riskScore,
      flagged: isFlagged,
      flags,
      courseName,
      message: isFlagged
        ? 'Attendance recorded but flagged for proxy review'
        : 'Attendance marked successfully',
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ======================== LIVE VIEW ========================================

// ---------------------------------------------------------------------------
// GET /live
// ---------------------------------------------------------------------------
router.get('/live', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId query parameter is required' });
    }

    const session = await AttendanceSession.findById(sessionId).populate('courseId');
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const records = await AttendanceRecord.find({ sessionId: session._id })
      .populate({ path: 'userId', select: 'name email role' })
      .sort({ markedAt: -1 })
      .limit(500);

    // Gather userId values for student lookup
    const userIds = records
      .filter((r) => r.status === 'PRESENT' || r.status === 'PROXY')
      .map((r) => r.userId);

    const students = await Student.find({ userId: { $in: userIds } }, 'userId rollNumber');
    const rollMap = new Map<string, string>();
    for (const s of students) {
      rollMap.set(s.userId.toString(), s.rollNumber);
    }

    const presentRecords = records
      .filter((r) => r.status === 'PRESENT' || r.status === 'PROXY')
      .map((r) => {
        const userObj = r.userId as any;
        return {
          _id: r._id,
          userId: userObj?._id ?? r.userId,
          name: userObj?.name ?? null,
          email: userObj?.email ?? null,
          rollNumber: rollMap.get((userObj?._id ?? r.userId).toString()) ?? null,
          status: r.status,
          riskScore: r.riskScore,
          flagged: r.flagged,
          markedAt: r.markedAt,
        };
      });

    const course = session.courseId as any;

    return res.json({
      success: true,
      sessionId: session._id,
      status: session.status,
      courseName: course?.name ?? session.courseName ?? '',
      courseCode: course?.code ?? '',
      totalPresent: presentRecords.length,
      records: presentRecords,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ======================== ALERT EMAIL ======================================

// ---------------------------------------------------------------------------
// POST /alert-email
// ---------------------------------------------------------------------------
router.post('/alert-email', async (req: Request, res: Response) => {
  try {
    const { courseId, threshold = 80 } = req.body;

    if (!courseId) {
      return res.status(400).json({ error: 'courseId is required' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Count total closed sessions for this course
    const totalSessions = await AttendanceSession.countDocuments({
      courseId,
      status: 'CLOSED',
    });

    if (totalSessions === 0) {
      return res.json({
        success: true,
        threshold,
        totalSessions: 0,
        totalStudents: 0,
        alertsSent: 0,
        alerts: [],
      });
    }

    // Get enrolled students
    const enrollments = await Enrollment.find({
      courseId,
      status: 'ACTIVE',
    }).populate('studentId');

    // Gather all closed session IDs for this course
    const closedSessions = await AttendanceSession.find(
      { courseId, status: 'CLOSED' },
      '_id'
    );
    const sessionIds = closedSessions.map((s) => s._id);

    // Get attendance records grouped by userId for present/late statuses
    const attendanceAgg = await AttendanceRecord.aggregate([
      {
        $match: {
          sessionId: { $in: sessionIds },
          status: { $in: ['PRESENT', 'LATE'] },
        },
      },
      {
        $group: {
          _id: '$userId',
          count: { $sum: 1 },
        },
      },
    ]);

    const attendanceMap = new Map<string, number>();
    for (const entry of attendanceAgg) {
      attendanceMap.set(entry._id.toString(), entry.count);
    }

    // Find students below threshold
    const alerts: any[] = [];
    for (const enrollment of enrollments) {
      const student = enrollment.studentId as any;
      if (!student || !student.userId) continue;

      const studentUserId = student.userId.toString();
      const attended = attendanceMap.get(studentUserId) ?? 0;
      const percentage = Math.round((attended / totalSessions) * 100);

      if (percentage < threshold) {
        // Upsert notification
        await Notification.findOneAndUpdate(
          { userId: student.userId, title: `Low Attendance: ${course.name}` },
          {
            userId: student.userId,
            title: `Low Attendance: ${course.name}`,
            message: `Your attendance in ${course.name} (${course.code}) is ${percentage}%, which is below the required ${threshold}%. Please attend classes regularly.`,
            type: 'WARNING',
            isRead: false,
          },
          { upsert: true, new: true }
        );

        alerts.push({
          userId: student.userId,
          rollNumber: student.rollNumber,
          attended,
          totalSessions,
          percentage,
        });
      }
    }

    return res.json({
      success: true,
      threshold,
      totalSessions,
      totalStudents: enrollments.length,
      alertsSent: alerts.length,
      alerts,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export const attendanceFullRouter = router;
