import { Router } from 'express';
import { protect } from '@/middlewares/auth.middleware';
import {
    createOrderHandler,
    getMyOrdersHandler,      // <-- Impor handler baru
    getOrderByIdHandler      // <-- Impor handler baru
} from './order.controller';

const router = Router();

// Middleware 'protect' akan diterapkan ke semua rute di bawah ini
router.use(protect);

// Rute untuk membuat pesanan baru
router.post('/', createOrderHandler);

// --- PERBAIKAN DI SINI ---
// Tambahkan rute baru untuk mendapatkan riwayat pesanan pengguna
router.get('/my-orders', getMyOrdersHandler);

// Tambahkan rute baru untuk mendapatkan detail pesanan spesifik
// Pastikan rute dengan parameter (:orderId) diletakkan setelah rute statis ('/my-orders')
router.get('/:orderId', getOrderByIdHandler);


export default router;