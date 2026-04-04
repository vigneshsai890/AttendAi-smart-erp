import { Request, Response, NextFunction } from 'express';
import { ENV } from '../lib/env.js';

/**
 * Internal Auth Middleware
 * Verifies the X-Internal-Token header for secure proxy communication.
 */
export const internalAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['x-internal-token'];
  const expectedToken = ENV.internalToken;

  if (!token || token !== expectedToken) {
    console.warn(`⚠️ [SECURITY] Unauthorized internal access attempt: ${req.method} ${req.path} from IP: ${req.ip}`);
    return res.status(401).json({
      error: "UNAUTHORIZED_INTERNAL",
      message: "Invalid or missing internal access token."
    });
  }

  next();
};
