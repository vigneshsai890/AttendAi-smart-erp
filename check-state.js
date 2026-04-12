const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://vigneshsaisai412_db_user:Qmewj1Fu2CNbYFz0@cluster1.4omhez7.mongodb.net/smart_erp_realtime?appName=Cluster1";
const client = new MongoClient(uri);

async function check() {
  try {
    await client.connect();
    const db = client.db('attendai');
    
    // Check courses
    const courses = await db.collection('courses').find().toArray();
    console.log(`Courses: ${courses.length}`);
    if (courses.length > 0) console.log(`Sample course:`, courses[0]);

    // Check enrollments
    const enrollments = await db.collection('enrollments').find().toArray();
    console.log(`Enrollments: ${enrollments.length}`);

    // Check student user
    const users = await db.collection('user').find({ role: 'STUDENT' }).toArray();
    console.log(`Student users: ${users.length}`);

    // Check faculty user
    const facUsers = await db.collection('user').find({ role: 'FACULTY' }).toArray();
    console.log(`Faculty users: ${facUsers.length}`);

    // Check course assignments
    const assignments = await db.collection('courseassignments').find().toArray();
    console.log(`Course Assignments: ${assignments.length}`);

  } finally {
    await client.close();
  }
}
check().catch(console.error);
