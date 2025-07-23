import { Router } from 'express';
import { protect, admin } from '../../middlewares/auth.middleware';
import { uploadProductImages } from '../../middlewares/upload.middleware';
import {
  createProductHandler,
  getAllProductsHandler,
  getProductBySlugHandler,
  updateProductHandler,
  deleteProductHandler,
  updateProductStockHandler, // ✅ Tambahkan ini
} from './product.controller';


const router = Router();

// Rute untuk mendapatkan semua produk (publik) dan membuat produk baru (admin)
router.route('/')
  .get(getAllProductsHandler)
  .post(protect, admin, uploadProductImages, createProductHandler);

// Rute untuk satu produk
router.route('/:id')
  .put(protect, admin, uploadProductImages, updateProductHandler) // Gunakan ID untuk update
  .delete(protect, admin, deleteProductHandler); // Gunakan ID untuk delete

router.get('/slug/:slug', getProductBySlugHandler); // Rute khusus untuk slug

// ✅ Rute khusus untuk update stok berdasarkan size
router.patch('/:productId/stock', protect, admin, updateProductStockHandler);

export default router;