import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  FiDollarSign,
  FiTrendingUp,
  FiCheckCircle,
  FiClock,
  FiShoppingBag,
  FiTruck,
  FiBox,
  FiSave,
  FiUsers,
  FiAlertCircle,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { adminAPI } from '../../../services/api';

const PARTNER_OPTIONS = [
  { value: 'store_fund', label: 'صندوق المتجر (Store Cash)' },
  { value: 'george', label: 'جورج (George)' },
  { value: 'partner_2', label: 'الشريك 2 (Partner 2)' },
];

const STATUS_OPTIONS = [
  { value: 'pending', label: 'معلق (Pending)', color: 'bg-gray-100 text-gray-700 border-gray-300' },
  { value: 'to_buy', label: 'مطلوب للشراء (To Buy)', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { value: 'purchased', label: 'تم الشراء (Purchased)', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { value: 'in_stock', label: 'متوفر بالمخزن (In Stock)', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
];

export default function OrderProcurementCard({ order, onOrderUpdated, formatCurrency }) {
  const [items, setItems] = useState([]);
  const [overheads, setOverheads] = useState({
    actualShippingCost: '',
    shippingPaidBy: 'store_fund',
    packagingCost: '',
    packagingPaidBy: 'store_fund',
    incidentalExpenses: '',
    incidentalsPaidBy: 'store_fund',
    notes: '',
  });
  const [isSettled, setIsSettled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state whenever order prop changes
  useEffect(() => {
    if (!order) return;

    const initialItems = (order.items || []).map((item) => ({
      itemId: item._id,
      name: item.product?.name || item.name,
      image: item.product?.images?.[0]?.url || item.image,
      quantity: item.quantity || 1,
      sellingPrice: item.price || 0,
      status: item.procurement?.status || 'pending',
      costPrice: item.procurement?.costPrice !== undefined ? item.procurement.costPrice : '',
      paidBy: item.procurement?.paidBy || 'store_fund',
      vendor: item.procurement?.vendor || '',
      notes: item.procurement?.notes || '',
      lastKnownCost: item.product?.lastKnownCost,
      lastKnownVendor: item.product?.lastKnownVendor,
    }));
    setItems(initialItems);

    const proc = order.procurement || {};
    setOverheads({
      actualShippingCost: proc.actualShippingCost ?? '',
      shippingPaidBy: proc.shippingPaidBy || 'store_fund',
      packagingCost: proc.packagingCost ?? '',
      packagingPaidBy: proc.packagingPaidBy || 'store_fund',
      incidentalExpenses: proc.incidentalExpenses ?? '',
      incidentalsPaidBy: proc.incidentalsPaidBy || 'store_fund',
      notes: proc.notes || '',
    });

    setIsSettled(Boolean(proc.isSettled));
  }, [order]);

  // Real-time live calculations
  const totalItemsCost = useMemo(() => {
    return items.reduce((acc, it) => {
      const cost = Number(it.costPrice) || 0;
      return acc + cost * (it.quantity || 1);
    }, 0);
  }, [items]);

  const shippingCost = Number(overheads.actualShippingCost) || 0;
  const packagingCost = Number(overheads.packagingCost) || 0;
  const incidentalsCost = Number(overheads.incidentalExpenses) || 0;

  const totalOverheads = shippingCost + packagingCost + incidentalsCost;
  const totalOrderCost = totalItemsCost + totalOverheads;
  const revenue = Number(order?.total) || 0;
  const netProfit = revenue - totalOrderCost;
  const profitMargin = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : 0;

  // Real-time live partner reimbursements
  const partnerBreakdown = useMemo(() => {
    const map = {};

    items.forEach((it) => {
      const cost = (Number(it.costPrice) || 0) * (it.quantity || 1);
      const payer = it.paidBy || 'store_fund';
      if (cost > 0 && payer !== 'store_fund' && payer !== 'store_cash') {
        map[payer] = (map[payer] || 0) + cost;
      }
    });

    const addOverhead = (cost, payer) => {
      if (cost > 0 && payer && payer !== 'store_fund' && payer !== 'store_cash') {
        map[payer] = (map[payer] || 0) + cost;
      }
    };
    addOverhead(shippingCost, overheads.shippingPaidBy);
    addOverhead(packagingCost, overheads.packagingPaidBy);
    addOverhead(incidentalsCost, overheads.incidentalsPaidBy);

    return Object.entries(map).map(([partner, amount]) => ({ partner, amount }));
  }, [items, shippingCost, packagingCost, incidentalsCost, overheads]);

  // Handlers
  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleApplySuggestion = (index) => {
    const it = items[index];
    if (it.lastKnownCost !== null && it.lastKnownCost !== undefined) {
      handleItemChange(index, 'costPrice', it.lastKnownCost);
    }
    if (it.lastKnownVendor) {
      handleItemChange(index, 'vendor', it.lastKnownVendor);
    }
    toast.success('تم تطبيق اقتراح التكلفة والمورد');
  };

  const handleSave = async () => {
    if (!order?._id) return;
    setIsSaving(true);
    try {
      const payload = {
        items: items.map((it) => ({
          itemId: it.itemId,
          status: it.status,
          costPrice: Number(it.costPrice) || 0,
          paidBy: it.paidBy,
          vendor: it.vendor,
          notes: it.notes,
        })),
        overheads: {
          actualShippingCost: Number(overheads.actualShippingCost) || 0,
          shippingPaidBy: overheads.shippingPaidBy,
          packagingCost: Number(overheads.packagingCost) || 0,
          packagingPaidBy: overheads.packagingPaidBy,
          incidentalExpenses: Number(overheads.incidentalExpenses) || 0,
          incidentalsPaidBy: overheads.incidentalsPaidBy,
          notes: overheads.notes,
        },
        isSettled,
      };

      const res = await adminAPI.updateOrderProcurement(order._id, payload);
      if (res.data?.success) {
        toast.success(res.data.message || 'تم حفظ حسابات وتكاليف الطلب بنجاح');
        if (onOrderUpdated && res.data.data) {
          onOrderUpdated(res.data.data);
        }
      }
    } catch (err) {
      console.error('Procurement save failed:', err);
      toast.error(err.response?.data?.message || 'فشل حفظ بيانات التكاليف');
    } finally {
      setIsSaving(false);
    }
  };

  const getPartnerLabel = (val) => {
    const found = PARTNER_OPTIONS.find((p) => p.value === val);
    return found ? found.label : val;
  };

  return (
    <div className="border border-purple-200 bg-gradient-to-br from-purple-50/50 via-white to-pink-50/30 rounded-2xl p-4 sm:p-6 space-y-6 shadow-sm">
      {/* Header & Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-purple-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">💼</span>
            <h3 className="text-lg font-bold text-gray-900">
              حسابات التكلفة وتدبير المشتريات (Procurement & Accounting)
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            تسجيل تكلفة شراء كل منتج، مصاريف الشحن والتغليف، وحساب صافي الربح ومستحقات الشركاء.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isSettled ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <FiCheckCircle /> تمت التسوية المالية
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
              <FiClock /> معلق للتسوية
            </span>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-purple-500/20 transition-all disabled:opacity-50"
          >
            <FiSave />
            {isSaving ? 'جاري الحفظ...' : 'حفظ التكاليف'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <FiShoppingBag className="text-purple-600" /> إجمالي دخل الطلب
          </p>
          <p className="text-base sm:text-lg font-extrabold text-gray-900 mt-1" dir="ltr">
            {formatCurrency(revenue)}
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <FiDollarSign className="text-amber-600" /> إجمالي التكلفة الفعلية
          </p>
          <p className="text-base sm:text-lg font-extrabold text-gray-900 mt-1 text-amber-700" dir="ltr">
            {formatCurrency(totalOrderCost)}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            منتجات {formatCurrency(totalItemsCost)} + مصاريف {formatCurrency(totalOverheads)}
          </p>
        </div>

        <div className={`p-3.5 rounded-xl border shadow-sm ${netProfit >= 0 ? 'bg-emerald-50/70 border-emerald-200' : 'bg-red-50/70 border-red-200'}`}>
          <p className={`text-xs font-semibold flex items-center gap-1 ${netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            <FiTrendingUp /> صافي الربح
          </p>
          <p className={`text-base sm:text-lg font-extrabold mt-1 ${netProfit >= 0 ? 'text-emerald-800' : 'text-red-800'}`} dir="ltr">
            {formatCurrency(netProfit)}
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500">هامش الربح (Margin)</p>
          <p className={`text-base sm:text-lg font-extrabold mt-1 ${profitMargin >= 30 ? 'text-purple-700' : profitMargin > 0 ? 'text-indigo-600' : 'text-red-600'}`} dir="ltr">
            {profitMargin}%
          </p>
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-1.5">
            <div
              className={`h-full ${profitMargin >= 30 ? 'bg-purple-600' : profitMargin > 0 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${Math.max(0, Math.min(100, profitMargin))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Items Procurement Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-gray-50/80 border-b border-gray-200 flex items-center justify-between">
          <h4 className="font-bold text-sm text-gray-800 flex items-center gap-1.5">
            <span>📦</span> حالة شراء وتدبير المنتجات ({items.length})
          </h4>
          <span className="text-xs text-gray-500">الكمية الإجمالية للتكلفة: {formatCurrency(totalItemsCost)}</span>
        </div>

        <div className="divide-y divide-gray-100 overflow-x-auto">
          {items.map((item, idx) => {
            const hasSuggestion =
              (!item.costPrice || Number(item.costPrice) === 0) &&
              (item.lastKnownCost !== null && item.lastKnownCost !== undefined);
            const lineCost = (Number(item.costPrice) || 0) * (item.quantity || 1);

            return (
              <div key={item.itemId || idx} className="p-3 sm:p-4 hover:bg-gray-50/50 transition-colors space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Product info */}
                  <div className="flex items-center gap-3 min-w-[220px]">
                    {item.image && (
                      <Image
                        width={44}
                        height={44}
                        src={item.image}
                        alt={item.name}
                        className="w-11 h-11 object-cover rounded-lg border border-gray-100 shrink-0"
                      />
                    )}
                    <div>
                      <p className="font-bold text-sm text-gray-900">{item.name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        <span>الكمية: <strong className="text-gray-800">{item.quantity}</strong></span>
                        <span>•</span>
                        <span>سعر البيع: <span dir="ltr">{formatCurrency(item.sellingPrice)}</span></span>
                      </div>
                    </div>
                  </div>

                  {/* Sourcing Suggestion Hint */}
                  {hasSuggestion && (
                    <button
                      type="button"
                      onClick={() => handleApplySuggestion(idx)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold transition-colors self-start md:self-center"
                    >
                      <span>💡</span>
                      <span>اقتراح: {item.lastKnownCost} ج.م {item.lastKnownVendor ? `(${item.lastKnownVendor})` : ''}</span>
                      <span className="underline ml-1">تطبيق</span>
                    </button>
                  )}

                  {/* Status, Cost, PaidBy, Vendor */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1">
                    {/* Status */}
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">حالة التوريد</label>
                      <select
                        value={item.status}
                        onChange={(e) => handleItemChange(idx, 'status', e.target.value)}
                        className="w-full text-xs py-1.5 px-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Cost Price */}
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                        تكلفة القطعة (ج.م)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder="0.00"
                        value={item.costPrice}
                        onChange={(e) => handleItemChange(idx, 'costPrice', e.target.value)}
                        className="w-full text-xs py-1.5 px-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
                        dir="ltr"
                      />
                    </div>

                    {/* Paid By */}
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">دُفع بواسطة</label>
                      <select
                        value={item.paidBy}
                        onChange={(e) => handleItemChange(idx, 'paidBy', e.target.value)}
                        className="w-full text-xs py-1.5 px-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        {PARTNER_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Vendor */}
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">المورد / المكان</label>
                      <input
                        type="text"
                        placeholder="مثل: كارفور، وسط البلد"
                        value={item.vendor}
                        onChange={(e) => handleItemChange(idx, 'vendor', e.target.value)}
                        className="w-full text-xs py-1.5 px-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                      </input>
                    </div>
                  </div>
                </div>

                {/* Sub-row for notes and line cost display */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-50">
                  <div className="flex-1 max-w-md">
                    <input
                      type="text"
                      placeholder="ملاحظات الشراء (اختياري)..."
                      value={item.notes}
                      onChange={(e) => handleItemChange(idx, 'notes', e.target.value)}
                      className="w-full text-[11px] py-1 px-2 text-gray-600 bg-transparent placeholder-gray-400 focus:outline-none focus:border-b focus:border-purple-300"
                    />
                  </div>
                  <div className="text-gray-500 text-[11px]">
                    إجمالي تكلفة البند: <strong className="text-gray-900" dir="ltr">{formatCurrency(lineCost)}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Overheads Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-4">
        <h4 className="font-bold text-sm text-gray-800 flex items-center gap-1.5">
          <span>🛵</span> مصاريف وتكاليف الطلب العامة (Overheads)
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Actual Shipping */}
          <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
                <FiTruck className="text-purple-600" /> شحن المندوب الفعلي
              </span>
            </div>
            <input
              type="number"
              min="0"
              placeholder="0.00"
              value={overheads.actualShippingCost}
              onChange={(e) => setOverheads({ ...overheads, actualShippingCost: e.target.value })}
              className="w-full text-xs py-1.5 px-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
              dir="ltr"
            />
            <div>
              <label className="block text-[10px] text-gray-500 mb-0.5">جهة السداد:</label>
              <select
                value={overheads.shippingPaidBy}
                onChange={(e) => setOverheads({ ...overheads, shippingPaidBy: e.target.value })}
                className="w-full text-xs py-1 px-2 bg-white border border-gray-200 rounded-lg focus:outline-none"
              >
                {PARTNER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Packaging Cost */}
          <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
                <FiBox className="text-pink-600" /> البوكس والتغليف والكارت
              </span>
            </div>
            <input
              type="number"
              min="0"
              placeholder="0.00"
              value={overheads.packagingCost}
              onChange={(e) => setOverheads({ ...overheads, packagingCost: e.target.value })}
              className="w-full text-xs py-1.5 px-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
              dir="ltr"
            />
            <div>
              <label className="block text-[10px] text-gray-500 mb-0.5">جهة السداد:</label>
              <select
                value={overheads.packagingPaidBy}
                onChange={(e) => setOverheads({ ...overheads, packagingPaidBy: e.target.value })}
                className="w-full text-xs py-1 px-2 bg-white border border-gray-200 rounded-lg focus:outline-none"
              >
                {PARTNER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Incidentals */}
          <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
                <FiAlertCircle className="text-amber-600" /> نثريات ومواصلات
              </span>
            </div>
            <input
              type="number"
              min="0"
              placeholder="0.00"
              value={overheads.incidentalExpenses}
              onChange={(e) => setOverheads({ ...overheads, incidentalExpenses: e.target.value })}
              className="w-full text-xs py-1.5 px-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
              dir="ltr"
            />
            <div>
              <label className="block text-[10px] text-gray-500 mb-0.5">جهة السداد:</label>
              <select
                value={overheads.incidentalsPaidBy}
                onChange={(e) => setOverheads({ ...overheads, incidentalsPaidBy: e.target.value })}
                className="w-full text-xs py-1 px-2 bg-white border border-gray-200 rounded-lg focus:outline-none"
              >
                {PARTNER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div>
          <input
            type="text"
            placeholder="ملاحظات عامة حول مصاريف هذا الطلب..."
            value={overheads.notes}
            onChange={(e) => setOverheads({ ...overheads, notes: e.target.value })}
            className="w-full text-xs py-2 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Partner Reimbursement Breakdown & Settlement Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm text-gray-800 flex items-center gap-1.5">
            <FiUsers className="text-indigo-600" /> كشف مستحقات الشركاء (Partner Reimbursements)
          </h4>
          <span className="text-xs text-gray-500">مبالغ دُفعت شخصياً وتستحق الاسترداد من مبيعات الطلب</span>
        </div>

        {partnerBreakdown.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {partnerBreakdown.map((pb) => (
              <div
                key={pb.partner}
                className="p-3 rounded-xl border border-indigo-100 bg-indigo-50/50 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-indigo-900">{getPartnerLabel(pb.partner)}</p>
                  <p className="text-[11px] text-indigo-600 mt-0.5">مستحق للاسترداد</p>
                </div>
                <p className="text-base font-extrabold text-indigo-900" dir="ltr">
                  {formatCurrency(pb.amount)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 bg-gray-50 rounded-xl text-center text-xs text-gray-500">
            كافة مشتريات ومصاريف هذا الطلب ممولة من صندوق المتجر (Store Cash) ولا توجد مستحقات معلقة لشركاء.
          </div>
        )}

        {/* Settlement Toggle */}
        <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-200">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isSettled}
              onChange={(e) => setIsSettled(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
            />
            <div>
              <span className="text-sm font-bold text-gray-900">
                تسوية وصرف مستحقات الشركاء لهذا الطلب
              </span>
              <p className="text-xs text-gray-500">
                عند تحديد هذا الخيار، يتم اعتبار جميع المصاريف المسجلة أعلاه مسوّاة ومصروفة للشركاء.
              </p>
            </div>
          </label>

          {order?.procurement?.settledAt && (
            <span className="text-[11px] text-gray-400">
              تمت التسوية بتاريخ: {new Date(order.procurement.settledAt).toLocaleDateString('ar-EG')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
