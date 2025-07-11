"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Product = void 0;
const mongoose_1 = require("mongoose");
const productSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true, index: true },
    images: [{ type: String }],
    stock: { type: Number, required: true, default: 0 },
}, { timestamps: true });
exports.Product = (0, mongoose_1.model)('Product', productSchema);
