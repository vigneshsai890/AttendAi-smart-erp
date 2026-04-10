const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://vigneshsaisai412_db_user:Qmewj1Fu2CNbYFz0@cluster1.4omhez7.mongodb.net/smart_erp_realtime?appName=Cluster1";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db('attendai');
    const collections = await db.listCollections().toArray();
    console.log("Collections:", collections.map(c => c.name));
    
    const usersCount = await db.collection('users').countDocuments();
    const userCount = await db.collection('user').countDocuments();
    console.log(`'users' count: ${usersCount}, 'user' count: ${userCount}`);
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
