const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://vigneshsaisai412_db_user:Qmewj1Fu2CNbYFz0@cluster1.4omhez7.mongodb.net/smart_erp_realtime?appName=Cluster1";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db('attendai');
    
    const sessions = await db.collection('attendancesessions').find({ courseId: null }).toArray();
    console.log(`Found ${sessions.length} sessions with null courseId.`);

    let updated = 0;
    for (const session of sessions) {
       if (session.courseName) {
           const course = await db.collection('courses').findOne({ name: session.courseName });
           if (course) {
               await db.collection('attendancesessions').updateOne(
                   { _id: session._id },
                   { $set: { courseId: course._id } }
               );
               updated++;
           }
       }
    }
    console.log(`Fixed ${updated} sessions!`);
    
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
