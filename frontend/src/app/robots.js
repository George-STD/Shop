export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/', '/account', '/account/', '/checkout', '/cart'],
      },
    ],
    sitemap: 'https://foryo.me/sitemap.xml',
  }
}
