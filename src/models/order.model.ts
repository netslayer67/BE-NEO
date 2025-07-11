import { Schema, model } from 'mongoose';
import { IOrder } from '@/types';

const orderSchema = new Schema<IOrder>({
  orderId: { type: String, required: true, unique: true },
  user: {
    _id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
  },
  items: [{
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
  }],
  totalAmount: { type: Number, required: true },
  shippingAddress: {
    street: String,
    city: String,
    postalCode: String,
    country: String,
    phone: String,
  },
  status: {
    type: String,
    enum: ['Pending Payment', 'Processing', 'Shipped', 'Fulfilled', 'Cancelled'],
    default: 'Pending Payment', // <-- Status default saat order dibuat
  },
  paymentProof: { type: String },
}, { timestamps: true });

export const Order = model<IOrder>('Order', orderSchema);