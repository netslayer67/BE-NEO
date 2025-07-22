"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.midtransWebhookHandler = void 0;
const order_model_1 = require("../../models/order.model");
const apiError_1 = require("../../errors/apiError");
const socket_service_1 = require("../../services/socket.service");
const orderStatusMapper_1 = require("../../utils/orderStatusMapper");
/**
 * Emit event status pesanan via Socket.IO
 */
const emitOrderStatusUpdate = (orderId, newStatus, userName, totalAmount) => {
    const io = (0, socket_service_1.getSocketIO)();
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
const midtransWebhookHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { order_id, transaction_status, fraud_status } = req.body;
        if (!order_id || !transaction_status) {
            throw new apiError_1.ApiError(400, 'Invalid Midtrans webhook payload.');
        }
        const order = yield order_model_1.Order.findOne({ orderId: order_id });
        if (!order)
            throw new apiError_1.ApiError(404, 'Order not found');
        const newStatus = (0, orderStatusMapper_1.mapMidtransToInternalStatus)(transaction_status, fraud_status);
        if (newStatus && newStatus !== order.status) {
            order.status = newStatus;
            yield order.save();
            emitOrderStatusUpdate(order.orderId, newStatus, order.user.name, order.totalAmount);
        }
        return res.status(200).json({ message: 'Webhook processed successfully.' });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Midtrans Webhook Error]', message);
        next(new apiError_1.ApiError(500, 'Failed to process Midtrans webhook.'));
    }
});
exports.midtransWebhookHandler = midtransWebhookHandler;
