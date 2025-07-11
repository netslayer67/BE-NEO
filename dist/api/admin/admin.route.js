"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("@/middlewares/auth.middleware");
const admin_controller_1 = require("./admin.controller");
const router = (0, express_1.Router)();
// Middleware ini akan melindungi semua rute di bawah ini
// Hanya admin yang sudah login yang bisa mengaksesnya
router.use(auth_middleware_1.protect, auth_middleware_1.admin);
// === Rute untuk Statistik Dashboard ===
router.get('/dashboard-stats', admin_controller_1.getDashboardStatsHandler);
router.get('/orders', admin_controller_1.getAllOrdersHandler); // <-- Rute baru untuk GET semua pesanan
router.get('/orders/:id', admin_controller_1.getOrderByIdHandler);
// === Rute untuk Manajemen Pesanan ===
router.put('/orders/:orderId/confirm-payment', admin_controller_1.confirmPaymentHandler);
router.put('/orders/:orderId/ship', admin_controller_1.shipOrderHandler); // <-- 3. Tambahkan route untuk "Barang Diantar"
router.put('/orders/:orderId/fulfill', admin_controller_1.fulfillOrderHandler); // <-- 4. Tambahkan route untuk "Barang Tiba"
// === Rute untuk Manajemen Pengguna (CRUD) ===
router.route('/users')
    .get(admin_controller_1.getAllUsersHandler); // GET /api/v1/admin/users
router.route('/users/:id')
    .get(admin_controller_1.getUserByIdHandler) // GET /api/v1/admin/users/:id
    .put(admin_controller_1.updateUserHandler) // PUT /api/v1/admin/users/:id
    .delete(admin_controller_1.deleteUserHandler); // DELETE /api/v1/admin/users/:id
exports.default = router;
