import midtransClient from 'midtrans-client';

const snap = new midtransClient.Snap({
  isProduction: process.env.NODE_ENV === 'production',
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
