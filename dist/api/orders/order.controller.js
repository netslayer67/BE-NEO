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
exports.cancelOrderHandler = exports.getOrderByIdHandler = exports.getMyOrdersHandler = exports.createOrderHandler = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const order_model_1 = require("../../models/order.model");
const product_model_1 = require("../../models/product.model");
const apiResponse_1 = require("../../utils/apiResponse");
const apiError_1 = require("../../errors/apiError");
const midtrans_service_1 = require("../../services/midtrans.service");
const socket_service_1 = require("../../services/socket.service");
const order_1 = require("../../utils/order");
const email_service_1 = require("../../services/email.service");
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
        const { items, shippingAddress, paymentMethod, type = 'ready-stock' } = req.body;
        if (!req.user)
            throw new apiError_1.ApiError(401, 'User not authenticated.');
        if (!(items === null || items === void 0 ? void 0 : items.length))
            throw new apiError_1.ApiError(400, 'Order items cannot be empty.');
        if (!['va', 'cod'].includes(paymentMethod)) {
            throw new apiError_1.ApiError(400, 'Invalid payment method. Must be va or cod.');
        }
        if (!['ready-stock', 'preorder'].includes(type)) {
            throw new apiError_1.ApiError(400, 'Invalid order type. Must be ready-stock or preorder.');
        }
        // Restrict preorder payments to VA only
        if (type === 'preorder' && paymentMethod !== 'va') {
            throw new apiError_1.ApiError(400, 'Preorder orders must use VA payment method.');
        }
        const opts = { session };
        let itemsPrice = 0;
        const processedItems = [];
        for (const item of items) {
            const product = yield product_model_1.Product.findById(item.product).setOptions(opts);
            if (!product)
                throw new apiError_1.ApiError(404, `Product with ID ${item.product} not found.`);
            if (!item.size)
                throw new apiError_1.ApiError(400, `Size is required for '${product.name}'.`);
            // For preorder orders, skip stock validation and deduction
            if (type === 'ready-stock') {
                const sizeEntry = product.sizes.find(s => s.size === item.size);
                if (!sizeEntry || sizeEntry.quantity < item.quantity) {
                    throw new apiError_1.ApiError(400, `Insufficient stock for '${product.name}' size ${item.size}.`);
                }
                // Update stock
                product.stock -= item.quantity;
                sizeEntry.quantity -= item.quantity;
                yield product.save(opts);
            }
            itemsPrice += product.price * item.quantity;
            processedItems.push({
                product,
                name: product.name,
                quantity: item.quantity,
                price: product.price,
                size: item.size,
            });
        }
        const orderId = `NEO-${Date.now()}-${(0, uuid_1.v4)().substring(0, 4).toUpperCase()}`;
        // ✅ Hitung total pakai helper dengan shipping calculation
        const calculationResult = yield (0, order_1.calculateOrderTotal)({
            itemsPrice,
            paymentMethod,
            shippingAddress,
            weight: 1000 // Default weight, can be calculated from items if needed
        });
        const newOrder = new order_model_1.Order({
            orderId,
            user: {
                _id: req.user._id,
                name: req.user.name,
                email: req.user.email,
            },
            items: processedItems,
            shippingAddress,
            paymentMethod,
            type,
            itemsPrice: calculationResult.itemsPrice,
            shippingPrice: calculationResult.shippingPrice,
            adminFee: calculationResult.adminFee,
            discount: calculationResult.discount,
            totalAmount: calculationResult.totalAmount,
            status: paymentMethod === 'va' ? 'Pending Payment' : 'Diproses',
        });
        yield newOrder.save(opts);
        // 🔔 Emit socket event ke admin/dashboard
        const io = (0, socket_service_1.getSocketIO)();
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
        let midtransSnapToken = null;
        let redirectUrl = null;
        if (paymentMethod === 'va') {
            try {
                console.log('Creating Midtrans transaction for order:', orderId, 'amount:', calculationResult.totalAmount);
                const midtransRes = yield (0, midtrans_service_1.createTransaction)(orderId, calculationResult.totalAmount, {
                    first_name: req.user.name.split(' ')[0],
                    last_name: req.user.name.split(' ').slice(1).join(' ') || '',
                    email: req.user.email,
                    phone: shippingAddress.phone || '',
                }, Object.assign(Object.assign({}, shippingAddress), { phone: shippingAddress.phone || '' }));
                midtransSnapToken = midtransRes.token;
                redirectUrl = midtransRes.redirect_url;
                console.log('Midtrans transaction response:', {
                    orderId,
                    hasToken: !!midtransSnapToken,
                    token: midtransSnapToken ? 'PRESENT' : 'MISSING',
                    redirectUrl: redirectUrl ? 'PRESENT' : 'MISSING'
                });
            }
            catch (midtransError) {
                console.error('Midtrans transaction creation failed:', midtransError);
                throw new apiError_1.ApiError(500, 'Failed to create payment transaction. Please try again.');
            }
        }
        if (session)
            yield session.commitTransaction();
        // Send email notification asynchronously (don't block response)
        setImmediate(() => {
            (0, email_service_1.sendOrderStatusUpdateEmail)(newOrder);
        });
        return new apiResponse_1.ApiResponse(res, 201, 'Order created successfully.', {
            order: newOrder,
            midtransSnapToken,
            redirectUrl,
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
 * @desc Mendapatkan semua pesanan milik user
 * @route GET /api/v1/orders/my
 */
const getMyOrdersHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user)
            throw new apiError_1.ApiError(401, 'Unauthorized');
        // Optimized query with selected fields and pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const orders = yield order_model_1.Order.find({ 'user._id': req.user._id })
            .select('orderId items totalAmount status paymentMethod shippingPrice createdAt')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(); // Use lean() for better performance
        const totalOrders = yield order_model_1.Order.countDocuments({ 'user._id': req.user._id });
        return new apiResponse_1.ApiResponse(res, 200, 'Successfully fetched your orders.', {
            orders,
            pagination: {
                page,
                limit,
                total: totalOrders,
                pages: Math.ceil(totalOrders / limit)
            }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getMyOrdersHandler = getMyOrdersHandler;
/**
 * @desc Mendapatkan detail satu pesanan
 * @route GET /api/v1/orders/:orderId
 */
const getOrderByIdHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user)
            throw new apiError_1.ApiError(401, 'Unauthorized');
        const order = yield order_model_1.Order.findOne({
            orderId: req.params.orderId,
            'user._id': req.user._id,
        });
        if (!order)
            throw new apiError_1.ApiError(404, 'Order not found.');
        return new apiResponse_1.ApiResponse(res, 200, 'Successfully fetched order detail.', order);
    }
    catch (error) {
        next(error);
    }
});
exports.getOrderByIdHandler = getOrderByIdHandler;
/**
 * @desc Membatalkan pesanan & kembalikan stok
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
        console.log('Cancel order request:', { orderId: req.params.orderId, userId: req.user._id });
        const order = yield order_model_1.Order.findOne({
            orderId: req.params.orderId,
            'user._id': req.user._id,
        }).setOptions(opts);
        console.log('Found order to cancel:', order ? { orderId: order.orderId, status: order.status } : 'NOT FOUND');
        if (!order)
            throw new apiError_1.ApiError(404, 'Order not found.');
        const cancellableStatuses = ['Pending Payment', 'Diproses'];
        if (!cancellableStatuses.includes(order.status)) {
            throw new apiError_1.ApiError(400, `Cannot cancel order with status '${order.status}'.`);
        }
        // Restore stock only for ready-stock orders
        if (order.type === 'ready-stock') {
            for (const item of order.items) {
                const product = yield product_model_1.Product.findById(item.product).setOptions(opts);
                if (product) {
                    if (item.size) {
                        const sizeEntry = product.sizes.find(s => s.size === item.size);
                        if (sizeEntry) {
                            sizeEntry.quantity += item.quantity;
                        }
                        else {
                            product.sizes.push({ size: item.size, quantity: item.quantity });
                        }
                    }
                    product.stock += item.quantity;
                    yield product.save(opts);
                }
            }
        }
        order.status = 'Cancelled';
        yield order.save(opts);
        // 🔔 Emit socket event
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
