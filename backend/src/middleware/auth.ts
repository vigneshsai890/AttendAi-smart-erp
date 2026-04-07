import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

/**
 * Universal Session Middleware
 * Verifies sessions from Next-Auth via shared MongoDB or internal proxy header
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

    // 1. Next-Auth Session Lookup (Shared MongoDB)
    const cookies = req.headers.cookie || "";
    const sessionToken = cookies.split('; ').find(row => row.startsWith('next-auth.session-token='))?.split('=')[1] ||
                        cookies.split('; ').find(row => row.startsWith('__Secure-next-auth.session-token='))?.split('=')[1];

    if (sessionToken) {
      const db = mongoose.connection.db;
      if (db) {
        // Next-Auth usually creates 'sessions' and 'users'
        const session = await db.collection("sessions").findOne({ sessionToken });
        if (session && session.expires > new Date()) {
          const user = await db.collection("users").findOne({ _id: session.userId });
          if (user) {
            (req as any).session = { user };
            (req as any).user = {
              id: user._id.toString(),
              role: user.role || "STUDENT",
              email: user.email,
              name: user.name,
              isProfileComplete: user.isProfileComplete
            };
            return next();
          }
        }
      }
    }

    // 3. Last Resort: Check if it's an internal proxy call with userId passed
    const { userId } = req.query;
    if (userId && (req as any).isInternal) {
       const db = mongoose.connection.db;
       if (db) {
         // Check both collections for user
         const user = await db.collection("user").findOne({ _id: new mongoose.Types.ObjectId(userId as string) }) ||
                      await db.collection("users").findOne({ _id: new mongoose.Types.ObjectId(userId as string) });
         if (user) {
           (req as any).user = {
             id: user._id.toString(),
             role: user.role || "STUDENT",
             email: user.email,
             name: user.name
           };
           return next();
         }
       }
    }

    return res.status(401).json({ error: "Unauthorized: No active session" });
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
