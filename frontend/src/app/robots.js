import { SITE_CONFIG, ROUTES } from '../constants'

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [ROUTES.ADMIN, `${ROUTES.ADMIN}/`, ROUTES.ACCOUNT, `${ROUTES.ACCOUNT}/`, ROUTES.CHECKOUT, ROUTES.CART],
      },
    ],
    sitemap: `${SITE_CONFIG.SITE_URL}/sitemap.xml`,
  }
}
