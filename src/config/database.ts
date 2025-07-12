// src/config/database.ts
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.DATABASE_URL as string);
    console.log(`🌿 MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    console.error(`🔥 MongoDB Connection Error: ${error.message}`);
    // Lemparkan error agar bisa ditangkap oleh fungsi yang memanggilnya
    throw new Error(`Database connection failed: ${error.message}`);
  }
};

export default connectDB;