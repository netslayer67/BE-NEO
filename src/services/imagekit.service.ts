
// src/services/imagekit.service.ts
import dotenv from 'dotenv';
dotenv.config(); // tambahkan baris ini di paling atas
import ImageKit from 'imagekit';
import sharp from 'sharp';
import { ApiError } from '../errors/apiError';

// Pastikan semua variabel environment ada

if (!process.env.IMAGEKIT_PUBLIC_KEY || !process.env.IMAGEKIT_PRIVATE_KEY || !process.env.IMAGEKIT_URL_ENDPOINT) {
    throw new Error("FATAL ERROR: ImageKit credentials are not defined in .env file.");
}
// Inisialisasi instance ImageKit
const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

/**
 * Memproses dan mengoptimalkan buffer gambar menggunakan Sharp.
 * @param buffer Buffer gambar asli.
 * @returns {Promise<Buffer>} Buffer gambar yang sudah dioptimalkan.
 */
const optimizeImage = async (buffer: Buffer): Promise<Buffer> => {
    // 1. Ubah ukuran: Batasi lebar maksimum menjadi 1200px, tinggi otomatis menyesuaikan rasio.
    // 2. Format: Konversi ke WebP, format modern yang efisien.
    // 3. Kualitas: Atur kualitas kompresi WebP menjadi 80 (keseimbangan baik antara kualitas dan ukuran).
    // 4. toBuffer: Dapatkan hasilnya sebagai buffer untuk diunggah.
    return sharp(buffer)
        .resize({ width: 1200, withoutEnlargement: true }) // Hindari memperbesar gambar kecil
        .webp({ quality: 80 })
        .toBuffer();
};


/**
 * Mengunggah satu atau lebih file ke ImageKit.io setelah optimisasi.
 * @param files - Array file dari Express.Multer.File.
 * @returns {Promise<string[]>} Sebuah promise yang resolve menjadi array URL gambar.
 */
export const uploadImages = async (files: Express.Multer.File[]): Promise<string[]> => {
    if (!files || files.length === 0) {
        return [];
    }

    const uploadPromises = files.map(async (file) => {
        // --- LOGIKA OPTIMISASI DI SINI ---
        const optimizedBuffer = await optimizeImage(file.buffer);

        // Upload buffer yang sudah dioptimalkan
        return imagekit.upload({
            file: optimizedBuffer,
            fileName: `${Date.now()}-${file.originalname.split('.')[0]}.webp`, // Ganti ekstensi ke .webp
            folder: '/neo_products',
            useUniqueFileName: false,
        });
    });

    try {
        const results = await Promise.all(uploadPromises);
        return results.map(result => result.url); // Ambil URL dari hasil upload
    } catch (error: any) {
        console.error("ImageKit Upload Error:", error);
        throw new ApiError(500, `Failed to upload images: ${error.message}`);
    }
};