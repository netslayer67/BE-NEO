"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserProfile = exports.getUserProfile = void 0;
const user_model_1 = require("../../models/user.model");
const order_model_1 = require("../../models/order.model"); // <-- 1. Impor model Order
const apiError_1 = require("../../errors/apiError");
/**
 * Mendapatkan profil pengguna beserta seluruh riwayat pesanannya.
 * @param userId - ID pengguna.
 * @returns Objek yang berisi profil pengguna dan daftar pesanan.
 */
const getUserProfile = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    // 3. Gunakan Promise.all untuk mengambil data user dan order secara bersamaan
    const [user, orders] = yield Promise.all([
        user_model_1.User.findById(userId),
        order_model_1.Order.find({ 'user._id': userId }).sort({ createdAt: -1 }) // Ambil semua order milik user, diurutkan dari yang terbaru
    ]);
    if (!user) {
        throw new apiError_1.ApiError(404, 'User not found.');
    }
    // 4. Kembalikan objek yang berisi profil dan daftar pesanan
    return {
        profile: user,
        orders: orders
    };
});
exports.getUserProfile = getUserProfile;
/**
 * Memperbarui profil pengguna.
 * @param userId - ID pengguna yang akan diupdate.
 * @param updateData - Data baru untuk pengguna (misalnya, nama).
 * @returns Dokumen pengguna yang sudah diupdate.
 */
const updateUserProfile = (userId, updateData) => __awaiter(void 0, void 0, void 0, function* () {
    // Hanya ambil field yang diizinkan untuk diupdate ('name', dll.)
    const allowedUpdates = {};
    if (updateData.name) {
        allowedUpdates.name = updateData.name;
    }
    // Jika tidak ada data yang valid untuk diupdate, throw error
    if (Object.keys(allowedUpdates).length === 0) {
        throw new apiError_1.ApiError(400, 'No valid fields provided for update.');
    }
    const user = yield user_model_1.User.findByIdAndUpdate(userId, allowedUpdates, {
        new: true, // Kembalikan dokumen yang sudah baru
        runValidators: true,
    });
    if (!user) {
        throw new apiError_1.ApiError(404, 'User not found.');
    }
    return user;
});
exports.updateUserProfile = updateUserProfile;
