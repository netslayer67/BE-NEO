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
exports.getShippingPreviewHandler = exports.calculateShippingHandler = void 0;
const apiResponse_1 = require("../../utils/apiResponse");
const apiError_1 = require("../../errors/apiError");
const shipping_service_1 = require("../../services/shipping.service");
/**
 * @desc Calculate shipping cost based on destination
 * @route POST /api/v1/shipping/calculate
 */
const calculateShippingHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { city, postalCode, weight = 1000 } = req.body;
        // Validate required fields
        if (!city || city.trim().length === 0) {
            throw new apiError_1.ApiError(400, 'City is required for shipping calculation');
        }
        // Validate shipping address
        if (!(0, shipping_service_1.validateShippingAddress)({ city, postalCode })) {
            throw new apiError_1.ApiError(400, 'Invalid shipping address format');
        }
        // Calculate shipping cost
        const shippingCalculation = yield (0, shipping_service_1.calculateShippingCost)(city, postalCode, weight);
        return new apiResponse_1.ApiResponse(res, 200, 'Shipping cost calculated successfully', {
            destination: city,
            isJabodetabek: shippingCalculation.isJabodetabek,
            shippingCost: shippingCalculation.shippingCost,
            courier: shippingCalculation.courier,
            service: shippingCalculation.service,
            etd: shippingCalculation.etd,
            weight: weight
        });
    }
    catch (error) {
        next(error);
    }
});
exports.calculateShippingHandler = calculateShippingHandler;
/**
 * @desc Get shipping information for checkout preview
 * @route POST /api/v1/shipping/preview
 */
const getShippingPreviewHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { city, postalCode, itemsPrice, paymentMethod, weight = 1000 } = req.body;
        if (!city || !itemsPrice || !paymentMethod) {
            throw new apiError_1.ApiError(400, 'City, items price, and payment method are required');
        }
        if (!['va', 'cod'].includes(paymentMethod)) {
            throw new apiError_1.ApiError(400, 'Invalid payment method. Must be va or cod');
        }
        // Calculate shipping
        const shippingCalculation = yield (0, shipping_service_1.calculateShippingCost)(city, postalCode, weight);
        // Calculate total with fees
        const adminFee = paymentMethod === 'cod' ? 2500 : 0;
        const discount = paymentMethod === 'va' ? 3000 : 0;
        const totalAmount = itemsPrice + shippingCalculation.shippingCost + adminFee - discount;
        return new apiResponse_1.ApiResponse(res, 200, 'Shipping preview calculated successfully', {
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
    }
    catch (error) {
        next(error);
    }
});
exports.getShippingPreviewHandler = getShippingPreviewHandler;
