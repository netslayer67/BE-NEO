console.log('[SERVER] 1. Memulai eksekusi file server.ts');

import express from 'express';
console.log('[SERVER] 2. Impor express selesai');

import dotenv from 'dotenv';
dotenv.config();
console.log('[SERVER] 3. Konfigurasi dotenv selesai');

import cors from 'cors';
console.log('[SERVER] 4. Impor cors selesai');

import helmet from 'helmet';
console.log('[SERVER] 5. Impor helmet selesai');

import apiRoutes from './api';
console.log('[SERVER] 6. Impor apiRoutes selesai');

import connectDB from './config/database';
console.log('[SERVER] 7. Impor connectDB selesai');

import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
console.log('[SERVER] 8. Impor middleware error selesai');


const app = express();
const PORT = process.env.PORT || 5000;
console.log(`[SERVER] 9. Port diatur ke: ${PORT}`);

// Connect to Database
console.log('[SERVER] 10. Memanggil fungsi connectDB...');
connectDB();
console.log('[SERVER] 11. Panggilan ke connectDB selesai (proses async berjalan di latar belakang)');

// Middlewares
console.log('[SERVER] 12. Menerapkan middleware...');
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
console.log('[SERVER] 13. Middleware selesai diterapkan');

// API Routes
console.log('[SERVER] 14. Menerapkan rute API...');
app.use('/api/v1', apiRoutes);
console.log('[SERVER] 15. Rute API selesai diterapkan');

// Error Handling
console.log('[SERVER] 16. Menerapkan handler error...');
app.use(notFoundHandler);
app.use(errorHandler);
console.log('[SERVER] 17. Handler error selesai diterapkan');

console.log('[SERVER] 18. Menjalankan app.listen...');
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
console.log('[SERVER] 19. Panggilan ke app.listen selesai');