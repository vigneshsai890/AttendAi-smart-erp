import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import { Department } from '../models/Department.js';
import { Faculty } from '../models/Faculty.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_erp_realtime';

async function provision() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    const email = 'vigneshsai890@gmail.com';
    const password = 'main';

    // 1. Ensure Department exists
    let dept = await Department.findOne({ code: 'CSE' });
    if (!dept) {
      dept = await Department.create({ code: 'CSE', name: 'Computer Science & Engineering' });
    }

    // 2. Create/Update User
    let user = await User.findOne({ email });
    const passwordHash = await bcrypt.hash(password, 10);

    if (user) {
      console.log('User exists, updating password and role...');
      user.passwordHash = passwordHash;
      user.role = 'FACULTY';
      await user.save();
    } else {
      console.log('Creating new faculty user...');
      user = await User.create({
        name: 'Vignesh Sai',
        email,
        role: 'FACULTY',
        passwordHash
      });
    }

    // 3. Ensure Faculty profile exists
    const faculty = await Faculty.findOne({ userId: user._id });
    if (!faculty) {
      console.log('Creating faculty profile...');
      await Faculty.create({
        userId: user._id,
        employeeId: 'EMP-VIGNESH-890',
        designation: 'Assistant Professor',
        departmentId: dept._id
      });
    }

    console.log('--------------------------------------------------');
    console.log(`Faculty Provisioned: ${email} / ${password}`);
    console.log('--------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('Provisioning failed:', error);
    process.exit(1);
  }
}

provision();
