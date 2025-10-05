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
exports.createTransaction = void 0;
const midtrans_client_1 = __importDefault(require("midtrans-client"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config(); // Tambahkan ini di awal midtrans.service.ts (opsional jika sudah yakin urutan import benar)
const snap = new midtrans_client_1.default.Snap({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY,
});
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://radiantrage.vercel.app';
/**
 * Membuat transaksi Midtrans Snap.
 */
const createTransaction = (orderId, amount, customerDetails, shippingAddress) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const enabledPayments = ((_a = process.env.MIDTRANS_ENABLED_PAYMENTS) === null || _a === void 0 ? void 0 : _a.split(',')) || [];
    const transactionParams = {
        transaction_details: {
            order_id: orderId,
            gross_amount: amount,
        },
        customer_details: Object.assign(Object.assign({}, customerDetails), { billing_address: shippingAddress ? {
                first_name: customerDetails.first_name,
                last_name: customerDetails.last_name || '',
                email: customerDetails.email,
                phone: customerDetails.phone || shippingAddress.phone,
                address: shippingAddress.street,
                city: shippingAddress.city,
                postal_code: shippingAddress.postalCode,
                country_code: 'IDN'
            } : undefined, shipping_address: shippingAddress ? {
                first_name: customerDetails.first_name,
                last_name: customerDetails.last_name || '',
                email: customerDetails.email,
                phone: customerDetails.phone || shippingAddress.phone,
                address: shippingAddress.street,
                city: shippingAddress.city,
                postal_code: shippingAddress.postalCode,
                country_code: 'IDN'
            } : undefined }),
        enabled_payments: enabledPayments,
        callbacks: {
            finish: `${FRONTEND_URL}/profile`,
        },
        // Webhook notification URL for payment status updates
        notification_url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/v1/orders/webhook`,
    };
    // Remove undefined addresses
    if (!shippingAddress) {
        delete transactionParams.customer_details.billing_address;
        delete transactionParams.customer_details.shipping_address;
    }
    return yield snap.createTransaction(transactionParams);
});
exports.createTransaction = createTransaction;
