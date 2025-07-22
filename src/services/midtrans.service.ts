import midtransClient from 'midtrans-client';
import dotenv from 'dotenv';
dotenv.config(); // Tambahkan ini di awal midtrans.service.ts (opsional jika sudah yakin urutan import benar)


const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY as string,
  clientKey: process.env.MIDTRANS_CLIENT_KEY as string,
});

/**
 * Membuat transaksi Midtrans Snap.
 */
export const createTransaction = async (
  orderId: string,
  amount: number,
  customerDetails: { first_name: string; email: string }
) => {
  const enabledPayments = process.env.MIDTRANS_ENABLED_PAYMENTS?.split(',') || [];

  const transactionParams = {
    transaction_details: {
      order_id: orderId,
      gross_amount: amount,
    },
    customer_details: customerDetails,
    enabled_payments: enabledPayments,
  };

  return await snap.createTransaction(transactionParams);
};
