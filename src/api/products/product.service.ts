// src/api/products/product.service.ts
import {Product} from '../../models/product.model';

interface QueryParams {
  page?: string;
  limit?: string;
  search?: string;
  category?: string;
}

export const getAllProducts = async (query: QueryParams) => {
  const page = parseInt(query.page || '1', 10);
  const limit = parseInt(query.limit || '10', 10);
  const skip = (page - 1) * limit;

  const filter: any = {};

  // Filter by category (optional)
  if (query.category) {
    filter.category = query.category;
  }

  // Search by name (optional)
  if (query.search) {
    filter.name = { $regex: query.search, $options: 'i' };
  }

  const [products, total] = await Promise.all([
    Product.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
    Product.countDocuments(filter)
  ]);

  const pagination = {
    total,
    page,
    limit,
  };

  return { products, pagination };
};
