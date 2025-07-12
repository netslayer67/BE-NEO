import { Router } from 'express';
import { protect } from '../../middlewares/auth.middleware';
import {
    createOrderHandler,
    getMyOrdersHandler,
    getOrderByIdHandler,
    cancelOrderHandler // <-- 1. Impor handler baru untuk pembatalan
} from './order.controller';

const router = Router();

// Middleware 'protect' akan diterapkan ke semua rute di bawah ini
// untuk memastikan hanya pengguna yang sudah login yang bisa mengakses.
router.use(protect);

// Rute untuk endpoint utama '/orders'
router.route('/')
    .post(createOrderHandler)    // POST /api/v1/orders - Membuat pesanan baru
    .get(getMyOrdersHandler);     // GET  /api/v1/orders - Mendapatkan semua riwayat pesanan pengguna

// Rute untuk membatalkan pesanan (menggunakan PUT karena ini adalah update status)
router.put('/:orderId/cancel', cancelOrderHandler); // <-- 2. Tambahkan rute untuk "cancel"

// Rute untuk mendapatkan detail satu pesanan spesifik
// Diletakkan terakhir agar tidak konflik dengan rute '/cancel'
router.get('/:id', getOrderByIdHandler);       // GET  /api/v1/orders/:orderId

export default router;