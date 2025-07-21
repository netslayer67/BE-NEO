import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../../utils/apiResponse';
import * as adminService from './admin.service'; // Impor semua service sebagai adminService


export const confirmPaymentHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const updatedOrder = await adminService.confirmOrderPayment(req.params.orderId);
        return new ApiResponse(res, 200, 'Payment confirmed and order status updated to Processing.', updatedOrder);
    } catch (error) {
        next(error);
    }
};

/**
 * (BARU) Handler untuk mengubah status pesanan menjadi 'Shipped'.
 */
export const shipOrderHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const updatedOrder = await adminService.shipOrder(req.params.orderId);
        return new ApiResponse(res, 200, 'Order status updated to Shipped.', updatedOrder);
    } catch (error) {
        next(error);
    }
};

/**
 * (BARU) Handler untuk mengubah status pesanan menjadi 'Fulfilled'.
 */
export const fulfillOrderHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const updatedOrder = await adminService.fulfillOrder(req.params.orderId);
        return new ApiResponse(res, 200, 'Order status updated to Fulfilled.', updatedOrder);
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

/**
 * @description (Admin) Mengambil semua pesanan dari semua pengguna.
 */
export const getAllOrdersHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orders = await adminService.getAllOrders();
    return new ApiResponse(res, 200, 'All orders fetched successfully', orders);
  } catch (error) {
    next(error);
  }
};

/**
 * @description (Admin) Mengambil detail satu pesanan berdasarkan ID.
 * @param {string} req.params.id - ID unik dari pesanan.
 */
export const getOrderByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await adminService.getOrderById(req.params.id);
    return new ApiResponse(res, 200, 'Order details fetched successfully', order);
  } catch (error) {
    next(error);
  }
};