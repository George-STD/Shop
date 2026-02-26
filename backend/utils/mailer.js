const nodemailer = require('nodemailer');

// Configure the transporter (use your real SMTP credentials in production)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * Send order confirmation email
 * @param {string} to - Recipient email
 * @param {object} order - Order object
 */
async function sendOrderConfirmationEmail(to, order) {
  const subject = 'تأكيد طلبك من متجر الهدايا';
  const html = `
    <h2>شكرًا لطلبك!</h2>
    <p>رقم الطلب: <b>${order._id}</b></p>
    <p>المجموع: <b>${order.total} ريال</b></p>
    <p>سنقوم بمعالجة طلبك قريبًا.</p>
  `;
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'no-reply@giftshop.com',
    to,
    subject,
    html
  });
}

module.exports = { sendOrderConfirmationEmail };