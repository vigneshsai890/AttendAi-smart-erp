import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Department } from '../models/Department';
import { Section } from '../models/Section';
import { Faculty } from '../models/Faculty';
import { Student } from '../models/Student';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_erp_realtime';

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    // Clear existing data
    console.log('Cleaning database...');
    await Promise.all([
      User.deleteMany({}),
      Department.deleteMany({}),
      Section.deleteMany({}),
      Faculty.deleteMany({}),
      Student.deleteMany({}),
    ]);

    // 1. Create Departments
    console.log('Creating departments...');
    const cseDept = await Department.create({ code: 'CSE', name: 'Computer Science & Engineering' });
    const aimlDept = await Department.create({ code: 'AIML', name: 'AI & Machine Learning' });
    const aidsDept = await Department.create({ code: 'AIDS', name: 'AI & Data Science' });

    // 2. Create Sections
    console.log('Creating sections...');
    const cseA = await Section.create({ name: 'Section A', departmentId: cseDept._id, year: 3 });
    const cseB = await Section.create({ name: 'Section B', departmentId: cseDept._id, year: 3 });
    const aimlA = await Section.create({ name: 'Section A', departmentId: aimlDept._id, year: 3 });

    // 3. Helper to hash password
    const hashPassword = async (pwd: string) => await bcrypt.hash(pwd, 10);

    // 4. Create Demo Users
    console.log('Creating demo users...');

    // ADMIN
    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@apollo.edu',
      role: 'ADMIN',
      passwordHash: await hashPassword('admin123')
    });

    // FACULTY
    const facultyUser = await User.create({
      name: 'Dr. Vignesh',
      email: 'vignesh@apollo.edu',
      role: 'FACULTY',
      passwordHash: await hashPassword('faculty123')
    });
    await Faculty.create({
      userId: facultyUser._id,
      employeeId: 'EMP001',
      designation: 'Senior Professor',
      departmentId: cseDept._id
    });

    // STUDENT
    const studentUser = await User.create({
      name: 'Vignesh S',
      email: 'vignesh.s@apollo.edu',
      role: 'STUDENT',
      passwordHash: await hashPassword('student123')
    });
    await Student.create({
      userId: studentUser._id,
      rollNumber: '22CS001',
      regNumber: 'REG2022001',
      year: 3,
      semester: 6,
      sectionId: cseB._id,
      departmentId: cseDept._id
    });

    console.log('--------------------------------------------------');
    console.log('Seeding completed successfully!');
    console.log('Admin: admin@apollo.edu / admin123');
    console.log('Faculty: vignesh@apollo.edu / faculty123');
    console.log('Student: vignesh.s@apollo.edu / student123');
    console.log('--------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
