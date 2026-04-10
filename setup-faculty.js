const { initializeApp } = require("firebase/app");
const { getAuth, createUserWithEmailAndPassword, updateProfile } = require("firebase/auth");
const { MongoClient } = require('mongodb');

const firebaseConfig = {
  apiKey: "AIzaSyC-3yV4Daj2xshEtGZJVzNs2Z9IXz-rv9o",
  authDomain: "attend-ai-299fc.firebaseapp.com",
  projectId: "attend-ai-299fc",
  storageBucket: "attend-ai-299fc.firebasestorage.app",
  messagingSenderId: "594589016295",
  appId: "1:594589016295:web:9733c8137b0f0c53144242",
  measurementId: "G-Z4VSVBLCBY"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const MONGO_URI = "mongodb+srv://vigneshsaisai412_db_user:Qmewj1Fu2CNbYFz0@cluster1.4omhez7.mongodb.net/smart_erp_realtime?appName=Cluster1";
const client = new MongoClient(MONGO_URI);

const facultyMembers = [
  {
    email: "faculty1@attendai.edu",
    password: "Password123!",
    name: "Dr. Alpha Centauri",
    role: "FACULTY"
  },
  {
    email: "faculty2@attendai.edu",
    password: "Password123!",
    name: "Prof. Beta Orionis",
    role: "FACULTY"
  },
  {
    email: "faculty3@attendai.edu",
    password: "Password123!",
    name: "Dr. Gamma Ray",
    role: "FACULTY"
  }
];

async function run() {
  try {
    await client.connect();
    const db = client.db('attendai');
    const users = db.collection("user");
    const faculties = db.collection("faculties");

    let dept = await db.collection("departments").findOne({ code: 'CSE-AIML' });
    if (!dept) {
      console.log("Department CSE-AIML not found. Please make sure to seed it.");
    }

    for (const member of facultyMembers) {
      console.log(`Setting up ${member.email}...`);
      let firebaseUid = null;
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, member.email, member.password);
        firebaseUid = userCredential.user.uid;
        await updateProfile(userCredential.user, { displayName: member.name });
        console.log(`✅ Firebase user created: ${firebaseUid}`);
      } catch (err) {
        if (err.code === 'auth/email-already-in-use') {
           console.log(`⚠️ Firebase user already exists for ${member.email}`);
           // We can't fetch the UID easily without admin SDK or signing in. Let's try signing in.
           const { signInWithEmailAndPassword } = require("firebase/auth");
           try {
             const userCred = await signInWithEmailAndPassword(auth, member.email, member.password);
             firebaseUid = userCred.user.uid;
             console.log(`✅ Logged in to get UID: ${firebaseUid}`);
           } catch (loginErr) {
             console.error(`❌ Could not login to get UID: ${loginErr.message}`);
             continue;
           }
        } else {
           console.error(`❌ Firebase error: ${err.message}`);
           continue;
        }
      }

      const existingUser = await users.findOne({ email: member.email });
      let userId;
      if (existingUser) {
        await users.updateOne(
          { _id: existingUser._id },
          { $set: { role: "FACULTY", isProfileComplete: true, firebaseUid: firebaseUid, name: member.name } }
        );
        userId = existingUser._id;
        console.log(`✅ MongoDB user updated`);
      } else {
        const result = await users.insertOne({
          firebaseUid: firebaseUid,
          email: member.email,
          name: member.name,
          role: "FACULTY",
          isProfileComplete: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        userId = result.insertedId;
        console.log(`✅ MongoDB user created`);
      }

      // Also create a Faculty profile just in case
      if (dept) {
        const existingFaculty = await faculties.findOne({ userId });
        if (!existingFaculty) {
          await faculties.insertOne({
            userId,
            employeeId: `EMP-${Date.now().toString().slice(-6)}`,
            designation: 'Assistant Professor',
            departmentId: dept._id
          });
          console.log(`✅ Faculty profile created`);
        }
      }
    }
  } finally {
    await client.close();
    process.exit(0);
  }
}

run().catch(console.dir);
