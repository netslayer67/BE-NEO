import { User } from '@/models/user.model';
import { ApiError } from '@/errors/apiError';
import { IUser } from '@/types';

/**
 * Mendapatkan profil pengguna berdasarkan ID.
 * @param userId - ID pengguna.
 * @returns Dokumen pengguna tanpa password.
 */
export const getUserProfile = async (userId: string): Promise<IUser> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }
  return user;
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