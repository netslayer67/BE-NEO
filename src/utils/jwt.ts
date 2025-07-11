import jwt, { SignOptions } from 'jsonwebtoken';

export const generateToken = (payload: object): string => {
  const secret = process.env.JWT_SECRET;

  // Pastikan secret key ada sebelum digunakan.
  if (!secret) {
    throw new Error('FATAL ERROR: JWT_SECRET is not defined in the environment variables.');
  }

  // --- PERBAIKAN FINAL DI SINI ---
  // Gunakan angka (detik) untuk expiresIn untuk menghindari masalah tipe string.
  // 7 * 24 * 60 * 60 = 604800 detik (7 hari)
  const signOptions: SignOptions = {
    expiresIn: 604800, 
  };

  // Panggil jwt.sign dengan variabel yang tipenya sudah pasti.
  return jwt.sign(payload, secret, signOptions);
};