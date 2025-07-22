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
exports.uploadImages = void 0;
const imagekit_1 = __importDefault(require("imagekit"));
const sharp_1 = __importDefault(require("sharp"));
const apiError_1 = require("../errors/apiError");
// Pastikan semua variabel environment ada
if (!process.env.IMAGEKIT_PUBLIC_KEY || !process.env.IMAGEKIT_PRIVATE_KEY || !process.env.IMAGEKIT_URL_ENDPOINT) {
    throw new Error("FATAL ERROR: ImageKit credentials are not defined in .env file.");
}
// Inisialisasi instance ImageKit
const imagekit = new imagekit_1.default({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});
/**
 * Memproses dan mengoptimalkan buffer gambar menggunakan Sharp.
 * @param buffer Buffer gambar asli.
 * @returns {Promise<Buffer>} Buffer gambar yang sudah dioptimalkan.
 */
const optimizeImage = (buffer) => __awaiter(void 0, void 0, void 0, function* () {
    // 1. Ubah ukuran: Batasi lebar maksimum menjadi 1200px, tinggi otomatis menyesuaikan rasio.
    // 2. Format: Konversi ke WebP, format modern yang efisien.
    // 3. Kualitas: Atur kualitas kompresi WebP menjadi 80 (keseimbangan baik antara kualitas dan ukuran).
    // 4. toBuffer: Dapatkan hasilnya sebagai buffer untuk diunggah.
    return (0, sharp_1.default)(buffer)
        .resize({ width: 1200, withoutEnlargement: true }) // Hindari memperbesar gambar kecil
        .webp({ quality: 80 })
        .toBuffer();
});
/**
 * Mengunggah satu atau lebih file ke ImageKit.io setelah optimisasi.
 * @param files - Array file dari Express.Multer.File.
 * @returns {Promise<string[]>} Sebuah promise yang resolve menjadi array URL gambar.
 */
const uploadImages = (files) => __awaiter(void 0, void 0, void 0, function* () {
    if (!files || files.length === 0) {
        return [];
    }
    const uploadPromises = files.map((file) => __awaiter(void 0, void 0, void 0, function* () {
        // --- LOGIKA OPTIMISASI DI SINI ---
        const optimizedBuffer = yield optimizeImage(file.buffer);
        // Upload buffer yang sudah dioptimalkan
        return imagekit.upload({
            file: optimizedBuffer,
            fileName: `${Date.now()}-${file.originalname.split('.')[0]}.webp`, // Ganti ekstensi ke .webp
            folder: '/neo_products',
            useUniqueFileName: false,
        });
    }));
    try {
        const results = yield Promise.all(uploadPromises);
        return results.map(result => result.url); // Ambil URL dari hasil upload
    }
    catch (error) {
        console.error("ImageKit Upload Error:", error);
        throw new apiError_1.ApiError(500, `Failed to upload images: ${error.message}`);
    }
});
exports.uploadImages = uploadImages;
