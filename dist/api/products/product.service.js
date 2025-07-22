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
exports.getAllProducts = void 0;
// src/api/products/product.service.ts
const product_model_1 = require("../../models/product.model");
const getAllProducts = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const skip = (page - 1) * limit;
    const filter = {};
    // Filter by category (optional)
    if (query.category) {
        filter.category = query.category;
    }
    // Search by name (optional)
    if (query.search) {
        filter.name = { $regex: query.search, $options: 'i' };
    }
    const [products, total] = yield Promise.all([
        product_model_1.Product.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
        product_model_1.Product.countDocuments(filter)
    ]);
    const pagination = {
        total,
        page,
        limit,
    };
    return { products, pagination };
});
exports.getAllProducts = getAllProducts;
