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
const apiResponse_1 = require("../../utils/apiResponse");
const apiError_1 = require("../../errors/apiError");
const product_model_1 = require("../../models/product.model");
// =================================================================
// PERBAIKAN UTAMA ADA DI SINI
// =================================================================
/**
 * @description Membuat pesanan baru dengan beberapa item produk.
 * Menggunakan transaksi HANYA di lingkungan produksi untuk memastikan integritas data.
 */
const createOrderHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Memulai sesi transaksi HANYA jika di lingkungan 'production'
    const isProduction = process.env.NODE_ENV === 'production';
    const session = isProduction ? yield mongoose_1.default.startSession() : null;
    if (session) {
        session.startTransaction();
    }
    try {
        const { items, shippingAddress } = req.body;
        if (!req.user)
            throw new apiError_1.ApiError(401, 'User not authenticated.');
        if (!items || items.length === 0)
            throw new apiError_1.ApiError(400, 'Order items cannot be empty.');
        let calculatedTotalAmount = 0;
        const processedItems = [];
        const opts = { session }; // Opsi untuk menyertakan sesi dalam query
        for (const item of items) {
            const product = yield product_model_1.Product.findById(item.product).setOptions(opts);
            if (!product)
                throw new apiError_1.ApiError(404, `Product with id ${item.product} not found.`);
            if (product.stock < item.quantity)
                throw new apiError_1.ApiError(400, `Not enough stock for '${product.name}'.`);
            product.stock -= item.quantity;
            yield product.save(opts);
            calculatedTotalAmount += product.price * item.quantity;
            processedItems.push({
                product: product,
                name: product.name,
                quantity: item.quantity,
                price: product.price
            });
        }
        const orderId = `NEO-${Date.now()}-${(0, uuid_1.v4)().substring(0, 4).toUpperCase()}`;
        const newOrder = new order_model_1.Order({
            orderId,
            user: { _id: req.user._id, name: req.user.name, email: req.user.email },
            items: processedItems,
            totalAmount: calculatedTotalAmount,
            shippingAddress,
            status: 'Pending Payment',
        });
        yield newOrder.save(opts);
        if (session) {
            yield session.commitTransaction();
        }
        return new apiResponse_1.ApiResponse(res, 201, 'Order created successfully.', newOrder);
    }
    catch (error) {
        if (session) {
            yield session.abortTransaction();
        }
        next(error);
    }
    finally {
        if (session) {
            session.endSession();
        }
    }
});
exports.createOrderHandler = createOrderHandler;
/**
 * @description Membatalkan pesanan oleh pengguna dan mengembalikan stok produk.
 * Menggunakan transaksi HANYA di lingkungan produksi.
 */
const cancelOrderHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const isProduction = process.env.NODE_ENV === 'production';
    const session = isProduction ? yield mongoose_1.default.startSession() : null;
    if (session) {
        session.startTransaction();
    }
    try {
        if (!req.user)
            throw new apiError_1.ApiError(401, 'User not authenticated.');
        const opts = { session };
        const order = yield order_model_1.Order.findOne({
            orderId: req.params.orderId,
            'user._id': req.user._id
        }).setOptions(opts);
        if (!order)
            throw new apiError_1.ApiError(404, 'Order not found.');
        if (order.status !== 'Pending Payment')
            throw new apiError_1.ApiError(400, `Cannot cancel order with status '${order.status}'.`);
        for (const item of order.items) {
            yield product_model_1.Product.findByIdAndUpdate(item.product, {
                $inc: { stock: item.quantity }
            }, opts);
        }
        order.status = 'Cancelled';
        yield order.save(opts);
        if (session) {
            yield session.commitTransaction();
        }
        return new apiResponse_1.ApiResponse(res, 200, 'Order has been successfully cancelled.', order);
    }
    catch (error) {
        if (session) {
            yield session.abortTransaction();
        }
        next(error);
    }
    finally {
        if (session) {
            session.endSession();
        }
    }
});
exports.cancelOrderHandler = cancelOrderHandler;
// ... (getMyOrdersHandler dan getOrderByIdHandler tidak perlu diubah)
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
const getOrderByIdHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new apiError_1.ApiError(401, 'User not authenticated.');
        }
        const { _id } = req.params; // Ambil _id dari parameter URL
        // --- PERBAIKAN DI SINI ---
        // Mencari berdasarkan `_id` dokumen dan memastikan pesanan ini milik pengguna yang login.
        const order = yield order_model_1.Order.findOne({
            _id: _id,
            'user._id': req.user._id
        });
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
