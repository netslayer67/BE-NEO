import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Order } from '../../models/order.model';
import { Product } from '../../models/product.model';
import { IRequest } from '../../middlewares/auth.middleware';
import { ApiResponse } from '../../utils/apiResponse';
import { ApiError } from '../../errors/apiError';
import { IOrderItem, IShippingAddress } from '../../types';
import { createTransaction } from '../../services/midtrans.service';
import { getSocketIO } from '../../services/socket.service';

/**
 * @desc Membuat pesanan baru & memproses pembayaran dengan Midtrans
 * @route POST /api/v1/orders
 */
export const createOrderHandler = async (req: IRequest, res: Response, next: NextFunction) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const session = isProduction ? await mongoose.startSession() : null;
  if (session) session.startTransaction();

  try {
    const { items, shippingAddress, paymentMethod } = req.body as {
      items: IOrderItem[];
      shippingAddress: IShippingAddress;
      paymentMethod: 'online' | 'offline';
    };

    if (!req.user) throw new ApiError(401, 'User not authenticated.');
    if (!items || items.length === 0) throw new ApiError(400, 'Order items cannot be empty.');
    if (!['online', 'offline'].includes(paymentMethod)) {
      throw new ApiError(400, 'Invalid payment method.');
    }

    const opts = { session };
    let itemsPrice = 0;
    const processedItems: IOrderItem[] = [];

    for (const item of items) {
      const product = await Product.findById(item.product).setOptions(opts);
      if (!product) throw new ApiError(404, `Product with ID ${item.product} not found.`);
      if (product.stock < item.quantity) {
        throw new ApiError(400, `Insufficient stock for '${product.name}'.`);
      }

      product.stock -= item.quantity;
      await product.save(opts);

      itemsPrice += product.price * item.quantity;

      processedItems.push({
        product,
        name: product.name,
        quantity: item.quantity,
        price: product.price
      });
    }

    const orderId = `NEO-${Date.now()}-${uuidv4().substring(0, 4).toUpperCase()}`;
    const shippingPrice = 15000;
    const adminFee = paymentMethod === 'offline' ? 2500 : 0;
    const onlineDiscount = paymentMethod === 'online' ? 3000 : 0;

    const totalAmount = itemsPrice + shippingPrice + adminFee - onlineDiscount;

    const newOrder = new Order({
      orderId,
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email
      },
      items: processedItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      adminFee,
      discount: onlineDiscount,
      totalAmount,
      status: paymentMethod === 'online' ? 'Pending Payment' : 'Diproses'
    });

    await newOrder.save(opts);

    // Emit ke admin bahwa ada pesanan baru
    const io = getSocketIO();
    if (io) {
      io.emit('new-order', {
        orderId: newOrder.orderId,
        user: req.user.name,
        total: totalAmount
      });

      io.emit('order-status-updated', {
        orderId: newOrder.orderId,
        status: newOrder.status,
        user: newOrder.user.name,
        totalAmount: newOrder.totalAmount
      });
      io.emit('dashboard-update');
    }

    // Midtrans hanya jika metode online
    let midtransSnapToken: string | null = null;
    let redirectUrl: string | null = null;

    if (paymentMethod === 'online') {
      const midtransRes = await createTransaction(orderId, totalAmount, {
        first_name: req.user.name,
        email: req.user.email
      });

      midtransSnapToken = midtransRes.token;
      redirectUrl = midtransRes.redirect_url;
    }

    if (session) await session.commitTransaction();

    return new ApiResponse(res, 201, 'Order created successfully.', {
      order: newOrder,
      midtransSnapToken,
      redirectUrl
    });
  } catch (error) {
    if (session) await session.abortTransaction();
    next(error);
  } finally {
    if (session) session.endSession();
  }
};


/**
 * @desc Membatalkan pesanan dan mengembalikan stok
 * @route PATCH /api/v1/orders/:orderId/cancel
 */
export const cancelOrderHandler = async (req: IRequest, res: Response, next: NextFunction) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const session = isProduction ? await mongoose.startSession() : null;
  if (session) session.startTransaction();

  try {
    if (!req.user) throw new ApiError(401, 'User not authenticated.');
    const opts = { session };

    // Cari pesanan milik user yang sedang login
    const order = await Order.findOne({
      orderId: req.params.orderId,
      'user._id': req.user._id
    }).setOptions(opts);

    if (!order) throw new ApiError(404, 'Order not found.');

    const cancellableStatuses = ['Pending Payment', 'Diproses'];
    if (!cancellableStatuses.includes(order.status)) {
      throw new ApiError(400, `Cannot cancel order with status '${order.status}'.`);
    }

    // Kembalikan stok produk
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity }
      }, opts);
    }

    // Ubah status order
    order.status = 'Cancelled';
    await order.save(opts); // Simpan ke database dulu sebelum emit

    // Emit event real-time ke admin bahwa status order berubah
    const io = getSocketIO();
    if (io) {
      io.emit('order-status-updated', {
        orderId: order.orderId,
        status: order.status,
        user: order.user.name,
        totalAmount: order.totalAmount,
      });
      io.emit('dashboard-update');
    }

    if (session) await session.commitTransaction();

    return new ApiResponse(res, 200, 'Order has been successfully cancelled.', order);
  } catch (error) {
    if (session) await session.abortTransaction();
    next(error);
  } finally {
    if (session) session.endSession();
  }
};



/**
 * @desc Mendapatkan semua pesanan milik user yang login
 * @route GET /api/v1/orders/my
 */
export const getMyOrdersHandler = async (req: IRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'User not authenticated.');

    const orders = await Order.find({ 'user._id': req.user._id }).sort({ createdAt: -1 });
    return new ApiResponse(res, 200, 'User orders fetched successfully', orders);
  } catch (error) {
    next(error);
  }
};


/**
 * @desc Mendapatkan detail pesanan berdasarkan ID
 * @route GET /api/v1/orders/:_id
 */
export const getOrderByIdHandler = async (req: IRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'User not authenticated.');

    const { _id } = req.params;
    const order = await Order.findOne({ _id, 'user._id': req.user._id });

    if (!order) {
      throw new ApiError(404, 'Order not found or you do not have permission to view it.');
    }

    return new ApiResponse(res, 200, 'Order details fetched successfully', order);
  } catch (error) {
    next(error);
  }
};
