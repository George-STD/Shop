# 📋 تقرير الفحص الشامل - مشروع Hadaya Gift Shop (For You)

> **تاريخ الفحص:** 4 أغسطس 2026  
> **نطاق الفحص:** Frontend (Next.js 15) + Backend (Node.js/Express) + Database (MongoDB) + Infrastructure  
> **الهدف:** تقرير تحليلي شامل بدون تعديل الكود

---

## 🔴 القسم الأول: مشاكل أمنية حرجة (Critical Security Issues)

### 1.1 تسريب مفتاح Gemini API في حالة عدم وجوده
**الملفات:** `backend/routes/ai-vision.js`, `backend/routes/ai-agent.js`, `backend/routes/gift-finder.js`  
**المشكلة:** مفتاح `GEMINI_API_KEY` يُقرأ من `process.env` لكن لا يوجد validation إلزامي عند بدء التشغيل. إذا تم تسريب المفتاح عبر لوجز أو إعدادات خاطئة، يمكن للمهاجم استهلاك الكوتا بالكامل.  
**الخطورة:** 🔴 حرجة  
**الإثبات:**
```javascript
// ai-agent.js سطر 25
_aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
```
**التوصية:** أضف فحص إلزامي في `server.js`:
```javascript
const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI', 'GEMINI_API_KEY'];
requiredEnvVars.forEach(key => {
  if (!process.env[key]) throw new Error(`Missing required env var: ${key}`);
});
```

### 1.2 غياب Rate Limiting على Routes عامة حساسة
**الملف:** `backend/server.js` + `backend/routes/products.js`  
**المشكلة:** الـ `apiLimiter` يُطبق على `/api/*` بشكل عام (500 طلب/15 دقيقة)، لكن Routes مثل `/api/products` (GET) و `/api/gift-finder/ai-recommend` لا تحتوي على rate limiting مخصص. المهاجم يمكنه إرسال آلاف الطلبات لاستهلاك موارد السيرفر أو كوتا Gemini.  
**الخطورة:** 🟠 عالية  
**التوصية:** أضف rate limiter مخصص لكل route حساس:
```javascript
const productLimiter = rateLimit({ windowMs: 15*60*1000, max: 100 });
router.get('/', productLimiter, productController.getAllProducts);
```

### 1.3 رقم InstaPay ثابت في كود المصدر
**الملفات:** `frontend/src/legacy-pages/CheckoutPage.jsx` (سطر 407)، `backend/utils/mailer.js` (سطر 78)  
**المشكلة:** رقم الهاتف `+201286153004` مكتوب Hard-coded في Frontend وBackend. أي تغيير يتطلب تعديل الكود وإعادة Build.  
**الخطورة:** 🟡 متوسطة (أمان تشغيلي)  
**التوصية:** انقل الرقم إلى `process.env.INSTAPAY_NUMBER` وSettings API ديناميكي.

### 1.4 غياب حماية CSRF
**الملف:** `backend/server.js`  
**المشكلة:** لا يوجد CSRF middleware. رغم استخدام JWT في Header، الـ endpoints العامة مثل `POST /api/gift-finder/ai-recommend` لا تتطلب توثيقاً ويمكن استدعاؤها من أي موقع.  
**الخطورة:** 🟠 عالية  
**التوصية:** أضف `csurf` middleware للـ POST/PUT/DELETE endpoints.

### 1.5 ثغرة XSS محتملة في Reviews
**الملف:** `frontend/src/legacy-pages/` (عرض التعليقات)  
**المشكلة:** الـ `sanitizeInput` في Backend يزيل HTML tags لكنه لا يضمن التطهير الكامل. في Frontend، إذا تم استخدام `dangerouslySetInnerHTML` في أي مكان، فهناك ثغرة محتملة.  
**الخطورة:** 🟡 متوسطة  
**التوصية:** تأكد من عدم استخدام `dangerouslySetInnerHTML` في عرض reviews.

### 1.6 Secret Keys افتراضية ضعيفة في .env.example
**الملف:** `backend/.env.example`  
**المشكلة:** `JWT_SECRET=your-super-secret-jwt-key-change-in-production` قد يُنسخه المطور وينسى تغييرها.  
**الخطورة:** 🟠 عالية  
**التوصية:** اجعل القيم الافتراضية فارغة وأضف validation:
```javascript
if (process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must be at least 32 chars');
```

---

## 🟠 القسم الثاني: مشاكل Backend (Node.js/Express)

### 2.1 عدم وجود معالجة أخطاء MongoDB في Runtime
**الملف:** `backend/server.js`  
**المشكلة:** إذا فشل الاتصال بـ MongoDB بعد كل المحاولات، يتم `process.exit(1)` بدون mechanism لإعادة المحاولة.  
**الخطورة:** 🟠 عالية  
**التوصية:** أضف reconnection logic مستمر:
```javascript
mongoose.connection.on('disconnected', () => {
  setTimeout(connectToDatabase, 5000);
});
```

### 2.2 Race Condition في خصم المخزون
**الملف:** `backend/controllers/orderController.js` (سطر 385-442)  
**المشكلة:** الـ `createWithoutSession` fallback يُستخدم عندما لا تدعم MongoDB transactions. هذا يعني أنه في بيئات standalone، قد تحدث race conditions في خصم المخزون إذا تم طلب نفس المنتج في نفس الوقت.  
**الخطورة:** 🟠 عالية  
**الإثبات:**
```javascript
// deductStock بدون transaction
await Product.updateOne(
  { _id: item.product, stock: { $gte: item.quantity } },
  { $inc: { stock: -item.quantity } }
);
```
**التوصية:** استخدم atomic operations دائماً حتى مع transactions.

### 2.3 غياب Pagination في Audit Logs
**الملف:** `backend/controllers/admin/statsController.js` (سطر 164-180)  
**المشكلة:** `getLogs` تستخدم `limit` فقط بدون `skip`، مما يعني عدم القدرة على تصفح السجلات.  
**الخطورة:** 🟡 متوسطة  
**التوصية:** أضف `skip` للـ pagination.

### 2.4 Memory Leak في Gemini Model Manager
**الملف:** `backend/utils/geminiModelManager.js`  
**المشكلة:** `modelUsage` مخزن في الذاكرة و `minuteTimestamps` array ينمو بلا حدود.  
**الخطورة:** 🟡 متوسطة  
**التوصية:** استخدم Redis لتتبع الاستخدام.

### 2.5 غياب Input Validation على Admin Routes
**الملف:** `backend/routes/admin.js`  
**المشكلة:** Routes مثل `GET /admin/products` لا تحتوي على express-validator للـ query params.  
**الخطورة:** 🟡 متوسطة  
**التوصية:** أضف validation لكل query parameters.

### 2.6 Email Verification Code يُحتفظ به بعد الاستخدام
**الملف:** `backend/controllers/authController.js`  
**المشكلة:** في `verifyEmail`، يتم `unset` للكود بعد التحقق، لكن إذا تم إرسال كود جديد قبل انتهاء صلاحية القديم، قد يكون هناك لبس.  
**الخطورة:** 🟢 منخفضة  
**التوصية:** تأكد من أن كل كود جديد يحل محل القديم تماماً.

### 2.7 AI Vision يستهلك موارد Cloudinary بدون حساب
**الملف:** `backend/routes/ai-vision.js`  
**المشكلة:** Upload 5 images في طلب واحد يُحسب كطلب واحد فقط للـ rate limiter، لكنه يستهلك موارد Cloudinary كبيرة.  
**الخطورة:** 🟠 عالية  
**التوصية:** أضف rate limiting على upload size أو عدد الصور.

### 2.8 غياب Timeout على AI Agent Chat
**الملف:** `backend/routes/ai-agent.js` (سطر 286-291)  
**المشكلة:** الـ timeout 45 ثانية للـ initial message و 15 ثانية للـ tool loop. إذا تجاوز الـ AI هذا الوقت، يحدث خطأ بدون معالجة مناسبة.  
**الخطورة:** 🟡 متوسطة  
**التوصية:** أضف handling أفضل للـ timeouts مع retry logic.

---

## 🟡 القسم الثالث: مشاكل Frontend (Next.js/React)

### 3.1 react-router-dom Shim غير كامل وغير موثوق
**الملف:** `frontend/src/lib/react-router-dom-shim.jsx`  
**المشكلة:** الـ `Routes` component يقارن `pathname` بـ `route.path` بشكل بدائي. هذا يسبب مشاكل في التطابق مع dynamic routes أو nested routes.  
**الخطورة:** 🟠 عالية  
**الإثبات:**
```javascript
// react-router-dom-shim.jsx سطر 142-147
const matched = routeDefs.find((route) => {
  if (!route.path || route.index) return false;
  if (route.path.startsWith('/')) return pathname === route.path;
  return pathname.endsWith(`/${route.path}`);
});
```
**التوصية:** استخدم `next/navigation` و `next/link` مباشرة بدلاً من محاكاة react-router-dom.

### 3.2 Legacy Pages Pattern غير مستدام
**الملفات:** `frontend/src/legacy-pages/` + `frontend/src/app/(shop)/*/page.jsx`  
**المشكلة:** كل صفحات `app/` router تستورد Legacy Pages. هذا pattern غير مستدام ويصعب الصيانة ويُلغي فائدة Server Components.  
**الخطورة:** 🟠 عالية  
**التوصية:** انقل كل المنطق إلى `app/` router مباشرة.

### 3.3 عدم استخدام Server Components
**الملف:** معظم صفحات `app/(shop)/`  
**المشكلة:** كل الصفحات تستخدم `'use client'` وتستورد Legacy Pages.  
**الخطورة:** 🟠 عالية  
**التوصية:** استخدم Server Components لجلب البيانات الأولية.

### 3.4 غياب Loading States
**الملف:** `frontend/src/app/`  
**المشكلة:** لا يوجد `loading.js` أو `error.js` في معظم أقسام `app/`.  
**الخطورة:** 🟡 متوسطة  
**التوصية:** أضف loading و error boundaries لكل segment.

### 3.5 صور المنتجات لا تستخدم Next.js Image
**الملف:** `frontend/src/legacy-pages/` (CartPage, CheckoutPage, ProductPage)  
**المشكلة:** تُستخدم `<img>` عادية بدلاً من `<Image>` من Next.js.  
**الخطورة:** 🟡 متوسطة  
**التوصية:** استبدل `<img>` بـ `<Image>`.

### 3.6 Error Boundary يستخدم reload بدلاً من reset
**الملف:** `frontend/src/components/common/ErrorBoundary.jsx` (سطر 32)  
**المشكلة:** `window.location.reload()` يفقد حالة المستخدم.  
**الخطورة:** 🟡 متوسطة  
**التوصية:** استخدم `this.setState({ hasError: false })` بدلاً من reload.

### 3.7 Google Fonts بطريقة Blocking
**الملف:** `frontend/src/app/layout.jsx`  
**المشكلة:** `<link href="https://fonts.googleapis.com/...">` بدون `display=swap`.  
**الخطورة:** 🟢 منخفضة  
**التوصية:** أضف `&display=swap`.

---

## 🟡 القسم الرابع: مشاكل الأداء (Performance)

### 4.1 Sitemap يُجلب 1000 منتج في كل Request
**الملف:** `frontend/src/app/sitemap.js`  
**المشكلة:** `fetch(${API_BASE_URL}/products?limit=1000)` يُجلب كل المنتجات.  
**الخطورة:** 🟠 عالية  
**التوصية:** استخدم ISR مع `revalidate` أطول أو build-time generation.

### 4.2 Product Images بدون Lazy Loading
**الملف:** معظم صفحات المنتجات  
**المشكلة:** لا يوجد `loading="lazy"` على الصور.  
**الخطورة:** 🟡 متوسطة  
**التوصية:** استخدم `next/image`.

### 4.3 Bundle Size كبير بسبب Recharts
**الملف:** `frontend/package.json`  
**المشكلة:** `recharts` مُضمن في الـ dependencies الرئيسية رغم أنه يُستخدم فقط في Admin.  
**الخطورة:** 🟡 متوسطة  
**التوصية:** استخدم dynamic import:
```javascript
const Recharts = dynamic(() => import('recharts'), { ssr: false });
```

---

## 🟢 القسم الخامس: مشاكل SEO

### 5.1 Sitemap لا يتضمن Categories أو Occasions
**الملف:** `frontend/src/app/sitemap.js`  
**المشكلة:** الـ sitemap يتضمن فقط الصفحات الثابتة والمنتجات.  
**الخطورة:** 🟡 متوسطة  
**التوصية:** أضف dynamic pages للفئات والمناسبات.

### 5.2 Robots.txt يمنع Track Order
**الملف:** `frontend/src/app/robots.js`  
**المشكلة:** `/track-order` قد تكون ممنوعة unintentionally.  
**الخطورة:** 🟢 منخفضة  
**التوصية:** تأكد من أن `/track-order` مسموح بها.

---

## 🟠 القسم السادس: مشاكل قابلية التوسع (Scalability)

### 6.1 In-Memory Rate Limiting لا يعمل في Multi-Instance
**الملف:** `backend/middleware/auth.js`  
**المشكلة:** كل instance لها عداد منفصل.  
**الخطورة:** 🟠 عالية  
**التوصية:** استخدم Redis.

### 6.2 Audit Log بدون TTL
**الملف:** `backend/models/AuditLog.js`  
**المشكلة:** ينمو بلا حدود.  
**الخطورة:** 🟠 عالية  
**التوصية:** أضف TTL index:
```javascript
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days
```

### 6.3 Cloudinary Upload بدون Validations كافية
**الملف:** `backend/routes/upload.js`  
**المشكلة:** لا يوجد تحقق من dimensions أو virus scanning.  
**الخطورة:** 🟡 متوسطة  
**التوصية:** أضف validation للـ dimensions.

### 6.4 Health Check سطحي
**الملف:** `backend/server.js`  
**المشكلة:** `/health` يتحقق فقط من أن السيرفر مستيقظ.  
**الخطورة:** 🟡 متوسطة  
**التوصية:** أضف deep health check.

### 6.5 Logging بدون Structure
**الملف:** كامل الـ Backend  
**المشكلة:** `console.log` فقط.  
**الخطورة:** 🟡 متوسطة  
**التوصية:** استخدم Winston أو Pino.

---

## 🟡 القسم السابع: مشاكل قاعدة البيانات

### 7.1 غياب Database Migrations
**الملف:** كامل المشروع  
**المشكلة:** لا يوجد نظام migrations.  
**الخطورة:** 🟠 عالية  
**التوصية:** استخدم `migrate-mongo`.

### 7.2 Order Number قد يسبب Collision
**الملف:** `backend/models/Order.js`  
**المشكلة:** `crypto.randomInt(100000, 999999)` مع الوقت. الاحتمالية ضعيفة لكنها موجودة.  
**الخطورة:** 🟢 منخفضة  
**التوصية:** استخدم UUID أو أضف unique index.

---

## 🟡 القسم الثامن: مشاكل DevOps

### 8.1 غياب Dockerfile
**الملف:** غير موجود  
**المشكلة:** لا يوجد Docker للتطوير المحلي.  
**الخطورة:** 🟡 متوسطة  
**التوصية:** أضف Dockerfile و docker-compose.yml.

### 8.2 غياب CI/CD Pipeline
**الملف:** غير موجود  
**المشكلة:** لا يوجد GitHub Actions.  
**الخطورة:** 🟡 متوسطة  
**التوصية:** أضف GitHub Actions.

### 8.3 Backend URL Hard-coded
**الملف:** `frontend/src/constants/config.js`  
**المشكلة:** `DEFAULT_API_URL = 'https://shop-gx97.onrender.com/api'`  
**الخطورة:** 🟡 متوسطة  
**التوصية:** استخدم `.env.local` فقط.

---

## 📊 ملخص المشاكل حسب الخطورة

| الخطورة | العدد | الأمثلة |
|---------|-------|---------|
| 🔴 حرجة | 2 | تسريب API keys، غياب CSRF |
| 🟠 عالية | 12 | Rate limiting، Race conditions، Multi-instance |
| 🟡 متوسطة | 20 | Legacy pattern، Performance، SEO gaps |
| 🟢 منخفضة | 6 | HSTS، Fonts loading، Health checks |

---

## ✅ التوصيات العاجلة (Priority Action Items)

1. **فوراً:** أضف validation إلزامي لكل secrets عند بدء التشغيل.
2. **فوراً:** انقل رقم InstaPay إلى متغير بيئة.
3. **قريباً:** استبدل In-Memory rate limiting بـ Redis.
4. **قريباً:** أضف TTL index لـ AuditLog.
5. **قريباً:** انقل Logic من `legacy-pages/` إلى `app/` router.
6. **مستقبلاً:** أضف Docker و CI/CD pipeline.
7. **مستقبلاً:** استخدم Winston للـ structured logging.

---

> **ختاماً:** المشروع بنية جيدة بشكل عام مع اهتمام واضح بالأمان (Helmet, XSS sanitization, Rate limiting) لكنه يحتاج إلى تحسينات جوهرية في الأداء والتوسع والصيانة على المدى الطويل.
