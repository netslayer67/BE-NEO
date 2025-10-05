// src/api/shipping/shipping.route.ts
import { Router } from 'express';
import { calculateShippingHandler, getShippingPreviewHandler } from './shipping.controller';

const router = Router();

// Shipping cost calculation routes
router.post('/calculate', calculateShippingHandler);
router.post('/preview', getShippingPreviewHandler);

export default router;