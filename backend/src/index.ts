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

// --- 0. ULTIMATE DEBUG & PATH SNIFFER ---
app.use((req, res, next) => {
  const isSniff = req.url && (req.url.includes('sniff=true') || req.headers['x-sniff'] === 'true');
  if (isSniff) {
    return res.json({
      url: req.url,
      path: req.path,
      originalUrl: req.originalUrl,
      method: req.method,
      headers: req.headers
    });
  }
  next();
});

// --- 1. Industry-Grade CORS & Socket.io Security ---
const allowedOrigins = [
  ENV.frontendUrl,
  'https://attendai-smart-erp.onrender.com',
  'https://dash.better-auth.com',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: true, // Temporarily open for discovery
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

// --- 2. THE AUTH HUB (UNIVERSAL MOUNT) ---
// We match ANY path containing /auth to ensure we catch proxy variations
app.use((req, res, next) => {
  const url = req.url || "";
  if (url.includes('/auth')) {
    console.log(`📡 [AUTH HUB] Intercepted: ${url}`);
    if (url.endsWith('/ping')) {
      return res.json({ status: "ALIVE", hub: "Universal Auth Hub", url });
    }
    return toNodeHandler(getAuth())(req, res);
  }
  next();
});

// --- 3. PUBLIC UTILITIES ---
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    db: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED',
    version: '1.0.0-HUB-SWEEP-V2',
    deploy: '93e13745' // Matching latest pushed commit
  });
});

app.get('/api/debug/db-test', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    if (!db) throw new Error("No DB connection");
    const testCol = db.collection('test_connectivity');
    await testCol.insertOne({ timestamp: new Date(), msg: 'Universal Hub Sweep' });
    res.json({ status: 'SUCCESS', count: await testCol.countDocuments() });
  } catch (err: any) {
    res.status(500).json({ status: 'ERROR', message: err.message });
  }
});

// --- 4. SECURE API ROUTES ---
app.use('/api', (req, res, next) => {
  if (req.path.includes('/auth') || req.path.includes('/health') || req.path.includes('/debug')) {
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

// --- 5. GLOBAL ERROR HANDLER ---
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("🔥 [HUB ERROR]:", err);
  res.status(500).json({ error: "HUB_ERROR", message: err.message, path: req.path });
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
    }
    server.listen(PORT, HOST, () => {
      console.log(`🚀 Universal Hub running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Crash:', err);
    process.exit(1);
  }
};

startServer();
export default app;
