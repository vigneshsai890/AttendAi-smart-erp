import express, { Request, Response } from 'express';
import { User } from '../models/User.js';
import { Student } from '../models/Student.js';
import { Faculty } from '../models/Faculty.js';
import { Enrollment } from '../models/Enrollment.js';
import { AttendanceSession } from '../models/Session.js';
import { AttendanceRecord } from '../models/Attendance.js';
import { CourseAssignment } from '../models/CourseAssignment.js';
import { Schedule } from '../models/Schedule.js';
import { Exam } from '../models/Exam.js';
import { ExamResult } from '../models/ExamResult.js';
import { Notification } from '../models/Notification.js';
import { ProxyAlert } from '../models/ProxyAlert.js';
import { Department } from '../models/Department.js';
import { Section } from '../models/Section.js';
import { generateSecret, generateURI, verify } from 'otplib';
import mongoose from 'mongoose';
import QRCode from 'qrcode';

const router = express.Router();

// ---------------------------------------------------------------------------
// POST /dashboard/onboard
// ---------------------------------------------------------------------------
router.post('/onboard', async (req: Request, res: Response) => {
  try {
    const { userId, department, specialization, rollNumber, regNumber } = req.body;
    console.log(`📡 [ONBOARD] Received userId/firebaseUid: ${userId}`);
    if (!userId) return res.status(400).json({ success: false, error: 'userId/firebaseUid is required' });

    // In the new Firebase setup, the frontend sends the firebaseUid as 'userId'
    let user = await User.findOne({ firebaseUid: userId });
    
    // Fallback if userId was actually the Mongo ID
    if (!user && mongoose.Types.ObjectId.isValid(userId)) {
        user = await User.findById(userId);
    }

    if (!user) {
      console.error(`❌ [ONBOARD] User not found in DB: ${userId}`);
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    console.log(`✅ [ONBOARD] User found: ${user.email} (Role: ${user.role})`);

    if (user.role === 'STUDENT') {
      // Check if student already exists
      const existingStudent = await Student.findOne({ userId: user._id });
      if (existingStudent) {
        return res.json({ success: true, message: 'Student already onboarded', student: existingStudent });
      }

      // Find or create department
      let dept = await Department.findOne({ code: department }) || await Department.findOne({ name: department });
      if (!dept) {
        dept = await Department.create({ code: department, name: department });
      }

      // Find or create section (default to Section A for new signups)
      let section = await Section.findOne({ departmentId: dept._id, name: 'Section A' });
      if (!section) {
        section = await Section.create({ name: 'Section A', departmentId: dept._id, year: 1 });
      }

      // Create Student profile
      const student = await Student.create({
        userId: user._id,
        rollNumber: rollNumber || `ROLL-${Date.now().toString().slice(-6)}`,
        regNumber: regNumber || `REG-${Date.now().toString().slice(-6)}`,
        year: 1,
        semester: 1,
        sectionId: section._id,
        departmentId: dept._id
      });

      return res.json({ success: true, student });
    } else if (user.role === 'FACULTY') {
      const existingFaculty = await Faculty.findOne({ userId: user._id });
      if (existingFaculty) return res.json({ success: true, message: 'Faculty already onboarded' });

      let dept = await Department.findOne({ code: department }) || await Department.findOne({ name: department });
      if (!dept) dept = await Department.create({ code: 'GEN', name: 'General' });

      await Faculty.create({
        userId: user._id,
        employeeId: `EMP-${Date.now().toString().slice(-6)}`,
        designation: 'Assistant Professor',
        departmentId: dept._id
      });
    }

    return res.json({ success: true });
  } catch (error: any) {
    console.error('Onboarding error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ---------------------------------------------------------------------------
// GET /dashboard/student
// ---------------------------------------------------------------------------
router.get('/student', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ success: false, error: 'userId query param is required' });
    }

    // Unified User lookup (singular 'user' collection)
    let user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // --- Automatic Registration ID Generation ---
    if (!user.registrationId) {
      const year = new Date().getFullYear();
      const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
      const newRegId = `ATD-${year}-${randomPart}`;
      user.registrationId = newRegId;
      await user.save();
      console.log(`📡 [AUTO-REG] Generated ID ${newRegId} for ${user.email}`);
    }

    // Fetch student profile with department and section populated
    let student = await Student.findOne({ userId: user._id })
      .populate('departmentId')
      .populate('sectionId');

    if (!student) {
      let dept = await Department.findOne({ code: 'CSE' }) || await Department.findOne({ name: 'Computer Science & Engineering' });
      if (!dept) {
        dept = await Department.create({ code: 'CSE', name: 'Computer Science & Engineering' });
      }

      let section = await Section.findOne({ departmentId: dept._id, name: 'Section A' });
      if (!section) {
        section = await Section.create({ name: 'Section A', departmentId: dept._id, year: 1 });
      }

      student = await Student.create({
        userId: user._id,
        rollNumber: (user.registrationId || `AT-${Date.now().toString().slice(-6)}`).replace(/[^A-Z0-9-]/gi, ''),
        regNumber: user.registrationId || `REG-${Date.now().toString().slice(-6)}`,
        year: 1,
        semester: 1,
        sectionId: section._id,
        departmentId: dept._id,
      });

      student = await Student.findOne({ userId: user._id })
        .populate('departmentId')
        .populate('sectionId');
    }

    if (!student) {
      return res.status(404).json({ success: false, error: 'Student profile not found' });
    }

    // Fetch active enrollments with course data
    const enrollments = await Enrollment.find({
      studentId: student._id,
      status: 'ACTIVE',
    }).populate('courseId');

    // Fetch last 10 notifications
    const notifications = await Notification.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    // Gather course IDs from active enrollments
    const courseIds = enrollments
      .map((e: any) => e.courseId?._id)
      .filter(Boolean);

    // Today boundaries for schedule lookup
    const today = new Date();
    const todayDayOfWeek = today.getDay(); // 0-6

    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Parallel queries
    const [
      sessionCountsByCourse,
      examResults,
      todaySchedules,
      recentRecords,
      activeSession,
    ] = await Promise.all([
      // Total sessions per course
      AttendanceSession.aggregate([
        { $match: { courseId: { $in: courseIds } } },
        { $group: { _id: '$courseId', count: { $sum: 1 } } },
      ]),

      // Exam results for this student
      ExamResult.find({ studentRoll: student.rollNumber }).populate('examId'),

      // Today's schedule entries for the student's section and enrolled courses
      Schedule.find({
        sectionId: student.sectionId,
        courseId: { $in: courseIds },
        dayOfWeek: todayDayOfWeek,
      }).populate('courseId'),

      // Recent attendance records for this user (last 20)
      AttendanceRecord.find({ userId: user._id })
        .sort({ markedAt: -1 })
        .limit(20)
        .populate({
          path: 'sessionId',
          populate: { path: 'courseId' },
        }),

      // Any currently active session for enrolled courses
      AttendanceSession.findOne({
        courseId: { $in: courseIds },
        status: 'ACTIVE',
      }).populate('courseId'),
    ]);

    // Build session count map: courseId -> count
    const sessionCountMap: Record<string, number> = {};
    for (const entry of sessionCountsByCourse) {
      sessionCountMap[entry._id.toString()] = entry.count;
    }

    // Fetch all attendance records for the student grouped by session's course
    const studentRecords = await AttendanceRecord.find({
      userId: user._id,
      sessionId: {
        $in: await AttendanceSession.find({ courseId: { $in: courseIds } }).distinct('_id'),
      },
    }).populate('sessionId');

    // Map records by courseId
    const recordsByCourse: Record<string, any[]> = {};
    for (const record of studentRecords) {
      const session = record.sessionId as any;
      if (!session?.courseId) continue;
      const cid = session.courseId.toString();
      if (!recordsByCourse[cid]) recordsByCourse[cid] = [];
      recordsByCourse[cid].push(record);
    }

    // Per-course attendance stats
    let totalAttendedAll = 0;
    let totalClassesAll = 0;
    let safeCount = 0;
    let atRiskCount = 0;

    const subjects = enrollments.map((enrollment: any) => {
      const course = enrollment.courseId;
      if (!course) return null;
      const cid = course._id.toString();
      const totalSessions = sessionCountMap[cid] || 0;
      const courseRecords = recordsByCourse[cid] || [];
      const attended = courseRecords.filter(
        (r: any) => r.status === 'PRESENT' || r.status === 'LATE'
      ).length;
      const percentage = totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 0;

      let status: 'safe' | 'borderline' | 'at-risk';
      if (percentage >= 75) {
        status = 'safe';
        safeCount++;
      } else if (percentage >= 60) {
        status = 'borderline';
      } else {
        status = 'at-risk';
        atRiskCount++;
      }

      totalAttendedAll += attended;
      totalClassesAll += totalSessions;

      return {
        courseId: cid,
        courseCode: course.code,
        courseName: course.name,
        totalSessions,
        attended,
        percentage,
        status,
      };
    }).filter(Boolean);

    const overallPercentage =
      totalClassesAll > 0 ? Math.round((totalAttendedAll / totalClassesAll) * 100) : 0;

    // Build timetable from today's schedules
    // Fetch course assignments for faculty names
    const courseAssignments = await CourseAssignment.find({
      courseId: { $in: courseIds },
    }).populate({
      path: 'facultyId',
      populate: { path: 'userId', select: 'name' },
    });

    const facultyByCourse: Record<string, string> = {};
    for (const ca of courseAssignments) {
      const fa = ca.facultyId as any;
      if (fa?.userId?.name) {
        facultyByCourse[ca.courseId.toString()] = fa.userId.name;
      }
    }

    const timetable = todaySchedules.map((sched: any) => {
      const course = sched.courseId;
      const cid = course?._id?.toString();
      const isActive = activeSession
        ? (activeSession.courseId as any)?._id?.toString() === cid
        : false;

      return {
        courseId: cid,
        courseCode: course?.code,
        courseName: course?.name,
        startTime: sched.startTime,
        endTime: sched.endTime,
        room: sched.room,
        faculty: cid ? facultyByCourse[cid] || null : null,
        isActive,
      };
    });

    // Format recent activity
    const recentActivity = recentRecords.map((record: any) => {
      const session = record.sessionId as any;
      return {
        id: record._id,
        courseName: session?.courseId?.name || session?.courseName || 'Unknown',
        courseCode: session?.courseId?.code || '',
        date: record.markedAt,
        status: record.status,
      };
    });

    // Format exams
    const exams = examResults.map((er: any) => {
      const exam = er.examId as any;
      return {
        id: er._id,
        examName: exam?.name || '',
        courseCode: exam?.courseCode || '',
        marks: er.marks,
        maxMarks: exam?.maxMarks || 0,
        grade: er.grade,
        date: exam?.date,
      };
    });

    // Format active session
    const activeSessionPayload = activeSession
      ? {
          id: activeSession._id,
          courseName: (activeSession.courseId as any)?.name || activeSession.courseName,
          courseCode: (activeSession.courseId as any)?.code || '',
          qrCode: activeSession.qrCode,
          qrExpiry: activeSession.qrExpiry,
        }
      : null;

    const dept = student.departmentId as any;
    const sect = student.sectionId as any;

    return res.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
      student: {
        rollNumber: student.rollNumber,
        year: student.year,
        semester: student.semester,
        department: dept?.name || dept?.code || null,
        section: sect?.name || null,
      },
      stats: {
        overallPercentage,
        totalAttended: totalAttendedAll,
        totalClasses: totalClassesAll,
        safeCount,
        atRiskCount,
      },
      subjects,
      exams,
      timetable,
      recentActivity,
      notifications: notifications.map((n: any) => ({
        id: n._id,
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: n.isRead,
        createdAt: n.createdAt,
      })),
      activeSession: activeSessionPayload,
    });
  } catch (error) {
    console.error('Student dashboard error:', error);
    return res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ---------------------------------------------------------------------------
// GET /dashboard/faculty
// ---------------------------------------------------------------------------
router.get('/faculty', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ success: false, error: 'userId query param is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Faculty profile with department
    const faculty = await Faculty.findOne({ userId: user._id })
      .populate('departmentId');
    if (!faculty) {
      return res.status(404).json({ success: false, error: 'Faculty profile not found' });
    }

    // Course assignments for this faculty
    const courseAssignments = await CourseAssignment.find({ facultyId: faculty._id })
      .populate('courseId');

    // Active attendance sessions by this faculty
    const activeSessions = await AttendanceSession.find({
      facultyId: faculty._id,
      status: 'ACTIVE',
    }).populate('courseId');

    // Use the primary (first) course assignment
    const primaryAssignment = courseAssignments[0] as any;
    const course = primaryAssignment?.courseId as any;

    if (!course) {
      return res.json({
        success: true,
        faculty: {
          name: user.name,
          email: user.email,
          department: (faculty.departmentId as any)?.name || null,
        },
        course: null,
        stats: { totalStudents: 0, avgAttendance: 0, atRiskStudents: 0, fraudFlagCount: 0 },
        students: [],
        fraudFlags: [],
        sessionSummary: { present: 0, absent: 0, flagged: 0, percentage: 0 },
        activeSession: null,
      });
    }

    const courseId = course._id;

    // Parallel: enrolled student count, total sessions for the course
    const [enrolledCount, totalSessionCount] = await Promise.all([
      Enrollment.countDocuments({ courseId, status: 'ACTIVE' }),
      AttendanceSession.countDocuments({ courseId }),
    ]);

    // All session IDs for this course
    const sessionIds = await AttendanceSession.find({ courseId }).distinct('_id');

    // Group attendance records by userId and status
    const attendanceAgg = await AttendanceRecord.aggregate([
      { $match: { sessionId: { $in: sessionIds } } },
      {
        $group: {
          _id: { userId: '$userId', status: '$status' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Flagged records with proxy alerts
    const flaggedRecords = await AttendanceRecord.find({
      sessionId: { $in: sessionIds },
      flagged: true,
    }).populate('userId', 'name email');

    const flaggedRecordIds = flaggedRecords.map((r: any) => r._id);
    const proxyAlerts = await ProxyAlert.find({
      recordId: { $in: flaggedRecordIds },
    });

    // Map proxy alerts by recordId
    const alertsByRecord: Record<string, any[]> = {};
    for (const alert of proxyAlerts) {
      const rid = alert.recordId.toString();
      if (!alertsByRecord[rid]) alertsByRecord[rid] = [];
      alertsByRecord[rid].push(alert);
    }

    // Get enrolled students with their user info and roll numbers
    const enrollments = await Enrollment.find({ courseId, status: 'ACTIVE' })
      .populate({
        path: 'studentId',
        populate: { path: 'userId', select: 'name email' },
      });

    // Build per-student stats map: userId -> { present, absent, late, proxy }
    const studentStatsMap: Record<string, Record<string, number>> = {};
    for (const entry of attendanceAgg) {
      const uid = entry._id.userId.toString();
      const status = entry._id.status as string;
      if (!studentStatsMap[uid]) studentStatsMap[uid] = {};
      studentStatsMap[uid][status] = entry.count;
    }

    // Check which students are flagged
    const flaggedUserIds = new Set(
      flaggedRecords.map((r: any) => r.userId?._id?.toString() || r.userId?.toString())
    );

    let totalPercentageSum = 0;
    let atRiskStudents = 0;

    const students = enrollments.map((enrollment: any) => {
      const studentProfile = enrollment.studentId;
      const userProfile = studentProfile?.userId;
      if (!userProfile) return null;

      const uid = userProfile._id.toString();
      const stats = studentStatsMap[uid] || {};
      const present = (stats['PRESENT'] || 0) + (stats['LATE'] || 0);
      const absent = stats['ABSENT'] || 0;
      const total = totalSessionCount;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
      const isFlagged = flaggedUserIds.has(uid);

      totalPercentageSum += percentage;
      if (percentage < 75) atRiskStudents++;

      return {
        userId: uid,
        name: userProfile.name,
        email: userProfile.email,
        rollNumber: studentProfile.rollNumber,
        present,
        absent: total - present,
        percentage,
        flagged: isFlagged,
      };
    }).filter(Boolean);

    const avgAttendance =
      students.length > 0 ? Math.round(totalPercentageSum / students.length) : 0;

    // Build fraud flags
    const fraudFlags = flaggedRecords.map((record: any) => {
      const alerts = alertsByRecord[record._id.toString()] || [];
      return {
        recordId: record._id,
        studentName: record.userId?.name || 'Unknown',
        studentEmail: record.userId?.email || '',
        date: record.markedAt,
        riskScore: record.riskScore,
        alerts: alerts.map((a: any) => ({
          type: a.alertType,
          severity: a.severity,
          description: a.description,
        })),
      };
    });

    // Session summary for active session
    let sessionSummary = { present: 0, absent: 0, flagged: 0, percentage: 0 };
    const activeSession = activeSessions[0] as any;

    if (activeSession) {
      const activeSessionRecords = await AttendanceRecord.find({
        sessionId: activeSession._id,
      });

      const presentCount = activeSessionRecords.filter(
        (r: any) => r.status === 'PRESENT' || r.status === 'LATE'
      ).length;
      const flaggedCount = activeSessionRecords.filter((r: any) => r.flagged).length;
      const absentCount = enrolledCount - presentCount;

      sessionSummary = {
        present: presentCount,
        absent: absentCount > 0 ? absentCount : 0,
        flagged: flaggedCount,
        percentage: enrolledCount > 0 ? Math.round((presentCount / enrolledCount) * 100) : 0,
      };
    }

    // Format active session payload
    const activeSessionPayload = activeSession
      ? {
          id: activeSession._id,
          courseName: (activeSession.courseId as any)?.name || activeSession.courseName,
          qrCode: activeSession.qrCode,
          qrExpiry: activeSession.qrExpiry,
          room: '',
          totalStudents: enrolledCount,
        }
      : null;

    // If we have an active session, try to find the room from schedule
    if (activeSessionPayload && activeSession) {
      const sessionSchedule = await Schedule.findOne({
        courseId,
        dayOfWeek: new Date().getDay(),
      });
      if (sessionSchedule) {
        activeSessionPayload.room = sessionSchedule.room;
      }
    }

    const dept = faculty.departmentId as any;

    return res.json({
      success: true,
      faculty: {
        name: user.name,
        email: user.email,
        department: dept?.name || null,
      },
      course: {
        id: courseId,
        code: course.code,
        name: course.name,
      },
      stats: {
        totalStudents: enrolledCount,
        avgAttendance,
        atRiskStudents,
        fraudFlagCount: fraudFlags.length,
      },
      students,
      fraudFlags,
      sessionSummary,
      activeSession: activeSessionPayload,
    });
  } catch (error) {
    console.error('Faculty dashboard error:', error);
    return res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ---------------------------------------------------------------------------
// GET /dashboard/faculty/reports
// ---------------------------------------------------------------------------
router.get('/faculty/reports', async (req: Request, res: Response) => {
  try {
    const { courseId } = req.query;
    if (!courseId || typeof courseId !== 'string') {
      return res.status(400).json({ success: false, error: 'courseId query param is required' });
    }

    // Find all sessions for this course
    const sessionIds = await AttendanceSession.find({
      courseId: new mongoose.Types.ObjectId(courseId),
    }).distinct('_id');

    // Get all attendance records for those sessions
    const records = await AttendanceRecord.find({
      sessionId: { $in: sessionIds },
    })
      .populate('userId', 'name email')
      .populate('sessionId', 'sessionDate startTime')
      .sort({ markedAt: -1 });

    // Collect record IDs that are flagged to look up proxy alerts
    const flaggedRecordIds = records.filter((r: any) => r.flagged).map((r: any) => r._id);
    const proxyAlerts = await ProxyAlert.find({ recordId: { $in: flaggedRecordIds } });

    // Map alerts by recordId for quick lookup
    const alertsByRecord: Record<string, string[]> = {};
    for (const alert of proxyAlerts) {
      const rid = alert.recordId.toString();
      if (!alertsByRecord[rid]) alertsByRecord[rid] = [];
      alertsByRecord[rid].push(`${alert.alertType}(${alert.severity})`);
    }

    // Build CSV
    const csvHeader = 'Name,Email,Date,Time,Status,IP Address,Device Flags,Risk Score';
    const csvRows = records.map((record: any) => {
      const userDoc = record.userId;
      const session = record.sessionId as any;
      const name = userDoc?.name || 'Unknown';
      const email = userDoc?.email || '';
      const date = session?.sessionDate
        ? new Date(session.sessionDate).toISOString().split('T')[0]
        : '';
      const time = record.markedAt
        ? new Date(record.markedAt).toISOString().split('T')[1]?.slice(0, 8) || ''
        : '';
      const status = record.status || '';
      const ipAddress = record.ipAddress || '';
      const deviceFlags = alertsByRecord[record._id.toString()]?.join('; ') || '';
      const riskScore = record.riskScore ?? 0;

      // Escape fields that might contain commas
      const escapeCSV = (val: string) => {
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      };

      return [
        escapeCSV(name),
        escapeCSV(email),
        date,
        time,
        status,
        ipAddress,
        escapeCSV(deviceFlags),
        String(riskScore),
      ].join(',');
    });

    const csv = [csvHeader, ...csvRows].join('\n');

    return res.json({ success: true, csv });
  } catch (error) {
    console.error('Faculty reports error:', error);
    return res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ---------------------------------------------------------------------------
// POST /dashboard/2fa/setup
// ---------------------------------------------------------------------------
router.post('/2fa/setup', async (req: Request, res: Response) => {
  try {
    const { userEmail } = req.body;
    if (!userEmail) {
      return res.status(400).json({ success: false, error: 'userEmail is required' });
    }

    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({ success: false, error: '2FA is already enabled for this user' });
    }

    // Generate TOTP secret
    const secret = generateSecret();

    // Generate otpauth URI
    const otpauthUri = generateURI({ 
      issuer: 'AttendAi-SmartERP', 
      label: userEmail, 
      secret 
    });

    // Generate QR code data URL
    const qrCodeImage = await QRCode.toDataURL(otpauthUri);

    // Save secret to user (not yet enabled -- verified in the /2fa/verify step)
    user.twoFactorSecret = secret;
    await user.save();

    return res.json({
      success: true,
      secret,
      qrCodeImage,
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    return res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ---------------------------------------------------------------------------
// POST /dashboard/2fa/verify
// ---------------------------------------------------------------------------
router.post('/2fa/verify', async (req: Request, res: Response) => {
  try {
    const { userEmail, token } = req.body;
    if (!userEmail || !token) {
      return res.status(400).json({ success: false, error: 'userEmail and token are required' });
    }

    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (!user.twoFactorSecret) {
      return res.status(400).json({ success: false, error: '2FA has not been set up. Call /2fa/setup first.' });
    }

    const result = await verify({ token, secret: user.twoFactorSecret });
    const isValid = result.valid;

    if (!isValid) {
      return res.status(400).json({ success: false, error: 'Invalid token' });
    }

    user.twoFactorEnabled = true;
    await user.save();

    return res.json({ success: true });
  } catch (error) {
    console.error('2FA verify error:', error);
    return res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export const dashboardRouter = router;
