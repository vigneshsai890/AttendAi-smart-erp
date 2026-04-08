import { Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.js';
import { User } from '../models/User.js';

/**
 * Universal Session Middleware
 * Verifies sessions via Firebase ID Tokens
 */
import { AuthenticatedRequest, AuthenticatedUser } from '../lib/types.js';

export const universalAuthMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // 0. Trusted Internal Proxy (Highest Priority)
    // If the request comes from our own frontend with a valid internal token
    const userDataHeader = req.headers['x-user-data'];
    if (userDataHeader && req.isInternal) {
      try {
        const userData = JSON.parse(Buffer.from(userDataHeader as string, 'base64').toString());
        if (userData && (userData.id || userData._id)) {
          const id = userData.id || userData._id;
          const user: AuthenticatedUser = { ...userData, id: id.toString() };
          req.user = user;
          req.session = { user };
          return next();
        }
      } catch (e) {
        console.error("❌ [AUTH] Failed to parse x-user-data header:", e);
      }
    }

    // 1. Firebase Token Verification
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        
        // Find corresponding user in MongoDB using firebaseUid
        let user = await User.findOne({ firebaseUid: decodedToken.uid });
        
        // Auto-healing: Try to link by email if missing
        if (!user && decodedToken.email) {
          user = await User.findOne({ email: decodedToken.email });
          if (user) {
            user.firebaseUid = decodedToken.uid;
            await user.save();
            console.log(`✅ [AUTH] Linked existing user ${user.email} to Firebase UID ${decodedToken.uid}`);
          }
        }
        
        // Auto-healing: Create missing user
        if (!user && decodedToken.email) {
          console.warn(`⚠️ [AUTH] Auto-healing: Creating missing MongoDB record for ${decodedToken.email}`);
          const email = decodedToken.email;
          const name = decodedToken.name || email.split('@')[0] || "Student";
          
          user = await User.create({
            firebaseUid: decodedToken.uid,
            email,
            name,
            role: "STUDENT",
            isProfileComplete: false,
            passwordHash: "", // Not used
          });
        }

        if (user) {
          const authUser: AuthenticatedUser = {
            id: user._id.toString(),
            firebaseUid: decodedToken.uid,
            role: user.role || "STUDENT",
            email: user.email,
            name: user.name,
            isProfileComplete: user.isProfileComplete
          };
          req.user = authUser;
          req.session = { user: authUser };
          return next();
        } else {
          console.warn(`❌ [AUTH] Verified Firebase token but failed to auto-heal or find user for uid: ${decodedToken.uid}`);
        }
      } catch (tokenError) {
        console.error("❌ [AUTH] Firebase token verification failed:", tokenError);
      }
    }

    return res.status(401).json({ error: "Unauthorized: No active session or valid token" });
  } catch (err) {
    console.error("Auth Middleware Error:", err);
    res.status(500).json({ error: "Authentication protocol failure" });
  }
};

/**
 * Role-based Authorization Guard
 */
export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: "Forbidden: Insufficient privileges" });
    }
    next();
  };
};
