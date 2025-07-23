"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadProductImages = void 0;
const multer_1 = __importDefault(require("multer"));
const apiError_1 = require("../errors/apiError");
// Konfigurasi penyimpanan di memori, bukan di disk.
// Ini adalah praktik terbaik untuk skalabilitas, karena file bisa langsung
// diproses dan di-stream ke layanan cloud (S3, Cloudinary, dll.)
const storage = multer_1.default.memoryStorage();
// Filter untuk hanya menerima tipe file gambar
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    }
    else {
        cb(new apiError_1.ApiError(400, 'Not an image! Please upload only images.'), false);
    }
};
// Inisialisasi multer dengan konfigurasi di atas
const upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // Batas ukuran file 5MB
    },
});
// Middleware untuk menangani upload banyak file (misalnya, untuk 'images')
exports.uploadProductImages = upload.array('images', 5); // 'images' adalah nama field, 5 adalah jumlah maks file
