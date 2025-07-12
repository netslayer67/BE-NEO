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
exports.getDashboardStats = exports.getOrderById = exports.getAllOrders = exports.fulfillOrder = exports.shipOrder = exports.confirmOrderPayment = exports.deleteUserById = exports.updateUserById = exports.getUserById = exports.getAllUsers = void 0;
// src/services/admin.service.ts
const user_model_1 = require("../../models/user.model");
const order_model_1 = require("../../models/order.model");
const apiError_1 = require("../../errors/apiError");
const dashboard_service_1 = require("./dashboard.service");
const email_service_1 = require("../../services/email.service");
// === User Management ===
const getAllUsers = () => __awaiter(void 0, void 0, void 0, function* () {
    return user_model_1.User.find({}).select('-password');
});
exports.getAllUsers = getAllUsers;
const getUserById = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId).select('-password');
    if (!user) {
        throw new apiError_1.ApiError(404, 'User not found.');
    }
    return user;
});
exports.getUserById = getUserById;
const updateUserById = (userId, updateData) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true }).select('-password');
    if (!user) {
        throw new apiError_1.ApiError(404, 'User not found.');
    }
    return user;
});
exports.updateUserById = updateUserById;
const deleteUserById = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findByIdAndDelete(userId);
    if (!user) {
        throw new apiError_1.ApiError(404, 'User not found.');
    }
});
exports.deleteUserById = deleteUserById;
// === Order Management ===
const confirmOrderPayment = (orderId) => __awaiter(void 0, void 0, void 0, function* () {
    const order = yield order_model_1.Order.findById(orderId);
    if (!order) {
        throw new apiError_1.ApiError(404, 'Order not found.');
    }
    if (order.status !== 'Pending Payment') {
        throw new apiError_1.ApiError(400, `Cannot confirm payment for order with status: ${order.status}`);
    }
    order.status = 'Diproses';
    yield order.save();
    (0, email_service_1.sendOrderStatusUpdateEmail)(order).catch(err => {
        console.error("Latar belakang: Gagal mengirim email setelah konfirmasi.", err);
    });
    return order;
});
exports.confirmOrderPayment = confirmOrderPayment;
const shipOrder = (orderId) => __awaiter(void 0, void 0, void 0, function* () {
    const order = yield order_model_1.Order.findById(orderId);
    if (!order) {
        throw new apiError_1.ApiError(404, 'Order not found.');
    }
    if (order.status !== 'Diproses') {
        throw new apiError_1.ApiError(400, `Cannot ship an order with status: ${order.status}. Must be 'Processing'.`);
    }
    order.status = 'Dikirim';
    yield order.save();
    (0, email_service_1.sendOrderStatusUpdateEmail)(order).catch(err => {
        console.error("Latar belakang: Gagal mengirim email notifikasi pengiriman.", err);
    });
    return order;
});
exports.shipOrder = shipOrder;
const fulfillOrder = (orderId) => __awaiter(void 0, void 0, void 0, function* () {
    const order = yield order_model_1.Order.findById(orderId);
    if (!order) {
        throw new apiError_1.ApiError(404, 'Order not found.');
    }
    if (order.status !== 'Dikirim') {
        throw new apiError_1.ApiError(400, `Cannot fulfill an order with status: ${order.status}. Must be 'Dikirim'.`);
    }
    order.status = 'Telah Sampai';
    yield order.save();
    (0, email_service_1.sendOrderStatusUpdateEmail)(order).catch(err => {
        console.error("Latar belakang: Gagal mengirim email notifikasi penyelesaian pesanan.", err);
    });
    return order;
});
exports.fulfillOrder = fulfillOrder;
// --- PENAMBAHAN FUNGSI BARU DI SINI ---
/**
 * (Admin) Mengambil semua pesanan dari database.
 * @returns {Promise<IOrder[]>} Daftar semua pesanan.
 */
const getAllOrders = () => __awaiter(void 0, void 0, void 0, function* () {
    // Populate user details untuk mendapatkan nama dan email
    return order_model_1.Order.find({}).sort({ createdAt: -1 }).populate('user', 'name email');
});
exports.getAllOrders = getAllOrders;
/**
 * (Admin) Mengambil satu pesanan berdasarkan ID database-nya.
 * @param {string} orderId - ID unik pesanan (_id).
 * @returns {Promise<IOrder>} Detail satu pesanan.
 */
const getOrderById = (orderId) => __awaiter(void 0, void 0, void 0, function* () {
    const order = yield order_model_1.Order.findById(orderId).populate('user', 'name email');
    if (!order) {
        throw new apiError_1.ApiError(404, 'Order not found.');
    }
    return order;
});
exports.getOrderById = getOrderById;
// === Dashboard Stats ===
exports.getDashboardStats = dashboard_service_1.getDashboardStats;
