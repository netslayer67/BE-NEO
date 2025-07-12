"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.getOrderByIdHandler = exports.getAllOrdersHandler = exports.deleteUserHandler = exports.updateUserHandler = exports.getUserByIdHandler = exports.getAllUsersHandler = exports.getDashboardStatsHandler = exports.fulfillOrderHandler = exports.shipOrderHandler = exports.confirmPaymentHandler = void 0;
const apiResponse_1 = require("../../utils/apiResponse");
const adminService = __importStar(require("./admin.service")); // Impor semua service sebagai adminService
const confirmPaymentHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const updatedOrder = yield adminService.confirmOrderPayment(req.params.orderId);
        return new apiResponse_1.ApiResponse(res, 200, 'Payment confirmed and order status updated to Processing.', updatedOrder);
    }
    catch (error) {
        next(error);
    }
});
exports.confirmPaymentHandler = confirmPaymentHandler;
/**
 * (BARU) Handler untuk mengubah status pesanan menjadi 'Shipped'.
 */
const shipOrderHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const updatedOrder = yield adminService.shipOrder(req.params.orderId);
        return new apiResponse_1.ApiResponse(res, 200, 'Order status updated to Shipped.', updatedOrder);
    }
    catch (error) {
        next(error);
    }
});
exports.shipOrderHandler = shipOrderHandler;
/**
 * (BARU) Handler untuk mengubah status pesanan menjadi 'Fulfilled'.
 */
const fulfillOrderHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const updatedOrder = yield adminService.fulfillOrder(req.params.orderId);
        return new apiResponse_1.ApiResponse(res, 200, 'Order status updated to Fulfilled.', updatedOrder);
    }
    catch (error) {
        next(error);
    }
});
exports.fulfillOrderHandler = fulfillOrderHandler;
// === Dashboard ===
const getDashboardStatsHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const stats = yield adminService.getDashboardStats();
        return new apiResponse_1.ApiResponse(res, 200, 'Dashboard statistics fetched successfully', stats);
    }
    catch (error) {
        next(error);
    }
});
exports.getDashboardStatsHandler = getDashboardStatsHandler;
// === User Management ===
const getAllUsersHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield adminService.getAllUsers();
        return new apiResponse_1.ApiResponse(res, 200, 'All users fetched successfully', users);
    }
    catch (error) {
        next(error);
    }
});
exports.getAllUsersHandler = getAllUsersHandler;
const getUserByIdHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield adminService.getUserById(req.params.id);
        return new apiResponse_1.ApiResponse(res, 200, 'User fetched successfully', user);
    }
    catch (error) {
        next(error);
    }
});
exports.getUserByIdHandler = getUserByIdHandler;
const updateUserHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const updatedUser = yield adminService.updateUserById(req.params.id, req.body);
        return new apiResponse_1.ApiResponse(res, 200, 'User updated successfully', updatedUser);
    }
    catch (error) {
        next(error);
    }
});
exports.updateUserHandler = updateUserHandler;
const deleteUserHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield adminService.deleteUserById(req.params.id);
        return new apiResponse_1.ApiResponse(res, 200, 'User deleted successfully');
    }
    catch (error) {
        next(error);
    }
});
exports.deleteUserHandler = deleteUserHandler;
/**
 * @description (Admin) Mengambil semua pesanan dari semua pengguna.
 */
const getAllOrdersHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orders = yield adminService.getAllOrders();
        return new apiResponse_1.ApiResponse(res, 200, 'All orders fetched successfully', orders);
    }
    catch (error) {
        next(error);
    }
});
exports.getAllOrdersHandler = getAllOrdersHandler;
/**
 * @description (Admin) Mengambil detail satu pesanan berdasarkan ID.
 * @param {string} req.params.id - ID unik dari pesanan.
 */
const getOrderByIdHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const order = yield adminService.getOrderById(req.params.id);
        return new apiResponse_1.ApiResponse(res, 200, 'Order details fetched successfully', order);
    }
    catch (error) {
        next(error);
    }
});
exports.getOrderByIdHandler = getOrderByIdHandler;
