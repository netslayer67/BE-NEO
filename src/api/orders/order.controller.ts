import { Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Order } from '@/models/order.model';
import { IRequest } from '@/middlewares/auth.middleware';
import { ApiResponse } from '@/utils/apiResponse';
import { ApiError } from '@/errors/apiError';
import { Product } from '@/models/product.model';
import { IOrderItem } from '@/types'; // Pastikan IOrderItem diimpor

export const createOrderHandler = async (req: IRequest, res: Response, next: NextFunction) => {
    try {
        const { items, totalAmount, shippingAddress } = req.body;
        
        if (!req.user) {
            throw new ApiError(401, 'User not authenticated.');
        }
        const user = req.user;

        // --- PENGURANGAN STOK (TANPA TRANSAKSI) ---
        // Kita akan mengurangi stok terlebih dahulu.
        for (const item of items as IOrderItem[]) {
            const product = await Product.findById(item.product);
            if (!product || product.stock < item.quantity) {
                // Jika satu produk saja gagal, seluruh proses berhenti.
                throw new ApiError(400, `Product ${item.name} is out of stock or does not exist.`);
            }
            product.stock -= item.quantity;
            await product.save(); // Simpan perubahan stok langsung.
        }

        // --- PEMBUATAN PESANAN ---
        // Buat ID Pesanan unik
        const orderId = `RAD-${Date.now()}-${uuidv4().substring(0, 4).toUpperCase()}`;

        const newOrder = new Order({
            orderId,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
            },
            items,
            totalAmount,
            shippingAddress,
            status: 'Pending Payment', // Status awal
        });

        await newOrder.save();

        // Kembalikan detail pesanan agar bisa ditampilkan di halaman instruksi
        return new ApiResponse(res, 201, 'Order created successfully. Waiting for payment.', newOrder);

    } catch (error) {
        // Karena tidak ada transaksi, kita tidak bisa me-rollback stok secara otomatis.
        // Penanganan error yang lebih canggih bisa ditambahkan di sini jika perlu.
        console.error("Error creating order:", error);
        next(error);
    }
};

/**
 * Handler untuk mendapatkan riwayat pesanan pengguna yang sedang login.
 */
export const getMyOrdersHandler = async (req: IRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            throw new ApiError(401, 'User not authenticated.');
        }
        const orders = await Order.find({ 'user._id': req.user._id }).sort({ createdAt: -1 });
        return new ApiResponse(res, 200, 'User orders fetched successfully', orders);
    } catch (error) {
        next(error);
    }
};

/**
 * Handler untuk mendapatkan detail satu pesanan spesifik milik pengguna.
 */
export const getOrderByIdHandler = async (req: IRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            throw new ApiError(401, 'User not authenticated.');
        }
        const order = await Order.findOne({ 
            orderId: req.params.orderId,
            'user._id': req.user._id
        });

        if (!order) {
            throw new ApiError(404, 'Order not found or you do not have permission to view it.');
        }
        return new ApiResponse(res, 200, 'Order details fetched successfully', order);
    } catch (error) {
        next(error);
    }
};