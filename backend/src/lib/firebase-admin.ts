import admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

const initializeFirebase = () => {
  if (admin.apps.length > 0) return admin.app();

  const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
  const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json');

  try {
    if (serviceAccountVar) {
      console.log('🚀 [FIREBASE] Initializing with FIREBASE_SERVICE_ACCOUNT env var');
      const serviceAccount = JSON.parse(serviceAccountVar);
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else if (fs.existsSync(serviceAccountPath)) {
      console.log('📂 [FIREBASE] Initializing with local service account file');
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath),
      });
    } else {
      console.warn('⚠️ [FIREBASE] No credentials found. Admin features may fail.');
      // We don't initialize here to avoid immediate crash, but dependent calls will fail.
      return null;
    }
  } catch (error) {
    console.error('❌ [FIREBASE] Initialization error:', error);
    return null;
  }
};

const app = initializeFirebase();

export const adminAuth = app ? admin.auth() : null as any;
export default admin;
