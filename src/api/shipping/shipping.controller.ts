// src/api/shipping/shipping.controller.ts
import { Response, NextFunction } from 'express';
import { IRequest } from '../../middlewares/auth.middleware';
import { ApiResponse } from '../../utils/apiResponse';
import { ApiError } from '../../errors/apiError';
import { calculateShippingCost, validateShippingAddress } from '../../services/shipping.service';

/**
 * @desc Calculate shipping cost based on destination
 * @route POST /api/v1/shipping/calculate
 */
export const calculateShippingHandler = async (
  req: IRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { city, postalCode, weight = 1000 } = req.body;

    // Validate required fields
    if (!city || city.trim().length === 0) {
      throw new ApiError(400, 'City is required for shipping calculation');
    }

    // Validate shipping address
    if (!validateShippingAddress({ city, postalCode })) {
      throw new ApiError(400, 'Invalid shipping address format');
    }

    // Calculate shipping cost
    const shippingCalculation = await calculateShippingCost(city, postalCode, weight);

    return new ApiResponse(res, 200, 'Shipping cost calculated successfully', {
      destination: city,
      isJabodetabek: shippingCalculation.isJabodetabek,
      shippingCost: shippingCalculation.shippingCost,
      courier: shippingCalculation.courier,
      service: shippingCalculation.service,
      etd: shippingCalculation.etd,
      weight: weight
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get shipping information for checkout preview
 * @route POST /api/v1/shipping/preview
 */
export const getShippingPreviewHandler = async (
  req: IRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { city, postalCode, itemsPrice, paymentMethod, weight = 1000 } = req.body;

    if (!city || !itemsPrice || !paymentMethod) {
      throw new ApiError(400, 'City, items price, and payment method are required');
    }

    if (!['va', 'cod'].includes(paymentMethod)) {
      throw new ApiError(400, 'Invalid payment method. Must be va or cod');
    }

    // Calculate shipping
    const shippingCalculation = await calculateShippingCost(city, postalCode, weight);

    // Calculate total with fees
    const adminFee = paymentMethod === 'cod' ? 2500 : 0;
    const discount = paymentMethod === 'va' ? 3000 : 0;
    const totalAmount = itemsPrice + shippingCalculation.shippingCost + adminFee - discount;

    return new ApiResponse(res, 200, 'Shipping preview calculated successfully', {
      destination: city,
      shipping: {
        isJabodetabek: shippingCalculation.isJabodetabek,
        cost: shippingCalculation.shippingCost,
        courier: shippingCalculation.courier,
        service: shippingCalculation.service,
        etd: shippingCalculation.etd
      },
      pricing: {
        itemsPrice,
        shippingPrice: shippingCalculation.shippingCost,
        adminFee,
        discount,
        totalAmount
      },
      paymentMethod
    });

  } catch (error) {
    next(error);
  }
};