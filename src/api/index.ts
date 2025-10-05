import { Router } from 'express';
import authRoutes from './auth/auth.route';
import productRoutes from './products/product.route';
import orderRoutes from './orders/order.route';
import adminRoutes from './admin/admin.route';
import userRoutes from './users/user.route'; // <--- 1. Impor rute user
import paymentRoutes from './payment/payment.route';
import shippingRoutes from './shipping/shipping.route';

const router = Router();

// --- Pendaftaran Semua Rute ---

// Rute Publik
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/shipping', shippingRoutes);

// Rute Terproteksi (memerlukan login)
router.use('/orders', orderRoutes);
router.use('/users', userRoutes); // <--- 2. Daftarkan rute user di sini
router.use('/payment', paymentRoutes);

// Rute Khusus Admin
router.use('/admin', adminRoutes);


export default router;