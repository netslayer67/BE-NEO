"use strict";
// src/controllers/admin/dashboard.controller.ts (atau service)
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
const order_model_1 = require("../../models/order.model");
const user_model_1 = require("../../models/user.model");
const product_model_1 = require("../../models/product.model");
const getDashboardStats = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g;
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    // === Revenue Calculation ===
    const thisMonthRevenue = yield order_model_1.Order.aggregate([
        {
            $match: {
                createdAt: { $gte: startOfThisMonth },
                status: { $in: ['Diproses', 'Dikirim', 'Telah Sampai'] }
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$totalAmount' }
            }
        }
    ]);
    const lastMonthRevenue = yield order_model_1.Order.aggregate([
        {
            $match: {
                createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth },
                status: { $in: ['Diproses', 'Dikirim', 'Telah Sampai'] }
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$totalAmount' }
            }
        }
    ]);
    const currentRevenue = ((_a = thisMonthRevenue[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
    const previousRevenue = ((_b = lastMonthRevenue[0]) === null || _b === void 0 ? void 0 : _b.total) || 0;
    const revenueChange = previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : 100;
    // === Sales (order count) ===
    const currentSales = yield order_model_1.Order.countDocuments({
        createdAt: { $gte: startOfThisMonth },
        status: { $in: ['Diproses', 'Dikirim', 'Telah Sampai'] }
    });
    const lastMonthSales = yield order_model_1.Order.countDocuments({
        createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth },
        status: { $in: ['Diproses', 'Dikirim', 'Telah Sampai'] }
    });
    const salesChange = lastMonthSales > 0
        ? ((currentSales - lastMonthSales) / lastMonthSales) * 100
        : 100;
    // === Subscriptions (new users) ===
    const currentSubscriptions = yield user_model_1.User.countDocuments({
        role: 'user',
        createdAt: { $gte: startOfThisMonth }
    });
    const lastMonthSubscriptions = yield user_model_1.User.countDocuments({
        role: 'user',
        createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth }
    });
    const subscriptionsChange = lastMonthSubscriptions > 0
        ? ((currentSubscriptions - lastMonthSubscriptions) / lastMonthSubscriptions) * 100
        : 100;
    // === Active Users (logged in or active recently) ===
    const activeSince = new Date(Date.now() - 10 * 60 * 1000); // last 10 minutes
    const activeUsers = yield user_model_1.User.countDocuments({
        lastActiveAt: { $gte: activeSince },
        role: 'user'
    });
    // === Product Count ===
    const totalProducts = yield product_model_1.Product.countDocuments();
    // === Order Status Summary ===
    const orderStatusCounts = yield order_model_1.Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { _id: 0, status: '$_id', count: 1 } }
    ]);
    const statusSummary = {
        pending: ((_c = orderStatusCounts.find(s => s.status === 'Pending Payment')) === null || _c === void 0 ? void 0 : _c.count) || 0,
        processing: ((_d = orderStatusCounts.find(s => s.status === 'Diproses')) === null || _d === void 0 ? void 0 : _d.count) || 0,
        shipped: ((_e = orderStatusCounts.find(s => s.status === 'Dikirim')) === null || _e === void 0 ? void 0 : _e.count) || 0,
        fulfilled: ((_f = orderStatusCounts.find(s => s.status === 'Telah Sampai')) === null || _f === void 0 ? void 0 : _f.count) || 0,
        cancelled: ((_g = orderStatusCounts.find(s => s.status === 'Cancelled')) === null || _g === void 0 ? void 0 : _g.count) || 0,
    };
    // === Recent Orders ===
    const recentOrders = yield order_model_1.Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('orderId user.name totalAmount status createdAt');
    // === Sales Overview (last 7 months) ===
    const salesOverview = yield order_model_1.Order.aggregate([
        {
            $match: {
                createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 6, 1) },
                status: { $in: ['Diproses', 'Dikirim', 'Telah Sampai'] }
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                },
                total: { $sum: '$totalAmount' }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const last7Months = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(now.getFullYear(), now.getMonth() - 6 + i, 1);
        return {
            label: monthNames[date.getMonth()],
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            total: 0,
        };
    });
    for (const item of salesOverview) {
        const match = last7Months.find(m => m.month === item._id.month && m.year === item._id.year);
        if (match)
            match.total = item.total;
    }
    return {
        revenue: {
            total: currentRevenue,
            change: revenueChange,
        },
        sales: {
            total: currentSales,
            change: salesChange,
        },
        subscriptions: {
            total: currentSubscriptions,
            change: subscriptionsChange,
        },
        activeUsers: {
            total: activeUsers,
        },
        products: {
            total: totalProducts,
        },
        orders: {
            statusSummary,
            recent: recentOrders,
        },
        salesOverview: last7Months.map(m => ({ month: m.label, total: m.total })),
    };
});
exports.getDashboardStats = getDashboardStats;
