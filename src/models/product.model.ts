import { Schema, model } from 'mongoose';

const imageSchema = new Schema({
  url: { type: String, required: true },
  alt: { type: String, default: '' }
}, { _id: false });

const sizeStockSchema = new Schema({
  size: {
    type: String,
    enum: ['S', 'M', 'L', 'XL'],
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 0
  }
}, { _id: false });

const productSchema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true, index: true },
  images: [imageSchema],
  stock: { type: Number, required: true, default: 0 },
  sizes: [sizeStockSchema]
}, { timestamps: true });

export const Product = model('Product', productSchema);
