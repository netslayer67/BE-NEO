import multer from 'multer';
import { ApiError } from '../errors/apiError';

// Konfigurasi penyimpanan di memori, bukan di disk.
// Ini adalah praktik terbaik untuk skalabilitas, karena file bisa langsung
// diproses dan di-stream ke layanan cloud (S3, Cloudinary, dll.)
const storage = multer.memoryStorage();

// Filter untuk hanya menerima tipe file gambar
const fileFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Not an image! Please upload only images.'), false);
  }
};

// Inisialisasi multer dengan konfigurasi di atas
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Batas ukuran file 5MB
  },
});

// Middleware untuk menangani upload banyak file (misalnya, untuk 'images')
export const uploadProductImages = upload.array('images', 5); // 'images' adalah nama field, 5 adalah jumlah maks file