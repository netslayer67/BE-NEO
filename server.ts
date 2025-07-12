// src/server.ts
import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import helmet from 'helmet';
import apiRoutes from './src/api/index';
import connectDB from './src/config/database';
import { errorHandler, notFoundHandler } from './src/middlewares/error.middleware';

/**
 * Fungsi utama untuk memulai aplikasi.
 * Ini memastikan semua koneksi siap sebelum server menerima permintaan.
 */
const startServer = async () => {
  try {
    // 1. Tunggu koneksi database selesai
    console.log('[SERVER] Menunggu koneksi database...');
    await connectDB();
    console.log('[SERVER] Koneksi database berhasil.');

    // 2. Jika koneksi berhasil, baru buat dan konfigurasikan server Express
    const app = express();
    const PORT = process.env.PORT || 5000;

    // Middlewares
    app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
    app.use(helmet());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // API Routes
    app.use('/api/v1', apiRoutes);

    // Error Handling
    app.use(notFoundHandler);
    app.use(errorHandler);

    // 3. Jalankan server hanya setelah semuanya siap
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('❌ FATAL: Gagal memulai server.', error);
    process.exit(1);
  }
};

// Panggil fungsi untuk memulai server
startServer();