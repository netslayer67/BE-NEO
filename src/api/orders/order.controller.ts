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
import { calculateOrderTotal } from '../../utils/order';
import { sendOrderStatusUpdateEmail } from '../../services/email.service';

/**
 * @desc Membuat pesanan baru & memproses pembayaran dengan Midtrans
 * @route POST /api/v1/orders
 */
export const createOrderHandler = async (
  req: IRequest,
  res: Response,
  next: NextFunction
) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const session = isProduction ? await mongoose.startSession() : null;
  if (session) session.startTransaction();

  try {
    const { items, shippingAddress, paymentMethod } = req.body as {
      items: IOrderItem[];
      shippingAddress: IShippingAddress;
      paymentMethod: 'va' | 'cod';
    };

    if (!req.user) throw new ApiError(401, 'User not authenticated.');
    if (!items?.length) throw new ApiError(400, 'Order items cannot be empty.');
    if (!['va', 'cod'].includes(paymentMethod)) {
      throw new ApiError(400, 'Invalid payment method. Must be va or cod.');
    }

    const opts = { session };
    let itemsPrice = 0;
    const processedItems: IOrderItem[] = [];

    for (const item of items) {
      const product = await Product.findById(item.product).setOptions(opts);
      if (!product) throw new ApiError(404, `Product with ID ${item.product} not found.`);
      if (!item.size) throw new ApiError(400, `Size is required for '${product.name}'.`);

      const sizeEntry = product.sizes.find(s => s.size === item.size);
      if (!sizeEntry || sizeEntry.quantity < item.quantity) {
        throw new ApiError(400, `Insufficient stock for '${product.name}' size ${item.size}.`);
      }

      // Update stock
      product.stock -= item.quantity;
      sizeEntry.quantity -= item.quantity;
      await product.save(opts);

      itemsPrice += product.price * item.quantity;

      processedItems.push({
        product,
        name: product.name,
        quantity: item.quantity,
        price: product.price,
        size: item.size,
      });
    }

    const orderId = `NEO-${Date.now()}-${uuidv4().substring(0, 4).toUpperCase()}`;

    // ✅ Hitung total pakai helper dengan shipping calculation
    const calculationResult = await calculateOrderTotal({
      itemsPrice,
      paymentMethod,
      shippingAddress,
      weight: 1000 // Default weight, can be calculated from items if needed
    });

    const newOrder = new Order({
      orderId,
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
      },
      items: processedItems,
      shippingAddress,
      paymentMethod,
      itemsPrice: calculationResult.itemsPrice,
      shippingPrice: calculationResult.shippingPrice,
      adminFee: calculationResult.adminFee,
      discount: calculationResult.discount,
      totalAmount: calculationResult.totalAmount,
      status: paymentMethod === 'va' ? 'Pending Payment' : 'Diproses',
    });

    await newOrder.save(opts);

    // 🔔 Emit socket event ke admin/dashboard
    const io = getSocketIO();
    if (io) {
      io.emit('new-order', {
        orderId: newOrder.orderId,
        user: req.user.name,
        total: newOrder.totalAmount,
      });
      io.emit('order-status-updated', {
        orderId: newOrder.orderId,
        status: newOrder.status,
        user: newOrder.user.name,
        totalAmount: newOrder.totalAmount,
      });
      io.emit('dashboard-update');
    }

    let midtransSnapToken: string | null = null;
    let redirectUrl: string | null = null;

    if (paymentMethod === 'va') {
      const midtransRes = await createTransaction(orderId, calculationResult.totalAmount, {
        first_name: req.user.name,
        email: req.user.email,
      });
      midtransSnapToken = midtransRes.token;
      redirectUrl = midtransRes.redirect_url;
    }

    if (session) await session.commitTransaction();

    // Send email notification asynchronously (don't block response)
    setImmediate(() => {
      sendOrderStatusUpdateEmail(newOrder);
    });

    return new ApiResponse(res, 201, 'Order created successfully.', {
      order: newOrder,
      midtransSnapToken,
      redirectUrl,
    });
  } catch (error) {
    if (session) await session.abortTransaction();
    next(error);
  } finally {
    if (session) session.endSession();
  }
};

/**
 * @desc Mendapatkan semua pesanan milik user
 * @route GET /api/v1/orders/my
 */
export const getMyOrdersHandler = async (
  req: IRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new ApiError(401, 'Unauthorized');

    // Optimized query with selected fields and pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ 'user._id': req.user._id })
      .select('orderId items totalAmount status paymentMethod shippingPrice createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean() for better performance

    const totalOrders = await Order.countDocuments({ 'user._id': req.user._id });

    return new ApiResponse(res, 200, 'Successfully fetched your orders.', {
      orders,
      pagination: {
        page,
        limit,
        total: totalOrders,
        pages: Math.ceil(totalOrders / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Mendapatkan detail satu pesanan
 * @route GET /api/v1/orders/:orderId
 */
export const getOrderByIdHandler = async (
  req: IRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new ApiError(401, 'Unauthorized');
    const order = await Order.findOne({
      orderId: req.params.orderId,
      'user._id': req.user._id,
    });
    if (!order) throw new ApiError(404, 'Order not found.');
    return new ApiResponse(res, 200, 'Successfully fetched order detail.', order);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Membatalkan pesanan & kembalikan stok
 * @route PATCH /api/v1/orders/:orderId/cancel
 */
export const cancelOrderHandler = async (
  req: IRequest,
  res: Response,
  next: NextFunction
) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const session = isProduction ? await mongoose.startSession() : null;
  if (session) session.startTransaction();

  try {
    if (!req.user) throw new ApiError(401, 'User not authenticated.');
    const opts = { session };

    console.log('Cancel order request:', { orderId: req.params.orderId, userId: req.user._id });

    const order = await Order.findOne({
      orderId: req.params.orderId,
      'user._id': req.user._id,
    }).setOptions(opts);

    console.log('Found order to cancel:', order ? { orderId: order.orderId, status: order.status } : 'NOT FOUND');

    if (!order) throw new ApiError(404, 'Order not found.');

    const cancellableStatuses: string[] = ['Pending Payment', 'Diproses'];
    if (!cancellableStatuses.includes(order.status)) {
      throw new ApiError(400, `Cannot cancel order with status '${order.status}'.`);
    }

    // Restore stock
    for (const item of order.items) {
      const product = await Product.findById(item.product).setOptions(opts);
      if (product) {
        if (item.size) {
          const sizeEntry = product.sizes.find(s => s.size === item.size);
          if (sizeEntry) {
            sizeEntry.quantity += item.quantity;
          } else {
            product.sizes.push({ size: item.size, quantity: item.quantity });
          }
        }
        product.stock += item.quantity;
        await product.save(opts);
      }
    }

    order.status = 'Cancelled';
    await order.save(opts);

    // 🔔 Emit socket event
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
