import { Request } from 'express';
import { AuthenticatedUser } from './auth.js';

declare global {
  // Make AuthenticatedUser available globally if needed, 
  // but we'll also export it for explicit imports.
  interface AuthenticatedUser {
    id: string;
    email: string;
    role: string;
    name?: string;
    firebaseUid?: string;
    isProfileComplete?: boolean;
  }

  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      session?: {
        user: AuthenticatedUser;
      };
      isInternal?: boolean;
    }
  }
}
