'use client';

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMessageCircle, FiMail, FiTruck, FiHelpCircle, FiX } from 'react-icons/fi';
import { STRINGS } from '../../constants';

const SUPPORT_EMAIL = 'support@foryo.me';

const ContactFab = () => {
  const [isOpen, setIsOpen] = useState(false);

  const contactItems = [
    {
      type: 'link',
      href: '/contact',
      label: STRINGS.CONTACT_FAB.CONTACT_FORM,
      description: STRINGS.CONTACT_FAB.CONTACT_FORM_DESC,
      icon: FiMessageCircle,
    },
    {
      type: 'mail',
      href: `mailto:${SUPPORT_EMAIL}`,
      label: STRINGS.CONTACT_FAB.EMAIL_SUPPORT,
      description: SUPPORT_EMAIL,
      icon: FiMail,
    },
    {
      type: 'link',
      href: '/track-order',
      label: STRINGS.CONTACT_FAB.TRACK_ORDER,
      description: STRINGS.CONTACT_FAB.TRACK_ORDER_DESC,
      icon: FiTruck,
    },
    {
      type: 'link',
      href: '/faq',
      label: STRINGS.CONTACT_FAB.FAQ,
      description: STRINGS.CONTACT_FAB.FAQ_DESC,
      icon: FiHelpCircle,
    },
  ];

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label={STRINGS.CONTACT_FAB.CLOSE_MENU}
          className="fixed inset-0 z-40 bg-black/10"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {isOpen && (
          <div className="w-80 max-w-[calc(100vw-3rem)] rounded-2xl border border-gray-100 bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-gray-800">{STRINGS.CONTACT_FAB.CONTACT_METHODS}</span>
              <button
                type="button"
                aria-label={STRINGS.CONTACT_FAB.CLOSE}
                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <FiX size={16} />
              </button>
            </div>
            <div className="space-y-2">
              {contactItems.map((item) => {
                const content = (
                  <div className="flex items-center gap-3 rounded-xl p-3 hover:bg-gray-50 transition-colors">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-r from-purple-100 to-pink-100 flex items-center justify-center">
                      <item.icon className="text-purple-600" size={16} />
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-800">{item.label}</div>
                      <div className="text-xs text-gray-500">{item.description}</div>
                    </div>
                  </div>
                );

                if (item.type === 'mail') {
                  return (
                    <a key={item.label} href={item.href} className="block">
                      {content}
                    </a>
                  );
                }

                return (
                  <Link
                    key={item.label}
                    to={item.href}
                    onClick={() => setIsOpen(false)}
                    className="block"
                  >
                    {content}
                  </Link>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-gray-500">
              {STRINGS.CONTACT_FAB.REPLY_TIME}
            </p>
          </div>
        )}

        <button
          type="button"
          aria-label={STRINGS.CONTACT_FAB.CONTACT_US}
          aria-expanded={isOpen}
          className="group flex items-center gap-3 rounded-full border border-gray-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur hover:shadow-xl transition-all"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md">
            <FiMessageCircle size={20} />
          </span>
          <span className="text-sm font-bold text-gray-800">{STRINGS.CONTACT_FAB.CONTACT_US}</span>
        </button>
      </div>
    </>
  );
};

export default ContactFab;
