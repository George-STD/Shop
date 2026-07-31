import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { FiGift, FiX, FiCheck, FiAward, FiDollarSign, FiMessageSquare, FiSliders } from 'react-icons/fi';
import Modal from '../ui/Modal';

const LoyaltySettingsModal = ({ isOpen, onClose, onUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    enabled: true,
    pointsPerEgpSpent: 1,
    pointsPerReview: 50,
    egpPerPointRedeemed: 0.1,
    minPointsToRedeem: 100
  });

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getLoyaltySettings();
      if (res.data?.data) {
        setForm(res.data.data);
      }
    } catch (err) {
      toast.error('حدث خطأ في جلب إعدادات نظام الولاء');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await adminAPI.updateLoyaltySettings(form);
      toast.success(res.data?.message || 'تم حفظ إعدادات نظام الولاء بنجاح');
      if (onUpdated) onUpdated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-xl"
      customHeader={
        <div className="bg-gradient-to-r from-purple-700 via-pink-600 to-red-500 p-6 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
              <FiGift className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold">إعدادات نظام الولاء والمكافآت</h2>
              <p className="text-purple-100 text-xs mt-0.5">التحكم الكلي بجمع واستبدال النقاط في المتجر</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>
      }
    >
        {loading ? (
          <div className="p-12 text-center text-gray-500 font-medium">جاري تحميل الإعدادات...</div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Toggle System ON/OFF */}
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-2xl border border-purple-100">
              <div className="flex items-center gap-3">
                <FiAward className="w-6 h-6 text-purple-600" />
                <div>
                  <span className="font-bold text-gray-800 text-sm block">حالة نظام المكافآت والنقاط</span>
                  <span className="text-xs text-gray-500">تفعيل أو تعطيل إمكانية جمع واستبدال النقاط بالكامل</span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {/* Config inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Points per EGP spent */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <FiDollarSign className="text-green-600" />
                  نقاط الشراء (لكل 1 ج.م)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.pointsPerEgpSpent}
                  onChange={(e) => setForm({ ...form, pointsPerEgpSpent: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  required
                />
                <span className="text-[11px] text-gray-400">مثال: 1 تعني أن طلب بقيمة 500 ج.م يعطي 500 نقطة.</span>
              </div>

              {/* Points per Review */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <FiMessageSquare className="text-blue-600" />
                  مكافأة التقييم للمنتجات (نقاط)
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.pointsPerReview}
                  onChange={(e) => setForm({ ...form, pointsPerReview: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  required
                />
                <span className="text-[11px] text-gray-400">تمنح فقط للمشترين الموثوقين (Verified Buyer).</span>
              </div>

              {/* EGP Value per Point Redeemed */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <FiSliders className="text-pink-600" />
                  قيمة النقطة بالجنيه (عند الاستبدال)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.egpPerPointRedeemed}
                  onChange={(e) => setForm({ ...form, egpPerPointRedeemed: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  required
                />
                <span className="text-[11px] text-gray-400">مثال: 0.1 تعني أن كل 100 نقطة تعادل 10 ج.م خصم.</span>
              </div>

              {/* Min Points to Redeem */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <FiAward className="text-amber-600" />
                  الحد الأدنى لاستبدال النقاط
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.minPointsToRedeem}
                  onChange={(e) => setForm({ ...form, minPointsToRedeem: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  required
                />
                <span className="text-[11px] text-gray-400">أقل رصيد نقاط يسمح للمستخدم بخصمه بالطلب.</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 text-sm font-medium text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-lg shadow-purple-200 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <FiCheck className="w-4 h-4" />
                {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </button>
            </div>
        </form>
        )}
    </Modal>
  );
};

export default LoyaltySettingsModal;
