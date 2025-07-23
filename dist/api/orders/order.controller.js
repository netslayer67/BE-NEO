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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrderByIdHandler = exports.getMyOrdersHandler = exports.cancelOrderHandler = exports.createOrderHandler = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const order_model_1 = require("../../models/order.model");
const product_model_1 = require("../../models/product.model");
const apiResponse_1 = require("../../utils/apiResponse");
const apiError_1 = require("../../errors/apiError");
const midtrans_service_1 = require("../../services/midtrans.service");
const socket_service_1 = require("../../services/socket.service");
/**
 * @desc Membuat pesanan baru & memproses pembayaran dengan Midtrans
 * @route POST /api/v1/orders
 */
const createOrderHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const isProduction = process.env.NODE_ENV === 'production';
    const session = isProduction ? yield mongoose_1.default.startSession() : null;
    if (session)
        session.startTransaction();
    try {
        const { items, shippingAddress, paymentMethod } = req.body;
        if (!req.user)
            throw new apiError_1.ApiError(401, 'User not authenticated.');
        if (!items || items.length === 0)
            throw new apiError_1.ApiError(400, 'Order items cannot be empty.');
        if (!['online', 'offline'].includes(paymentMethod)) {
            throw new apiError_1.ApiError(400, 'Invalid payment method.');
        }
        const opts = { session };
        let itemsPrice = 0;
        const processedItems = [];
        for (const item of items) {
            const product = yield product_model_1.Product.findById(item.product).setOptions(opts);
            if (!product)
                throw new apiError_1.ApiError(404, `Product with ID ${item.product} not found.`);
            if (product.stock < item.quantity) {
                throw new apiError_1.ApiError(400, `Insufficient stock for '${product.name}'.`);
            }
            product.stock -= item.quantity;
            yield product.save(opts);
            itemsPrice += product.price * item.quantity;
            processedItems.push({
                product,
                name: product.name,
                quantity: item.quantity,
                price: product.price
            });
        }
        const orderId = `NEO-${Date.now()}-${(0, uuid_1.v4)().substring(0, 4).toUpperCase()}`;
        const shippingPrice = 15000;
        const adminFee = paymentMethod === 'offline' ? 2500 : 0;
        const onlineDiscount = paymentMethod === 'online' ? 3000 : 0;
        const totalAmount = itemsPrice + shippingPrice + adminFee - onlineDiscount;
        const newOrder = new order_model_1.Order({
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
        yield newOrder.save(opts);
        // Emit ke admin bahwa ada pesanan baru
        const io = (0, socket_service_1.getSocketIO)();
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
        let midtransSnapToken = null;
        let redirectUrl = null;
        if (paymentMethod === 'online') {
            const midtransRes = yield (0, midtrans_service_1.createTransaction)(orderId, totalAmount, {
                first_name: req.user.name,
                email: req.user.email
            });
            midtransSnapToken = midtransRes.token;
            redirectUrl = midtransRes.redirect_url;
        }
        if (session)
            yield session.commitTransaction();
        return new apiResponse_1.ApiResponse(res, 201, 'Order created successfully.', {
            order: newOrder,
            midtransSnapToken,
            redirectUrl
        });
    }
    catch (error) {
        if (session)
            yield session.abortTransaction();
        next(error);
    }
    finally {
        if (session)
            session.endSession();
    }
});
exports.createOrderHandler = createOrderHandler;
/**
 * @desc Membatalkan pesanan dan mengembalikan stok
 * @route PATCH /api/v1/orders/:orderId/cancel
 */
const cancelOrderHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const isProduction = process.env.NODE_ENV === 'production';
    const session = isProduction ? yield mongoose_1.default.startSession() : null;
    if (session)
        session.startTransaction();
    try {
        if (!req.user)
            throw new apiError_1.ApiError(401, 'User not authenticated.');
        const opts = { session };
        // Cari pesanan milik user yang sedang login
        const order = yield order_model_1.Order.findOne({
            orderId: req.params.orderId,
            'user._id': req.user._id
        }).setOptions(opts);
        if (!order)
            throw new apiError_1.ApiError(404, 'Order not found.');
        const cancellableStatuses = ['Pending Payment', 'Diproses'];
        if (!cancellableStatuses.includes(order.status)) {
            throw new apiError_1.ApiError(400, `Cannot cancel order with status '${order.status}'.`);
        }
        // Kembalikan stok produk
        for (const item of order.items) {
            yield product_model_1.Product.findByIdAndUpdate(item.product, {
                $inc: { stock: item.quantity }
            }, opts);
        }
        // Ubah status order
        order.status = 'Cancelled';
        yield order.save(opts); // Simpan ke database dulu sebelum emit
        // Emit event real-time ke admin bahwa status order berubah
        const io = (0, socket_service_1.getSocketIO)();
        if (io) {
            io.emit('order-status-updated', {
                orderId: order.orderId,
                status: order.status,
                user: order.user.name,
                totalAmount: order.totalAmount,
            });
            io.emit('dashboard-update');
        }
        if (session)
            yield session.commitTransaction();
        return new apiResponse_1.ApiResponse(res, 200, 'Order has been successfully cancelled.', order);
    }
    catch (error) {
        if (session)
            yield session.abortTransaction();
        next(error);
    }
    finally {
        if (session)
            session.endSession();
    }
});
exports.cancelOrderHandler = cancelOrderHandler;
/**
 * @desc Mendapatkan semua pesanan milik user yang login
 * @route GET /api/v1/orders/my
 */
const getMyOrdersHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user)
            throw new apiError_1.ApiError(401, 'User not authenticated.');
        const orders = yield order_model_1.Order.find({ 'user._id': req.user._id }).sort({ createdAt: -1 });
        return new apiResponse_1.ApiResponse(res, 200, 'User orders fetched successfully', orders);
    }
    catch (error) {
        next(error);
    }
});
exports.getMyOrdersHandler = getMyOrdersHandler;
/**
 * @desc Mendapatkan detail pesanan berdasarkan ID
 * @route GET /api/v1/orders/:_id
 */
const getOrderByIdHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user)
            throw new apiError_1.ApiError(401, 'User not authenticated.');
        const { _id } = req.params;
        const order = yield order_model_1.Order.findOne({ _id, 'user._id': req.user._id });
        if (!order) {
            throw new apiError_1.ApiError(404, 'Order not found or you do not have permission to view it.');
        }
        return new apiResponse_1.ApiResponse(res, 200, 'Order details fetched successfully', order);
    }
    catch (error) {
        next(error);
    }
});
exports.getOrderByIdHandler = getOrderByIdHandler;
