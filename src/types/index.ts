import { Document, Schema } from 'mongoose';

// =================================================================
// 1. Interface untuk Sub-dokumen (Lebih Rapi & Reusable)
// =================================================================

/**
 * @description Alamat pengiriman untuk pesanan.
 */
export interface IShippingAddress {
  street: string;
  city: string;
  postalCode: string;
  country: string;
  phone?: string;
}

/**
 * @description Item produk di dalam keranjang pesanan.
 */
export interface IOrderItem {
  product: Schema.Types.ObjectId | IProduct;
  name: string;
  quantity: number;
  price: number;
}


// =================================================================
// 2. Interface untuk Model Utama
// =================================================================

/**
 * @description Merepresentasikan dokumen Pengguna (User) di database.
 */
export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: 'user' | 'admin';
  createdAt: Date; // Timestamps
  updatedAt: Date; // Timestamps
  comparePassword(password: string): Promise<boolean>;
}

/**
 * @description Merepresentasikan dokumen Produk (Product) di database.
 */
export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  stock: number;
  createdAt: Date; // Timestamps
  updatedAt: Date; // Timestamps
}

/**
 * @description Merepresentasikan dokumen Pesanan (Order) di database.
 */
export interface IOrder extends Document {
  orderId: string; // ID unik yang dibuat aplikasi, bukan _id dari MongoDB
  user: {
      _id: Schema.Types.ObjectId;
      name: string;
      email: string;
  };
  items: IOrderItem[];
  totalAmount: number;
  shippingAddress: IShippingAddress; // Menggunakan interface sub-dokumen
  status: 'Pending Payment' | 'Diproses' | 'Dikirim' | 'Telah Sampai' | 'Cancelled';
  paymentProof?: string;
  createdAt: Date; // Timestamps
  updatedAt: Date; // Timestamps
}

/**
 * @description Merepresentasikan dokumen Ulasan (Review) di database.
 */
export interface IReview extends Document {
    user: Schema.Types.ObjectId | IUser;
    product: Schema.Types.ObjectId | IProduct;
    rating: number;
    comment: string;
    createdAt: Date; // Timestamps
    updatedAt: Date; // Timestamps
}