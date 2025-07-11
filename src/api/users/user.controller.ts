import { Response, NextFunction } from 'express';
import { IRequest } from '@/middlewares/auth.middleware';
import { getUserProfile, updateUserProfile } from './user.service';
import { ApiResponse } from '@/utils/apiResponse';
import { ApiError } from '@/errors/apiError';

/**
 * Handler untuk mendapatkan profil pengguna yang sedang login.
 */
export const getMyProfileHandler = async (req: IRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !req.user._id) {
      throw new ApiError(401, 'User not authenticated or user ID is missing.');
    }

    // --- PERBAIKAN DI SINI ---
    // Konversi _id (yang merupakan ObjectId) menjadi string sebelum dikirim ke service.
    const userProfile = await getUserProfile(req.user._id.toString());
    
    return new ApiResponse(res, 200, 'Profile fetched successfully', userProfile);
  } catch (error) {
    next(error);
  }
};

/**
 * Handler untuk memperbarui profil pengguna yang sedang login.
 */
export const updateMyProfileHandler = async (req: IRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !req.user._id) {
      throw new ApiError(401, 'User not authenticated or user ID is missing.');
    }

    // --- PERBAIKAN DI SINI ---
    // Konversi _id (yang merupakan ObjectId) menjadi string.
    const updatedUser = await updateUserProfile(req.user._id.toString(), req.body);
    
    return new ApiResponse(res, 200, 'Profile updated successfully', updatedUser);
  } catch (error) {
    next(error);
  }
};