// src/routes/payment.route.ts
import express from 'express';
import { generateSnapToken } from './payment.controller';

const router = express.Router();

router.post('/token', generateSnapToken); // POST /api/payment/token

export default router;
