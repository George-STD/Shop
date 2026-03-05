/**
 * Mailer utility using Resend HTTP API
 * (SMTP ports are blocked on Render, so we use HTTPS instead)
 */

const RESEND_API_KEY = process.env.SMTP_PASS; // Resend API key
const FROM_EMAIL = process.env.SMTP_FROM || 'For You <no-reply@foryo.me>';
const BRAND_NAME = 'For You - فور يو';

/**
 * Send email via Resend HTTP API
 */
async function sendEmail({ to, subject, html }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html })
  });

  const data = await res.json();

  if (!res.ok) {
    console.error('Resend API error:', data);
    throw new Error(data.message || `Resend API error: ${res.status}`);
  }

  return data;
}

// Verify API key on startup
(async () => {
  if (!RESEND_API_KEY) {
    console.error('❌ SMTP_PASS (Resend API key) is not set');
    return;
  }
  try {
    const res = await fetch('https://api.resend.com/domains', {
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}` }
    });
    if (res.ok) {
      console.log('✅ Resend API key verified successfully');
    } else {
      console.error('❌ Resend API key invalid:', (await res.json()).message);
    }
  } catch (err) {
    console.error('❌ Resend API check failed:', err.message);
  }
})();

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
  await sendEmail({ to, subject, html });
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
  await sendEmail({ to, subject, html });
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
  await sendEmail({ to, subject, html });
}

/**
 * Generate a 6-digit verification code
 */
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send order shipped / tracking number email
 */
async function sendTrackingEmail(to, order, trackingNumber) {
  const subject = `طلبك في الطريق إليك! - ${BRAND_NAME}`;
  const html = `
    <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #eee;">
      <div style="background: linear-gradient(135deg, #a855f7, #ec4899); padding: 24px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 24px;">${BRAND_NAME}</h1>
      </div>
      <div style="padding: 32px 24px;">
        <h2 style="color: #1f2937; margin-top: 0;">طلبك تم شحنه! 🚚</h2>
        <p style="color: #6b7280;">رقم الطلب: <b>${order.orderNumber || order._id}</b></p>
        <div style="background: linear-gradient(135deg, #f3e8ff, #fce7f3); border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
          <p style="color: #6b7280; margin: 0 0 8px 0;">رمز التتبع الخاص بك:</p>
          <span style="font-size: 24px; font-weight: bold; color: #7c3aed;">${trackingNumber}</span>
        </div>
        <p style="color: #6b7280;">يمكنك استخدام رمز التتبع لمتابعة حالة شحنتك من خلال صفحة <a href="https://foryo.me/track-order" style="color: #7c3aed;">تتبع الطلب</a>.</p>
        <p style="color: #6b7280;">سنقوم بتوصيل طلبك في أقرب وقت ممكن.</p>
      </div>
    </div>
  `;
  await sendEmail({ to, subject, html });
}

module.exports = { 
  sendOrderConfirmationEmail, 
  sendTrackingEmail,
  sendVerificationEmail, 
  sendPasswordResetEmail, 
  generateVerificationCode 
};