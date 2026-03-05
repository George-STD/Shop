import '../index.css'
import Providers from './providers'
import JsonLd from './JsonLd'

const SITE_URL = 'https://foryo.me'
const SITE_NAME = 'For You - فور يو'
const SITE_DESCRIPTION = 'فور يو (For You) - متجر الهدايا الأول في مصر | تشكيلة واسعة من هدايا أعياد الميلاد، الزواج، التخرج وجميع المناسبات. شحن سريع وتغليف مجاني لكل أنحاء مصر.'
const OG_IMAGE = `${SITE_URL}/images/logo.jpeg`

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'For You | فور يو - متجر الهدايا الأول في مصر | هدايا لجميع المناسبات',
    template: '%s | For You - فور يو',
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'foryo', 'for you', 'foryou', 'for you gift shop', 'foryo giftshop',
    'foryo gifts', 'foryou gifts', 'foryo egypt', 'foryou egypt',
    'foryo.me', 'for you gifts egypt', 'for you هدايا',
    'فور يو', 'فوريو', 'فور يو هدايا', 'فور يو للهدايا', 'متجر فور يو',
    'for you store', 'foryo store', 'foryou store',
    'هدايا', 'متجر هدايا', 'هدايا اون لاين', 'شراء هدايا', 'هدايا مصر',
    'هدايا عيد ميلاد', 'هدايا زواج', 'هدايا تخرج', 'هدايا خطوبة',
    'هدايا مواليد', 'هدايا رجالي', 'هدايا حريمي', 'هدايا اطفال',
    'gift shop egypt', 'gifts egypt', 'online gift shop egypt',
    'هدايا فالنتاين', 'هدايا عيد الام', 'تغليف هدايا', 'توصيل هدايا',
    'هدايا اونلاين مصر', 'أفضل متجر هدايا',
  ],
  authors: [{ name: 'For You - فور يو' }],
  creator: 'For You',
  publisher: 'For You',
  applicationName: 'For You - فور يو',
  generator: 'Next.js',
  referrer: 'origin-when-cross-origin',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: 'website',
    locale: 'ar_EG',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: 'For You | فور يو - متجر الهدايا الأول في مصر',
    description: SITE_DESCRIPTION,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'For You - فور يو | متجر الهدايا الأول في مصر',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'For You | فور يو - متجر الهدايا الأول في مصر',
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
    creator: '@foryou._.21',
    site: '@foryou._.21',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your Google Search Console verification code here
    // google: 'your-google-verification-code',
  },
  category: 'shopping',
  icons: {
    icon: '/images/logo.jpeg',
    apple: '/images/logo.jpeg',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#a855f7',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&family=Aref+Ruqaa:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <JsonLd />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
