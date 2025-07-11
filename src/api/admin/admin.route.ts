import { Router } from 'express';
import { protect, admin } from '@/middlewares/auth.middleware';
import {
    getDashboardStatsHandler,
    getAllUsersHandler,
    getUserByIdHandler,
    updateUserHandler,
    deleteUserHandler,
    confirmPaymentHandler,
    shipOrderHandler,      // <-- 1. Impor handler baru
    fulfillOrderHandler,    // <-- 2. Impor handler baru
    getAllOrdersHandler,  // <-- Impor
    getOrderByIdHandler 
} from './admin.controller';

const router = Router();

// Middleware ini akan melindungi semua rute di bawah ini
// Hanya admin yang sudah login yang bisa mengaksesnya
router.use(protect, admin);

// === Rute untuk Statistik Dashboard ===
router.get('/dashboard-stats', getDashboardStatsHandler);
router.get('/orders', getAllOrdersHandler); // <-- Rute baru untuk GET semua pesanan
router.get('/orders/:id', getOrderByIdHandler);

// === Rute untuk Manajemen Pesanan ===
router.put('/orders/:orderId/confirm-payment', confirmPaymentHandler);
router.put('/orders/:orderId/ship', shipOrderHandler);          // <-- 3. Tambahkan route untuk "Barang Diantar"
router.put('/orders/:orderId/fulfill', fulfillOrderHandler);      // <-- 4. Tambahkan route untuk "Barang Tiba"


// === Rute untuk Manajemen Pengguna (CRUD) ===
router.route('/users')
  .get(getAllUsersHandler); // GET /api/v1/admin/users

router.route('/users/:id')
  .get(getUserByIdHandler)      // GET /api/v1/admin/users/:id
  .put(updateUserHandler)       // PUT /api/v1/admin/users/:id
  .delete(deleteUserHandler);   // DELETE /api/v1/admin/users/:id

export default router;