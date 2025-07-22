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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProductHandler = exports.updateProductHandler = exports.getProductBySlugHandler = exports.getAllProductsHandler = exports.createProductHandler = void 0;
const product_model_1 = require("../../models/product.model");
const apiResponse_1 = require("../../utils/apiResponse");
const apiError_1 = require("../../errors/apiError");
const slugify_1 = __importDefault(require("slugify"));
const imagekit_service_1 = require("../../services/imagekit.service");
const productService = __importStar(require("./product.service"));
// Admin: Create Product (dengan form-data dan upload gambar)
const createProductHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, description, price, category, stock } = req.body;
        if (!req.files || req.files.length === 0) {
            throw new apiError_1.ApiError(400, 'Product images are required.');
        }
        const files = req.files;
        const uploadedUrls = yield (0, imagekit_service_1.uploadImages)(files);
        const imageObjects = uploadedUrls.map((url, index) => ({
            url,
            alt: `${name} - Image ${index + 1}`,
        }));
        const newProduct = new product_model_1.Product({
            name,
            slug: (0, slugify_1.default)(name, { lower: true, strict: true }),
            description,
            price: parseFloat(price),
            category,
            stock: parseInt(stock, 10),
        });
        newProduct.set('images', imageObjects); // <- penting
        yield newProduct.save();
        return new apiResponse_1.ApiResponse(res, 201, 'Product created successfully', newProduct);
    }
    catch (error) {
        next(error);
    }
});
exports.createProductHandler = createProductHandler;
const getAllProductsHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { products, pagination } = yield productService.getAllProducts(req.query);
        return new apiResponse_1.ApiResponse(res, 200, 'Products fetched successfully', { products, pagination });
    }
    catch (error) {
        next(error);
    }
});
exports.getAllProductsHandler = getAllProductsHandler;
// Public: Get a Single Product by slug
const getProductBySlugHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const product = yield product_model_1.Product.findOne({ slug: req.params.slug });
        if (!product) {
            throw new apiError_1.ApiError(404, 'Product not found');
        }
        return new apiResponse_1.ApiResponse(res, 200, 'Product fetched successfully', product);
    }
    catch (error) {
        next(error);
    }
});
exports.getProductBySlugHandler = getProductBySlugHandler;
// Admin: Update Product
const updateProductHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const product = yield product_model_1.Product.findById(req.params.id);
        if (!product) {
            throw new apiError_1.ApiError(404, 'Product not found');
        }
        Object.assign(product, req.body);
        if (req.files && req.files.length > 0) {
            const files = req.files;
            const uploadedUrls = yield (0, imagekit_service_1.uploadImages)(files);
            const imageObjects = uploadedUrls.map((url, index) => ({
                url,
                alt: `${req.body.name || product.name} - Image ${index + 1}`,
            }));
            product.set('images', imageObjects); // <- penting
        }
        if (req.body.name) {
            product.slug = (0, slugify_1.default)(req.body.name, { lower: true, strict: true });
        }
        const updatedProduct = yield product.save();
        return new apiResponse_1.ApiResponse(res, 200, 'Product updated successfully', updatedProduct);
    }
    catch (error) {
        next(error);
    }
});
exports.updateProductHandler = updateProductHandler;
// Admin: Delete Product
const deleteProductHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const product = yield product_model_1.Product.findByIdAndDelete(req.params.id);
        if (!product) {
            throw new apiError_1.ApiError(404, 'Product not found');
        }
        // Hapus gambar dari cloud di sini jika diperlukan
        return new apiResponse_1.ApiResponse(res, 200, 'Product deleted successfully', { id: req.params.id });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteProductHandler = deleteProductHandler;
