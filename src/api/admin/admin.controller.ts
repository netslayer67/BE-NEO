import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@/utils/apiResponse';
import * as adminService from './admin.service'; // Impor semua service sebagai adminService

export const confirmPaymentHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const updatedOrder = await adminService.confirmOrderPayment(req.params.orderId);
        return new ApiResponse(res, 200, 'Payment confirmed and order status updated.', updatedOrder);
    } catch (error) {
        next(error);
    }
};

// === Dashboard ===
export const getDashboardStatsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await adminService.getDashboardStats();
    return new ApiResponse(res, 200, 'Dashboard statistics fetched successfully', stats);
  } catch (error) {
    next(error);
  }
};

// === User Management ===
export const getAllUsersHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await adminService.getAllUsers();
    return new ApiResponse(res, 200, 'All users fetched successfully', users);
  } catch (error) {
    next(error);
  }
};

export const getUserByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await adminService.getUserById(req.params.id);
    return new ApiResponse(res, 200, 'User fetched successfully', user);
  } catch (error) {
    next(error);
  }
};

export const updateUserHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const updatedUser = await adminService.updateUserById(req.params.id, req.body);
        return new ApiResponse(res, 200, 'User updated successfully', updatedUser);
    } catch (error) {
        next(error);
    }
};

export const deleteUserHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await adminService.deleteUserById(req.params.id);
        return new ApiResponse(res, 200, 'User deleted successfully');
    } catch (error) {
        next(error);
    }
};