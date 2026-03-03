const nodemailer = require('nodemailer');

// Configure the transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000
});

// Verify SMTP connection on startup
transporter.verify()
  .then(() => console.log('✅ SMTP connection verified successfully'))
  .catch((err) => console.error('❌ SMTP connection failed:', err.message));

const FROM_EMAIL = process.env.SMTP_FROM || 'no-reply@foryo.me';
const BRAND_NAME = 'For You - فور يو';

/**
 * Send order confirmation email
 */
async function sendOrderConfirmationEmail(to, order) {
  const subject = `تأكيد طلبك من ${BRAND_NAME}`;
  const html = `
    <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #eee;">
      <div style="background: linear-gradient(135deg, #a855f7, #ec4899); padding: 24px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 24px;">${BRAND_NAME}</h1>
      </div>
      <div style="padding: 32px 24px;">
        <h2 style="color: #1f2937; margin-top: 0;">شكرًا لطلبك! 🎁</h2>
        <p style="color: #6b7280;">رقم الطلب: <b>${order._id}</b></p>
        <p style="color: #6b7280;">المجموع: <b>${order.total} ج.م</b></p>
        <p style="color: #6b7280;">سنقوم بمعالجة طلبك قريبًا.</p>
      </div>
    </div>
  `;
  await transporter.sendMail({ from: FROM_EMAIL, to, subject, html });
}

/**
 * Send email verification code
 */
async function sendVerificationEmail(to, code) {
  const subject = `${code} - كود تأكيد حسابك في ${BRAND_NAME}`;
  const html = `
    <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #eee;">
      <div style="background: linear-gradient(135deg, #a855f7, #ec4899); padding: 24px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 24px;">${BRAND_NAME}</h1>
      </div>
      <div style="padding: 32px 24px; text-align: center;">
        <h2 style="color: #1f2937; margin-top: 0;">تأكيد البريد الإلكتروني</h2>
        <p style="color: #6b7280; font-size: 16px;">أدخل الكود التالي لتأكيد حسابك:</p>
        <div style="background: linear-gradient(135deg, #f3e8ff, #fce7f3); border-radius: 12px; padding: 20px; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #7c3aed;">${code}</span>
        </div>
        <p style="color: #9ca3af; font-size: 14px;">الكود صالح لمدة 10 دقائق</p>
        <p style="color: #9ca3af; font-size: 13px;">إذا لم تقم بإنشاء حساب، تجاهل هذا البريد.</p>
      </div>
    </div>
  `;
  await transporter.sendMail({ from: FROM_EMAIL, to, subject, html });
}

/**
 * Send password reset code
 */
async function sendPasswordResetEmail(to, code) {
  const subject = `${code} - إعادة تعيين كلمة المرور في ${BRAND_NAME}`;
  const html = `
    <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #eee;">
      <div style="background: linear-gradient(135deg, #a855f7, #ec4899); padding: 24px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 24px;">${BRAND_NAME}</h1>
      </div>
      <div style="padding: 32px 24px; text-align: center;">
        <h2 style="color: #1f2937; margin-top: 0;">إعادة تعيين كلمة المرور</h2>
        <p style="color: #6b7280; font-size: 16px;">أدخل الكود التالي لإعادة تعيين كلمة المرور:</p>
        <div style="background: linear-gradient(135deg, #f3e8ff, #fce7f3); border-radius: 12px; padding: 20px; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #7c3aed;">${code}</span>
        </div>
        <p style="color: #9ca3af; font-size: 14px;">الكود صالح لمدة 10 دقائق</p>
        <p style="color: #9ca3af; font-size: 13px;">إذا لم تطلب إعادة تعيين كلمة المرور، تجاهل هذا البريد.</p>
      </div>
    </div>
  `;
  await transporter.sendMail({ from: FROM_EMAIL, to, subject, html });
}

/**
 * Generate a 6-digit verification code
 */
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = { 
  sendOrderConfirmationEmail, 
  sendVerificationEmail, 
  sendPasswordResetEmail, 
  generateVerificationCode 
};