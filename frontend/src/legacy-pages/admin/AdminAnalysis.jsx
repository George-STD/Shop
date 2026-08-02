import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import LoyaltySettingsModal from '../../components/admin/LoyaltySettingsModal';
import {
  FiActivity, FiFilter, FiBox, FiUsers, FiShoppingCart, FiGrid, FiList,
  FiDownload, FiGift, FiAlertTriangle, FiCalendar
} from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ef4444', '#14b8a6'];

const AdminAnalysis = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [logFilter, setLogFilter] = useState('');
  const [period, setPeriod] = useState('all'); // '7d' | '30d' | 'all'
  const [isLoyaltyModalOpen, setIsLoyaltyModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const { data: analysisData, isLoading: isAnalysisLoading, refetch: refetchAnalysis } = useQuery({
    queryKey: ['admin-analysis', period],
    queryFn: () => adminAPI.getAnalysis({ period }).then(res => res.data.data),
  });

  const { data: logsData, isLoading: isLogsLoading } = useQuery({
    queryKey: ['admin-logs', logFilter],
    queryFn: () => adminAPI.getLogs({ entityType: logFilter }).then(res => res.data.data),
  });

  const handleExportCSV = async (reportType) => {
    try {
      setExporting(true);
      const res = await adminAPI.getExportReport(reportType);
      const data = res.data?.data || [];
      if (data.length === 0) {
        toast.error('لا توجد بيانات متاحة للتصدير');
        return;
      }

      // Generate CSV string with UTF-8 BOM for Arabic compatibility in Excel
      const headers = Object.keys(data[0]);
      const csvRows = [headers.join(',')];

      data.forEach(row => {
        const values = headers.map(header => {
          const val = row[header] !== undefined && row[header] !== null ? String(row[header]) : '';
          return `"${val.replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(','));
      });

      const csvString = '\uFEFF' + csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Hadaya_Report_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('تم تصدير التقرير بنجاح (CSV)');
    } catch (err) {
      toast.error('حدث خطأ أثناء تصدير التقرير');
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('ar-EG', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE': return 'text-green-600 bg-green-100';
      case 'UPDATE': return 'text-blue-600 bg-blue-100';
      case 'DELETE': return 'text-red-600 bg-red-100';
      case 'STOCK_CHANGE': return 'text-orange-600 bg-orange-100';
      case 'BULK_UPDATE': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getActionLabel = (action) => {
    switch (action) {
      case 'CREATE': return 'إنشاء';
      case 'UPDATE': return 'تحديث';
      case 'DELETE': return 'حذف';
      case 'STOCK_CHANGE': return 'تغيير مخزون';
      case 'BULK_UPDATE': return 'تحديث جماعي';
      default: return action;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FiActivity className="text-purple-600" />
            التحليلات والتقارير المتقدمة
          </h1>
          <p className="text-gray-500 text-sm mt-1">إدارة نقاط الولاء، تحليلات المبيعات، وتصدير التقارير بضغطة واحدة</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Loyalty Settings Button */}
          <button
            onClick={() => setIsLoyaltyModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-sm font-semibold shadow-md hover:opacity-95 transition-all flex items-center gap-2"
          >
            <FiGift className="w-4 h-4 text-yellow-300" />
            إعدادات الولاء والمكافآت
          </button>

          {/* Export Reports Dropdown */}
          <div className="relative">
            <button
              disabled={exporting}
              onClick={() => setShowExportMenu((prev) => !prev)}
              className="px-4 py-2 bg-gray-800 text-white rounded-xl text-sm font-semibold shadow-sm hover:bg-gray-900 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <FiDownload className="w-4 h-4" />
              {exporting ? 'جاري التصدير...' : 'تصدير تقرير (CSV)'}
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-20 py-2">
                <button
                  onClick={() => {
                    handleExportCSV('sales');
                    setShowExportMenu(false);
                  }}
                  className="w-full text-right px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors flex items-center gap-2"
                >
                  📊 تقرير المبيعات (Sales)
                </button>
                <button
                  onClick={() => {
                    handleExportCSV('inventory');
                    setShowExportMenu(false);
                  }}
                  className="w-full text-right px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors flex items-center gap-2"
                >
                  📦 تقرير المخزون (Inventory)
                </button>
                <button
                  onClick={() => {
                    handleExportCSV('orders');
                    setShowExportMenu(false);
                  }}
                  className="w-full text-right px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors flex items-center gap-2"
                >
                  🛒 تقرير الطلبات (Orders)
                </button>
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'overview' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              نظرة عامة
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'logs' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              سجل النشاطات
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in-up">
          {/* Period Filter Bar */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
              <FiCalendar className="text-purple-600" />
              النطاق الزمني للتحليلات:
            </div>
            <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-medium">
              <button
                onClick={() => setPeriod('7d')}
                className={`px-3 py-1.5 rounded-lg transition-all ${period === '7d' ? 'bg-white text-purple-700 font-bold shadow-sm' : 'text-gray-600'}`}
              >
                آخر 7 أيام
              </button>
              <button
                onClick={() => setPeriod('30d')}
                className={`px-3 py-1.5 rounded-lg transition-all ${period === '30d' ? 'bg-white text-purple-700 font-bold shadow-sm' : 'text-gray-600'}`}
              >
                آخر 30 يوم
              </button>
              <button
                onClick={() => setPeriod('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${period === 'all' ? 'bg-white text-purple-700 font-bold shadow-sm' : 'text-gray-600'}`}
              >
                كل الأوقات
              </button>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Categories Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <FiGrid className="text-pink-500" />
                مبيعات الفئات (Category Sales)
              </h2>
              {isAnalysisLoading ? (
                <div className="h-64 flex items-center justify-center text-gray-400">جاري التحميل...</div>
              ) : (
                <div className="h-80 w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analysisData?.categorySales || []}
                        dataKey="sales"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {analysisData?.categorySales?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Top Products Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <FiBox className="text-blue-500" />
                المنتجات الأكثر طلباً (Top 10)
              </h2>
              {isAnalysisLoading ? (
                <div className="h-64 flex items-center justify-center text-gray-400">جاري التحميل...</div>
              ) : (
                <div className="h-80 w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analysisData?.productSales || []} layout="vertical" margin={{ left: 50 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                      <RechartsTooltip />
                      <Bar dataKey="sales" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="الكمية المباعة">
                        {analysisData?.productSales?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Low Stock Alerts Section */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <FiAlertTriangle className="text-red-500" />
              تنبيهات نواقص المخزون (&le; 5 قطع)
            </h2>

            {analysisData?.lowStockProducts?.length === 0 ? (
              <p className="text-sm text-gray-400 py-4">جميع المنتجات متوفرة بمخزون جيد 👍</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-xs border-b border-gray-100">
                      <th className="p-3">اسم المنتج</th>
                      <th className="p-3">السعر</th>
                      <th className="p-3">المخزون المتبقي</th>
                      <th className="p-3 hidden md:table-cell">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {analysisData?.lowStockProducts?.map((item) => (
                      <tr key={item._id} className="hover:bg-red-50/50 transition-colors">
                        <td className="p-3 font-semibold text-gray-800 flex items-center gap-2">
                          {item.images?.[0]?.url && (
                            <img src={item.images[0].url} alt={item.name} className="w-8 h-8 rounded-lg object-cover" />
                          )}
                          {item.name}
                        </td>
                        <td className="p-3 font-bold text-purple-700">{item.price} ج.م</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${item.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                            {item.stock === 0 ? 'نفذت الكمية!' : `${item.stock} قطع متبقية`}
                          </span>
                        </td>
                        <td className="p-3 text-xs text-gray-500 hidden md:table-cell">يحتاج إعادة طلب فورية</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in-up">
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <FiList className="text-purple-600" />
              سجل التتبع (Timeline)
            </h2>
            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-400" />
              <select 
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value)}
                className="text-sm border-gray-200 rounded-lg focus:ring-purple-500 focus:border-purple-500 pr-8"
              >
                <option value="">كل الكيانات (الكل)</option>
                <option value="Product">المنتجات فقط</option>
                <option value="Order">الطلبات</option>
                <option value="User">المستخدمين</option>
                <option value="Category">الفئات</option>
              </select>
            </div>
          </div>

          <div className="p-6">
            {isLogsLoading ? (
              <div className="py-12 text-center text-gray-500">جاري تحميل السجل...</div>
            ) : logsData?.length === 0 ? (
              <div className="py-12 text-center text-gray-500">لا توجد نشاطات مسجلة بعد.</div>
            ) : (
              <div className="relative border-r-2 border-purple-100 pr-6 mr-3 space-y-8">
                {logsData?.map((log) => (
                  <div key={log._id} className="relative">
                    <div className="absolute w-4 h-4 bg-purple-500 rounded-full -right-[35px] top-1 border-4 border-white shadow-sm"></div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${getActionColor(log.action)}`}>
                            {getActionLabel(log.action)}
                          </span>
                          <span className="font-semibold text-gray-700 text-sm">
                            {log.entityType}: {log.entityName || 'غير محدد'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400 font-mono">
                          {formatDate(log.createdAt)}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 mt-2">
                        بواسطة: <span className="font-medium">{log.adminId?.firstName} {log.adminId?.lastName}</span>
                      </div>
                      
                      {log.reason && (
                        <div className="mt-2 text-sm text-gray-500 bg-white p-2 rounded border border-gray-100">
                          <strong>السبب:</strong> {log.reason}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loyalty Control Modal */}
      <LoyaltySettingsModal
        isOpen={isLoyaltyModalOpen}
        onClose={() => setIsLoyaltyModalOpen(false)}
        onUpdated={refetchAnalysis}
      />
    </div>
  );
};

export default AdminAnalysis;

