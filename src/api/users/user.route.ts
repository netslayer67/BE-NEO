import { Router } from 'express';
import { protect } from '@/middlewares/auth.middleware';
import { getMyProfileHandler, updateMyProfileHandler } from './user.controller';

const router = Router();

// Semua rute di bawah ini memerlukan otentikasi (login)
router.use(protect);

// Endpoint /api/v1/users/me untuk mengelola profil sendiri
router.route('/me')
  .get(getMyProfileHandler)
  .put(updateMyProfileHandler);

// Di masa depan, Anda bisa menambahkan rute admin di sini
// Contoh: router.get('/:id', admin, getUserByIdHandler);

export default router;