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

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/attendance_db';
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err: Error) => console.error('MongoDB connection error:', err));

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

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
