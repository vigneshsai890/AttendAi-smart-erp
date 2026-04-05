import { Router, Request, Response } from 'express';
import { getAuth } from '../lib/auth.js';
import { toNodeHandler } from "better-auth/node";

export const authRouter = Router();

authRouter.all('/*', async (req: Request, res: Response) => {
  const auth = getAuth();
  if (!auth) {
    return res.status(500).json({ error: "Better-Auth instance not available" });
  }
  
  // Forward the request to the Better-Auth handler using the Node.js adapter
  return toNodeHandler(auth)(req, res);
});
