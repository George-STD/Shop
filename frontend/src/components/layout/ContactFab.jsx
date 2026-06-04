'use client'

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiMessageCircle, FiMail, FiTruck, FiHelpCircle, FiX } from 'react-icons/fi'

const SUPPORT_EMAIL = 'support@foryo.me'

const ContactFab = () => {
  const [isOpen, setIsOpen] = useState(false)

  const contactItems = [
    {
      type: 'link',
      href: '/contact',
      label: 'نموذج التواصل',
      description: 'أرسل رسالة مباشرة للدعم',
      icon: FiMessageCircle,
    },
    {
      type: 'mail',
      href: `mailto:${SUPPORT_EMAIL}`,
      label: 'الدعم بالبريد',
      description: SUPPORT_EMAIL,
      icon: FiMail,
    },
    {
      type: 'link',
      href: '/track-order',
      label: 'تتبع الطلب',
      description: 'اعرف حالة طلبك بسرعة',
      icon: FiTruck,
    },
    {
      type: 'link',
      href: '/faq',
      label: 'الأسئلة الشائعة',
      description: 'إجابات سريعة ومختصرة',
      icon: FiHelpCircle,
    },
  ]

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="إغلاق قائمة التواصل"
          className="fixed inset-0 z-40 bg-black/10"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {isOpen && (
          <div className="w-80 max-w-[calc(100vw-3rem)] rounded-2xl border border-gray-100 bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-gray-800">طرق التواصل</span>
              <button
                type="button"
                aria-label="إغلاق"
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
                )

                if (item.type === 'mail') {
                  return (
                    <a key={item.label} href={item.href} className="block">
                      {content}
                    </a>
                  )
                }

                return (
                  <Link key={item.label} to={item.href} onClick={() => setIsOpen(false)} className="block">
                    {content}
                  </Link>
                )
              })}
            </div>
            <p className="mt-3 text-xs text-gray-500">
              نرد عادة خلال 24-48 ساعة عبر البريد الإلكتروني.
            </p>
          </div>
        )}

        <button
          type="button"
          aria-label="تواصل معنا"
          aria-expanded={isOpen}
          className="group flex items-center gap-3 rounded-full border border-gray-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur hover:shadow-xl transition-all"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md">
            <FiMessageCircle size={20} />
          </span>
          <span className="text-sm font-bold text-gray-800">تواصل معنا</span>
        </button>
      </div>
    </>
  )
}

export default ContactFab
