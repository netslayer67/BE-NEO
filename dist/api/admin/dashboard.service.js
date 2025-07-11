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
exports.getDashboardStats = void 0;
const order_model_1 = require("@/models/order.model");
const user_model_1 = require("@/models/user.model");
const product_model_1 = require("@/models/product.model");
const getDashboardStats = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    // --- Diperbaiki ---
    // Hitung total pendapatan dari pesanan yang statusnya BUKAN 'Pending Payment' atau 'Cancelled'.
    // Ini lebih akurat mencerminkan pesanan yang sudah terbayar atau sedang diproses.
    const totalRevenueResult = yield order_model_1.Order.aggregate([
        { $match: { status: { $in: ['Diproses', 'Dikirim', 'Telah Sampai'] } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    // Hitung jumlah total penjualan dengan logika yang sama.
    const totalSales = yield order_model_1.Order.countDocuments({
        status: { $in: ['Diproses', 'Dikirim', 'Telah Sampai'] }
    });
    // --- Disempurnakan ---
    // Hitung jumlah pelanggan baru dalam 30 hari terakhir.
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const newCustomers = yield user_model_1.User.countDocuments({ role: 'user', createdAt: { $gte: oneMonthAgo } });
    // Hitung jumlah total produk yang ada.
    const totalProducts = yield product_model_1.Product.countDocuments();
    // --- BARU ---
    // Dapatkan rincian jumlah pesanan berdasarkan statusnya.
    const orderStatusCounts = yield order_model_1.Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { _id: 0, status: '$_id', count: 1 } }
    ]);
    const statusSummary = {
        pending: ((_a = orderStatusCounts.find(s => s.status === 'Pending Payment')) === null || _a === void 0 ? void 0 : _a.count) || 0,
        processing: ((_b = orderStatusCounts.find(s => s.status === 'Dikirim')) === null || _b === void 0 ? void 0 : _b.count) || 0,
        shipped: ((_c = orderStatusCounts.find(s => s.status === 'Dikirim')) === null || _c === void 0 ? void 0 : _c.count) || 0,
        fulfilled: ((_d = orderStatusCounts.find(s => s.status === 'Telah Sampai')) === null || _d === void 0 ? void 0 : _d.count) || 0,
        cancelled: ((_e = orderStatusCounts.find(s => s.status === 'Cancelled')) === null || _e === void 0 ? void 0 : _e.count) || 0,
    };
    // --- BARU ---
    // Dapatkan 5 pesanan terbaru untuk ditampilkan di dasbor.
    const recentOrders = yield order_model_1.Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('orderId user.name totalAmount status createdAt');
    // --- Diperbarui ---
    // Mengembalikan objek yang lebih terstruktur.
    return {
        revenue: {
            total: totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0,
        },
        sales: {
            total: totalSales,
        },
        users: {
            newLast30Days: newCustomers,
        },
        products: {
            total: totalProducts,
        },
        orders: {
            statusSummary,
            recent: recentOrders
        }
    };
});
exports.getDashboardStats = getDashboardStats;
