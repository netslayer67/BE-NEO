import { Schema, model } from 'mongoose';

const imageSchema = new Schema({
  url: { type: String, required: true },
  alt: { type: String, default: '' }
}, { _id: false });

const productSchema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true, index: true },
  images: [imageSchema], // now an array of objects
  stock: { type: Number, required: true, default: 0 },
}, { timestamps: true });

export const Product = model('Product', productSchema);
