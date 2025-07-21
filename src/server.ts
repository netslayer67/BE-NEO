// src/server.ts

import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import helmet from 'helmet';
import http from 'http';
import { Server } from 'socket.io';
import { initializeSocketIO } from './services/socket.service';
import connectDB from './config/database';
import apiRoutes from './api';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';


const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server for socket.io
const httpServer = http.createServer(app);

// Initialize Socket.IO
// --- PERBAIKAN DI SINI ---
const allowedOrigins = [
    'http://localhost:5173',      // Untuk Vite standar 
    'https://radiantrage.vercel.app' // Untuk production
];

const io = new Server(httpServer, {
  cors: {
    origin: function (origin, callback) {
      // Izinkan jika origin ada di dalam daftar, atau jika tidak ada origin (seperti dari Postman)
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST"]
  }
});

initializeSocketIO(io);

// Socket.IO: Connection Event
io.on('connection', (socket) => {
  console.log('[Socket.IO] Connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('[Socket.IO] Disconnected:', socket.id);
  });
});

app.use(cors()); // Cukup gunakan cors() standar
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
