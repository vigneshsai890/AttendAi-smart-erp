import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🏛️ Seeding AttendAI — Clean Start ...')

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

  // ── Passwords ──
  const studentPass = await bcrypt.hash('student123', 10)
  const facultyPass = await bcrypt.hash('faculty123', 10)
  const adminPass = await bcrypt.hash('admin123', 10)

  // ── Department ──
  const cse = await prisma.department.create({
    data: { code: 'CSE', name: 'Computer Science & Engineering' }
  })

  // ── Section ──
  const secA = await prisma.section.create({
    data: { name: 'CSE A', departmentId: cse.id, year: 2, batchYear: 2024 }
  })

  // ── Admin ──
  await prisma.user.create({
    data: { name: 'Admin', email: 'admin@apollo.edu', password: adminPass, role: 'ADMIN' }
  })

  // ── Faculty: Prof. Vignesh ──
  const vigneshFaculty = await prisma.user.create({
    data: {
      name: 'Prof. Vignesh', email: 'vignesh@apollo.edu', password: facultyPass, role: 'FACULTY',
      faculty: {
        create: { employeeId: 'FAC001', designation: 'Professor', departmentId: cse.id }
      }
    },
    include: { faculty: true }
  })

  // ── 5 Demo Students (zero attendance history) ──
  const studentData = [
    { name: 'Vignesh S',  email: 'vignesh.s@apollo.edu',  roll: 'CS24001', reg: 'REG24001' },
    { name: 'Arjun K',    email: 'arjun.k@apollo.edu',    roll: 'CS24002', reg: 'REG24002' },
    { name: 'Priya R',    email: 'priya.r@apollo.edu',    roll: 'CS24003', reg: 'REG24003' },
    { name: 'Sneha M',    email: 'sneha.m@apollo.edu',    roll: 'CS24004', reg: 'REG24004' },
    { name: 'Ravi T',     email: 'ravi.t@apollo.edu',     roll: 'CS24005', reg: 'REG24005' },
  ]

  const studentUsers = []
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
    studentUsers.push(u)
  }

  // ── Course: DBMS ──
  const dbms = await prisma.course.create({
    data: {
      code: 'CS401', name: 'Database Management Systems', credits: 4,
      courseType: 'LECTURE', semester: 4, departmentId: cse.id
    }
  })

  // Assign faculty
  await prisma.courseAssignment.create({
    data: { courseId: dbms.id, facultyId: vigneshFaculty.faculty!.id, academicYear: 2024, semester: 4 }
  })

  // Enroll all students
  for (const su of studentUsers) {
    await prisma.enrollment.create({
      data: { studentId: su.student!.id, courseId: dbms.id, academicYear: 2024, semester: 4 }
    })
  }

  // ── Schedule (all weekdays) ──
  for (let day = 1; day <= 5; day++) {
    await prisma.schedule.create({
      data: {
        courseId: dbms.id, sectionId: secA.id,
        dayOfWeek: day,
        startTime: '09:00', endTime: '10:30',
        room: 'Room 301', academicYear: 2024, semester: 4
      }
    })
  }

  console.log('✅ Seeding complete — clean start, zero attendance history!')
  console.log('')
  console.log('📧 Login credentials:')
  console.log('  Faculty:  vignesh@apollo.edu / faculty123')
  console.log('  Student:  vignesh.s@apollo.edu / student123')
  console.log('  Admin:    admin@apollo.edu / admin123')
  console.log('')
  console.log('🎯 Start a live session from the Faculty Dashboard, then scan QR to mark attendance.')
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
