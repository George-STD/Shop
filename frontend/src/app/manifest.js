import { SITE_CONFIG } from '../constants';

export default function manifest() {
  return {
    name: `${SITE_CONFIG.SITE_NAME} - ${SITE_CONFIG.SITE_TAGLINE}`,
    short_name: SITE_CONFIG.SITE_NAME_EN,
    description: SITE_CONFIG.DEFAULT_DESCRIPTION,
    start_url: '/',
    display: 'standalone',
    dir: 'rtl',
    lang: 'ar',
    background_color: '#ffffff',
    theme_color: '#9333ea',
    icons: [
      {
        src: SITE_CONFIG.LOGO_URL,
        sizes: '512x512',
        type: 'image/jpeg',
        purpose: 'any maskable',
      },
    ],
  };
}
