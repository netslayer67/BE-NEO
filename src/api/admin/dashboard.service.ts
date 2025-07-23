// src/controllers/admin/dashboard.controller.ts (atau service)

import { Order } from '../../models/order.model';
import { User } from '../../models/user.model';
import { Product } from '../../models/product.model';
import { IOrder } from '../../types';
import mongoose from 'mongoose';

export const getDashboardStats = async () => {
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // === Revenue Calculation ===
  const thisMonthRevenue = await Order.aggregate([
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

  const lastMonthRevenue = await Order.aggregate([
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

  const currentRevenue = thisMonthRevenue[0]?.total || 0;
  const previousRevenue = lastMonthRevenue[0]?.total || 0;
  const revenueChange = previousRevenue > 0
    ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
    : 100;

  // === Sales (order count) ===
  const currentSales = await Order.countDocuments({
    createdAt: { $gte: startOfThisMonth },
    status: { $in: ['Diproses', 'Dikirim', 'Telah Sampai'] }
  });

  const lastMonthSales = await Order.countDocuments({
    createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth },
    status: { $in: ['Diproses', 'Dikirim', 'Telah Sampai'] }
  });

  const salesChange = lastMonthSales > 0
    ? ((currentSales - lastMonthSales) / lastMonthSales) * 100
    : 100;

  // === Subscriptions (new users) ===
  const currentSubscriptions = await User.countDocuments({
    role: 'user',
    createdAt: { $gte: startOfThisMonth }
  });

  const lastMonthSubscriptions = await User.countDocuments({
    role: 'user',
    createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth }
  });

  const subscriptionsChange = lastMonthSubscriptions > 0
    ? ((currentSubscriptions - lastMonthSubscriptions) / lastMonthSubscriptions) * 100
    : 100;

  // === Active Users (logged in or active recently) ===
  const activeSince = new Date(Date.now() - 10 * 60 * 1000); // last 10 minutes
  const activeUsers = await User.countDocuments({
    lastActiveAt: { $gte: activeSince },
    role: 'user'
  });

  // === Product Count ===
  const totalProducts = await Product.countDocuments();

  // === Order Status Summary ===
  const orderStatusCounts = await Order.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $project: { _id: 0, status: '$_id', count: 1 } }
  ]);

  const statusSummary = {
    pending: orderStatusCounts.find(s => s.status === 'Pending Payment')?.count || 0,
    processing: orderStatusCounts.find(s => s.status === 'Diproses')?.count || 0,
    shipped: orderStatusCounts.find(s => s.status === 'Dikirim')?.count || 0,
    fulfilled: orderStatusCounts.find(s => s.status === 'Telah Sampai')?.count || 0,
    cancelled: orderStatusCounts.find(s => s.status === 'Cancelled')?.count || 0,
  };

  // === Recent Orders ===
  const recentOrders: IOrder[] = await Order.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select('orderId user.name totalAmount status createdAt');

  // === Sales Overview (last 7 months) ===
  const salesOverview = await Order.aggregate([
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
    if (match) match.total = item.total;
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
};
