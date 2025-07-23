// src/server.ts

import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import connectDB from './config/database';
import { initializeSocketIO } from './services/socket.service';

const PORT = process.env.PORT || 5000;

// 1. Buat HTTP server dari express app
const httpServer = http.createServer(app);

// 2. Inisialisasi Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'https://radiantrage.vercel.app'],
    methods: ["GET", "POST"],
    credentials: true,
  },
});



// 3. Simpan instance Socket.IO agar bisa digunakan modul lain
initializeSocketIO(io);

// 4. Log saat koneksi masuk
io.on('connection', (socket) => {
  console.log('[Socket.IO] Connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('[Socket.IO] Disconnected:', socket.id);
  });
});

// 5. Jalankan server
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
