import { Schema, model } from 'mongoose';
import { IOrder } from '../types/index';

const orderSchema = new Schema<IOrder>({
  orderId: { type: String, required: true, unique: true, index: true },
  user: {
    _id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
  },
  items: [{
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    size: {
      type: String,
      enum: ['S', 'M', 'L', 'XL'],
      required: true,
    },
  }],
  itemsPrice: { type: Number, required: true },
  shippingPrice: { type: Number, required: true, default: 0 },
  adminFee: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  shippingAddress: {
    street: String,
    city: String,
    postalCode: String,
    country: String,
    phone: String,
  },
  paymentMethod: {
    type: String,
    enum: ['va', 'cod'],
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending Payment', 'Diproses', 'Dikirim', 'Telah Sampai', 'Cancelled'],
    default: 'Pending Payment',
  },
  type: {
    type: String,
    enum: ['ready-stock', 'preorder'],
    default: 'ready-stock',
    required: true,
  },
  paymentProof: { type: String },
  transactionId: { type: String },
}, { timestamps: true });

// Add compound indexes for better query performance
orderSchema.index({ 'user._id': 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ orderId: 1 }); // For fast order lookups
orderSchema.index({ createdAt: -1 }); // For recent orders
orderSchema.index({ status: 1, 'user._id': 1 }); // For user-specific status queries


export const Order = model<IOrder>('Order', orderSchema);