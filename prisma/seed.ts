import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🏛️ Seeding The Apollo University — AttendAI ...')

  // Clean up in dependency order
  await prisma.proxyAlert.deleteMany()
  await prisma.attendanceRecord.deleteMany()
  await prisma.attendanceSession.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.examResult.deleteMany()
  await prisma.exam.deleteMany()
  await prisma.schedule.deleteMany()
  await prisma.enrollment.deleteMany()
  await prisma.courseAssignment.deleteMany()
  await prisma.course.deleteMany()
  await prisma.student.deleteMany()
  await prisma.faculty.deleteMany()
  await prisma.section.deleteMany()
  await prisma.department.deleteMany()
  await prisma.user.deleteMany()

  // ── Department ──
  const cse = await prisma.department.create({
    data: { code: 'CSE', name: 'Computer Science & Engineering' }
  })

  // ── Section ──
  const secA = await prisma.section.create({
    data: { name: 'CSE A', departmentId: cse.id, year: 2, batchYear: 2024 }
  })

  // ── Passwords ──
  const studentPass = await bcrypt.hash('student123', 10)
  const facultyPass = await bcrypt.hash('faculty123', 10)
  const adminPass = await bcrypt.hash('admin123', 10)

  // ── Admin ──
  await prisma.user.create({
    data: { name: 'Admin', email: 'admin@apollo.edu', password: adminPass, role: 'ADMIN' }
  })

  // ── Faculty: Dr. Mehta ──
  const mehtaUser = await prisma.user.create({
    data: {
      name: 'Dr. Mehta', email: 'mehta@apollo.edu', password: facultyPass, role: 'FACULTY',
      faculty: {
        create: { employeeId: 'FAC001', designation: 'Professor', departmentId: cse.id }
      }
    },
    include: { faculty: true }
  })

  // ── More faculty for different subjects ──
  const sharmaUser = await prisma.user.create({
    data: {
      name: 'Dr. Sharma', email: 'sharma@apollo.edu', password: facultyPass, role: 'FACULTY',
      faculty: { create: { employeeId: 'FAC002', designation: 'Associate Professor', departmentId: cse.id } }
    },
    include: { faculty: true }
  })
  const patilUser = await prisma.user.create({
    data: {
      name: 'Dr. Patil', email: 'patil@apollo.edu', password: facultyPass, role: 'FACULTY',
      faculty: { create: { employeeId: 'FAC003', designation: 'Associate Professor', departmentId: cse.id } }
    },
    include: { faculty: true }
  })
  const joshiUser = await prisma.user.create({
    data: {
      name: 'Dr. Joshi', email: 'joshi@apollo.edu', password: facultyPass, role: 'FACULTY',
      faculty: { create: { employeeId: 'FAC004', designation: 'Assistant Professor', departmentId: cse.id } }
    },
    include: { faculty: true }
  })

  // ── Student: Alex (primary) ──
  const alexUser = await prisma.user.create({
    data: {
      name: 'Alex Patel', email: 'alex@apollo.edu', password: studentPass, role: 'STUDENT',
      student: {
        create: {
          rollNumber: 'CS21001', regNumber: 'REG21001',
          year: 2, semester: 4, sectionId: secA.id, departmentId: cse.id, batchYear: 2024
        }
      }
    },
    include: { student: true }
  })

  // ── 8 more students for teacher dashboard ──
  const studentData = [
    { name: 'Arjun Patel',   email: 'arjun@apollo.edu',  roll: 'CS21002', reg: 'REG21002' },
    { name: 'Priya Sharma',  email: 'priya@apollo.edu',  roll: 'CS21003', reg: 'REG21003' },
    { name: 'Rohan Gupta',   email: 'rohan@apollo.edu',  roll: 'CS21004', reg: 'REG21004' },
    { name: 'Sneha Rao',     email: 'sneha@apollo.edu',  roll: 'CS21005', reg: 'REG21005' },
    { name: 'Karan Joshi',   email: 'karan@apollo.edu',  roll: 'CS21006', reg: 'REG21006' },
    { name: 'Meera Singh',   email: 'meera@apollo.edu',  roll: 'CS21007', reg: 'REG21007' },
    { name: 'Aditya Kumar',  email: 'aditya@apollo.edu', roll: 'CS21008', reg: 'REG21008' },
    { name: 'Divya Nair',    email: 'divya@apollo.edu',  roll: 'CS21009', reg: 'REG21009' },
  ]

  const otherStudentUsers = []
  for (const s of studentData) {
    const u = await prisma.user.create({
      data: {
        name: s.name, email: s.email, password: studentPass, role: 'STUDENT',
        student: {
          create: {
            rollNumber: s.roll, regNumber: s.reg,
            year: 2, semester: 4, sectionId: secA.id, departmentId: cse.id, batchYear: 2024
          }
        }
      },
      include: { student: true }
    })
    otherStudentUsers.push(u)
  }

  // ── Courses (4 subjects matching AttendAI UI) ──
  const courses = [
    { code: 'CS401', name: 'Database Management Systems', credits: 4, faculty: mehtaUser.faculty!, icon: 'DBMS' },
    { code: 'CS302', name: 'Data Structures & Algorithms', credits: 4, faculty: sharmaUser.faculty!, icon: 'DS' },
    { code: 'CS303', name: 'Operating Systems',            credits: 3, faculty: patilUser.faculty!,  icon: 'OS' },
    { code: 'CS404', name: 'Computer Networks',             credits: 3, faculty: joshiUser.faculty!,  icon: 'CN' },
  ]

  // Alex's target attendance %
  const alexAttendanceTarget: Record<string, number> = {
    'CS401': 0.88,  // 22/25
    'CS302': 0.84,  // 21/25
    'CS303': 0.78,  // ~19/25 (actually 19.5, we'll do 20/25 for cleaner numbers but target 78%)
    'CS404': 0.68,  // 17/25
  }

  // Other students' attendance for DBMS (teacher view)
  const otherStudentAttendance: Record<string, { present: number, total: number }> = {
    'CS21002': { present: 23, total: 25 }, // Arjun 92%
    'CS21003': { present: 21, total: 25 }, // Priya 84%
    'CS21004': { present: 18, total: 25 }, // Rohan 72%
    'CS21005': { present: 22, total: 25 }, // Sneha 88%
    'CS21006': { present: 16, total: 25 }, // Karan 64%
    'CS21007': { present: 19, total: 25 }, // Meera 76%
    'CS21008': { present: 15, total: 25 }, // Aditya 60%
    'CS21009': { present: 24, total: 25 }, // Divya 96%
  }

  const totalSessions = 25
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  for (const c of courses) {
    const course = await prisma.course.create({
      data: {
        code: c.code, name: c.name, credits: c.credits,
        courseType: 'LECTURE', semester: 4, departmentId: cse.id
      }
    })

    // Assign faculty
    await prisma.courseAssignment.create({
      data: { courseId: course.id, facultyId: c.faculty.id, academicYear: 2024, semester: 4 }
    })

    // Enroll Alex
    await prisma.enrollment.create({
      data: { studentId: alexUser.student!.id, courseId: course.id, academicYear: 2024, semester: 4 }
    })

    // Enroll other students
    for (const su of otherStudentUsers) {
      await prisma.enrollment.create({
        data: { studentId: su.student!.id, courseId: course.id, academicYear: 2024, semester: 4 }
      })
    }

    // Create past attendance sessions
    const alexTarget = alexAttendanceTarget[c.code] || 0.8
    const alexAttended = Math.round(totalSessions * alexTarget)

    for (let j = 0; j < totalSessions; j++) {
      const sessionDate = new Date(today.getTime() - (totalSessions - j) * 86400000)
      const sess = await prisma.attendanceSession.create({
        data: {
          courseId: course.id, facultyId: c.faculty.id,
          sessionDate, startTime: '10:00', endTime: '11:00', status: 'CLOSED'
        }
      })

      // Alex's record
      const alexPresent = j < alexAttended
      await prisma.attendanceRecord.create({
        data: {
          sessionId: sess.id, userId: alexUser.id,
          status: alexPresent ? 'PRESENT' : 'ABSENT',
          markedAt: new Date(sessionDate.getTime() + 36000000 + Math.floor(Math.random() * 300000))
        }
      })

      // Other students (only for DBMS/CS401 - teacher view)
      if (c.code === 'CS401') {
        for (const su of otherStudentUsers) {
          const stats = otherStudentAttendance[su.student!.rollNumber]
          const sPresent = stats ? j < stats.present : j < 20
          const record = await prisma.attendanceRecord.create({
            data: {
              sessionId: sess.id, userId: su.id,
              status: sPresent ? 'PRESENT' : 'ABSENT',
              markedAt: new Date(sessionDate.getTime() + 36000000 + Math.floor(Math.random() * 600000)),
              deviceFingerprint: `device-${su.student!.rollNumber}`,
              ipAddress: `192.168.1.${10 + otherStudentUsers.indexOf(su)}`
            }
          })

          // Add proxy alerts for Karan, Aditya, Rohan (on their last session)
          if (j === totalSessions - 1) {
            if (su.student!.rollNumber === 'CS21006') {
              await prisma.attendanceRecord.update({
                where: { id: record.id },
                data: { flagged: true, riskScore: 80, status: 'PROXY' }
              })
              await prisma.proxyAlert.create({
                data: {
                  recordId: record.id,
                  alertType: 'DEVICE',
                  severity: 'CRITICAL',
                  description: 'Proxy — same device_id matched 2 students simultaneously',
                  status: 'PENDING'
                }
              })
            }
            if (su.student!.rollNumber === 'CS21008') {
              await prisma.attendanceRecord.update({
                where: { id: record.id },
                data: { flagged: true, riskScore: 75, status: 'PROXY', ipAddress: '192.168.1.14' }
              })
              await prisma.proxyAlert.create({
                data: {
                  recordId: record.id,
                  alertType: 'BUDDY_PATTERN',
                  severity: 'HIGH',
                  description: 'IP clustering — 4 check-ins from 192.168.1.14 within 28 sec',
                  status: 'PENDING'
                }
              })
            }
            if (su.student!.rollNumber === 'CS21004') {
              await prisma.attendanceRecord.update({
                where: { id: record.id },
                data: { flagged: true, riskScore: 55 }
              })
              await prisma.proxyAlert.create({
                data: {
                  recordId: record.id,
                  alertType: 'TIMING',
                  severity: 'MEDIUM',
                  description: 'Timing spike — checked in 2 sec before QR code expiry',
                  status: 'PENDING'
                }
              })
            }
          }
        }
      }
    }

    // Create schedule for today (Wednesday = dayOfWeek 3)
    const scheduleMap: Record<string, { start: string, end: string, room: string }> = {
      'CS401': { start: '09:00', end: '10:30', room: 'Room 301' },
      'CS302': { start: '11:00', end: '12:30', room: 'Room 205' },
      'CS303': { start: '14:00', end: '15:30', room: 'Lab 104' },
      'CS404': { start: '16:00', end: '17:30', room: 'Room 204' },
    }
    const sched = scheduleMap[c.code]
    if (sched) {
      await prisma.schedule.create({
        data: {
          courseId: course.id, sectionId: secA.id,
          dayOfWeek: 3, // Wednesday
          startTime: sched.start, endTime: sched.end,
          room: sched.room, academicYear: 2024, semester: 4
        }
      })
    }
  }

  // Create an active session for DBMS (for the QR panel)
  const dbmsCourse = await prisma.course.findUnique({ where: { code: 'CS401' } })
  if (dbmsCourse) {
    await prisma.attendanceSession.create({
      data: {
        courseId: dbmsCourse.id, facultyId: mehtaUser.faculty!.id,
        sessionDate: today, startTime: '09:00', endTime: '10:30',
        qrCode: 'apollo-dbms-live-qr-2026',
        qrExpiry: new Date(Date.now() + 180000), // 3 min from now
        latitude: 12.9716, longitude: 77.5946, geoRadius: 100,
        status: 'ACTIVE'
      }
    })
  }

  // ── Notifications for Alex ──
  await prisma.notification.createMany({
    data: [
      { userId: alexUser.id, title: 'Warning — Computer Networks', message: 'CN is at 68%. Need 4 consecutive classes to hit 75%.', type: 'WARNING' },
      { userId: alexUser.id, title: 'DBMS Live Now — Room 301', message: 'Dr. Mehta · QR check-in active. Scan now.', type: 'ALERT' },
      { userId: alexUser.id, title: 'Perfect Week!', message: 'Attended every class this week. Streak: 5 days 🔥', type: 'INFO' },
    ]
  })

  console.log('✅ Seeding complete!')
  console.log('📧 Login credentials:')
  console.log('  Student: alex@apollo.edu / student123')
  console.log('  Faculty: mehta@apollo.edu / faculty123')
  console.log('  Admin:   admin@apollo.edu / admin123')
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
