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
exports.deleteProductHandler = exports.updateProductHandler = exports.getProductBySlugHandler = exports.getAllProductsHandler = exports.createProductHandler = void 0;
const product_model_1 = require("@/models/product.model");
const apiResponse_1 = require("@/utils/apiResponse");
const apiError_1 = require("@/errors/apiError");
const slugify_1 = __importDefault(require("slugify")); // `npm install slugify`
const imagekit_service_1 = require("@/services/imagekit.service");
// --- SIMULASI UPLOAD KE CLOUD ---
// Di aplikasi produksi, fungsi ini akan mengupload buffer ke S3/Cloudinary
// dan mengembalikan URL publiknya.
// Admin: Create Product (dengan form-data dan upload gambar)
const createProductHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, description, price, category, stock } = req.body;
        if (!req.files || req.files.length === 0) {
            throw new apiError_1.ApiError(400, 'Product images are required.');
        }
        // --- 2. GUNAKAN SERVICE IMAGEKIT DI SINI ---
        const files = req.files;
        const imageUrls = yield (0, imagekit_service_1.uploadImages)(files); // Memanggil service ImageKit
        const newProduct = new product_model_1.Product({
            name,
            slug: (0, slugify_1.default)(name, { lower: true, strict: true }),
            description,
            price: parseFloat(price),
            category,
            stock: parseInt(stock, 10),
            images: imageUrls,
        });
        yield newProduct.save();
        return new apiResponse_1.ApiResponse(res, 201, 'Product created successfully', newProduct);
    }
    catch (error) {
        next(error);
    }
});
exports.createProductHandler = createProductHandler;
// Public: Get All Products (dengan filtering, sorting, pagination)
const getAllProductsHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { category, sortBy, order = 'asc', page = 1, limit = 10 } = req.query;
        const query = {};
        if (category) {
            query.category = category;
        }
        const sortOptions = {};
        if (sortBy) {
            sortOptions[sortBy] = order === 'desc' ? -1 : 1;
        }
        else {
            sortOptions.createdAt = -1; // Default sort by newest
        }
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        const products = yield product_model_1.Product.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(limitNum);
        const totalProducts = yield product_model_1.Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / limitNum);
        const pagination = {
            currentPage: pageNum,
            totalPages,
            totalProducts,
        };
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
        // Jika ada file baru, upload dan ganti gambar lama
        if (req.files && req.files.length > 0) {
            // Di dunia nyata, Anda bisa menambahkan logika untuk menghapus gambar lama di ImageKit
            const files = req.files;
            const newImageUrls = yield (0, imagekit_service_1.uploadImages)(files); // <-- 3. GUNAKAN SERVICE IMAGEKIT
            product.images = newImageUrls;
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
        // Di dunia nyata, Anda akan menghapus semua gambar produk dari cloud di sini
        return new apiResponse_1.ApiResponse(res, 200, 'Product deleted successfully', { id: req.params.id });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteProductHandler = deleteProductHandler;
