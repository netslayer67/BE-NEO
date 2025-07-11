import { Document, Schema } from 'mongoose';

// Interface untuk Model Pengguna
export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: 'user' | 'admin';
  comparePassword(password: string): Promise<boolean>;
}

// Interface untuk Model Produk
export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  stock: number;
}

// --- PERBAIKAN DI SINI ---
// Definisikan IOrderItem SEBELUM digunakan di IOrder.
export interface IOrderItem {
  product: Schema.Types.ObjectId | IProduct;
  name: string;
  quantity: number;
  price: number;
}

// Interface untuk Model Pesanan
export interface IOrder extends Document {
  orderId: string;
  user: {
      _id: Schema.Types.ObjectId;
      name: string;
      email: string;
  };
  items: IOrderItem[]; // Sekarang TypeScript sudah tahu apa itu IOrderItem
  totalAmount: number;
  shippingAddress: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  status: 'Pending Payment' | 'Processing' | 'Shipped' | 'Fulfilled' | 'Cancelled';
  paymentProof?: string;
}

// Interface untuk Model Ulasan
export interface IReview extends Document {
    user: Schema.Types.ObjectId | IUser;
    product: Schema.Types.ObjectId | IProduct;
    rating: number;
    comment: string;
}