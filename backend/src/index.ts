import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import http from 'http';
import { Server } from 'socket.io';
import { toNodeHandler } from "better-auth/node";
import { ENV } from './lib/env.js';
import { getAuth } from './lib/auth.js';

import { sessionRouter } from './routes/session.js';
import { attendanceRouter, setIo } from './routes/attendance.js';
import { attendanceFullRouter, setIo as setIoFull } from './routes/attendance-full.js';
import { debugRouter } from './routes/debug.js';
import { adminRouter } from './routes/admin.js';
import { dashboardRouter } from './routes/dashboard.js';
import { betterAuthMiddleware } from './middleware/auth.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// --- 1. Industry-Grade CORS & Socket.io Security ---
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

// --- 2. FOOL-PROOF BETTER AUTH MOUNT (PRIORITY) ---
// We handle both /auth and /api/auth to account for proxy variations
app.use(["/auth", "/api/auth"], (req, res, next) => {
  console.log(`🔌 [AUTH PROBE] ${req.method} ${req.url}`);
  if (req.url === "/ping" || req.url === "/") {
    return res.json({
      status: "ALIVE",
      service: "Better Auth Handler",
      url: req.url,
      path: req.path
    });
  }
  return toNodeHandler(getAuth())(req, res);
});

// --- 3. PUBLIC UTILITIES & HEALTH ---
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED',
    env: ENV.isProduction ? 'production' : 'development'
  });
});

app.get('/api/debug/db-test', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    if (!db) throw new Error("No DB connection");
    const testCol = db.collection('test_connectivity');
    await testCol.insertOne({ timestamp: new Date(), message: 'Final Production Sweep' });
    res.json({ status: 'SUCCESS', count: await testCol.countDocuments() });
  } catch (err: any) {
    res.status(500).json({ status: 'ERROR', message: err.message });
  }
});

// --- 4. INTERNAL AUTH GUARD & BYPASS ---
const internalAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['x-internal-token'];
  // Bypass for health and auth (redundant but safe)
  if (req.path.includes('/auth') || req.path.includes('/health')) {
    return next();
  }

  if (token !== ENV.internalToken) {
    console.error(`🚨 [SECURITY] Unauthorized internal access attempt from: ${req.ip} to ${req.path}`);
    return res.status(403).json({ error: 'FORBIDDEN: Internal communication only' });
  }
  next();
};

app.use(internalAuth);

// --- 5. SECURE API ROUTES ---
// Apply Better Auth middleware to all /api routes except health/auth
app.use('/api', (req, res, next) => {
  if (req.path === '/health' || req.path.includes('/auth')) {
    return next();
  }
  return betterAuthMiddleware(req, res, next);
});

app.use('/api/session', sessionRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/attendance', attendanceFullRouter);
app.use('/api/debug', debugRouter);
app.use('/api/admin', adminRouter);
app.use('/api/dashboard', dashboardRouter);

// --- 6. GLOBAL ERROR HANDLER ---
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("🔥 [GLOBAL ERROR]:", err);
  res.status(500).json({
    error: "GLOBAL_ERROR",
    message: err.message,
    path: req.path
  });
});

const PORT = parseInt(process.env.PORT || '5001', 10);
const HOST = '0.0.0.0';

setIo(io);
setIoFull(io);

const startServer = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_erp_realtime';
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(MONGO_URI);
      console.log('✅ MongoDB connected');
    }
    server.listen(PORT, HOST, () => {
      console.log(`🚀 Industry-Grade Backend running on http://${HOST}:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Database connection failure:', err);
    process.exit(1);
  }
};

const shutdown = async () => {
  console.log('\n🛑 Shutting down gracefully...');
  server.close(() => {
    mongoose.connection.close(false).then(() => {
      console.log('✅ MongoDB connection closed.');
      process.exit(0);
    });
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

startServer();
