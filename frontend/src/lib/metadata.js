/**
 * SEO metadata utilities for consistent page metadata
 * Uses constants to ensure consistency across all pages
 */

import { SITE_CONFIG, ROUTES } from '../constants'

const SITE_URL = SITE_CONFIG.SITE_URL
const SITE_NAME = SITE_CONFIG.SITE_NAME

/**
 * Generate standard metadata for a page
 * @param {Object} options - Metadata options
 * @param {string} options.title - Page title (will be appended to site name via template)
 * @param {string} options.description - Page description
 * @param {string} options.path - Page path (e.g., '/products')
 * @param {string} [options.image] - OG image URL (defaults to site logo)
 * @param {Object} [options.extra] - Additional metadata fields
 */
export function generateMetadata({ title, description, path, image, extra = {} }) {
  const canonicalUrl = `${SITE_URL}${path}`
  const ogImage = image || `${SITE_URL}${SITE_CONFIG.OG_IMAGE}`

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: canonicalUrl,
      images: [{ url: ogImage }],
      locale: SITE_CONFIG.LOCALE,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [ogImage],
    },
    ...extra,
  }
}

/**
 * Generate product page metadata
 * @param {Object} product - Product data
 */
export function generateProductMetadata(product) {
  const title = product.name
  const description = product.description?.substring(0, 160) || 
    `اشتري ${product.name} من فور يو - متجر الهدايا الأول في مصر. شحن سريع وتغليف مجاني.`
  const path = `${ROUTES.PRODUCT}/${product.slug}`
  const image = product.images?.[0] || `${SITE_URL}${SITE_CONFIG.OG_IMAGE}`

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}${path}`,
    },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: `${SITE_URL}${path}`,
      images: [{ url: image, alt: product.name }],
      locale: SITE_CONFIG.LOCALE,
      type: 'product',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [image],
    },
  }
}

/**
 * Pre-defined page metadata
 */
export const PAGE_METADATA = {
  // Shop pages
  home: generateMetadata({
    title: SITE_CONFIG.DEFAULT_TITLE,
    description: SITE_CONFIG.DEFAULT_DESCRIPTION,
    path: ROUTES.HOME,
  }),

  products: generateMetadata({
    title: 'تسوق جميع الهدايا',
    description: 'تصفح مجموعتنا الكاملة من الهدايا لجميع المناسبات. هدايا أعياد ميلاد، زواج، تخرج، خطوبة ومواليد مع شحن سريع لكل مصر.',
    path: ROUTES.PRODUCTS,
  }),

  cart: generateMetadata({
    title: 'سلة التسوق',
    description: 'راجع منتجاتك في سلة التسوق قبل إتمام عملية الشراء. تغليف هدايا مجاني وشحن سريع لجميع أنحاء مصر.',
    path: ROUTES.CART,
  }),

  checkout: generateMetadata({
    title: 'إتمام الطلب',
    description: 'أكمل طلبك بأمان. الدفع عند الاستلام متاح. شحن سريع لجميع محافظات مصر.',
    path: ROUTES.CHECKOUT,
  }),

  wishlist: generateMetadata({
    title: 'قائمة الأمنيات',
    description: 'منتجاتك المفضلة في مكان واحد. احفظ الهدايا التي تعجبك واشتريها لاحقاً.',
    path: ROUTES.WISHLIST,
  }),

  giftFinder: generateMetadata({
    title: 'اختر الهدية المثالية',
    description: 'دع فور يو يساعدك في اختيار الهدية المناسبة. حدد المناسبة والميزانية ونوع الشخص واحصل على اقتراحات مخصصة.',
    path: ROUTES.GIFT_FINDER,
  }),

  trackOrder: generateMetadata({
    title: 'تتبع الطلب',
    description: 'تتبع حالة طلبك من فور يو. أدخل رقم الطلب لمعرفة حالة الشحن والتوصيل.',
    path: ROUTES.TRACK_ORDER,
  }),

  account: generateMetadata({
    title: 'حسابي',
    description: 'إدارة حسابك في فور يو. تتبع طلباتك، تحديث بياناتك الشخصية وإدارة قائمة الأمنيات.',
    path: ROUTES.ACCOUNT,
  }),

  // Info pages
  about: generateMetadata({
    title: 'من نحن - تعرف على فور يو',
    description: 'تعرف على فور يو (For You) - متجر الهدايا الأول في مصر. نقدم أفضل تشكيلة هدايا لجميع المناسبات مع خدمة تغليف مجانية وتوصيل سريع.',
    path: ROUTES.ABOUT,
  }),

  contact: generateMetadata({
    title: 'تواصل معنا',
    description: 'تواصل مع فريق فور يو (For You) لأي استفسارات. نحن هنا لمساعدتك في اختيار الهدية المثالية. اتصل بنا أو راسلنا عبر الواتساب.',
    path: ROUTES.CONTACT,
  }),

  faq: generateMetadata({
    title: 'الأسئلة الشائعة',
    description: 'إجابات على الأسئلة الشائعة حول الطلب، الدفع، الشحن والتوصيل في فور يو. اعرف كل شيء عن تجربة التسوق معنا.',
    path: ROUTES.FAQ,
  }),

  shipping: generateMetadata({
    title: 'الشحن والتوصيل',
    description: 'تعرف على سياسة الشحن والتوصيل في فور يو. نوصل لجميع محافظات مصر بأسرع وقت. شحن سريع وآمن.',
    path: ROUTES.SHIPPING,
  }),

  returns: generateMetadata({
    title: 'سياسة الاستبدال والاسترجاع',
    description: 'تعرف على سياسة الاستبدال والاسترجاع في فور يو. نضمن رضاك التام عن مشترياتك.',
    path: ROUTES.RETURNS,
  }),

  stores: generateMetadata({
    title: 'فروعنا',
    description: 'اعرف أماكن فروع فور يو في مصر. زورنا في أقرب فرع لمشاهدة منتجاتنا واختيار هديتك.',
    path: ROUTES.STORES,
  }),

  privacy: generateMetadata({
    title: 'سياسة الخصوصية',
    description: 'سياسة الخصوصية لموقع فور يو. نحترم خصوصيتك ونحافظ على بياناتك الشخصية.',
    path: ROUTES.PRIVACY,
  }),

  terms: generateMetadata({
    title: 'الشروط والأحكام',
    description: 'الشروط والأحكام لاستخدام موقع فور يو للهدايا. اقرأ قبل إتمام عملية الشراء.',
    path: ROUTES.TERMS,
  }),
}

export default PAGE_METADATA
