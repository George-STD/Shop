/**
 * Centralized Arabic messages for the Gift Shop API
 * All user-facing messages should be defined here for easy maintenance
 */

const MESSAGES = {
  // =====================================================
  // GENERAL MESSAGES
  // =====================================================
  GENERAL: {
    ERROR: 'حدث خطأ',
    SERVER_ERROR: 'حدث خطأ في الخادم',
    NOT_FOUND: 'المسار غير موجود',
    INVALID_ID: 'معرف غير صالح',
    UNAUTHORIZED: 'غير مصرح لك بالوصول',
    FORBIDDEN: 'ليس لديك صلاحية للوصول إلى هذه الصفحة',
    RATE_LIMIT: 'عدد كبير جداً من الطلبات. حاول مرة أخرى لاحقاً',
    VALIDATION_ERROR: 'بيانات غير صالحة',
    SUCCESS: 'تمت العملية بنجاح',
  },

  // =====================================================
  // AUTHENTICATION MESSAGES
  // =====================================================
  AUTH: {
    // Login
    LOGIN_SUCCESS: 'تم تسجيل الدخول بنجاح',
    LOGIN_FAILED: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    LOGIN_RATE_LIMIT: 'عدد محاولات تسجيل الدخول تجاوز الحد المسموح. حاول بعد ساعة',
    
    // Registration
    REGISTER_SUCCESS: 'تم إنشاء الحساب بنجاح',
    REGISTER_VERIFICATION_SENT: 'تم إرسال كود التحقق إلى بريدك الإلكتروني',
    REGISTER_VERIFICATION_FAILED: 'تم إنشاء الحساب لكن فشل إرسال الكود. جرب إعادة الإرسال',
    REGISTER_RATE_LIMIT: 'عدد كبير جداً من عمليات التسجيل. حاول مرة أخرى لاحقاً',
    EMAIL_EXISTS: 'البريد الإلكتروني مسجل مسبقاً',
    
    // Email Verification
    VERIFICATION_SUCCESS: 'تم تأكيد الحساب بنجاح',
    VERIFICATION_REQUIRED: 'يجب تأكيد بريدك الإلكتروني أولاً',
    VERIFICATION_REQUIRED_CODE_SENT: 'يجب تأكيد بريدك الإلكتروني أولاً. تم إرسال كود جديد',
    VERIFICATION_REQUIRED_CODE_FAILED: 'يجب تأكيد بريدك الإلكتروني. فشل إرسال الكود، جرب إعادة الإرسال',
    VERIFICATION_CODE_SENT: 'تم إرسال كود جديد إلى بريدك الإلكتروني',
    VERIFICATION_CODE_INVALID: 'الكود غير صحيح',
    VERIFICATION_CODE_EXPIRED: 'الكود منتهي الصلاحية. أعد إرسال كود جديد',
    VERIFICATION_ALREADY_DONE: 'الحساب مفعّل بالفعل',
    VERIFICATION_RATE_LIMIT: 'عدد كبير جداً من المحاولات. حاول مرة أخرى بعد 15 دقيقة',
    
    // Password
    PASSWORD_CHANGED: 'تم تغيير كلمة المرور بنجاح',
    PASSWORD_RESET_SENT: 'تم إرسال كود إعادة التعيين إلى بريدك الإلكتروني',
    PASSWORD_RESET_GENERIC: 'إذا كان البريد مسجلاً، سيتم إرسال كود إعادة التعيين',
    PASSWORD_INCORRECT: 'كلمة المرور الحالية غير صحيحة',
    PASSWORD_LOGIN_PROMPT: 'تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن',
    CODE_VALID: 'الكود صحيح',
    CODE_EXPIRED: 'الكود منتهي الصلاحية. أعد المحاولة',
    
    // Profile
    PROFILE_UPDATED: 'تم تحديث البيانات بنجاح',
    
    // Email Change
    EMAIL_CHANGE_CODE_SENT: 'تم إرسال كود التأكيد إلى بريدك الإلكتروني الحالي',
    EMAIL_CHANGE_SUCCESS: 'تم تغيير البريد الإلكتروني بنجاح',
    EMAIL_CHANGE_SAME: 'البريد الجديد مطابق للبريد الحالي',
    EMAIL_CHANGE_EXISTS: 'البريد الإلكتروني الجديد مستخدم بالفعل',
    EMAIL_CHANGE_CODE_INVALID: 'كود التأكيد غير صحيح',
    EMAIL_CHANGE_CODE_EXPIRED: 'كود التأكيد منتهي الصلاحية. أعد المحاولة',
    EMAIL_CHANGE_NO_PENDING: 'لا يوجد طلب تغيير بريد إلكتروني',
    
    // Account Status
    ACCOUNT_INACTIVE: 'الحساب غير مفعل',
    ACCOUNT_DISABLED: 'تم تعطيل حسابك. تواصل مع الدعم',
    USER_NOT_FOUND: 'المستخدم غير موجود',
    SESSION_INVALID: 'جلسة غير صالحة. يرجى تسجيل الدخول مرة أخرى',
    LOGIN_REQUIRED: 'غير مصرح لك بالوصول. يرجى تسجيل الدخول',
    AUTH_ERROR: 'خطأ في التحقق من الهوية',
    
    // Email
    EMAIL_SEND_FAILED: 'فشل في إرسال البريد. تأكد من إعدادات SMTP وأعد المحاولة',
    EMAIL_SEND_FAILED_RETRY: 'فشل في إرسال البريد. أعد المحاولة لاحقاً',
  },

  // =====================================================
  // VALIDATION MESSAGES
  // =====================================================
  VALIDATION: {
    // User fields
    FIRST_NAME_REQUIRED: 'الاسم الأول مطلوب',
    FIRST_NAME_LENGTH: 'الاسم الأول يجب أن يكون بين 2 و 50 حرف',
    LAST_NAME_REQUIRED: 'الاسم الأخير مطلوب',
    LAST_NAME_LENGTH: 'الاسم الأخير يجب أن يكون بين 2 و 50 حرف',
    EMAIL_INVALID: 'البريد الإلكتروني غير صالح',
    EMAIL_REQUIRED: 'البريد الإلكتروني مطلوب',
    PHONE_REQUIRED: 'رقم الهاتف مطلوب',
    PASSWORD_REQUIRED: 'كلمة المرور مطلوبة',
    PASSWORD_MIN_LENGTH: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
    CURRENT_PASSWORD_REQUIRED: 'كلمة المرور الحالية مطلوبة',
    NEW_PASSWORD_MIN_LENGTH: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل',
    
    // Verification code
    CODE_LENGTH: 'الكود يجب أن يكون 6 أرقام',
    CODE_INVALID: 'الكود غير صالح',
  },

  // =====================================================
  // PRODUCT MESSAGES
  // =====================================================
  PRODUCTS: {
    FETCH_ERROR: 'حدث خطأ أثناء جلب المنتجات',
    FEATURED_ERROR: 'حدث خطأ أثناء جلب المنتجات المميزة',
    NOT_FOUND: 'المنتج غير موجود',
    NAME_REQUIRED: 'اسم المنتج مطلوب',
    DESCRIPTION_REQUIRED: 'وصف المنتج مطلوب',
    PRICE_REQUIRED: 'السعر مطلوب',
    GENERIC_ERROR: 'حدث خطأ',
  },

  // =====================================================
  // ORDER MESSAGES
  // =====================================================
  ORDERS: {
    CREATED: 'تم إنشاء الطلب بنجاح',
    CREATE_ERROR: 'حدث خطأ أثناء إنشاء الطلب',
    NOT_FOUND: 'الطلب غير موجود',
    UNAUTHORIZED: 'غير مصرح',
    CANCELLED: 'تم إلغاء الطلب بنجاح',
    CANNOT_CANCEL: 'لا يمكن إلغاء هذا الطلب',
    CANCELLED_BY_CUSTOMER: 'تم الإلغاء بواسطة العميل',
    RECEIVED: 'تم استلام الطلب',
    GENERIC_ERROR: 'حدث خطأ',
    
    // Validation
    ITEMS_REQUIRED: 'يجب إضافة منتج واحد على الأقل',
    NO_ITEMS: 'لا يوجد منتجات في الطلب',
    ADDRESS_REQUIRED: 'العنوان مطلوب',
    GOVERNORATE_REQUIRED: 'المحافظة مطلوبة',
    PHONE_REQUIRED: 'رقم الهاتف مطلوب',
    PAYMENT_INVALID: 'طريقة الدفع غير صالحة',
    
    // Stock
    PRODUCT_NOT_FOUND_TEMPLATE: 'المنتج غير موجود',
    INSUFFICIENT_STOCK_TEMPLATE: 'الكمية غير متوفرة للمنتج',
  },

  // =====================================================
  // REVIEW MESSAGES
  // =====================================================
  REVIEWS: {
    CREATED: 'تم إضافة التقييم بنجاح',
    UPDATED: 'تم تحديث التقييم',
    DELETED: 'تم حذف التقييم',
    NOT_FOUND: 'التقييم غير موجود',
    UNAUTHORIZED: 'غير مصرح لك بتعديل هذا التقييم',
    HELPFUL_MARKED: 'تم تسجيل رأيك',
    ALREADY_REVIEWED: 'لقد قمت بتقييم هذا المنتج مسبقاً',
    PURCHASE_REQUIRED: 'يجب شراء المنتج لتتمكن من كتابة تقييم',
    GENERIC_ERROR: 'حدث خطأ',
    
    // Validation
    PRODUCT_REQUIRED: 'معرف المنتج مطلوب',
    RATING_INVALID: 'التقييم يجب أن يكون بين 1 و 5',
    COMMENT_TOO_SHORT: 'التعليق يجب أن يكون 10 أحرف على الأقل',
    GUEST_NAME_REQUIRED: 'اسم الضيف مطلوب',
    GUEST_EMAIL_INVALID: 'بريد إلكتروني صحيح مطلوب',
    GUEST_INFO_REQUIRED: 'يجب إدخال الاسم والبريد الإلكتروني للزائر',
  },

  // =====================================================
  // WISHLIST MESSAGES
  // =====================================================
  WISHLIST: {
    ADDED: 'تمت الإضافة إلى قائمة الأمنيات',
    REMOVED: 'تمت الإزالة من قائمة الأمنيات',
    ALREADY_EXISTS: 'المنتج موجود في قائمة الأمنيات',
  },

  // =====================================================
  // CATEGORY MESSAGES
  // =====================================================
  CATEGORIES: {
    FETCH_ERROR: 'حدث خطأ أثناء جلب الفئات',
    NOT_FOUND: 'الفئة غير موجودة',
    NAME_REQUIRED: 'اسم الفئة مطلوب',
    CREATED: 'تم إنشاء الفئة بنجاح',
    UPDATED: 'تم تحديث الفئة بنجاح',
    DELETED: 'تم حذف الفئة بنجاح',
    GENERIC_ERROR: 'حدث خطأ',
  },

  // =====================================================
  // OCCASION MESSAGES
  // =====================================================
  OCCASIONS: {
    FETCH_ERROR: 'حدث خطأ أثناء جلب المناسبات',
    NOT_FOUND: 'المناسبة غير موجودة',
    GENERIC_ERROR: 'حدث خطأ',
  },

  // =====================================================
  // ADMIN MESSAGES
  // =====================================================
  ADMIN: {
    UNAUTHORIZED: 'ليس لديك صلاحية للوصول إلى هذه الصفحة',
    USER_UPDATED: 'تم تحديث بيانات المستخدم',
    USER_DELETED: 'تم حذف المستخدم',
    PRODUCT_CREATED: 'تم إنشاء المنتج بنجاح',
    PRODUCT_UPDATED: 'تم تحديث المنتج بنجاح',
    PRODUCT_DELETED: 'تم حذف المنتج بنجاح',
    ORDER_STATUS_UPDATED: 'تم تحديث حالة الطلب',
    REVIEW_APPROVED: 'تم قبول المراجعة',
    REVIEW_REJECTED: 'تم رفض المراجعة',
  },

  // =====================================================
  // RATE LIMITER MESSAGES
  // =====================================================
  RATE_LIMIT: {
    API: 'عدد كبير جداً من الطلبات. حاول مرة أخرى بعد 15 دقيقة',
    ADMIN: 'عدد كبير جداً من الطلبات. حاول مرة أخرى لاحقاً',
    LOGIN: 'عدد محاولات تسجيل الدخول تجاوز الحد المسموح. حاول بعد ساعة',
    VERIFY: 'عدد كبير جداً من المحاولات. حاول مرة أخرى بعد 15 دقيقة',
    REGISTER: 'عدد كبير جداً من عمليات التسجيل. حاول مرة أخرى لاحقاً',
  },

  // =====================================================
  // HEALTH CHECK
  // =====================================================
  HEALTH: {
    OK: 'For You Gift Shop API is running',
  },
};

module.exports = MESSAGES;
