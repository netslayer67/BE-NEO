"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const user_controller_1 = require("./user.controller");
const router = (0, express_1.Router)();
// Semua rute di bawah ini memerlukan otentikasi (login)
router.use(auth_middleware_1.protect);
// Endpoint /api/v1/users/me untuk mengelola profil sendiri
router.route('/me')
    .get(user_controller_1.getMyProfileHandler)
    .put(user_controller_1.updateMyProfileHandler);
// Di masa depan, Anda bisa menambahkan rute admin di sini
// Contoh: router.get('/:id', admin, getUserByIdHandler);
exports.default = router;
