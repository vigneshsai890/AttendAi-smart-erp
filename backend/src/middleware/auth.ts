import { User } from '../models/User.js';
import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.js';
import { AuthenticatedUser } from '../types/auth.js';

export const universalAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
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
      
      if (!adminAuth) {
        console.warn("⚠️ [AUTH] Firebase Admin not initialized. Will use manual decoding.");
      }

      try {
        let decodedToken: any;
        if (adminAuth) {
          decodedToken = await adminAuth.verifyIdToken(token);
          console.log(`🔍 [AUTH] Verified Firebase token for: ${decodedToken.email || decodedToken.uid}`);
        } else {
          // Fallback: decode JWT manually if adminAuth is not configured
          console.warn("⚠️ [AUTH] Firebase Admin not initialized. Decoding token manually (unverified).");
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
          decodedToken = JSON.parse(jsonPayload);
          decodedToken.uid = decodedToken.user_id; // Firebase sets user_id in the token
        }
        
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
          
          try {
            user = await User.create({
              firebaseUid: decodedToken.uid,
              email,
              name,
              role: "STUDENT",
              isProfileComplete: false,
              passwordHash: "", // Not used
            });
            console.log(`✅ [AUTH] Auto-healing successful for ${email}`);
          } catch (createError: any) {
            console.error(`❌ [AUTH] Auto-healing failed to create user:`, createError.message);
            // Fallback: search one more time, maybe it was created by a concurrent request
            user = await User.findOne({ email: decodedToken.email });
          }
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
          console.warn(`❌ [AUTH] Verified Firebase token but failed to find/create user for uid: ${decodedToken.uid}`);
        }
      } catch (tokenError: any) {
        console.error("❌ [AUTH] Firebase token verification failed:", tokenError.message);
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
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: "Forbidden: Insufficient privileges" });
    }
    next();
  };
};
