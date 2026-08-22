import React, { useEffect, useRef, memo } from 'react';
import Image from 'next/image';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FiX, FiUser, FiMapPin, FiMail, FiSettings, FiChevronLeft } from 'react-icons/fi';
import { useUIStore, useAuthStore } from '../../store';
import { occasionsAPI } from '../../services/api';
import { STRINGS, BUSINESS_CONFIG } from '../../constants';

/**
 * Accessible & Memoized Mobile Navigation Drawer with Focus Trapping
 */
const MobileMenu = () => {
  const panelRef = useRef(null);
  const closeButtonRef = useRef(null);

  // 1. Granular Zustand Selectors
  const closeMobileMenu = useUIStore((state) => state.closeMobileMenu);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isAdmin = useAuthStore((state) => state.user?.role === 'admin');

  const { data: occasions } = useQuery({
    queryKey: ['occasions'],
    queryFn: () => occasionsAPI.getAll().then((res) => res.data.data),
    staleTime: 1000 * 60 * 10,
  });

  const categories = STRINGS.NAV_CATEGORIES;

  // 2. Keyboard accessibility: Focus trap & Escape dismissal
  useEffect(() => {
    // Focus the close button on mount
    closeButtonRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeMobileMenu();
        return;
      }

      if (e.key === 'Tab' && panelRef.current) {
        const focusableElements = panelRef.current.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeMobileMenu]);

  return (
    <div
      id="mobile-menu-drawer"
      className="fixed inset-0 z-[60] lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label={STRINGS.NAV.MENU || 'القائمة الرئيسية'}
    >
      {/* Semi-transparent Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm overlay-backdrop"
        onClick={closeMobileMenu}
        aria-hidden="true"
      />

      {/* Menu Slide-Out Panel */}
      <div
        ref={panelRef}
        className="absolute top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl overflow-y-auto panel-slide-right flex flex-col justify-between"
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-l from-purple-50/50 to-white">
            <div className="relative w-28 h-12">
              <Image
                src="/images/logo.jpeg"
                alt="For You Gift Shop"
                fill
                priority
                sizes="112px"
                className="object-contain"
              />
            </div>
            <button
              ref={closeButtonRef}
              onClick={closeMobileMenu}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
              aria-label={STRINGS.ACCESSIBILITY.CLOSE_MENU || 'إغلاق القائمة'}
            >
              <FiX size={22} aria-hidden="true" />
            </button>
          </div>

          {/* Account Link */}
          <div className="p-4 border-b border-gray-100">
            <Link
              to="/account"
              onClick={closeMobileMenu}
              className="flex items-center gap-3 text-gray-700 p-3 rounded-2xl hover:bg-purple-50 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                <FiUser className="text-white" size={18} />
              </div>
              <div className="flex-1">
                {isAuthenticated ? (
                  <>
                    <span className="font-bold text-gray-800 text-sm block">{STRINGS.NAV.ACCOUNT}</span>
                    <p className="text-xs text-gray-400">{STRINGS.HEADER.MANAGE_ACCOUNT}</p>
                  </>
                ) : (
                  <>
                    <span className="font-bold text-gray-800 text-sm block">{STRINGS.NAV.LOGIN}</span>
                    <p className="text-xs text-gray-400">{STRINGS.HEADER.CREATE_ACCOUNT}</p>
                  </>
                )}
              </div>
              <FiChevronLeft size={16} className="text-gray-400" />
            </Link>
          </div>

          {/* Admin Panel Link */}
          {isAdmin && (
            <div className="px-4 pt-4">
              <Link
                to="/admin"
                onClick={closeMobileMenu}
                className="flex items-center gap-3 bg-gradient-to-l from-purple-50 to-pink-50 p-4 rounded-2xl border border-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-md shadow-purple-500/20">
                  <FiSettings className="text-white" size={16} />
                </div>
                <div>
                  <span className="font-bold text-purple-700 text-sm block">{STRINGS.NAV.ADMIN}</span>
                  <p className="text-xs text-purple-400">{STRINGS.HEADER.MANAGE_SITE}</p>
                </div>
              </Link>
            </div>
          )}

          {/* Gift Finder CTA */}
          <div className="p-4">
            <Link
              to="/gift-finder"
              onClick={closeMobileMenu}
              className="flex items-center gap-3 bg-gradient-to-l from-purple-500 via-fuchsia-500 to-pink-500 text-white p-4 rounded-2xl shadow-lg shadow-purple-500/20 hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <span className="text-2xl" aria-hidden="true">🎯</span>
              <div>
                <span className="font-bold text-sm block">{STRINGS.NAV.GIFT_FINDER}</span>
                <p className="text-xs text-white/80">{STRINGS.HEADER.LET_US_HELP}</p>
              </div>
            </Link>
          </div>

          {/* Categories Navigation */}
          <div className="px-4 pb-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-3">
              {STRINGS.NAV.CATEGORIES}
            </h3>
            <ul className="space-y-0.5" role="menu">
              {categories.map((category) => (
                <li key={category.slug} role="none">
                  <Link
                    to={category.slug ? `/products?category=${category.slug}` : '/products'}
                    onClick={closeMobileMenu}
                    className="flex items-center justify-between py-2.5 px-3 text-gray-600 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-all group focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    role="menuitem"
                  >
                    <span>{category.name}</span>
                    <FiChevronLeft
                      size={14}
                      className="text-gray-300 group-hover:text-purple-400 transition-colors"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Shop by Occasion */}
          {occasions?.length > 0 && (
            <div className="px-4 pb-4 border-t border-gray-100 pt-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-3">
                {STRINGS.HEADER.SHOP_BY_OCCASION}
              </h3>
              <div className="flex flex-wrap gap-2">
                {occasions.map((occasion) => (
                  <Link
                    key={occasion._id}
                    to={`/products?occasion=${encodeURIComponent(occasion.name)}`}
                    onClick={closeMobileMenu}
                    className="px-3 py-1.5 bg-purple-50 rounded-full text-xs font-medium text-purple-700 hover:bg-purple-100 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {occasion.icon} {occasion.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Quick Links */}
          <div className="px-4 pb-4 border-t border-gray-100 pt-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-3">
              {STRINGS.HEADER.QUICK_LINKS}
            </h3>
            <ul className="space-y-0.5">
              {[
                { to: '/track-order', label: STRINGS.NAV.TRACK_ORDER, icon: '📦' },
                { to: '/stores', label: STRINGS.NAV.STORES, icon: '🏪' },
                { to: '/faq', label: STRINGS.FOOTER.FAQ || 'الأسئلة الشائعة', icon: '❓' },
                { to: '/contact', label: STRINGS.NAV.CONTACT, icon: '💬' },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 py-2.5 px-3 text-gray-600 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-all text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <span aria-hidden="true">{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact Info Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <div className="space-y-2.5 text-gray-500 text-xs">
            <a
              href={`mailto:${BUSINESS_CONFIG.EMAIL}`}
              className="flex items-center gap-2.5 hover:text-purple-600 transition-colors"
            >
              <FiMail className="text-purple-400" size={15} />
              <span>{BUSINESS_CONFIG.EMAIL}</span>
            </a>
            <div className="flex items-start gap-2.5">
              <FiMapPin className="text-purple-400 mt-0.5" size={15} />
              <span>
                {BUSINESS_CONFIG.ADDRESS.CITY}{STRINGS.COMMON.COMMA} {STRINGS.COMMON.EGYPT}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(MobileMenu);
