import express from 'express';
import { User } from '../models/User';
import { Session } from '../models/Session';
import { Attendance } from '../models/Attendance';
import { Course } from '../models/Course';

const router = express.Router();

router.post('/simulate-scan', async (req, res) => {
    try {
        const { sessionId, studentId } = req.body;
        
        const session = await Session.findById(sessionId);
        if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
        
        const student = await User.findById(studentId);
        if (!student) return res.status(404).json({ success: false, error: 'Student not found' });
        
        const existing = await Attendance.findOne({ sessionId, studentId });
        if (existing) return res.status(400).json({ success: false, error: 'Attendance already marked' });
        
        const attendance = await Attendance.create({
            sessionId,
            studentId,
            status: 'PRESENT'
        });
        
        await attendance.populate('studentId', 'name email role');
        
        res.json({ success: true, message: 'Simulated attendance successful', attendance });
    } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
    }
});

// Advanced Seeder for scalable database (e.g. 5000 students)
router.post('/seed-5k', async (req, res) => {
    try {
        // Warning: Deletes everything first!
        await User.deleteMany({});
        await Session.deleteMany({});
        await Attendance.deleteMany({});
        await Course.deleteMany({});
        
        // 1. Create real-world subject courses
        const realCourses = [
          { name: 'Artificial Intelligence', code: 'CS401', department: 'Computer Science' },
          { name: 'Data Structures & Algorithms', code: 'CS201', department: 'Computer Science' },
          { name: 'Operating Systems', code: 'CS302', department: 'Computer Science' },
          { name: 'Quantum Computing', code: 'CS505', department: 'Computer Science' },
          { name: 'Database Management Systems', code: 'CS304', department: 'Computer Science' },
          { name: 'Software Engineering', code: 'CS305', department: 'Computer Science' },
          { name: 'Machine Learning', code: 'CS402', department: 'Computer Science' },
          { name: 'Computer Networks', code: 'CS403', department: 'Computer Science' },
          { name: 'Cryptography & Network Security', code: 'CS404', department: 'Computer Science' }
        ];
        await Course.insertMany(realCourses);

        // 2. Create Faculty
        const faculty = await User.create({
            name: 'Prof. Alan Turing',
            email: 'alan@faculty.com',
            role: 'FACULTY',
            passwordHash: 'hashedpassword' 
        });
        
        // 3. Create 5000 Students using batching to avoid JS memory issues
        const BATCH_SIZE = 1000;
        const TOTAL_STUDENTS = 5000;
        
        for (let batch = 0; batch < TOTAL_STUDENTS / BATCH_SIZE; batch++) {
            const studentsBatch = [];
            for (let i = 0; i < BATCH_SIZE; i++) {
                const id = batch * BATCH_SIZE + i;
                studentsBatch.push({
                    name: `Student ${id}`,
                    email: `student${id}@university.edu`,
                    role: 'STUDENT',
                    passwordHash: 'hashed'
                });
            }
            // Execute batch insert into MongoDB
            await User.insertMany(studentsBatch, { ordered: false });
        }
        
        // Fetch 5 random students to return as test subjects
        const sampleStudents = await User.find({ role: 'STUDENT' }).limit(5);

        res.json({ 
            success: true, 
            message: 'Database seeded with 5000 students and real courses', 
            faculty, 
            courses: realCourses.length,
            sampleStudents 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
    }
});

export const debugRouter = router;
