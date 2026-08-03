'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiStar, FiCheckCircle, FiPackage, FiHeart, FiGift, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../../../services/api';

export default function ReviewOrderClient({ orderNumber }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('ممتاز جداً');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function fetchOrderInfo() {
      try {
        setLoading(true);
        const res = await api.get(`/reviews/order-info/${orderNumber}`);
        if (res.data?.success) {
          setOrder(res.data.data);
          if (res.data.data.customerName) setGuestName(res.data.data.customerName);
          if (res.data.data.customerEmail) setGuestEmail(res.data.data.customerEmail);
        } else {
          setError('لم نتمكن من جلب بيانات الطلب.');
        }
      } catch (err) {
        console.error('Error fetching order info:', err);
        setError('عذراً، الطلب غير موجود أو تم إدخال رابط غير صحيح.');
      } finally {
        setLoading(false);
      }
    }

    if (orderNumber) {
      fetchOrderInfo();
    }
  }, [orderNumber]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      toast.error('يرجى اختيار التقييم بالنجوم');
      return;
    }
    if (!comment.trim()) {
      toast.error('يرجى كتابة تعليق على التقييم');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/reviews/batch-order-review', {
        orderNumber,
        rating,
        comment,
        guestName,
        guestEmail
      });

      if (res.data?.success) {
        setSubmitted(true);
        toast.success('تم إرسال تقييمك بنجاح لجميع المنتجات! ❤️');
      } else {
        toast.error(res.data?.message || 'حدث خطأ أثناء إرسال التقييم');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      toast.error(err.response?.data?.message || 'حدث خطأ في الاتصال بالخادم');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">جاري تحميل بيانات الطلب...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl text-center border border-gray-100">
          <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            <FiAlertCircle />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">عذراً، الطلب غير موجود</h2>
          <p className="text-gray-600 text-sm mb-6">{error || 'لم يتم العثور على أرقام المنتجات في هذا الطلب.'}</p>
          <Link href="/" className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg transition-all">
            الصفحة الرئيسية
          </Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4 py-12">
        <div className="max-w-lg w-full bg-white rounded-3xl p-8 sm:p-10 shadow-xl text-center border border-purple-100 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400"></div>
          
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-lg shadow-green-500/20 animate-bounce">
            <FiCheckCircle />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">شكراً جزيلاً لتقييمك! 🎁</h2>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-6">
            تم تطبيق تقييمك ({rating} ⭐) بنجاح على جميع منتجات بوكس الهدايا الخاص بكِ.
            سعادتك ورضاكِ هما هدفنا دائمًا! ❤️
          </p>

          <div className="bg-purple-50 rounded-2xl p-4 mb-8 border border-purple-100 text-right space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between items-center text-purple-900 font-bold border-b border-purple-200/60 pb-2">
              <span>رقم الطلب: #{order.orderNumber}</span>
              <span className="text-amber-600">{'★'.repeat(rating)}</span>
            </div>
            <p className="text-gray-700 italic font-medium">"{comment}"</p>
          </div>

          <Link href="/" className="inline-flex items-center justify-center px-8 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-lg shadow-purple-500/25 hover:scale-105 transition-all">
            تصفح المزيد من الهدايا ✨
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] py-8 sm:py-14 bg-gradient-to-b from-purple-50/50 via-white to-pink-50/30">
      <div className="container-custom max-w-2xl">
        
        {/* Header Badge */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-purple-100 mb-8 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-purple-600 to-pink-600"></div>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center text-2xl shrink-0">
              <FiGift />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">تقييم تجربة الطلب وبوكس الهدايا</h1>
              <p className="text-xs sm:text-sm text-gray-500">طلب رقم <strong className="text-purple-700">#{order.orderNumber}</strong></p>
            </div>
          </div>

          <p className="text-gray-600 text-sm leading-relaxed border-t pt-4">
            أهلاً بكِ <strong>{order.customerName}</strong>! نتمنى أن تكون المنتجات قد نالت إعجابك.
            يرجى تقييم تجربتك، وسيقوم النظام بتطبيق تقييمك تلقائياً على كل المنتجات بداخل هذا البوكس:
          </p>
        </div>

        {/* Products in this box preview */}
        {order.items?.length > 0 && (
          <div className="bg-white rounded-3xl p-6 shadow-md border border-gray-100 mb-8">
            <h3 className="font-bold text-gray-800 text-sm mb-4 flex items-center gap-2">
              <FiPackage className="text-purple-600" />
              المنتجات المشمولة في هذا التقييم ({order.items.length}):
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2.5 rounded-2xl bg-gray-50 border border-gray-100">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded-xl shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate" title={item.name}>{item.name}</p>
                    <p className="text-[10px] text-purple-600 font-bold">{item.price} ج.م</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rating Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-purple-100 space-y-6">
          
          {/* Star Selector */}
          <div className="text-center py-4 bg-purple-50/50 rounded-2xl border border-purple-100">
            <label className="block text-gray-800 font-bold text-sm sm:text-base mb-3">
              ما هو تقييمك الإجمالي للمنتجات؟ ⭐
            </label>
            <div className="flex items-center justify-center gap-2 dir-ltr">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 text-3xl sm:text-4xl transition-all duration-200 hover:scale-125 focus:outline-none"
                >
                  <span className={(hoverRating || rating) >= star ? 'text-amber-400 drop-shadow-sm' : 'text-gray-300'}>
                    ★
                  </span>
                </button>
              ))}
            </div>
            <p className="text-xs text-purple-700 font-bold mt-2">
              {rating === 5 ? 'ممتاز جداً 🌟🌟🌟🌟🌟' : rating === 4 ? 'جيد جداً 👍' : rating === 3 ? 'جيد' : 'يحتاج تحسين'}
            </p>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-gray-800 font-bold text-sm mb-2">
              رأيك وتعليقك على المنتجات:
            </label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="اكتبي تعليقك ورأيك هنا (مثلاً: ممتاز جداً والألوان والتغليف تحفة)..."
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm transition-all"
            ></textarea>
          </div>

          {/* Name & Email */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-xs font-semibold mb-1">الاسم:</label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                placeholder="الاسم"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-xs font-semibold mb-1">البريد الإلكتروني:</label>
              <input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                placeholder="email@example.com"
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold text-base shadow-xl shadow-purple-500/25 hover:from-purple-700 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-[1.01]"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                جاري إرسال التقييم...
              </>
            ) : (
              <>
                <FiStar className="fill-current text-amber-300" />
                إرسال التقييم لجميع المنتجات
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
