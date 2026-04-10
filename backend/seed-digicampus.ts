import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { Course } from './src/models/Course.js';
import { Department } from './src/models/Department.js';
import { Student } from './src/models/Student.js';
import { Enrollment } from './src/models/Enrollment.js';

dotenv.config();
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://vigneshsaisai412_db_user:Qmewj1Fu2CNbYFz0@cluster1.4omhez7.mongodb.net/smart_erp_realtime?appName=Cluster1";

const aimlCourses = [
  { name: 'Soft Skills', code: 'SKILL24' },
  { name: 'Computer Organization and Architecture', code: 'BTMT2307' },
  { name: 'Management for Engineers', code: 'BTMT2901' },
  { name: 'Machine Learning', code: 'BTMT2501' },
  { name: 'Database Management Systems', code: 'BTMT2304' },
  { name: 'Operating Systems', code: 'BTMT2305' },
  { name: 'Artificial Intelligence', code: 'BTMT2502' },
  { name: 'Universal Human Values', code: 'BTMT2306' },
  { name: 'Database Management Systems Lab', code: 'BTML2302' },
  { name: 'Machine Learning Lab', code: 'BTML2501' },
  { name: 'Library-2024', code: 'Lib 24' },
  { name: 'Sports-2024', code: 'Sports 24' },
  { name: 'Mentoring-2024', code: 'Ment 24' },
  { name: 'Aptitude-2024', code: 'APT24' }
];

const dsCourses = [
  { name: 'Traditional Sports Club', code: 'TSTAU27' },
  { name: 'Soft Skills', code: 'SKILL24-DS' }, // slightly different code if it's unique to DS, or use the same if shared.
  { name: 'Exploratory Data Analytics with R Lab', code: 'BTAL2501' },
  { name: 'Foundation of Data Science', code: 'BTAT2501' },
  { name: 'Library-2024', code: 'Lib 24-DS' },
  { name: 'Artificial Intelligence', code: 'BTAT2502' },
  { name: 'Sports-2024', code: 'Sports 24-DS' },
  { name: 'Database Management Systems Lab', code: 'BTAL2302' },
  { name: 'Mentoring-2024', code: 'Ment 24-DS' },
  { name: 'Database Management Systems', code: 'BTAT2304' },
  { name: 'Management for Engineers', code: 'BTAT2901' },
  { name: 'Computer Organization and Architecture', code: 'BTAT2307' },
  { name: 'Aptitude-2024', code: 'APT24-DS' },
  { name: 'Operating Systems', code: 'BTAT2305' },
  { name: 'Universal Human Values', code: 'BTAT2306' }
];

async function seed() {
  try {
    console.log('Connecting to database...');
    // We must connect to the 'attendai' database specifically for the app logic
    const uri = MONGO_URI.replace('smart_erp_realtime', 'attendai');
    await mongoose.connect(uri);

    console.log('Connected. Clearing old courses and enrollments...');
    await Course.deleteMany({});
    await Enrollment.deleteMany({});
    
    console.log('Creating Departments...');
    let aimlDept = await Department.findOne({ code: 'CSE-AIML' });
    if (!aimlDept) {
      aimlDept = await Department.create({ code: 'CSE-AIML', name: 'Computer Science & Engineering (AIML)' });
    }
    
    let dsDept = await Department.findOne({ code: 'CSE-DS' });
    if (!dsDept) {
      dsDept = await Department.create({ code: 'CSE-DS', name: 'Computer Science & Engineering (Data Science)' });
    }

    console.log('Seeding AIML Courses...');
    for (const c of aimlCourses) {
      await Course.create({
        ...c,
        department: 'CSE-AIML',
        departmentId: aimlDept._id,
        semester: 4,
        credits: 3
      });
    }

    console.log('Seeding DS Courses...');
    for (const c of dsCourses) {
      await Course.create({
        ...c,
        department: 'CSE-DS',
        departmentId: dsDept._id,
        semester: 4,
        credits: 3
      });
    }

    console.log('Auto-enrolling existing students based on department...');
    const students = await Student.find({});
    // Default to AIML for all existing students if they don't have these
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      // alternate students between AIML and DS just for testing, or set all to AIML
      const targetDept = i % 2 === 0 ? aimlDept : dsDept;
      
      // Update student department
      student.departmentId = targetDept._id;
      await student.save();

      // Enroll in all courses for their department
      const deptCourses = await Course.find({ departmentId: targetDept._id });
      for (const course of deptCourses) {
        await Enrollment.create({
          studentId: student._id,
          courseId: course._id,
          status: 'ACTIVE'
        });
      }
      console.log(`Enrolled student ${student.rollNumber} into ${deptCourses.length} ${targetDept.code} courses.`);
    }

    console.log('Done!');
  } catch (error) {
    console.error('Seed Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
