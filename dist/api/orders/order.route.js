"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const order_controller_1 = require("./order.controller");
const router = (0, express_1.Router)();
// Middleware 'protect' akan diterapkan ke semua rute di bawah ini
// untuk memastikan hanya pengguna yang sudah login yang bisa mengakses.
router.use(auth_middleware_1.protect);
// Rute untuk endpoint utama '/orders'
router.route('/')
    .post(order_controller_1.createOrderHandler) // POST /api/v1/orders - Membuat pesanan baru
    .get(order_controller_1.getMyOrdersHandler); // GET  /api/v1/orders - Mendapatkan semua riwayat pesanan pengguna
// Rute untuk membatalkan pesanan (menggunakan PUT karena ini adalah update status)
router.put('/:orderId/cancel', order_controller_1.cancelOrderHandler); // <-- 2. Tambahkan rute untuk "cancel"
// Rute untuk mendapatkan detail satu pesanan spesifik
// Diletakkan terakhir agar tidak konflik dengan rute '/cancel'
router.get('/:id', order_controller_1.getOrderByIdHandler); // GET  /api/v1/orders/:orderId
exports.default = router;
