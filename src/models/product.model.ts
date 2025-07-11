import { Schema, model } from 'mongoose';

const productSchema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true, index: true },
  images: [{ type: String }],
  stock: { type: Number, required: true, default: 0 },
}, { timestamps: true });

export const Product = model('Product', productSchema);
