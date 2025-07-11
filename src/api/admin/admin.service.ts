// src/services/admin.service.ts
import { User } from '@/models/user.model';
import { Order } from '@/models/order.model';
import { ApiError } from '@/errors/apiError';
import { IUser, IOrder } from '@/types';
import { getDashboardStats as getStats } from './dashboard.service';
import { sendOrderStatusUpdateEmail } from '@/services/email.service';

// === User Management ===

export const getAllUsers = async (): Promise<IUser[]> => {
  return User.find({}).select('-password');
};

export const getUserById = async (userId: string): Promise<IUser> => {
  const user = await User.findById(userId).select('-password');
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }
  return user;
};

export const updateUserById = async (userId: string, updateData: Partial<Pick<IUser, 'name' | 'email' | 'role'>>): Promise<IUser> => {
  const user = await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true }).select('-password');
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }
  return user;
};

export const deleteUserById = async (userId: string): Promise<void> => {
  const user = await User.findByIdAndDelete(userId);
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }
};

// === Order Management ===

export const confirmOrderPayment = async (orderId: string): Promise<IOrder> => {
    const order = await Order.findById(orderId);
    if (!order) {
        throw new ApiError(404, 'Order not found.');
    }

    if (order.status !== 'Pending Payment') {
        throw new ApiError(400, `Cannot confirm payment for order with status: ${order.status}`);
    }

    order.status = 'Diproses'; 
    await order.save();

    sendOrderStatusUpdateEmail(order).catch(err => {
        console.error("Latar belakang: Gagal mengirim email setelah konfirmasi.", err);
    });
    
    return order;
};

export const shipOrder = async (orderId: string): Promise<IOrder> => {
    const order = await Order.findById(orderId);
    if (!order) {
        throw new ApiError(404, 'Order not found.');
    }

    if (order.status !== 'Diproses') {
        throw new ApiError(400, `Cannot ship an order with status: ${order.status}. Must be 'Processing'.`);
    }

    order.status = 'Dikirim';
    await order.save();
    
    sendOrderStatusUpdateEmail(order).catch(err => {
        console.error("Latar belakang: Gagal mengirim email notifikasi pengiriman.", err);
    });

    return order;
};

export const fulfillOrder = async (orderId: string): Promise<IOrder> => {
    const order = await Order.findById(orderId);
    if (!order) {
        throw new ApiError(404, 'Order not found.');
    }

    if (order.status !== 'Dikirim') {
        throw new ApiError(400, `Cannot fulfill an order with status: ${order.status}. Must be 'Dikirim'.`);
    }

    order.status = 'Telah Sampai';
    await order.save();
    
    sendOrderStatusUpdateEmail(order).catch(err => {
        console.error("Latar belakang: Gagal mengirim email notifikasi penyelesaian pesanan.", err);
    });

    return order;
};

// --- PENAMBAHAN FUNGSI BARU DI SINI ---

/**
 * (Admin) Mengambil semua pesanan dari database.
 * @returns {Promise<IOrder[]>} Daftar semua pesanan.
 */
export const getAllOrders = async (): Promise<IOrder[]> => {
    // Populate user details untuk mendapatkan nama dan email
    return Order.find({}).sort({ createdAt: -1 }).populate('user', 'name email');
};

/**
 * (Admin) Mengambil satu pesanan berdasarkan ID database-nya.
 * @param {string} orderId - ID unik pesanan (_id).
 * @returns {Promise<IOrder>} Detail satu pesanan.
 */
export const getOrderById = async (orderId: string): Promise<IOrder> => {
    const order = await Order.findById(orderId).populate('user', 'name email');
    if (!order) {
        throw new ApiError(404, 'Order not found.');
    }
    return order;
};

// === Dashboard Stats ===
export const getDashboardStats = getStats;