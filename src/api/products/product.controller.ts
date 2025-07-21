import { Request, Response, NextFunction } from 'express';
import { Product } from '../../models/product.model';
import { ApiResponse } from '../../utils/apiResponse';
import { ApiError } from '../../errors/apiError';
import slugify from 'slugify';
import { uploadImages } from '../../services/imagekit.service';

// Admin: Create Product (dengan form-data dan upload gambar)
export const createProductHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, price, category, stock } = req.body;

    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      throw new ApiError(400, 'Product images are required.');
    }

    const files = req.files as Express.Multer.File[];
    const uploadedUrls = await uploadImages(files);

    const imageObjects = uploadedUrls.map((url, index) => ({
      url,
      alt: `${name} - Image ${index + 1}`,
    }));

    const newProduct = new Product({
      name,
      slug: slugify(name, { lower: true, strict: true }),
      description,
      price: parseFloat(price),
      category,
      stock: parseInt(stock, 10),
    });

    newProduct.set('images', imageObjects); // <- penting

    await newProduct.save();
    return new ApiResponse(res, 201, 'Product created successfully', newProduct);
  } catch (error) {
    next(error);
  }
};

// Public: Get All Products
export const getAllProductsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, sortBy, order = 'asc', page = 1, limit = 10 } = req.query;

    const query: any = {};
    if (category) {
      query.category = category as string;
    }

    const sortOptions: any = {};
    if (sortBy) {
      sortOptions[sortBy as string] = order === 'desc' ? -1 : 1;
    } else {
      sortOptions.createdAt = -1;
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const products = await Product.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limitNum);

    const pagination = {
      currentPage: pageNum,
      totalPages,
      totalProducts,
    };

    return new ApiResponse(res, 200, 'Products fetched successfully', { products, pagination });
  } catch (error) {
    next(error);
  }
};

// Public: Get a Single Product by slug
export const getProductBySlugHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug });
    if (!product) {
      throw new ApiError(404, 'Product not found');
    }
    return new ApiResponse(res, 200, 'Product fetched successfully', product);
  } catch (error) {
    next(error);
  }
};

// Admin: Update Product
export const updateProductHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    Object.assign(product, req.body);

    if (req.files && (req.files as Express.Multer.File[]).length > 0) {
      const files = req.files as Express.Multer.File[];
      const uploadedUrls = await uploadImages(files);

      const imageObjects = uploadedUrls.map((url, index) => ({
        url,
        alt: `${req.body.name || product.name} - Image ${index + 1}`,
      }));

      product.set('images', imageObjects); // <- penting
    }

    if (req.body.name) {
      product.slug = slugify(req.body.name, { lower: true, strict: true });
    }

    const updatedProduct = await product.save();
    return new ApiResponse(res, 200, 'Product updated successfully', updatedProduct);
  } catch (error) {
    next(error);
  }
};

// Admin: Delete Product
export const deleteProductHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    // Hapus gambar dari cloud di sini jika diperlukan

    return new ApiResponse(res, 200, 'Product deleted successfully', { id: req.params.id });
  } catch (error) {
    next(error);
  }
};
