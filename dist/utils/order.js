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
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateOrderTotal = calculateOrderTotal;
exports.calculateOrderTotalLegacy = calculateOrderTotalLegacy;
// src/utils/order.ts
const shipping_service_1 = require("../services/shipping.service");
function calculateOrderTotal(input) {
    return __awaiter(this, void 0, void 0, function* () {
        const { itemsPrice, paymentMethod, shippingAddress, weight = 1000 } = input;
        // Calculate shipping cost based on destination
        const shippingCalculation = yield (0, shipping_service_1.calculateShippingCost)(shippingAddress.city, shippingAddress.postalCode, weight);
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
    });
}
/**
 * Legacy function for backward compatibility
 * @deprecated Use calculateOrderTotal with OrderCalculationInput instead
 */
function calculateOrderTotalLegacy(itemsPrice, paymentMethod) {
    const shippingPrice = 15000;
    const adminFee = paymentMethod === 'offline' ? 2500 : 0;
    const discount = paymentMethod === 'online' ? 3000 : 0;
    const totalAmount = itemsPrice + shippingPrice + adminFee - discount;
    return { totalAmount, shippingPrice, adminFee, discount };
}
