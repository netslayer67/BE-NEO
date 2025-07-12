"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Order = void 0;
const mongoose_1 = require("mongoose");
const orderSchema = new mongoose_1.Schema({
    orderId: { type: String, required: true, unique: true },
    user: {
        _id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
        name: { type: String, required: true },
        email: { type: String, required: true },
    },
    items: [{
            product: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Product', required: true },
            name: { type: String, required: true },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true },
        }],
    totalAmount: { type: Number, required: true },
    shippingAddress: {
        street: String,
        city: String,
        postalCode: String,
        country: String,
        phone: String,
    },
    status: {
        type: String,
        enum: ['Pending Payment', 'Diproses', 'Dikirim', 'Telah Sampai', 'Cancelled'],
        default: 'Pending Payment', // <-- Status default saat order dibuat
    },
    paymentProof: { type: String },
}, { timestamps: true });
exports.Order = (0, mongoose_1.model)('Order', orderSchema);
