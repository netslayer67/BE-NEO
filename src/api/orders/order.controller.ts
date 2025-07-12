import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Order } from '../../models/order.model';
import { IRequest } from '../../middlewares/auth.middleware';
import { ApiResponse } from '../../utils/apiResponse';
import { ApiError } from '../../errors/apiError';
import { Product } from '../../models/product.model';
import { IOrderItem, IShippingAddress } from '../../types/index';

// =================================================================
// PERBAIKAN UTAMA ADA DI SINI
// =================================================================

/**
 * @description Membuat pesanan baru dengan beberapa item produk.
 * Menggunakan transaksi HANYA di lingkungan produksi untuk memastikan integritas data.
 */
export const createOrderHandler = async (req: IRequest, res: Response, next: NextFunction) => {
    // Memulai sesi transaksi HANYA jika di lingkungan 'production'
    const isProduction = process.env.NODE_ENV === 'production';
    const session = isProduction ? await mongoose.startSession() : null;
    if (session) {
        session.startTransaction();
    }

    try {
        const { items, shippingAddress } = req.body as { items: IOrderItem[], shippingAddress: IShippingAddress };
        if (!req.user) throw new ApiError(401, 'User not authenticated.');
        if (!items || items.length === 0) throw new ApiError(400, 'Order items cannot be empty.');

        let calculatedTotalAmount = 0;
        const processedItems: IOrderItem[] = [];
        const opts = { session }; // Opsi untuk menyertakan sesi dalam query

        for (const item of items) {
            const product = await Product.findById(item.product).setOptions(opts);
            if (!product) throw new ApiError(404, `Product with id ${item.product} not found.`);
            if (product.stock < item.quantity) throw new ApiError(400, `Not enough stock for '${product.name}'.`);

            product.stock -= item.quantity;
            await product.save(opts);

            calculatedTotalAmount += product.price * item.quantity;
            processedItems.push({
                product: product,
                name: product.name,
                quantity: item.quantity,
                price: product.price
            });
        }
        
        const orderId = `NEO-${Date.now()}-${uuidv4().substring(0, 4).toUpperCase()}`;
        const newOrder = new Order({
            orderId,
            user: { _id: req.user._id, name: req.user.name, email: req.user.email },
            items: processedItems,
            totalAmount: calculatedTotalAmount,
            shippingAddress,
            status: 'Pending Payment',
        });

        await newOrder.save(opts);

        if (session) {
            await session.commitTransaction();
        }
        
        return new ApiResponse(res, 201, 'Order created successfully.', newOrder);

    } catch (error) {
        if (session) {
            await session.abortTransaction();
        }
        next(error);
    } finally {
        if (session) {
            session.endSession();
        }
    }
};


/**
 * @description Membatalkan pesanan oleh pengguna dan mengembalikan stok produk.
 * Menggunakan transaksi HANYA di lingkungan produksi.
 */
export const cancelOrderHandler = async (req: IRequest, res: Response, next: NextFunction) => {
    const isProduction = process.env.NODE_ENV === 'production';
    const session = isProduction ? await mongoose.startSession() : null;
    if (session) {
        session.startTransaction();
    }

    try {
        if (!req.user) throw new ApiError(401, 'User not authenticated.');
        
        const opts = { session };
        const order = await Order.findOne({
            orderId: req.params.orderId,
            'user._id': req.user._id
        }).setOptions(opts);

        if (!order) throw new ApiError(404, 'Order not found.');
        if (order.status !== 'Pending Payment') throw new ApiError(400, `Cannot cancel order with status '${order.status}'.`);

        for (const item of order.items) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: item.quantity }
            }, opts);
        }

        order.status = 'Cancelled';
        await order.save(opts);

        if (session) {
            await session.commitTransaction();
        }

        return new ApiResponse(res, 200, 'Order has been successfully cancelled.', order);

    } catch (error) {
        if (session) {
            await session.abortTransaction();
        }
        next(error);
    } finally {
        if (session) {
            session.endSession();
        }
    }
};

// ... (getMyOrdersHandler dan getOrderByIdHandler tidak perlu diubah)

export const getMyOrdersHandler = async (req: IRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) throw new ApiError(401, 'User not authenticated.');
        const orders = await Order.find({ 'user._id': req.user._id }).sort({ createdAt: -1 });
        return new ApiResponse(res, 200, 'User orders fetched successfully', orders);
    } catch (error) {
        next(error);
    }
};

export const getOrderByIdHandler = async (req: IRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            throw new ApiError(401, 'User not authenticated.');
        }

        const { _id } = req.params; // Ambil _id dari parameter URL

        // --- PERBAIKAN DI SINI ---
        // Mencari berdasarkan `_id` dokumen dan memastikan pesanan ini milik pengguna yang login.
        const order = await Order.findOne({
            _id: _id,
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