// src/utils/order.ts
import { calculateShippingCost } from '../services/shipping.service';

export interface OrderCalculationInput {
  itemsPrice: number;
  paymentMethod: 'va' | 'cod';
  shippingAddress: {
    city: string;
    postalCode?: string;
    [key: string]: any; // Allow additional fields
  };
  weight?: number;
}

export async function calculateOrderTotal(input: OrderCalculationInput) {
  const { itemsPrice, paymentMethod, shippingAddress, weight = 1000 } = input;

  // Calculate shipping cost based on destination
  const shippingCalculation = await calculateShippingCost(
    shippingAddress.city,
    shippingAddress.postalCode,
    weight
  );

  // Calculate fees based on payment method
  const adminFee = paymentMethod === 'cod' ? 2500 : 0;
  const discount = paymentMethod === 'va' ? 3000 : 0;

  // Calculate final total
  const totalAmount = itemsPrice + shippingCalculation.shippingCost + adminFee - discount;

  return {
    totalAmount,
    itemsPrice,
    shippingPrice: shippingCalculation.shippingCost,
    adminFee,
    discount,
    isJabodetabek: shippingCalculation.isJabodetabek,
    courier: shippingCalculation.courier,
    service: shippingCalculation.service,
    etd: shippingCalculation.etd
  };
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use calculateOrderTotal with OrderCalculationInput instead
 */
export function calculateOrderTotalLegacy(
  itemsPrice: number,
  paymentMethod: 'online' | 'offline'
) {
  const shippingPrice = 15000;
  const adminFee = paymentMethod === 'offline' ? 2500 : 0;
  const discount = paymentMethod === 'online' ? 3000 : 0;

  const totalAmount = itemsPrice + shippingPrice + adminFee - discount;

  return { totalAmount, shippingPrice, adminFee, discount };
}
