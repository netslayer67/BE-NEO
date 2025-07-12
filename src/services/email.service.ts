import nodemailer from 'nodemailer';
import { IOrder } from '../types/index';

/**
 * Membuat transporter Nodemailer yang dapat digunakan kembali.
 * Konfigurasi diambil dari environment variables.
 */
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('Email credentials are not defined in .env file. Email service is disabled.');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '465', 10),
    secure: process.env.EMAIL_SECURE === 'true', // true untuk port 465
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Mengirim email notifikasi saat status pesanan berubah.
 * @param order - Dokumen pesanan yang statusnya diperbarui.
 */
export const sendOrderStatusUpdateEmail = async (order: IOrder): Promise<void> => {
  const transporter = createTransporter();
  
  if (!transporter) {
    return;
  }
  
  if (!order.user.email) {
    console.warn(`Attempted to send email for order ${order.orderId}, but user email is missing.`);
    return;
  }

  // Peta subjek email ini sudah mencakup semua status yang diperlukan.
  const subjectMap = {
    'Processing': `Pesanan Anda #${order.orderId} Telah Dikonfirmasi!`,
    'Shipped': `Pesanan Anda #${order.orderId} Telah Dikirim!`, // <-- Sudah ada
    'Fulfilled': `Pesanan Anda #${order.orderId} Telah Selesai!`, // <-- Sudah ada
    'Cancelled': `Pesanan Anda #${order.orderId} Dibatalkan.`,
  };

  const subject = subjectMap[order.status as keyof typeof subjectMap] || `Update Status Pesanan #${order.orderId}`;

  const emailBody = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; background-color: #0a0a0a; border: 1px solid #222; border-radius: 12px; color: #e0e0e0; }
        .header { background-color: #111; padding: 40px; text-align: center; border-bottom: 1px solid #222; }
        .header h1 { color: #fff; margin: 0; font-size: 28px; letter-spacing: 2px; }
        .content { padding: 30px 40px; }
        .content h2 { color: #fff; font-size: 22px; }
        .content p { color: #aaa; font-size: 16px; line-height: 1.7; }
        .order-details { margin: 30px 0; }
        .order-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #222; }
        .order-item:last-child { border-bottom: none; }
        .total { text-align: right; margin-top: 20px; font-size: 18px; font-weight: bold; color: #fff; }
        .footer { padding: 30px; text-align: center; font-size: 12px; color: #555; }
        .status-box { background-color: #1a1a1a; border: 1px solid #333; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
        .status-box p { margin: 0; font-size: 16px; color: #ccc; }
        .status-box strong { font-size: 18px; color: #fff; }
      </style>
    </head>
    <body style="background-color: #000; padding: 20px;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td align="center">
            <div class="container">
              <div class="header">
                <h1>NEO DERVISH</h1>
              </div>
              <div class="content">
                <h2>Halo ${order.user.name},</h2>
                <p>Kabar baik! Ada pembaruan untuk pesanan Anda #${order.orderId}.</p>
                <div class="status-box">
                  <p>Status Pesanan Saat Ini:</p>
                  <strong>${order.status.toUpperCase()}</strong>
                </div>
                <div class="order-details">
                  <h3 style="color: #fff; border-bottom: 1px solid #333; padding-bottom: 10px;">Rincian Pesanan</h3>
                  ${order.items.map(item => `
                    <div class="order-item">
                      <span>${item.name} (x${item.quantity})</span>
                      <span>Rp ${item.price.toLocaleString('id-ID')}</span>
                    </div>
                  `).join('')}
                  <div class="total">
                    Total: Rp ${order.totalAmount.toLocaleString('id-ID')}
                  </div>
                </div>
                <p>Kami akan memberitahu Anda kembali jika ada pembaruan lebih lanjut. Anda juga bisa melihat detail pesanan di halaman profil Anda.</p>
              </div>
              <div class="footer">
                &copy; ${new Date().getFullYear()} Neo Dervish. All Rights Reserved.
              </div>
            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"NEO DERVISH Store" <${process.env.EMAIL_USER}>`,
    to: order.user.email,
    subject: subject,
    html: emailBody,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email notification sent successfully to: ${order.user.email} (Message ID: ${info.messageId})`);
  } catch (error) {
    console.error(`Failed to send email for order ${order.orderId}:`, error);
  }
};