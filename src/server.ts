// src/server.ts

import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import cors, { CorsOptions } from 'cors'; // Import CorsOptions
import helmet from 'helmet';
import http from 'http';
import { Server } from 'socket.io';
import { initializeSocketIO } from './services/socket.service';
import connectDB from './config/database';
import apiRoutes from './api';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';


const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server
const httpServer = http.createServer(app);

// --- KONFIGURASI CORS TERPUSAT ---
// Daftar domain yang diizinkan untuk mengakses backend Anda
const allowedOrigins = [
    'http://localhost:5173',        // Frontend saat development lokal
    'https://radiantrage.vercel.app'  // Frontend Anda di Vercel
];

// Definisikan tipe untuk callback agar lebih jelas
type CorsCallback = (err: Error | null, allow?: boolean) => void;

const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback: CorsCallback) => {
    // Izinkan jika origin ada di dalam daftar, atau jika tidak ada origin (misalnya dari Postman, server-side requests)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('This origin is not allowed by CORS policy.'));
    }
  },
  credentials: true // Penting jika Anda menggunakan cookies atau header otentikasi
};


// --- Inisialisasi Socket.IO dengan Opsi CORS ---
const io = new Server(httpServer, {
  cors: corsOptions
});

initializeSocketIO(io);

// Socket.IO: Connection Event
io.on('connection', (socket) => {
  console.log('[Socket.IO] Connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('[Socket.IO] Disconnected:', socket.id);
  });
});


// --- MIDDLEWARE ---

// Terapkan CORS ke semua rute Express (API)
app.use(cors(corsOptions));

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