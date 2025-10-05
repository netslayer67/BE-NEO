"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateShippingAddress = exports.getShippingCostFromAPI = exports.calculateShippingCost = exports.isJabodetabekArea = void 0;
// src/services/shipping.service.ts
const axios_1 = __importDefault(require("axios"));
const cache_service_1 = require("./cache.service");
/**
 * Check if destination is in Jabodetabek area (free shipping)
 */
const isJabodetabekArea = (city, postalCode) => {
    const jabodetabekCities = [
        'jakarta', 'bogor', 'depok', 'tangerang', 'bekasi',
        'jakarta pusat', 'jakarta utara', 'jakarta barat', 'jakarta selatan', 'jakarta timur',
        'kabupaten bogor', 'kabupaten tangerang', 'kabupaten bekasi'
    ];
    const normalizedCity = city.toLowerCase().trim();
    return jabodetabekCities.some(jaboCity => normalizedCity.includes(jaboCity) || jaboCity.includes(normalizedCity));
};
exports.isJabodetabekArea = isJabodetabekArea;
/**
 * Calculate shipping cost based on destination
 * Free shipping for Jabodetabek, otherwise use external API or fixed rate
 */
const calculateShippingCost = (destination_1, postalCode_1, ...args_1) => __awaiter(void 0, [destination_1, postalCode_1, ...args_1], void 0, function* (destination, postalCode, weight = 1000 // Default 1kg
) {
    // Create cache key based on destination and postal code
    const cacheKey = `shipping_${destination}_${postalCode || ''}_${weight}`;
    // Check cache first
    const cachedResult = cache_service_1.cacheService.get(cacheKey);
    if (cachedResult) {
        return cachedResult;
    }
    const isJabodetabek = (0, exports.isJabodetabekArea)(destination, postalCode);
    let result;
    if (isJabodetabek) {
        result = {
            isJabodetabek: true,
            shippingCost: 0,
            courier: 'FREE',
            service: 'Jabodetabek Free Shipping',
            etd: '1-2 hari'
        };
    }
    else {
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
    cache_service_1.cacheService.set(cacheKey, result, 30 * 60 * 1000);
    return result;
});
exports.calculateShippingCost = calculateShippingCost;
/**
 * Get shipping cost from external API (RajaOngkir example)
 * Uncomment and configure when you have API key
 */
const getShippingCostFromAPI = (request) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield axios_1.default.post('https://api.rajaongkir.com/starter/cost', {
            origin: request.origin,
            destination: request.destination,
            weight: request.weight,
            courier: request.courier
        }, {
            headers: {
                'key': process.env.RAJAONGKIR_API_KEY || '',
                'content-type': 'application/x-www-form-urlencoded'
            }
        });
        return response.data.rajaongkir.results;
    }
    catch (error) {
        console.error('Error fetching shipping cost from API:', error);
        throw new Error('Failed to calculate shipping cost');
    }
});
exports.getShippingCostFromAPI = getShippingCostFromAPI;
/**
 * Validate shipping address for shipping cost calculation
 */
const validateShippingAddress = (address) => {
    if (!address.city || address.city.trim().length === 0) {
        return false;
    }
    // Basic postal code validation for Indonesia
    if (address.postalCode && !/^\d{5}$/.test(address.postalCode)) {
        return false;
    }
    return true;
};
exports.validateShippingAddress = validateShippingAddress;
