// src/services/shipping.service.ts
import axios from 'axios';
import { cacheService } from './cache.service';

export interface ShippingCostRequest {
  origin: string; // Origin city/district code
  destination: string; // Destination city/district code
  weight: number; // Weight in grams
  courier: string; // Courier service (jne, tiki, pos)
}

export interface ShippingCostResponse {
  code: string;
  name: string;
  costs: Array<{
    service: string;
    description: string;
    cost: Array<{
      value: number;
      etd: string;
      note: string;
    }>;
  }>;
}

export interface ShippingCalculation {
  isJabodetabek: boolean;
  shippingCost: number;
  courier?: string;
  service?: string;
  etd?: string;
}

/**
 * Check if destination is in Jabodetabek area (free shipping)
 */
export const isJabodetabekArea = (city: string, postalCode?: string): boolean => {
  const jabodetabekCities = [
    'jakarta', 'bogor', 'depok', 'tangerang', 'bekasi',
    'jakarta pusat', 'jakarta utara', 'jakarta barat', 'jakarta selatan', 'jakarta timur',
    'kabupaten bogor', 'kabupaten tangerang', 'kabupaten bekasi'
  ];

  const normalizedCity = city.toLowerCase().trim();
  return jabodetabekCities.some(jaboCity =>
    normalizedCity.includes(jaboCity) || jaboCity.includes(normalizedCity)
  );
};

/**
 * Calculate shipping cost based on destination
 * Free shipping for Jabodetabek, otherwise use external API or fixed rate
 */
export const calculateShippingCost = async (
  destination: string,
  postalCode?: string,
  weight: number = 1000 // Default 1kg
): Promise<ShippingCalculation> => {
  // Create cache key based on destination and postal code
  const cacheKey = `shipping_${destination}_${postalCode || ''}_${weight}`;

  // Check cache first
  const cachedResult = cacheService.get<ShippingCalculation>(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }

  const isJabodetabek = isJabodetabekArea(destination, postalCode);

  let result: ShippingCalculation;

  if (isJabodetabek) {
    result = {
      isJabodetabek: true,
      shippingCost: 0,
      courier: 'FREE',
      service: 'Jabodetabek Free Shipping',
      etd: '1-2 hari'
    };
  } else {
    // For areas outside Jabodetabek, use a fixed rate or external API
    // You can integrate with RajaOngkir, JNE API, etc. here
    // For now, using a fixed rate
    const baseShippingCost = 25000; // Fixed rate for outside Jabodetabek

    result = {
      isJabodetabek: false,
      shippingCost: baseShippingCost,
      courier: 'JNE',
      service: 'REG',
      etd: '3-5 hari'
    };
  }

  // Cache the result for 30 minutes
  cacheService.set(cacheKey, result, 30 * 60 * 1000);

  return result;
};

/**
 * Get shipping cost from external API (RajaOngkir example)
 * Uncomment and configure when you have API key
 */
export const getShippingCostFromAPI = async (
  request: ShippingCostRequest
): Promise<ShippingCostResponse[]> => {
  try {
    const response = await axios.post(
      'https://api.rajaongkir.com/starter/cost',
      {
        origin: request.origin,
        destination: request.destination,
        weight: request.weight,
        courier: request.courier
      },
      {
        headers: {
          'key': process.env.RAJAONGKIR_API_KEY || '',
          'content-type': 'application/x-www-form-urlencoded'
        }
      }
    );

    return response.data.rajaongkir.results;
  } catch (error) {
    console.error('Error fetching shipping cost from API:', error);
    throw new Error('Failed to calculate shipping cost');
  }
};

/**
 * Validate shipping address for shipping cost calculation
 */
export const validateShippingAddress = (address: {
  city: string;
  postalCode?: string;
}): boolean => {
  if (!address.city || address.city.trim().length === 0) {
    return false;
  }

  // Basic postal code validation for Indonesia
  if (address.postalCode && !/^\d{5}$/.test(address.postalCode)) {
    return false;
  }

  return true;
};