import { Request, Response, NextFunction } from 'express';
import { Order } from '../../models/order.model';
import { ApiError } from '../../errors/apiError';
import { io } from '../../server'; // Pastikan io diexport di server.ts
import { mapMidtransToInternalStatus } from '../../utils/orderStatusMapper';


/**
 * @desc Handler untuk menerima webhook dari Midtrans
 * @route POST /api/v1/orders/webhook
 */
export const midtransWebhookHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      order_id,
      transaction_status,
      fraud_status
    } = req.body;

    const order = await Order.findOne({ orderId: order_id });
    if (!order) throw new ApiError(404, 'Order not found');

    // Update status berdasarkan Midtrans status
 const newStatus = mapMidtransToInternalStatus(transaction_status, fraud_status);

if (newStatus) {
  order.status = newStatus; // ✅ sekarang sudah sesuai type
  await order.save();

  io.emit('order-status-updated', {
    orderId: order.orderId,
    status: newStatus,
    user: order.user.name,
    totalAmount: order.totalAmount
  });
}

    // Midtrans expects a 200 OK response
    return res.status(200).json({ message: 'Webhook received' });
  } catch (error) {
    next(error);
  }
};
