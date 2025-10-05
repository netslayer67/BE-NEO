"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/api/shipping/shipping.route.ts
const express_1 = require("express");
const shipping_controller_1 = require("./shipping.controller");
const router = (0, express_1.Router)();
// Shipping cost calculation routes
router.post('/calculate', shipping_controller_1.calculateShippingHandler);
router.post('/preview', shipping_controller_1.getShippingPreviewHandler);
exports.default = router;
