import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { adminAuth } from '../lib/firebase-admin.js';
import { User } from '../models/User.js';

/**
 * Universal Session Middleware
 * Verifies sessions via Firebase ID Tokens
 */
export const universalAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 0. Trusted Internal Proxy (Highest Priority)
    // If the request comes from our own frontend with a valid internal token
    const userDataHeader = req.headers['x-user-data'];
    if (userDataHeader && (req as any).isInternal) {
      try {
        const userData = JSON.parse(Buffer.from(userDataHeader as string, 'base64').toString());
        if (userData && (userData.id || userData._id)) {
          const id = userData.id || userData._id;
          (req as any).user = { ...userData, id: id.toString() };
          (req as any).session = { user: (req as any).user };
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
        const user = await User.findOne({ firebaseUid: decodedToken.uid });
        if (user) {
          (req as any).user = {
            id: user._id.toString(),
            firebaseUid: decodedToken.uid,
            role: user.role || "STUDENT",
            email: user.email,
            name: user.name,
            isProfileComplete: user.isProfileComplete
          };
          (req as any).session = { user: (req as any).user };
          return next();
        } else {
          console.warn(`⚠️ [AUTH] Verified Firebase token but no MongoDB user found for uid: ${decodedToken.uid}`);
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
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as Request & { user?: { role: string } }).user;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: "Forbidden: Insufficient privileges" });
    }
    next();
  };
};
