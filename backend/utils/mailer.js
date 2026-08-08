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
  if (process.env.NODE_ENV === 'test') {
    return { id: 'test_id', message: 'Email skipped in test environment' };
  }

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
  if (process.env.NODE_ENV === 'test') return;
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
  const isInstaPay = order.paymentMethod === 'instapay';
  const html = `
    <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #eee;">
      <div style="background: linear-gradient(135deg, #a855f7, #ec4899); padding: 24px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 24px;">${BRAND_NAME}</h1>
      </div>
      <div style="padding: 32px 24px;">
        <h2 style="color: #1f2937; margin-top: 0;">شكرًا لطلبك! 🎁</h2>
        <p style="color: #6b7280; font-size: 15px;">رقم الطلب: <b style="color: #1f2937;">${order.orderNumber || order._id}</b></p>
        <p style="color: #6b7280; font-size: 15px;">المجموع الإجمالي: <b style="color: #a855f7;">${order.total} ج.م</b></p>
        <p style="color: #6b7280; font-size: 15px;">طريقة الدفع: <b>${isInstaPay ? 'إنستاباي (InstaPay)' : 'الدفع عند الاستلام (كاش)'}</b></p>
        
        ${isInstaPay ? `
          <div style="margin: 20px 0; padding: 20px; background-color: #fdf4ff; border: 2px dashed #c084fc; border-radius: 12px; text-align: center;">
            <p style="margin: 0 0 6px 0; color: #7e22ce; font-weight: bold; font-size: 16px;">📱 تفاصيل الدفع عبر إنستاباي (InstaPay)</p>
            <p style="margin: 8px 0; color: #581c87; font-size: 22px; font-weight: 800; letter-spacing: 1px; direction: ltr;">${process.env.INSTAPAY_NUMBER || '+201286153004'}</p>
            <p style="margin: 6px 0 0 0; color: #6b21a8; font-size: 13px; line-height: 1.5;">يرجى تحويل المبلغ الإجمالي (<b>${order.total} ج.م</b>) إلى هذا الرقم عبر تطبيق InstaPay لإتمام ومعالجة الطلب.</p>
          </div>
        ` : ''}

        <p style="color: #6b7280; margin-top: 24px;">سنقوم بمعالجة طلبك قريبًا.</p>
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
 * Generate a 6-digit verification code (cryptographically secure)
 */
function generateVerificationCode() {
  const crypto = require('crypto');
  return crypto.randomInt(100000, 999999).toString();
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

/**
 * Send order delivered review request email
 */
async function sendDeliveredReviewEmail(to, order) {
  const customerName = order.shippingAddress?.firstName || order.user?.firstName || 'عميلنا العزيز';
  const orderNum = order.orderNumber || order._id;
  const reviewUrl = `https://www.foryo.me/review-order/${orderNum}`;
  const subject = `أهلاً ${customerName}، شاركنا رأيك في تجربتك وبوكس الهدايا 🎁 - ${BRAND_NAME}`;

  const html = `
    <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #f3e8ff; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
      <div style="background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); padding: 28px 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">For You - فور يو</h1>
      </div>
      <div style="padding: 36px 28px; background-color: #ffffff;">
        <h2 style="color: #1f2937; margin-top: 0; font-size: 22px; font-weight: 700;">أهلاً ${customerName}، شكراً لثقتك وتعاملك معنا! 🎁</h2>
        <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin-bottom: 24px;">
          سعداء جداً بخدمتك نتمنى أن يكون بوكس الهدايا والمنتجات قد نالت إعجابك وإعجاب من تحب!
        </p>

        <div style="background: #faf5ff; border: 1px solid #f3e8ff; border-radius: 14px; padding: 18px 20px; margin: 24px 0; text-align: center;">
          <span style="color: #7c3aed; font-size: 16px; font-weight: 700;">رقم الطلب: <span style="font-family: monospace; font-size: 17px;">${orderNum}</span></span>
        </div>

        <p style="color: #374151; font-size: 15px; font-weight: 600; text-align: center; margin-top: 28px; margin-bottom: 20px;">
          رأيك يهمنا جداً! يرجى التكرم بإضافة تقييمك لمنتجات البوكس الذي قمت بتشكيله:
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${reviewUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 700; padding: 16px 36px; border-radius: 50px; box-shadow: 0 8px 20px -4px rgba(168, 85, 247, 0.45); transition: all 0.2s ease;">
            ⭐ تقييم المنتجات والتجربة (5 نجوم)
          </a>
        </div>

        <div style="background-color: #f9fafb; border-right: 4px solid #a855f7; border-radius: 8px 12px 12px 8px; padding: 16px 20px; margin-top: 32px;">
          <p style="margin: 0; color: #4b5563; font-size: 13px; line-height: 1.6;">
            💡 <b>ملاحظة:</b> عبر هذا الرابط، يمكنك وضع تقييمك وتعليقك مرة واحدة ليعبق تلقائياً على كل المنتجات الموجودة بداخل البوكس.
          </p>
        </div>

        <div style="margin-top: 36px; padding-top: 20px; border-top: 1px solid #f3f4f6; text-align: center; color: #9ca3af; font-size: 13px;">
          مع تحيات فريق متجر <span style="color: #ec4899; font-weight: 700;">For You ❤️</span>
        </div>
      </div>
    </div>
  `;

  await sendEmail({ to, subject, html });
}

module.exports = { 
  sendOrderConfirmationEmail, 
  sendTrackingEmail,
  sendDeliveredReviewEmail,
  sendVerificationEmail, 
  sendPasswordResetEmail, 
  generateVerificationCode 
};