const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://vigneshsaisai412_db_user:Qmewj1Fu2CNbYFz0@cluster1.4omhez7.mongodb.net/smart_erp_realtime?appName=Cluster1";
const client = new MongoClient(uri);

async function check() {
  try {
    await client.connect();
    const db = client.db('attendai');
    
    // Find vignesh
    const user = await db.collection('user').findOne({ email: 'vigneshsaisai412@gmail.com' });
    console.log(`User:`, user);
    if (!user) return;

    // Find student profile
    const student = await db.collection('students').findOne({ userId: user._id });
    console.log(`Student profile:`, student);
    if (!student) return;

    // Find enrollments
    const enrollments = await db.collection('enrollments').find({ studentId: student._id }).toArray();
    console.log(`Enrollments count:`, enrollments.length);
    if (enrollments.length > 0) {
        console.log(`Sample enrollment:`, enrollments[0]);
    }

  } finally {
    await client.close();
  }
}
check().catch(console.error);
