import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../services/api';
import { FiActivity, FiFilter, FiBox, FiUsers, FiShoppingCart, FiGrid, FiList } from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ef4444', '#14b8a6'];

const AdminAnalysis = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [logFilter, setLogFilter] = useState('');

  const { data: analysisData, isLoading: isAnalysisLoading } = useQuery({
    queryKey: ['admin-analysis'],
    queryFn: () => adminAPI.getAnalysis().then(res => res.data.data),
  });

  const { data: logsData, isLoading: isLogsLoading } = useQuery({
    queryKey: ['admin-logs', logFilter],
    queryFn: () => adminAPI.getLogs({ entityType: logFilter }).then(res => res.data.data),
  });

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
      {/* Header & Tabs */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FiActivity className="text-purple-600" />
            التحليلات والتتبع
          </h1>
          <p className="text-gray-500 text-sm mt-1">تابع إحصائيات المتجر وسجل نشاطات النظام بالكامل</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'overview' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            نظرة عامة (Overview)
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'logs' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            سجل النشاطات (Audit Logs)
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up">
          {/* Categories Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <FiGrid className="text-pink-500" />
              مبيعات الفئات (Chocolates vs Perfumes)
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
    </div>
  );
};

export default AdminAnalysis;
