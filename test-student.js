const { MongoClient } = require('mongodb');
const http = require('http');

const uri = "mongodb+srv://vigneshsaisai412_db_user:Qmewj1Fu2CNbYFz0@cluster1.4omhez7.mongodb.net/smart_erp_realtime?appName=Cluster1";

async function run() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('attendai');
  
  // Find a student
  const u = await db.collection('user').findOne({ role: 'STUDENT' });
  if (!u) return console.log("No student found");
  
  console.log("Testing with student user:", u._id);

  const req = http.request('http://localhost:5001/api/dashboard/student', {
    headers: {
      'x-internal-token': 'smart-erp-internal-communication-secret-2024',
      'x-user-data': Buffer.from(JSON.stringify({
        id: u._id.toString(),
      })).toString('base64')
    }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log('Status:', res.statusCode, 'Data:', data));
  });
  
  req.on('error', console.error);
  req.end();
  
  await client.close();
}

run().catch(console.error);
