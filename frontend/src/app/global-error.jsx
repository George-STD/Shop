'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('Unhandled Global Application Error:', error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
          <div className="w-16 h-16 bg-gradient-to-tr from-purple-500 to-pink-500 text-white rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg shadow-purple-500/20">
            🎁
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">For You Gift Shop</h1>
          <p className="text-gray-600 text-sm mb-6">
            حدث خطأ فني أثناء تحميل التطبيق. يمكنك محاولة إعادة التنشيط أو العودة للرئيسية.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => reset()}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-md hover:opacity-95 transition-all"
            >
              إعادة التحميل
            </button>
            <a
              href="/"
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
            >
              العودة للرئيسية
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
