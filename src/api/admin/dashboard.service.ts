import { Order } from '@/models/order.model';
import { User } from '@/models/user.model';
import { Product } from '@/models/product.model';

export const getDashboardStats = async () => {
  // Hitung total pendapatan dari pesanan yang sudah lunas
  const totalRevenue = await Order.aggregate([
    { $match: { paymentStatus: 'Paid' } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } },
  ]);

  // Hitung jumlah penjualan (pesanan lunas)
  const totalSales = await Order.countDocuments({ paymentStatus: 'Paid' });

  // Hitung jumlah pelanggan baru dalam 30 hari terakhir
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const newCustomers = await User.countDocuments({ role: 'user', createdAt: { $gte: oneMonthAgo } });

  // Hitung jumlah produk yang ada
  const totalProducts = await Product.countDocuments();

  return {
    totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
    totalSales,
    newCustomers,
    totalProducts,
  };
};