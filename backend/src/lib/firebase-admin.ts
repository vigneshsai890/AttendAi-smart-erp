import admin from 'firebase-admin';
import * as path from 'path';

// Assuming we load from a local json or ENV. 
// For production, we should load from ENV variables.
try {
  // If not already initialized
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(path.join(process.cwd(), 'firebase-service-account.json')),
    });
  }
} catch (error) {
  console.error('Firebase Admin initialization error', error);
}

export const adminAuth = admin.auth();
export default admin;
