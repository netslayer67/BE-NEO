import midtransClient from 'midtrans-client';
import dotenv from 'dotenv';
dotenv.config(); // Tambahkan ini di awal midtrans.service.ts (opsional jika sudah yakin urutan import benar)

console.log('Midtrans config:', {
  serverKey: process.env.MIDTRANS_SERVER_KEY ? 'PRESENT' : 'MISSING',
  clientKey: process.env.MIDTRANS_CLIENT_KEY ? 'PRESENT' : 'MISSING',
  backendUrl: process.env.BACKEND_URL,
  frontendUrl: process.env.FRONTEND_URL,
});

const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY as string,
  clientKey: process.env.MIDTRANS_CLIENT_KEY as string,
});

console.log('Midtrans Snap client initialized');

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://neodervish.vercel.app';

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
  // For testing, let's not restrict payment methods
  // const enabledPayments = process.env.MIDTRANS_ENABLED_PAYMENTS?.split(',') || [];

  // Simplified transaction params for testing
  const transactionParams: any = {
    transaction_details: {
      order_id: orderId,
      gross_amount: amount,
    },
    customer_details: {
      first_name: customerDetails.first_name,
      last_name: customerDetails.last_name || '',
      email: customerDetails.email,
      phone: customerDetails.phone || shippingAddress?.phone || '',
    },
    // enabled_payments: enabledPayments, // Temporarily disabled for testing
    callbacks: {
      finish: `${FRONTEND_URL}/profile`,
    },
    // Webhook notification URL for payment status updates
    notification_url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/v1/orders/webhook`,
  };

  // Add addresses if shipping address is provided
  if (shippingAddress) {
    transactionParams.customer_details.billing_address = {
      first_name: customerDetails.first_name,
      last_name: customerDetails.last_name || '',
      email: customerDetails.email,
      phone: customerDetails.phone || shippingAddress.phone,
      address: shippingAddress.street,
      city: shippingAddress.city,
      postal_code: shippingAddress.postalCode,
      country_code: 'IDN'
    };
    transactionParams.customer_details.shipping_address = {
      first_name: customerDetails.first_name,
      last_name: customerDetails.last_name || '',
      email: customerDetails.email,
      phone: customerDetails.phone || shippingAddress.phone,
      address: shippingAddress.street,
      city: shippingAddress.city,
      postal_code: shippingAddress.postalCode,
      country_code: 'IDN'
    };
  }

  console.log('Midtrans transaction params:', JSON.stringify(transactionParams, null, 2));

  try {
    const result = await snap.createTransaction(transactionParams);

    console.log('Midtrans transaction result:', {
      hasToken: !!result.token,
      hasRedirectUrl: !!result.redirect_url,
      tokenLength: result.token ? result.token.length : 0,
      resultKeys: Object.keys(result)
    });

    return result;
  } catch (error) {
    console.error('Midtrans createTransaction error:', error);
    throw error;
  }
};
