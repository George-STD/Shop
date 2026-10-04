import { STRINGS } from '../../../constants';

export const HERO_SLIDES = {
  brand: {
    id: 'brand',
    badge: {
      icon: '✨',
      text: STRINGS.HOME.HERO_BADGE,
      className: 'bg-white/60 backdrop-blur-sm text-purple-700',
    },
    title: STRINGS.HOME.HERO_TITLE,
    highlight: STRINGS.HOME.HERO_TITLE_HIGHLIGHT,
    highlightClassName: 'text-gradient',
    subtitle: STRINGS.HOME.HERO_SUBTITLE,
    subtitleClassName: 'text-gray-600',
    titleClassName: 'text-gray-800',
    themeClassName: '',
    decorativeGradients: false,
    ctas: [
      {
        href: '/products',
        label: `${STRINGS.HOME.SHOP_NOW} ←`,
        className: 'btn-primary text-sm sm:text-base px-6 sm:px-8',
      },
      {
        href: '/gift-finder',
        label: `🎯 ${STRINGS.HOME.FIND_GIFT}`,
        className: 'btn-secondary text-sm sm:text-base px-6 sm:px-8',
      },
    ],
  },
  loyalty: {
    id: 'loyalty',
    badge: {
      icon: '👑',
      text: STRINGS.HOME.LOYALTY_BADGE,
      className:
        'bg-yellow-400/20 border border-yellow-400/40 backdrop-blur-md text-yellow-300 shadow-lg shadow-purple-900/50',
    },
    title: STRINGS.HOME.LOYALTY_TITLE,
    highlight: STRINGS.HOME.LOYALTY_TITLE_HIGHLIGHT,
    highlightClassName:
      'text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-200',
    subtitle: STRINGS.HOME.LOYALTY_SUBTITLE,
    subtitleClassName: 'text-purple-100',
    titleClassName: 'text-white',
    themeClassName:
      'bg-gradient-to-br from-purple-900 via-indigo-900 to-pink-950 text-white',
    decorativeGradients: true,
    ctas: [
      {
        href: '/products',
        label: `${STRINGS.HOME.LOYALTY_ACTION_SHOP} ←`,
        className:
          'bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-gray-950 font-extrabold text-xs sm:text-sm md:text-base px-6 sm:px-8 py-3.5 rounded-2xl shadow-xl shadow-amber-500/20 transition-all transform hover:-translate-y-0.5 flex items-center gap-2',
      },
      {
        href: '/account/loyalty',
        label: STRINGS.HOME.LOYALTY_ACTION_ACCOUNT,
        className:
          'bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-white font-bold text-xs sm:text-sm md:text-base px-6 sm:px-8 py-3.5 rounded-2xl transition-all flex items-center gap-2',
      },
    ],
  },
  discount: {
    id: 'discount',
    badge: {
      icon: '🔥',
      text: STRINGS.HOME.DISCOUNT_BADGE,
      className:
        'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25',
    },
    title: STRINGS.HOME.DISCOUNT_TITLE,
    highlight: STRINGS.HOME.DISCOUNT_HIGHLIGHT,
    highlightClassName: 'text-gradient',
    subtitle: STRINGS.HOME.DISCOUNT_SUBTITLE,
    subtitleClassName: 'text-gray-600',
    titleClassName: 'text-gray-800',
    themeClassName:
      'bg-gradient-to-br from-purple-50 via-fuchsia-50 to-pink-50',
    decorativeGradients: false,
    ctas: [
      {
        href: '/products?sort=discount',
        label: `${STRINGS.HOME.SHOP_OFFERS} ←`,
        className: 'btn-gold text-sm sm:text-base px-6 sm:px-8',
      },
    ],
  },
};
