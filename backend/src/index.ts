import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import http from 'http';
import { Server } from 'socket.io';

import { sessionRouter } from './routes/session';
import { attendanceRouter, setIo } from './routes/attendance';
import { attendanceFullRouter, setIo as setIoFull } from './routes/attendance-full';
import { debugRouter } from './routes/debug';
import { authRouter } from './routes/auth';
import { adminRouter } from './routes/admin';
import { dashboardRouter } from './routes/dashboard';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// ULTRAMAX: Internal Communication Guard
const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN || 'smart-erp-internal-communication-secret-2024';
const internalAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = req.headers['x-internal-token'];
  if (token !== INTERNAL_TOKEN && req.path !== '/api/health') {
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
    db: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED'
  });
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
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/dashboard', dashboardRouter);

const PORT = parseInt(process.env.PORT || '5001', 10);
const HOST = '0.0.0.0'; // Explicit host binding to prevent ECONNREFUSED

// Export app for Vercel Serverless Functions
export default app;

const startServer = async () => {
  try {
    // Only connect if not already connected (Vercel optimization)
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(MONGO_URI);
      console.log('✅ MongoDB connected');
    }

    // Only listen if running locally (not in Vercel)
    if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
      server.listen(PORT, HOST, () => {
        console.log(`🚀 ULTRAMAX Backend running on http://${HOST}:${PORT}`);
        console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
      });
    }
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
