import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from './src/models/User';
import { Faculty } from './src/models/Faculty';

dotenv.config();

const FACULTY_LIST = [
  { name: 'Dr. Sarah Wilson', email: 'sarah.wilson@apollo.erp', empId: 'FAC001' },
  { name: 'Prof. James Bond', email: 'james.bond@apollo.erp', empId: 'FAC007' },
  { name: 'Dr. Elena Vance', email: 'elena.vance@apollo.erp', empId: 'FAC003' },
];

async function seed() {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_erp_realtime';
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const passwordHash = await bcrypt.hash('Faculty@123', 10);

    for (const f of FACULTY_LIST) {
      // 1. Create User
      const user = await User.findOneAndUpdate(
        { email: f.email },
        {
          name: f.name,
          email: f.email,
          role: 'FACULTY',
          passwordHash,
          isActive: true
        },
        { upsert: true, new: true }
      );

      // 2. Create Faculty Profile
      await Faculty.findOneAndUpdate(
        { userId: user._id },
        {
          userId: user._id,
          employeeId: f.empId,
          designation: 'Professor',
          department: 'Computer Science'
        },
        { upsert: true }
      );

      console.log(`✅ Provisioned Faculty: ${f.name} (${f.email})`);
    }

    console.log('\n--- SEEDING COMPLETE ---');
    console.log('Default Password for all: Faculty@123');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding Failed:', err);
    process.exit(1);
  }
}

seed();