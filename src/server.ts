// src/server.ts

import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import helmet from 'helmet';
import http from 'http';
import { Server } from 'socket.io';

import connectDB from './config/database';
import apiRoutes from './api';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';


const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server for socket.io
const httpServer = http.createServer(app);

// Initialize Socket.IO
export const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
  },
});

// Socket.IO: Connection Event
io.on('connection', (socket) => {
  console.log('[Socket.IO] Connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('[Socket.IO] Disconnected:', socket.id);
  });
});

// Middlewares
app.use(cors({
  origin: ['https://radiantrage.vercel.app'], // ganti dengan domain frontend kamu
  credentials: true // jika pakai cookies/auth
}));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/v1', apiRoutes);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

/**
 * Main server start function
 */
const startServer = async () => {
  try {
    console.log('[SERVER] Connecting to database...');
    await connectDB();
    console.log('[SERVER] Database connected successfully.');

    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('❌ Server failed to start:', error);
    process.exit(1);
  }
};

startServer();
