import React from 'react';
import { FiAward, FiArrowUpRight, FiArrowDownLeft, FiRefreshCw, FiCheckCircle } from 'react-icons/fi';

const LoyaltyPointsCard = ({ user, loyaltySettings }) => {
  const points = user?.loyaltyPoints || 0;
  const egpRate = loyaltySettings?.egpPerPointRedeemed || 0.1;
  const egpValue = (points * egpRate).toFixed(2);
  const history = user?.pointsHistory || [];

  const getTypeStyle = (type) => {
    switch (type) {
      case 'EARNED':
      case 'REFUNDED':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'REDEEMED':
      case 'DEDUCTED':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'EARNED': return 'مكافأة مكتسبة';
      case 'REFUNDED': return 'مسترجعة';
      case 'REDEEMED': return 'مستبدلة';
      case 'DEDUCTED': return 'مخصومة';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-gradient-to-r from-purple-800 via-pink-700 to-red-600 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold text-yellow-300">
              <FiAward className="w-4 h-4" />
              برنامج نقاط هدايا للمكافآت
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight">
              {points.toLocaleString('ar-EG')} <span className="text-lg font-medium text-purple-200">نقطة</span>
            </h2>
            <p className="text-purple-100 text-sm">
              رصيدك الحالي يعادل خصم بمقدار <span className="font-bold text-yellow-300">{egpValue} ج.م</span> عند الشراء من المتجر
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center w-full md:min-w-[180px] md:w-auto">
            <span className="text-xs text-purple-200 block mb-1">الحد الأدنى للاستبدال</span>
            <span className="text-lg font-bold text-white">
              {loyaltySettings?.minPointsToRedeem || 100} نقطة
            </span>
          </div>
        </div>
      </div>

      {/* History Ledger */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <FiRefreshCw className="text-purple-600" />
          سجل حركة النقاط
        </h3>

        {history.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            لا توجد حركة نقاط مسجلة حتى الآن. تسوق أو اكتب تقييم للمنتجات لجمع النقاط!
          </div>
        ) : (
          <div className="divide-y divide-gray-100 overflow-x-auto">
            {history.slice().reverse().map((item, idx) => (
              <div key={idx} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${getTypeStyle(item.type)}`}>
                    {item.type === 'EARNED' || item.type === 'REFUNDED' ? (
                      <FiArrowUpRight className="w-5 h-5" />
                    ) : (
                      <FiArrowDownLeft className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{item.reason}</p>
                    <span className="text-xs text-gray-400">
                      {new Date(item.createdAt).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className={`text-base font-bold ${item.type === 'EARNED' || item.type === 'REFUNDED' ? 'text-green-600' : 'text-red-600'}`}>
                    {item.type === 'EARNED' || item.type === 'REFUNDED' ? '+' : '-'}{item.points} نقطة
                  </span>
                  <span className="block text-[11px] text-gray-400">{getTypeLabel(item.type)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoyaltyPointsCard;
