import { Schema, model } from 'mongoose';
import { IOrder } from '../types/index';

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
    size: {
      type: String,
      enum: ['S', 'M', 'L', 'XL'],
      required: true,
    }, // <-- pindahkan size ke sini
  }],
  totalAmount: { type: Number, required: true },
  adminFee: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  shippingAddress: {
    street: String,
    city: String,
    postalCode: String,
    country: String,
    phone: String,
  },
  paymentMethod: {
    type: String,
    enum: ['online', 'offline'],
    default: null,
  },
  status: {
    type: String,
    enum: ['Pending Payment', 'Diproses', 'Dikirim', 'Telah Sampai', 'Cancelled'],
    default: 'Pending Payment',
  },
  paymentProof: { type: String },
  transactionId: { type: String },
}, { timestamps: true });


export const Order = model<IOrder>('Order', orderSchema);