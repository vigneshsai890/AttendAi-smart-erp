const mongoose = require('mongoose');
const { Enrollment } = require('./backend/dist/models/Enrollment.js');
const { Course } = require('./backend/dist/models/Course.js');

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
