import { Router } from 'express';
import { protect, admin } from '@/middlewares/auth.middleware';
import {
    getDashboardStatsHandler,
    getAllUsersHandler,
    getUserByIdHandler,
    updateUserHandler,
    deleteUserHandler,
    confirmPaymentHandler
} from './admin.controller';

import { Order } from '@/models/order.model';
import { ApiError } from '@/errors/apiError';
const router = Router();

// Middleware ini akan melindungi semua rute di bawah ini
// Hanya admin yang sudah login yang bisa mengaksesnya
router.use(protect, admin);

// Rute untuk Statistik Dashboard
router.get('/dashboard-stats', getDashboardStatsHandler);
router.put('/orders/:orderId/confirm-payment', confirmPaymentHandler);

// Rute untuk Manajemen Pengguna (CRUD)
router.route('/users')
  .get(getAllUsersHandler); // GET /api/v1/admin/users

router.route('/users/:id')
  .get(getUserByIdHandler)      // GET /api/v1/admin/users/:id
  .put(updateUserHandler)       // PUT /api/v1/admin/users/:id
  .delete(deleteUserHandler);   // DELETE /api/v1/admin/users/:id

  /**
 * Mengonfirmasi pembayaran dan mengubah status pesanan.
 * @param orderId - ID pesanan dari database (bukan orderId custom).
 * @returns Dokumen pesanan yang sudah diupdate.
 */
export const confirmOrderPayment = async (orderId: string) => {
    const order = await Order.findById(orderId);
    if (!order) {
        throw new ApiError(404, 'Order not found.');
    }

    if (order.status !== 'Pending Payment') {
        throw new ApiError(400, `Cannot confirm payment for order with status: ${order.status}`);
    }

    order.status = 'Processing'; // Status berubah menjadi "Sedang Diproses"
    await order.save();

    // Di sini Anda bisa menambahkan logika untuk mengirim email notifikasi ke pelanggan.
    
    return order;
};

export default router;