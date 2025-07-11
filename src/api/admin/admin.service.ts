import { User } from '@/models/user.model';
import { Order } from '@/models/order.model';
import { ApiError } from '@/errors/apiError';
import { IUser } from '@/types';
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

/**
 * Mengonfirmasi pembayaran dan mengubah status pesanan.
 * @param orderId - ID pesanan dari database (bukan orderId custom).
 * @returns Dokumen pesanan yang sudah diupdate.
 */
export const confirmOrderPayment = async (orderId: string) => {
    const order = await Order.findById(orderId);
    if (!order) {
        throw new ApiError(404, 'Order not found.');
    }

    if (order.status !== 'Pending Payment') {
        throw new ApiError(400, `Cannot confirm payment for order with status: ${order.status}`);
    }

    order.status = 'Processing'; 
    await order.save();

    // Kirim email notifikasi secara asynchronous
    sendOrderStatusUpdateEmail(order).catch(err => {
        console.error("Latar belakang: Gagal mengirim email setelah konfirmasi.", err);
    });
    
    return order;
};

// === Dashboard Stats ===
export const getDashboardStats = getStats;