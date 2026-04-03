import { Request, Response, NextFunction } from 'express';
import { getAuth } from '../lib/auth.js';

/**
 * Better-Auth Session Middleware
 * Verifies the session from the Better-Auth API
 */
export const betterAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth();
    if (!auth) {
      throw new Error("Better-Auth initialization failed");
    }

    // Convert Express headers to standard Headers object for Better-Auth
    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => headers.append(key, v));
      } else if (value) {
        headers.set(key, value as string);
      }
    });

    const session = await auth.api.getSession({
      headers,
    });

    if (!session) {
      return res.status(401).json({ error: "Unauthorized: No active session" });
    }

    // Attach session and user to request with type assertion
    const requestWithAuth = req as Request & { 
      session: { user: { id: string; role: string; email: string; name: string } }; 
      user: { id: string; role: string; email: string; name: string } 
    };
    requestWithAuth.session = session as any;
    requestWithAuth.user = session.user as any;
    
    next();
  } catch (err) {
    console.error("Better-Auth Middleware Error:", err);
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
