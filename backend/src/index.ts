import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import http from 'http';
import { Server } from 'socket.io';
import { ENV } from './lib/env.js';

import { sessionRouter } from './routes/session.js';
import { attendanceRouter, setIo } from './routes/attendance.js';
import { attendanceFullRouter, setIo as setIoFull } from './routes/attendance-full.js';
import { debugRouter } from './routes/debug.js';
import { authRouter } from './routes/auth.js';
import { adminRouter } from './routes/admin.js';
import { dashboardRouter } from './routes/dashboard.js';
import { toNodeHandler } from "better-auth/node";
import { getAuth } from './lib/auth.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// --- EMERGENCY AUTH MOUNT (TOP OF STACK) ---
app.all(['/api/auth', '/api/auth/*'], async (req, res, next) => {
  console.log(`🚨 [CRITICAL AUTH] ${req.method} ${req.url}`);
  try {
    const auth = getAuth();
    if (!auth) throw new Error("Failed to initialize Better Auth");
    return await toNodeHandler(auth)(req, res);
  } catch (err: any) {
    console.error("🔥 [AUTH CRASH]:", err.message);
    // Let the global error handler handle it for consistency
    next(err);
  }
});

// --- Industry-Grade CORS & Socket.io Security ---
const allowedOrigins = [
  ENV.frontendUrl,
  'https://attendai-smart-erp.onrender.com',
  'https://dash.better-auth.com',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️ [SECURITY] CORS blocked request from: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.use(express.json());
app.use(morgan('dev'));

// DB Write Test (Public for diagnosis)
app.get('/api/debug/db-test', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    if (!db) throw new Error("No DB connection");
    const testCol = db.collection('test_connectivity');
    await testCol.insertOne({
      timestamp: new Date(),
      message: 'Max Power Connectivity Test',
      reqPath: req.path,
      reqUrl: req.url,
      headers: req.headers
    });
    const count = await testCol.countDocuments();
    res.json({
      status: 'SUCCESS',
      count,
      debug: {
        path: req.path,
        url: req.url,
        headers: req.headers,
        env_backend_url: ENV.backendUrl,
        env_frontend_url: ENV.frontendUrl
      }
    });
  } catch (err: any) {
    console.error("❌ [DB TEST] Failure:", err.message);
    res.status(500).json({ status: 'ERROR', message: err.message, debug: { path: req.path, url: req.url } });
  }
});

// Better-Auth Session Verification
import { betterAuthMiddleware } from './middleware/auth.js';
app.use('/api', (req, res, next) => {
  // --- Industry-Grade Middleware Bypass ---
  // Allow health checks and ALL Better Auth endpoints (for dash, login, signup)
  if (req.path === '/health' || req.path.startsWith('/auth')) {
    return next();
  }
  return betterAuthMiddleware(req, res, next);
});

// ULTRAMAX: Internal Communication Guard
const internalAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['x-internal-token'];
  // Allow health checks and Better Auth routes without internal token
  if (req.path.startsWith('/api/auth') || req.path === '/api/health') {
    return next();
  }

  if (token !== ENV.internalToken) {
    console.error(`🚨 [SECURITY] Unauthorized internal access attempt from: ${req.ip}`);
    return res.status(403).json({ error: 'FORBIDDEN: Internal communication only' });
  }
  next();
};

app.use(internalAuth);

// ULTRAMAX Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED',
    env: ENV.isProduction ? 'production' : 'development'
  });
});

// DB Write Test
app.get('/api/debug/db-test', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    if (!db) throw new Error("No DB connection");
    const testCol = db.collection('test_connectivity');
    await testCol.insertOne({ timestamp: new Date(), message: 'Max Power Connectivity Test' });
    const count = await testCol.countDocuments();
    res.json({ status: 'SUCCESS', count });
  } catch (err: any) {
    res.status(500).json({ status: 'ERROR', message: err.message });
  }
});

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_erp_realtime';

io.on('connection', (socket: any) => {
  console.log(`Socket connected: ${socket.id}`);
  socket.on('join-session', (sessionId: string) => {
    socket.join(sessionId);
    console.log(`Socket ${socket.id} joined room ${sessionId}`);
  });
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

setIo(io);
setIoFull(io);

app.use('/api/session', sessionRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/attendance', attendanceFullRouter);
app.use('/api/debug', debugRouter);

app.use('/api/admin', adminRouter);
app.use('/api/dashboard', dashboardRouter);

// --- GLOBAL ERROR HANDLER ---
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("🔥 [GLOBAL ERROR]:", err);
  res.status(500).json({
    error: "GLOBAL_ERROR",
    message: err.message,
    path: req.path,
    stack: ENV.isProduction ? undefined : err.stack
  });
});

const PORT = parseInt(process.env.PORT || '5001', 10);
const HOST = '0.0.0.0'; // Explicit host binding for Render

// Export app for Vercel/Render
export default app;

const startServer = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(MONGO_URI);
      console.log('✅ MongoDB connected');
    }

    server.listen(PORT, HOST, () => {
      console.log(`🚀 Industry-Grade Backend running on http://${HOST}:${PORT}`);
      console.log(`📡 Production URL: ${ENV.backendUrl}`);
    });
  } catch (err) {
    console.error('❌ Database connection failure:', err);
    if (!process.env.VERCEL) process.exit(1);
  }
};

// Graceful Shutdown
const shutdown = async () => {
  console.log('\n🛑 Shutting down gracefully...');
  server.close(() => {
    console.log('📡 HTTP server closed.');
    mongoose.connection.close(false).then(() => {
      console.log('✅ MongoDB connection closed.');
      process.exit(0);
    });
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

startServer();
