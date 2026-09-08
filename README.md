# 🎁 For You - فور يو | Hadaya Gift Shop Platform

<div align="center">

![Next.js 15](https://img.shields.io/badge/Next.js-15.0-black?style=for-the-badge&logo=next.js)
![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=node.js)
![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-AI-4285F4?style=for-the-badge&logo=google)
![Security Score](https://img.shields.io/badge/Security-A%2B%20(96%25)-success?style=for-the-badge)
![Tests](https://img.shields.io/badge/Tests-204%2F204%20Passed-brightgreen?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

**منصة تجارة إلكترونية متكاملة وشاملة للهدايا وتخصيص البوكسات، مصممة بهندسة برمجية عالية الكفاءة (High Concurrency & Atomic Architecture) ومدعومة بالذكاء الاصطناعي التوليدي من Google Gemini، مع أعلى معايير الحماية والأمان السيبراني.**

[الموقع المباشر (Live Store)](https://www.foryo.me) • [توثيق الـ API](#-api-endpoints) • [إعدادات البيئة](#-إعداد-متغيرات-البيئة-environment-variables) • [اختبارات الأداء والتزامن](#-اختبارات-الجودة-والأداء-testing--benchmarks)

</div>

---

## 📑 جدول المحتويات (Table of Contents)

1. [نظرة عامة على المنصة](#-نظرة-عامة)
2. [الميزات والأنظمة الرئيسية](#-الميزات-والأنظمة-الرئيسية)
3. [نظام الذكاء الاصطناعي (Google Gemini AI Ecosystem)](#-نظام-الذكاء-الاصطناعي-google-gemini-ai)
4. [معمارية الأمان والتحصين السيبراني (Security Architecture)](#-معمارية-الأمان-والتحصين-السيبراني)
5. [الأداء والمعاملات الذرية (Concurrency & Performance)](#-الأداء-والمعاملات-الذرية)
6. [التقنيات المستخدمة (Tech Stack)](#-التقنيات-المستخدمة)
7. [هيكل المشروع (Directory Structure)](#-هيكل-المشروع)
8. [التشغيل السريع محلياً (Quick Start)](#-التشغيل-السريع-محليا)
9. [إعداد متغيرات البيئة (Environment Variables)](#-إعداد-متغيرات-البيئة-environment-variables)
10. [اختبارات الجودة والأداء (Testing & Benchmarks)](#-اختبارات-الجودة-والأداء-testing--benchmarks)
11. [دليل النشر للإنتاج (Production Deployment)](#-دليل-النشر-للإنتاج-production-deployment)

---

## 🌟 نظرة عامة

منصة **For You (فور يو)** هي حل تجاري متكامل مُصمم خصيصاً لسوق الهدايا وتجهيز المناسبات في مصر والشرق الأوسط. تجمع المنصة بين واجهة مستخدم حديثة وسلسة باللغة العربية (Full RTL) وتجربة شراء استثنائية تشمل تجهيز البوكسات المخصصة، محرك ترشيحات ذكي بالذكاء الاصطناعي، نظام ولاء ونقاط استبدال متكامل، وبنية تحتية خلفية مؤمنة بنسبة 96% ومختبرة تحت أقصى ضغط طلبات متزامن دون أي تضارب في المخزون (Zero Overselling).

---

## 🚀 الميزات والأنظمة الرئيسية

### 🛍️ تجربة المتجر والشراء (Storefront)
* **واجهة عربية أصيلة (Native RTL):** تصميم عصري متجاوب بالكامل مع كافة الشاشات (Desktop, Tablet, Mobile) بالاعتماد على Tailwind CSS و Next.js 15.
* **نظام بوكسات الهدايا الجاهزة والمخصصة (Custom Gift Box Builder):** إمكانية تجميع هدايا مخصصة واختيار التغليف والإكسسوارات مع تطبيق قيود الأعمال وخصومات البوكسات تلقائياً.
* **البحث الفوري والفلترة المتقدمة:** محرك بحث نصي يعتمد على الفهارس النصية الموزونة في MongoDB (`$text`) مع فلاتر ذكية للمناسبات، المستلمين، ونطاقات الأسعار.
* **تعدد خيارات الدفع والشحن:** دعم الدفع عند الاستلام (COD) والدفع الإلكتروني المباشر عبر InstaPay، مع تحديد أوقات وتواريخ التوصيل المجدولة وتخصيص كروت الإهداء المخفية السعر.
* **تتبع فوري ومحمي للطلبات (Public Order Tracking):** صفحة تتبع فورية للطلبات برقم الطلب مع حماية تامة للخصوصية وعدم كشف أي بيانات حساسة للعميل.

### 💎 نظام نقاط الولاء والمكافآت (Loyalty & Rewards Ledger)
* **اكتساب النقاط:** ربح نقاط تلقائية عند إتمام الطلبات أو عند كتابة تقييمات موثقة ومؤكدة الشراء (Verified Purchase Reviews).
* **خصم فوري عند الدفع:** إمكانية استبدال النقاط بخصم نقدي مباشر في خطوة الـ Checkout بمعاملات ذرية تمنع أي صرف مزدوج للنقاط (Double Spending).
* **سجل تدقيق النقاط (Audit Trail):** تتبع كامل لحركات النقاط (مكتسبة، مستردة، مستبدلة، ملغاة) مع استرجاع النقاط تلقائياً في حال إلغاء الطلب.

### 🛡️ لوحة تحكم الإدارة (Admin Dashboard)
* **إدارة المنتجات والأقسام:** إضافة وتعديل المنتجات مع أداة مسح الباركود (Barcode Scanner) ورفع الصور عبر Cloudinary.
* **إدارة الطلبات والحالات:** تغيير حالات الشحن والتوصيل مع إرسال إشعارات بريدية آلية للعملاء عبر Resend.
* **إحصائيات وتحليلات فورية:** رسوم بيانية ومؤشرات للأرباح والمبيعات وتقارير تدقيق شاملة لكافة العمليات الإدارية (`logAdminAction`).

---

## 🤖 نظام الذكاء الاصطناعي (Google Gemini AI)

تحتوي المنصة على منظومة ذكاء اصطناعي متكاملة مدعومة بأحدث نماذج **Google Gemini**:
1. **باحث الهدايا الذكي (AI Gift Finder):** مسار عام محمي (`/api/gift-finder/ai-recommend`) يحلل شخصية المستلم واهتماماته والمناسبة والميزانية ويرشح أفضل 5 بوكسات هدايا متطابقة فوراً من المخزون الحالي.
2. **المساعد البصري للكتالوج (AI Vision Assistant):** مسار إداري (`/api/ai-vision`) يحلل صور المنتجات بالذكاء الاصطناعي ويستخرج الأوصاف التسويقية والألوان والأقسام والمناسبات المناسبة تلقائياً.
3. **الوكيل الإداري الذكي (Autonomous Admin AI Agent):** وكيل ذكي للمسؤولين (`/api/ai-agent`) يساعد في الاستعلام عن التقارير وتحليل بيانات المتجر، مع **سياج حماية أمني صارم (Forbidden Fields Guard)** يمنع الوكيل منعاً باتاً من التعديل أو الوصول لحقول كلمات المرور والصلاحيات والبيانات الحساسة.
4. **مدير النماذج التكيفي (Smart Fallback Model Manager):** نظام إدارة ذكي في [backend/utils/geminiModelManager.js](file:///e:/Coding/Gift%20shop/backend/utils/geminiModelManager.js) يقوم بالتبديل التلقائي بين النماذج (`gemini-2.5-flash`, `gemini-2.5-pro`, `gemini-1.5-flash`) في أجزاء من الثانية عند الوصول لحدود الحصة (Rate Limits).

---

## 🔒 معمارية الأمان والتحصين السيبراني

حصلت المنصة على تقييم **A+ (96%)** في الفحص الأمني الشامل وفق معايير OWASP Top 10:

| نطاق الأمان | آلية التحصين المطبقة |
| :--- | :--- |
| **تشفير كلمات المرور** | تشفير بـ `bcrypt` بـ **12 Rounds** مع استبعاد كلمة المرور من أي استعلام (`select: false`). |
| **مكافحة Timing Attacks** | استخدام `DUMMY_BCRYPT_HASH` لمساواة زمن معالجة تسجيل الدخول سواء كان الإيميل موجوداً أم لا. |
| **رموز التحقق (OTP)** | تُولد عبر CSPRNG (`crypto.randomInt`) وتُخزن مشفرة بـ **SHA-256** وتُفحص بـ `crypto.timingSafeEqual`. |
| **إبطال الجلسات الفوري** | ترقية `tokenVersion` وإفراغ كاش الذاكرة `authzCache` عند تسجيل الخروج أو تغيير كلمة المرور. |
| **منع حقن NoSQL & Prototype** | ميدلوير `sanitizeInput` يسقط تلقائياً أي حقول تحتوي على `$` أو `.` أو `__proto__` حتى عمق 8 مستويات. |
| **مكافحة ثغرات XSS & ReDoS** | حظر التعبيرات المنتظمة غير المحدودة واستبدالها بالبحث النصي الموزون، مع تطهير نصوص HTML وإفلات React التلقائي. |
| **أمان صور المراجعات** | فحص صارم للنطاقات (Domain Whitelist) يسمح فقط بروابط Cloudinary ونطاق الموقع الرسمي. |
| **أمان رفع الملفات** | فحص البصمة الثنائية للصور (Magic Bytes Verification) لحظر الملفات التنفيذية وحيل SVG XSS، مع سياج ذاكرة 80MB. |
| **حماية الـ Webhooks** | تحقق تشفيري صارم عبر توقيع Svix (`wh.verify`) قبل معالجة أي إشعار بريد وارد من Resend. |
| **هيدرز الحماية المتقدمة** | تفعيل HSTS (سنتين مع Preload)، `X-Frame-Options: DENY`، `X-Content-Type-Options: nosniff`، و CSP محدد. |

---

## ⚡ الأداء والمعاملات الذرية

* **منع البيع الزائد (Zero Overselling Guarantee):** جميع عمليات خصم المخزون تتم عبر عمليات ذرية مشروطة:
  ```javascript
  Product.updateOne(
    { _id: productId, stock: { $gte: quantity } },
    { $inc: { stock: -quantity, salesCount: quantity } }
  )
  ```
* **إعادة المحاولة الذكية مع التشتيت العشوائي (Retry with Jitter):** نظام معالجة تضارب المعاملات (Write Conflicts) في MongoDB يكرر المحاولة حتى 10 مرات مدعوماً بـ **Exponential Backoff مع Random Jitter** لمنع اصطدام الطلبات المتزامنة.
* **كاش الذاكرة الداخلي (In-Memory LRU Cache):** كاش سريع للمسارات العامة يخفف الضغط عن قاعدة البيانات ويقدم استجابة في أقل من **1ms**.
* **سياج 503 الفوري (`mongoHealthFence`):** فحص حالة اتصال قاعدة البيانات والرد بالخطأ الفوري في أقل من 1ms عند أي انقطاع بدلاً من تعليق الطلبات حتى الـ Timeout.

---

## 🛠️ التقنيات المستخدمة

### Frontend
* **الإطار الأساسي:** [Next.js 15 (App Router)](https://nextjs.org/) & [React 18](https://react.dev/)
* **التصميم والتنسيق:** [Tailwind CSS](https://tailwindcss.com/) & Lucide / React Icons
* **إدارة الحالة:** [Zustand](https://github.com/pmndrs/zustand)
* **استدعاء البيانات:** [TanStack React Query](https://tanstack.com/query) & [Axios](https://axios-http.com/)
* **عناصر الحركة والتفاعل:** [Swiper.js](https://swiperjs.com/) & [React Hot Toast](https://react-hot-toast.com/)

### Backend
* **بيئة التشغيل:** [Node.js 20.x](https://nodejs.org/) & [Express.js](https://expressjs.com/)
* **قاعدة البيانات:** [MongoDB Atlas](https://www.mongodb.com/atlas) عبر [Mongoose 8](https://mongoosejs.com/)
* **الأمان والحماية:** `jsonwebtoken`, `bcryptjs`, `helmet`, `express-rate-limit`, `express-validator`, `svix`
* **إرسال البريد الإلكتروني:** [Resend HTTP API](https://resend.com/)
* **تخزين الصور:** [Cloudinary SDK](https://cloudinary.com/)
* **الذكاء الاصطناعي:** [@google/genai SDK](https://www.npmjs.com/package/@google/genai)

### DevOps & Testing
* **أدوات الاختبار:** [Jest](https://jestjs.io/), [Supertest](https://github.com/ladjs/supertest), [k6](https://k6.io/)
* **الحاويات والـ CI/CD:** Docker Multi-stage, Docker Compose, GitHub Actions, GHCR
* **الاستضافة:** Vercel (Frontend), Render (Backend), MongoDB Atlas (Database)

---

## 📂 هيكل المشروع

```
Gift-Shop/
├── .github/
│   ├── workflows/deploy.yml          # CI/CD Pipeline (Lint, 204 Tests, Docker Build & Push)
│   ├── ISSUE_TEMPLATE/               # قوالب البلاغات والميزات الجديدة
│   └── PULL_REQUEST_TEMPLATE.md      # معايير مراجعة الأكواد والـ PRs
├── backend/
│   ├── config/                       # إعدادات MongoDB و Cloudinary
│   ├── constants/                    # الثوابت ورسائل النظام الموحدة
│   ├── controllers/                  # المتحكمات ومنطق الأعمال
│   │   ├── admin/                    # متحكمات لوحة تحكم المسؤول
│   │   ├── authController.js         # المصادقة والأمان
│   │   ├── orderController.js        # الطلبات والمخزون الذري
│   │   └── productController.js      # المنتجات والبوكسات
│   ├── middleware/                   # التحقق، الكاش، جدران الحماية، والـ Rate Limiting
│   ├── models/                       # نماذج قاعدة البيانات (Mongoose Schemas)
│   ├── routes/                       # مسارات الـ API
│   ├── services/                     # الخدمات الخلفية (تنظيف الحسابات المهملة)
│   ├── tests/                        # 42 جناح اختبار مع اختبارات الوحدة والتكامل
│   ├── utils/                        # الأدوات المساعدة، الذكاء الاصطناعي، والبريد
│   ├── Dockerfile                    # إعداد صورة الباك إند
│   └── server.js                     # نقطة انطلاق السيرفر وإدارة الإشارات
├── frontend/
│   ├── src/
│   │   ├── app/                      # مسارات Next.js 15 App Router
│   │   ├── components/               # مكونات الواجهة وقوائم العرض
│   │   ├── constants/                # نصوص وعبارات المتجر
│   │   ├── services/                 # طبقة الاتصال بالـ Backend API
│   │   └── store/                    # مخازن الحالة العامة عبر Zustand
│   ├── Dockerfile                    # إعداد صورة الفرونت إند
│   └── next.config.mjs               # إعدادات الحماية والهيدرز والـ CSP
├── tests/
│   └── perf/                         # اختبارات الأداء والتزامن عبر k6
│       ├── benchmark-test.js         # محاكاة القراءة الكثيفة (Baseline)
│       ├── concurrency-order-test.js # محاكاة السباق على المخزون (Race Condition)
│       └── run-concurrency-simulation.js # المشغل الآلي للمحاكاة والتنظيف
├── docker-compose.yml                # تشغيل المنصة بالكامل محلياً بالحاويات
└── package.json                      # الأوامر الرئيسية وإدارة الحزم
```

---

## ⚡ التشغيل السريع محلياً

### المتطلبات الأساسية
* [Node.js](https://nodejs.org/) الإصدار 18 أو 20+
* قاعدة بيانات [MongoDB](https://www.mongodb.com/) (محلية أو عبر MongoDB Atlas)
* أداة [k6](https://k6.io/) (اختياري لاختبارات الأداء)

### 1. تثبيت كافة الحزم
```bash
npm run install:all
```

### 2. تجهيز ملفات البيئة
* أنشئ ملف `backend/.env` بناءً على `backend/.env.example`
* أنشئ ملف `frontend/.env.local` بناءً على `frontend/.env.example`

### 3. تشغيل المشروع كاملاً (Frontend + Backend)
```bash
npm run dev
```

* **المتجر (Frontend):** [http://localhost:3000](http://localhost:3000)
* **واجهة البرمجة (Backend API):** [http://localhost:5000](http://localhost:5000)
* **الفحص الصحي (Health Check):** [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🔑 إعداد متغيرات البيئة (Environment Variables)

### Backend (`backend/.env`)

| المتغير | مطلوب؟ | الوصف | القيمة الافتراضية / مثال |
| :--- | :---: | :--- | :--- |
| `PORT` | ❌ | منفذ تشغيل خادم Express | `5000` |
| `NODE_ENV` | ✅ | بيئة التشغيل (**ضروري جداً تعيينه production على Render**) | `development` / `production` |
| `MONGODB_URI` | ✅ | رابط الاتصال بقاعدة بيانات MongoDB Atlas | `mongodb+srv://user:pass@cluster...` |
| `JWT_SECRET` | ✅ | مفتاح تشفير توكنات المصادقة (32 حرفاً على الأقل) | `a-very-long-secure-random-secret-key-123` |
| `JWT_EXPIRES_IN` | ❌ | مدة صلاحية توكن تسجيل الدخول | `7d` |
| `CORS_ORIGINS` | ❌ | النطاقات المصرح لها بالاتصال بالسيرفر | `https://www.foryo.me,https://foryo.me` |
| `SHIPPING_COST` | ❌ | تكلفة الشحن الافتراضية بالجنيه المصري | `95` |
| `SMTP_PASS` | ✅ | مفتاح الـ API الخاص بخدمة Resend لإرسال الإيميلات | `re_xxxxxxxxxxxxxx` |
| `SMTP_FROM` | ❌ | عنوان واسم مرسل الإيميلات | `For You <no-reply@foryo.me>` |
| `GEMINI_API_KEY` | ❌ | مفتاح Google Gemini AI لميزات الذكاء الاصطناعي | `AIzaSy...` |
| `CLOUDINARY_CLOUD_NAME` | ❌ | اسم السحابة على Cloudinary لرفع الصور | `your-cloud-name` |
| `CLOUDINARY_API_KEY` | ❌ | مفتاح الـ API لـ Cloudinary | `your-api-key` |
| `CLOUDINARY_API_SECRET` | ❌ | السر الخاص بـ Cloudinary | `your-api-secret` |
| `RESEND_WEBHOOK_SECRET` | ❌ | السر التشفيري للتحقق من إشعارات Resend Svix | `whsec_xxxxxxxx` |

### Frontend (`frontend/.env.local`)

| المتغير | مطلوب؟ | الوصف |
| :--- | :---: | :--- |
| `NEXT_PUBLIC_API_URL` | ✅ | الرابط الأساسي لـ Backend API (مثال: `https://api.foryo.me/api` أو `http://localhost:5000/api`) |

---

## 🧪 اختبارات الجودة والأداء (Testing & Benchmarks)

### 1. الفحص الشامل للـ Syntax والـ Linting
```bash
npm run check
```
يفحص 109 ملفات في الباك إند ويشغل ESLint في الفرونت إند للتأكد من خلو المشروع تماماً من أي خطأ برمجي.

### 2. تشغيل أجنحة اختبارات الوحدة والتكامل (Jest Test Suite)
```bash
npm test --prefix backend
```
يشغل **42 جناح اختبار بإجمالي 204 اختبارات** تغطي كافة مسارات المصادقة، المعاملات، الحماية، الصلاحيات، وحالات الحافة (Edge Cases).

### 3. اختبار الأداء وسرعة الاستجابة الأساسي (k6 Baseline Benchmark)
```bash
npm run test:perf:baseline
```
يقيس قدرة الخادم على استقبال الطلبات المتتابعة لصفحات المنتجات والفحص الصحي تحت ضغط تدريجي حتى 25 مستخدماً متزامناً.

### 4. محاكاة التزامن ومنع البيع الزائد (Concurrency & Race Conditions)
```bash
npm run test:perf:concurrency
```
يقوم آلياً بإنشاء مستخدم ومنتج اختبار معزولين بمخزون 5 قطع فقط، ثم يطلق 20 مستخدماً وهمياً في نفس اللحظة عبر k6، ويتحقق من نجاح 5 طلبات فقط بالضبط ورفض 15 طلباً بنفاد المخزون، وتصفير المخزون في قاعدة البيانات دون أي سالب، ثم ينظف كافة البيانات التجريبية تلقائياً.

---

## 🚢 دليل النشر للإنتاج (Production Deployment)

### 1. الواجهة الخلفية (Backend on Render)
1. قم بربط مستودع الـ GitHub بـ **Render** كـ **Web Service**.
2. **Build Command:** `npm install` (داخل مجلد `backend`).
3. **Start Command:** `node server.js` (داخل مجلد `backend`).
4. **Environment Variables:** أضف كافة المتغيرات المذكورة في الجدول أعلاه، وتأكد بشكل حاسم من تعيين:
   * `NODE_ENV` = `production` (حتى يقرأ السيرفر عنوان الـ IP الحقيقي للمستخدمين خلف الـ Proxy ويعمل الـ Rate Limiter بشكل صحيح).

### 2. الواجهة الأمامية (Frontend on Vercel)
1. قم بربط المستودع بـ **Vercel**.
2. حدد مجلد المشروع الأساسي (Root Directory) ليكون: `frontend`.
3. في إعدادات البيئة أضف:
   * `NEXT_PUBLIC_API_URL` = رابط الـ Backend على Render متبوعاً بـ `/api`.

### 3. التشغيل بالحاويات (Docker & Docker Compose)
لتشغيل المشروع كاملاً مع قاعدة بيانات MongoDB محلية في ثوانٍ:
```bash
docker-compose up -d --build
```

---

<div align="center">

صنع بحب وإتقان بواسطة فريق **For You (فور يو)** © 2026

</div>
