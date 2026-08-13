'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('Unhandled Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center bg-gray-50">
      <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center text-3xl mb-4 shadow-sm">
        ⚠️
      </div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">عذراً، حدث خطأ غير متوقع</h1>
      <p className="text-gray-600 max-w-md mb-6 text-sm">
        حدثت مشكلة أدت إلى تعذر عرض هذه الصفحة بشكل صحيح. يمكنك محاولة إعادة التحميل أو العودة للصفحة الرئيسية.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => reset()}
          className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-md hover:opacity-95 transition-all"
        >
          إعادة المحاولة
        </button>
        <Link
          href="/"
          className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-all"
        >
          الصفحة الرئيسية
        </Link>
      </div>
    </div>
  );
}
