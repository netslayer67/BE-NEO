import { Request, Response, NextFunction } from 'express';
import { Product } from '../../models/product.model';
import { ApiResponse } from '../../utils/apiResponse';
import { ApiError } from '../../errors/apiError';
import slugify from 'slugify';
import { uploadImages } from '../../services/imagekit.service';
import * as productService from './product.service';

// Admin: Create Product (dengan form-data dan upload gambar)
export const createProductHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, price, category, stock: legacyStock, sizes: sizesRaw } = req.body;

    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      throw new ApiError(400, 'Product images are required.');
    }

    // --- Parse sizes (expect JSON string) ---
    let sizes: { size: string; quantity: number }[] = [];
    if (sizesRaw) {
      try {
        sizes = JSON.parse(sizesRaw);
      } catch {
        throw new ApiError(400, 'Invalid sizes format. Must be JSON.');
      }
    }

    if (!sizes.length) {
      throw new ApiError(400, 'Sizes array is required.');
    }

    // --- Hitung total stock dari sizes ---
    const totalStock = sizes.reduce((sum, s) => sum + s.quantity, 0);

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
      stock: totalStock, // <- hitung dari sizes
      sizes,
      images: imageObjects,
    });

    await newProduct.save();
    return new ApiResponse(res, 201, 'Product created successfully', newProduct);
  } catch (error) {
    next(error);
  }
};


export const getAllProductsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { products, pagination } = await productService.getAllProducts(req.query);
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

export const updateProductHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    const { sizes: sizesRaw } = req.body;

    // --- Parse sizes dan hitung ulang stock jika sizes diberikan ---
    if (sizesRaw) {
      try {
        const sizes = JSON.parse(sizesRaw);
        product.sizes = sizes;
        product.stock = sizes.reduce((sum: any, s: { quantity: any; }) => sum + s.quantity, 0);
      } catch {
        throw new ApiError(400, 'Invalid sizes format. Must be JSON.');
      }
    }

    Object.assign(product, req.body);

    if (req.files && (req.files as Express.Multer.File[]).length > 0) {
      const files = req.files as Express.Multer.File[];
      const uploadedUrls = await uploadImages(files);

      const imageObjects = uploadedUrls.map((url, index) => ({
        url,
        alt: `${req.body.name || product.name} - Image ${index + 1}`,
      }));

      product.set('images', imageObjects);
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

export const updateProductStockHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { size, quantity } = req.body;
    const product = await Product.findById(req.params.productId);
    if (!product) throw new ApiError(404, 'Product not found');

    const sizeEntry = product.sizes.find(s => s.size === size);
    if (!sizeEntry) throw new ApiError(400, 'Size not found');

    sizeEntry.quantity = quantity;
    product.stock = product.sizes.reduce((sum, s) => sum + s.quantity, 0);
    await product.save();

    return new ApiResponse(res, 200, 'Product stock updated successfully', product);
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
