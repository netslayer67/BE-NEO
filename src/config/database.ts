import mongoose from 'mongoose';

const connectDB = async () => {
  console.log('[DB] Memulai fungsi connectDB...');
  try {
    console.log('[DB] Mencoba menghubungkan ke:', process.env.DATABASE_URL ? 'URL Ditemukan' : 'URL TIDAK DITEMUKAN');
    const conn = await mongoose.connect(process.env.DATABASE_URL as string);
    console.log(`🌿 [DB] MongoDB Terhubung: ${conn.connection.host}`);
  } catch (error: any) {
    console.error(`🔥 [DB] MongoDB Connection Error: ${error.message}`);
    // Menambahkan log error lengkap untuk debugging
    console.error('[DB] Detail Error Lengkap:', error);
    process.exit(1);
  }
};

export default connectDB;