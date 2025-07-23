"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const upload_middleware_1 = require("../../middlewares/upload.middleware");
const product_controller_1 = require("./product.controller");
const router = (0, express_1.Router)();
// Rute untuk mendapatkan semua produk (publik) dan membuat produk baru (admin)
router.route('/')
    .get(product_controller_1.getAllProductsHandler)
    .post(auth_middleware_1.protect, auth_middleware_1.admin, upload_middleware_1.uploadProductImages, product_controller_1.createProductHandler);
// Rute untuk satu produk
router.route('/:id')
    .put(auth_middleware_1.protect, auth_middleware_1.admin, upload_middleware_1.uploadProductImages, product_controller_1.updateProductHandler) // Gunakan ID untuk update
    .delete(auth_middleware_1.protect, auth_middleware_1.admin, product_controller_1.deleteProductHandler); // Gunakan ID untuk delete
router.get('/slug/:slug', product_controller_1.getProductBySlugHandler); // Rute khusus untuk slug
// ✅ Rute khusus untuk update stok berdasarkan size
router.patch('/:productId/stock', auth_middleware_1.protect, auth_middleware_1.admin, product_controller_1.updateProductStockHandler);
exports.default = router;
