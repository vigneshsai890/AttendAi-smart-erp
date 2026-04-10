const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://vigneshsaisai412_db_user:Qmewj1Fu2CNbYFz0@cluster1.4omhez7.mongodb.net/smart_erp_realtime?appName=Cluster1";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db('attendai');
    const u = await db.collection('user').findOne({ email: 'faculty1@attendai.edu' });
    console.log(u);
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
