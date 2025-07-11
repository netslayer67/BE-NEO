import { Order } from '@/models/order.model';
import { User } from '@/models/user.model';
import { Product } from '@/models/product.model';
import { IOrder } from '@/types';

export const getDashboardStats = async () => {
    // --- Diperbaiki ---
    // Hitung total pendapatan dari pesanan yang statusnya BUKAN 'Pending Payment' atau 'Cancelled'.
    // Ini lebih akurat mencerminkan pesanan yang sudah terbayar atau sedang diproses.
    const totalRevenueResult = await Order.aggregate([
        { $match: { status: { $in: ['Diproses', 'Dikirim', 'Telah Sampai'] } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    // Hitung jumlah total penjualan dengan logika yang sama.
    const totalSales = await Order.countDocuments({
        status: { $in: ['Diproses', 'Dikirim', 'Telah Sampai'] }
    });

    // --- Disempurnakan ---
    // Hitung jumlah pelanggan baru dalam 30 hari terakhir.
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const newCustomers = await User.countDocuments({ role: 'user', createdAt: { $gte: oneMonthAgo } });

    // Hitung jumlah total produk yang ada.
    const totalProducts = await Product.countDocuments();
    
    // --- BARU ---
    // Dapatkan rincian jumlah pesanan berdasarkan statusnya.
    const orderStatusCounts = await Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { _id: 0, status: '$_id', count: 1 } }
    ]);
    
    const statusSummary = {
        pending: orderStatusCounts.find(s => s.status === 'Pending Payment')?.count || 0,
        processing: orderStatusCounts.find(s => s.status === 'Dikirim')?.count || 0,
        shipped: orderStatusCounts.find(s => s.status === 'Dikirim')?.count || 0,
        fulfilled: orderStatusCounts.find(s => s.status === 'Telah Sampai')?.count || 0,
        cancelled: orderStatusCounts.find(s => s.status === 'Cancelled')?.count || 0,
    };

    // --- BARU ---
    // Dapatkan 5 pesanan terbaru untuk ditampilkan di dasbor.
    const recentOrders: IOrder[] = await Order.find()
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
};