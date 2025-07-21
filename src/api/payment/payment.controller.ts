// src/controllers/payment.controller.ts
import { Request, Response } from 'express';
import { createTransaction } from '../../services/midtrans.service';

export const generateSnapToken = async (req: Request, res: Response) => {
  try {
    const { orderId, amount, customer } = req.body;

    if (!orderId || !amount || !customer) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const midtransResponse = await createTransaction(orderId, amount, customer);
    return res.json({ snapToken: midtransResponse.token });
  } catch (error) {
    console.error('Midtrans error:', error);
    return res.status(500).json({ error: 'Failed to generate Midtrans token' });
  }
};
