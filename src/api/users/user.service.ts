import { User } from '../../models/user.model';
import { Order } from '../../models/order.model'; // <-- 1. Impor model Order
import { ApiError } from '../../errors/apiError';
import { IUser, IOrder } from '../../types/index'; // <-- 2. Impor tipe IOrder

/**
 * Mendapatkan profil pengguna beserta seluruh riwayat pesanannya.
 * @param userId - ID pengguna.
 * @returns Objek yang berisi profil pengguna dan daftar pesanan.
 */
export const getUserProfile = async (userId: string): Promise<{ profile: IUser, orders: IOrder[] }> => {
  // 3. Gunakan Promise.all untuk mengambil data user dan order secara bersamaan
  const [user, orders] = await Promise.all([
    User.findById(userId),
    Order.find({ 'user._id': userId }).sort({ createdAt: -1 }) // Ambil semua order milik user, diurutkan dari yang terbaru
  ]);

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  // 4. Kembalikan objek yang berisi profil dan daftar pesanan
  return {
    profile: user,
    orders: orders
  };
};

/**
 * Memperbarui profil pengguna.
 * @param userId - ID pengguna yang akan diupdate.
 * @param updateData - Data baru untuk pengguna (misalnya, nama).
 * @returns Dokumen pengguna yang sudah diupdate.
 */
export const updateUserProfile = async (userId: string, updateData: { name?: string }): Promise<IUser> => {
  // Hanya ambil field yang diizinkan untuk diupdate ('name', dll.)
  const allowedUpdates: { name?: string } = {};
  if (updateData.name) {
    allowedUpdates.name = updateData.name;
  }
  
  // Jika tidak ada data yang valid untuk diupdate, throw error
  if (Object.keys(allowedUpdates).length === 0) {
    throw new ApiError(400, 'No valid fields provided for update.');
  }

  const user = await User.findByIdAndUpdate(userId, allowedUpdates, {
    new: true, // Kembalikan dokumen yang sudah baru
    runValidators: true,
  });

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  return user;
};