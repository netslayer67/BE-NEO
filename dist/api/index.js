"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_route_1 = __importDefault(require("./auth/auth.route"));
const product_route_1 = __importDefault(require("./products/product.route"));
const order_route_1 = __importDefault(require("./orders/order.route"));
const admin_route_1 = __importDefault(require("./admin/admin.route"));
const user_route_1 = __importDefault(require("./users/user.route")); // <--- 1. Impor rute user
const router = (0, express_1.Router)();
// --- Pendaftaran Semua Rute ---
// Rute Publik
router.use('/auth', auth_route_1.default);
router.use('/products', product_route_1.default);
// Rute Terproteksi (memerlukan login)
router.use('/orders', order_route_1.default);
router.use('/users', user_route_1.default); // <--- 2. Daftarkan rute user di sini
// Rute Khusus Admin
router.use('/admin', admin_route_1.default);
exports.default = router;
