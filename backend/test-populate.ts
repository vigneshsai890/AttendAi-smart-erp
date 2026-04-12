import mongoose from 'mongoose';
import { Enrollment } from './src/models/Enrollment.js';
import { Course } from './src/models/Course.js';

const uri = "mongodb+srv://vigneshsaisai412_db_user:Qmewj1Fu2CNbYFz0@cluster1.4omhez7.mongodb.net/attendai?appName=Cluster1";

async function run() {
  try {
    await mongoose.connect(uri);
    // Find enrollments
    const enrollments = await Enrollment.find({ status: 'ACTIVE' }).populate('courseId').limit(2);
    console.log("Populated enrollments:");
    console.log(JSON.stringify(enrollments, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}
run();
