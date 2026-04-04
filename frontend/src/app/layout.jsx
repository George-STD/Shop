import '../index.css'
import Providers from './providers'
import JsonLd from './JsonLd'
import { SITE_CONFIG, SEO_KEYWORDS } from '../constants'

const SITE_URL = SITE_CONFIG.SITE_URL
const SITE_NAME = SITE_CONFIG.SITE_NAME
const SITE_DESCRIPTION = SITE_CONFIG.DEFAULT_DESCRIPTION
const OG_IMAGE = `${SITE_URL}${SITE_CONFIG.OG_IMAGE}`

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_CONFIG.DEFAULT_TITLE,
    template: `%s | ${SITE_CONFIG.SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SEO_KEYWORDS,
  authors: [{ name: SITE_CONFIG.SITE_NAME }],
  creator: SITE_CONFIG.SITE_NAME_EN,
  publisher: SITE_CONFIG.SITE_NAME_EN,
  applicationName: SITE_CONFIG.SITE_NAME,
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
    locale: SITE_CONFIG.LOCALE,
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_CONFIG.SITE_NAME_EN} | ${SITE_CONFIG.SITE_NAME_AR} - ${SITE_CONFIG.SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: `${SITE_CONFIG.SITE_NAME} | ${SITE_CONFIG.SITE_TAGLINE}`,
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_CONFIG.SITE_NAME_EN} | ${SITE_CONFIG.SITE_NAME_AR} - ${SITE_CONFIG.SITE_TAGLINE}`,
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
    icon: SITE_CONFIG.LOGO_URL,
    apple: SITE_CONFIG.LOGO_URL,
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: SITE_CONFIG.THEME_COLOR,
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
