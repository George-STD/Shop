import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { STRINGS } from '../../constants';
import { adminAPI } from '../../services/api';

import OverviewCards from '../../components/admin/dashboard/OverviewCards';
import OrdersByStatus from '../../components/admin/dashboard/OrdersByStatus';
import TopProducts from '../../components/admin/dashboard/TopProducts';
import RecentOrders from '../../components/admin/dashboard/RecentOrders';

const statusLabels = STRINGS.ADMIN.STATUS_LABELS;

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 0,
  }).format(amount);
};

const AdminDashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminAPI.getStats().then((res) => res.data.data),
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
              <div className="h-8 bg-gray-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <OverviewCards stats={stats} formatCurrency={formatCurrency} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <OrdersByStatus stats={stats} statusLabels={statusLabels} statusColors={statusColors} />
        <TopProducts stats={stats} formatCurrency={formatCurrency} />
      </div>

      <RecentOrders stats={stats} statusLabels={statusLabels} statusColors={statusColors} formatCurrency={formatCurrency} />
    </div>
  );
};

export default AdminDashboard;
