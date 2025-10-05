import midtransClient from 'midtrans-client';
import dotenv from 'dotenv';
dotenv.config(); // Tambahkan ini di awal midtrans.service.ts (opsional jika sudah yakin urutan import benar)


const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY as string,
  clientKey: process.env.MIDTRANS_CLIENT_KEY as string,
});

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://radiantrage.vercel.app';

/**
 * Membuat transaksi Midtrans Snap.
 */
export const createTransaction = async (
  orderId: string,
  amount: number,
  customerDetails: {
    first_name: string;
    last_name?: string;
    email: string;
    phone?: string;
  },
  shippingAddress?: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
    phone: string;
  }
) => {
  const enabledPayments = process.env.MIDTRANS_ENABLED_PAYMENTS?.split(',') || [];

  const transactionParams: any = {
    transaction_details: {
      order_id: orderId,
      gross_amount: amount,
    },
    customer_details: {
      ...customerDetails,
      billing_address: shippingAddress ? {
        first_name: customerDetails.first_name,
        last_name: customerDetails.last_name || '',
        email: customerDetails.email,
        phone: customerDetails.phone || shippingAddress.phone,
        address: shippingAddress.street,
        city: shippingAddress.city,
        postal_code: shippingAddress.postalCode,
        country_code: 'IDN'
      } : undefined,
      shipping_address: shippingAddress ? {
        first_name: customerDetails.first_name,
        last_name: customerDetails.last_name || '',
        email: customerDetails.email,
        phone: customerDetails.phone || shippingAddress.phone,
        address: shippingAddress.street,
        city: shippingAddress.city,
        postal_code: shippingAddress.postalCode,
        country_code: 'IDN'
      } : undefined,
    },
    enabled_payments: enabledPayments,
    callbacks: {
      finish: `${FRONTEND_URL}/profile`,
    },
    // Webhook notification URL for payment status updates
    notification_url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/v1/orders/webhook`,
  };

  // Remove undefined addresses
  if (!shippingAddress) {
    delete transactionParams.customer_details.billing_address;
    delete transactionParams.customer_details.shipping_address;
  }

  return await snap.createTransaction(transactionParams);
};
