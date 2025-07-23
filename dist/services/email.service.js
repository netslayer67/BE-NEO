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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOrderStatusUpdateEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const createTransporter = () => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('Email credentials are not defined in .env file. Email service is disabled.');
        return null;
    }
    return nodemailer_1.default.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '465', 10),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
};
const sendOrderStatusUpdateEmail = (order) => __awaiter(void 0, void 0, void 0, function* () {
    const transporter = createTransporter();
    if (!transporter || !order.user.email)
        return;
    const subjectMap = {
        'Processing': `Pesanan Anda #${order.orderId} Telah Dikonfirmasi!`,
        'Shipped': `Pesanan Anda #${order.orderId} Telah Dikirim!`,
        'Fulfilled': `Pesanan Anda #${order.orderId} Telah Selesai!`,
        'Cancelled': `Pesanan Anda #${order.orderId} Dibatalkan.`,
    };
    const subject = subjectMap[order.status] || `Update Status Pesanan #${order.orderId}`;
    const emailBody = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #000; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background-color: #0a0a0a; border: 1px solid #222; border-radius: 12px; color: #e0e0e0; }
        .header { background-color: #111; padding: 40px; text-align: center; border-bottom: 1px solid #222; }
        .header h1 { color: #fff; margin: 0; font-size: 28px; letter-spacing: 2px; }
        .content { padding: 30px 40px; }
        .content h2 { color: #fff; font-size: 22px; }
        .content p { color: #aaa; font-size: 16px; line-height: 1.7; }
        .order-details { margin: 30px 0; }
        .order-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #222; font-size: 15px; }
        .order-item:last-child { border-bottom: none; }
        .order-item span.size { color: #999; font-size: 13px; display: block; }
        .total { text-align: right; margin-top: 20px; font-size: 18px; font-weight: bold; color: #fff; }
        .status-box { background-color: #1a1a1a; border: 1px solid #333; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
        .status-box p { margin: 0; font-size: 16px; color: #ccc; }
        .status-box strong { font-size: 18px; color: #fff; }
        .footer { padding: 30px; text-align: center; font-size: 12px; color: #555; }
      </style>
    </head>
    <body>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center">
            <div class="container">
              <div class="header">
                <h1>NEO DERVISH</h1>
              </div>
              <div class="content">
                <h2>Halo ${order.user.name},</h2>
                <p>Pembaruan untuk pesanan Anda #${order.orderId}:</p>
                <div class="status-box">
                  <p>Status Pesanan Saat Ini:</p>
                  <strong>${order.status.toUpperCase()}</strong>
                </div>
                <div class="order-details">
                  <h3 style="color: #fff; border-bottom: 1px solid #333; padding-bottom: 10px;">Rincian Pesanan</h3>
                  ${order.items.map(item => `
                    <div class="order-item">
                      <div>
                        <span>${item.name} (x${item.quantity})</span>
                        <span class="size">Ukuran: ${item.size || '-'}</span>
                      </div>
                      <div>Rp ${item.price.toLocaleString('id-ID')}</div>
                    </div>
                  `).join('')}
                  <div class="total">Total: Rp ${order.totalAmount.toLocaleString('id-ID')}</div>
                </div>
                <p>Kami akan menginformasikan lagi jika status pesanan Anda berubah. Terima kasih telah berbelanja di Neo Dervish.</p>
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
        subject,
        html: emailBody,
    };
    try {
        const info = yield transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${order.user.email} | Message ID: ${info.messageId}`);
    }
    catch (error) {
        console.error(`❌ Failed to send email to ${order.user.email}:`, error);
    }
});
exports.sendOrderStatusUpdateEmail = sendOrderStatusUpdateEmail;
