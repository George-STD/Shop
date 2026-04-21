# هدايا - Hadaya Gift Shop

متجر هدايا إلكتروني متكامل مبني بـ Next.js و Node.js و MongoDB

## المميزات

- واجهة مستخدم عربية بالكامل (RTL)
- تصميم متجاوب لجميع الأجهزة
- نظام تسجيل دخول وإنشاء حساب (JWT)
- سلة تسوق متقدمة
- نظام المفضلة (Wishlist)
- باحث الهدايا الذكي
- تتبع الطلبات
- تصفية وترتيب المنتجات حسب الفئة، السعر، والمناسبة
- نظام مراجعات المنتجات
- لوحة تحكم للمسؤول (Admin)
- دعم Webhooks

## التقنيات المستخدمة

### Frontend
- Next.js 15
- React 18
- Tailwind CSS
- Zustand (State Management)
- TanStack React Query
- Axios
- Swiper
- React Hot Toast

### Backend
- Node.js + Express.js
- MongoDB + Mongoose
- JWT Authentication
- bcryptjs + Helmet
- express-rate-limit + express-validator
- Morgan + CORS
- Svix (Webhooks)

## التشغيل السريع

### المتطلبات
- Node.js 18+
- MongoDB (محلي أو Atlas)

### 1. تثبيت جميع الاعتماديات

```bash
npm run install:all
```

### 2. إعداد ملف البيئة للـ Backend

أنشئ ملف `.env` داخل مجلد `backend/`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hadaya
JWT_SECRET=your-secret-key
```

### 3. تشغيل المشروع كاملاً

```bash
npm run dev
```

أو تشغيل كل جزء منفرداً:

```bash
# Backend فقط
npm run backend

# Frontend فقط
npm run frontend
```

### 4. فتح الموقع

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/api/health

## هيكل المشروع

```
├── backend/
│   ├── middleware/       # Auth & rate limiting
│   ├── models/           # Mongoose models
│   │   ├── Category.js
│   │   ├── Occasion.js
│   │   ├── Order.js
│   │   ├── Product.js
│   │   ├── Review.js
│   │   └── User.js
│   ├── routes/           # API routes
│   │   ├── admin.js
│   │   ├── auth.js
│   │   ├── categories.js
│   │   ├── occasions.js
│   │   ├── orders.js
│   │   ├── products.js
│   │   ├── reviews.js
│   │   └── webhooks.js
│   ├── utils/
│   └── server.js         # Entry point
│
├── frontend/             # Next.js 15
│   └── src/
│       ├── app/          # Next.js App Router pages
│       ├── components/
│       ├── lib/
│       ├── services/     # API layer (Axios)
│       └── store/        # Zustand stores
│
└── package.json          # Root scripts (concurrently)
```

## API Endpoints

| Method | Endpoint | الوصف |
|--------|----------|-------|
| GET/POST | `/api/products` | المنتجات |
| GET/POST | `/api/categories` | الفئات |
| GET/POST | `/api/occasions` | المناسبات |
| POST | `/api/auth/register` | إنشاء حساب |
| POST | `/api/auth/login` | تسجيل الدخول |
| GET/POST | `/api/orders` | الطلبات |
| GET/POST | `/api/reviews` | المراجعات |
| * | `/api/admin` | لوحة التحكم |
| POST | `/api/webhooks` | Webhooks |
| GET | `/api/health` | فحص الحالة |

## الصفحات

| الصفحة | الوصف |
|--------|------|
| HomePage | الرئيسية مع slider والمنتجات المميزة |
| ProductsPage | عرض المنتجات مع فلاتر |
| ProductPage | تفاصيل المنتج والمراجعات |
| CartPage | سلة التسوق |
| CheckoutPage | إتمام الشراء |
| AccountPage | الحساب / تسجيل الدخول |
| WishlistPage | قائمة الأمنيات |
| GiftFinderPage | باحث الهدايا الذكي |
| TrackOrderPage | تتبع الطلب |
| ContactPage | تواصل معنا |
| AboutPage | من نحن |
| FAQPage | الأسئلة الشائعة |
| ShippingPage | سياسة الشحن |
| ReturnsPage | الاستبدال والاسترجاع |
| StoresPage | فروعنا |
| PrivacyPage | سياسة الخصوصية |
| TermsPage | الشروط والأحكام |

---

صنع بـ ❤️ في مصر
