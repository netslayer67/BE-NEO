"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Product = void 0;
const mongoose_1 = require("mongoose");
const imageSchema = new mongoose_1.Schema({
    url: { type: String, required: true },
    alt: { type: String, default: '' }
}, { _id: false });
const sizeStockSchema = new mongoose_1.Schema({
    size: {
        type: String,
        enum: ['S', 'M', 'L', 'XL'],
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 0
    }
}, { _id: false });
const productSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true, index: true },
    images: [imageSchema],
    stock: { type: Number, required: true, default: 0 },
    sizes: [sizeStockSchema]
}, { timestamps: true });
exports.Product = (0, mongoose_1.model)('Product', productSchema);
