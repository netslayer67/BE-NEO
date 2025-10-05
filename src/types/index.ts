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
  size: 'S' | 'M' | 'L' | 'XL'; // <- tambahkan di sini
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
 * @description Struktur gambar untuk setiap produk.
 */
export interface IProductImage {
  url: string;
  alt: string;
}

/**
 * @description Detail stock untuk setiap ukuran baju.
 */
export interface ISizeStock {
  size: 'S' | 'M' | 'L' | 'XL';
  quantity: number;
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
  images: IProductImage[];
  stock: number; // Total dari semua ukuran
  sizes: ISizeStock[]; // 👈 Tambahkan ini
  createdAt: Date;
  updatedAt: Date;
}


export interface IOrder extends Document {
  orderId: string;
  user: {
    _id: Schema.Types.ObjectId;
    name: string;
    email: string;
  };
  items: IOrderItem[];
  itemsPrice: number;
  shippingPrice: number;
  adminFee: number;
  discount: number;
  totalAmount: number;
  shippingAddress: IShippingAddress;
  status: 'Pending Payment' | 'Diproses' | 'Dikirim' | 'Telah Sampai' | 'Cancelled';
  paymentMethod: 'va' | 'cod';
  paymentProof?: string;
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
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