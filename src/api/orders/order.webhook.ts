import { Request, Response, NextFunction } from 'express';
import { Order } from '../../models/order.model';
import { ApiError } from '../../errors/apiError';
import { getSocketIO } from '../../services/socket.service';
import { mapMidtransToInternalStatus } from '../../utils/orderStatusMapper';

/**
 * Emit event status pesanan via Socket.IO
 */
const emitOrderStatusUpdate = (
  orderId: string,
  newStatus: string,
  userName: string,
  totalAmount: number
) => {
  const io = getSocketIO();
  if (io) {
    io.emit('order-status-updated', {
      orderId,
      status: newStatus,
      user: userName,
      totalAmount
    });
  }
};

/**
 * @desc Handler untuk menerima webhook dari Midtrans
 * @route POST /api/v1/orders/webhook
 */
export const midtransWebhookHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      order_id,
      transaction_id,
      transaction_status,
      fraud_status,
      payment_type,
      gross_amount
    } = req.body;

    console.log('[Midtrans Webhook]', {
      order_id,
      transaction_id,
      transaction_status,
      fraud_status,
      payment_type,
      gross_amount
    });

    if (!order_id || !transaction_status) {
      throw new ApiError(400, 'Invalid Midtrans webhook payload.');
    }

    const order = await Order.findOne({ orderId: order_id });
    if (!order) {
      console.error(`Order not found for order_id: ${order_id}`);
      throw new ApiError(404, 'Order not found');
    }

    const newStatus = mapMidtransToInternalStatus(transaction_status, fraud_status);

    if (newStatus && newStatus !== order.status) {
      order.status = newStatus;
      // Store transaction_id if not already set
      if (transaction_id && !order.transactionId) {
        order.transactionId = transaction_id;
      }
      await order.save();

      emitOrderStatusUpdate(order.orderId, newStatus, order.user.name, order.totalAmount);

      console.log(`Order ${order.orderId} status updated to: ${newStatus}`);
    } else {
      console.log(`Order ${order.orderId} status unchanged: ${order.status}`);
    }

    return res.status(200).json({ message: 'Webhook processed successfully.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Midtrans Webhook Error]', message);
    next(new ApiError(500, 'Failed to process Midtrans webhook.'));
  }
};
