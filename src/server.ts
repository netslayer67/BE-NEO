// src/server.ts

import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import connectDB from './config/database';
import { initializeSocketIO } from './services/socket.service';

const PORT = process.env.PORT || 5000;

// Buat HTTP server dari express app
const httpServer = http.createServer(app);

// Inisialisasi socket.io
export const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'https://radiantrage.vercel.app'],
    credentials: true,
  },
});
initializeSocketIO(io);

// Jalankan koneksi Socket.IO
io.on('connection', (socket) => {
  console.log('[Socket.IO] Connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('[Socket.IO] Disconnected:', socket.id);
  });
});

// Start server
const startServer = async () => {
  try {
    console.log('[SERVER] Connecting to database...');
    await connectDB();
    console.log('[SERVER] Database connected.');

    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Server failed to start:', error);
    process.exit(1);
  }
};

startServer();
