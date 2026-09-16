import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { STRINGS } from '../../constants';
import toast from 'react-hot-toast';

import AdminOrdersHeader from '../../components/admin/orders/AdminOrdersHeader';
import AdminOrdersTable from '../../components/admin/orders/AdminOrdersTable';
import OrderDetailsModal from '../../components/admin/orders/OrderDetailsModal';

const statusLabels = STRINGS.ADMIN.STATUS_LABELS;

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  out_for_delivery: 'bg-teal-100 text-teal-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  returned: 'bg-orange-100 text-orange-800',
};

const statusOptions = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'];

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 0,
  }).format(amount);
};

const AdminOrders = ({ initialOrderId = null }) => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const targetOrderId = initialOrderId || searchParams?.get('orderId');

  useEffect(() => {
    if (targetOrderId) {
      adminAPI
        .getOrder(targetOrderId)
        .then((res) => {
          if (res?.data?.data) {
            setSelectedOrder(res.data.data);
          }
        })
        .catch((err) => {
          console.error('Failed to load order details for URL target:', err);
        });
    }
  }, [targetOrderId]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', { search, status: statusFilter, page }],
    queryFn: () =>
      adminAPI
        .getOrders({
          search: search || undefined,
          status: statusFilter || undefined,
          page,
          limit: 20,
        })
        .then((res) => res.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status, trackingNumber }) =>
      adminAPI.updateOrderStatus(id, { status, trackingNumber }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      setSelectedOrder(null);
      toast.success(STRINGS.ADMIN.NOTIFICATIONS.ORDER_UPDATED || 'تم تحديث حالة الطلب بنجاح');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'فشل تحديث حالة الطلب');
    },
  });

  const handleStatusChange = (orderId, newStatus) => {
    if (newStatus === 'shipped') {
      const trackingNumber = window.prompt(
        STRINGS.ADMIN.MESSAGES.ENTER_TRACKING_CODE
      );
      if (trackingNumber !== null) {
        statusMutation.mutate({
          id: orderId,
          status: newStatus,
          trackingNumber: trackingNumber.trim() || undefined,
        });
      }
    } else if (window.confirm(STRINGS.ADMIN.MESSAGES.CONFIRM_CHANGE_STATUS(statusLabels[newStatus]))) {
      statusMutation.mutate({ id: orderId, status: newStatus });
    }
  };

  return (
    <div className="space-y-6 min-h-[600px]">
      <AdminOrdersHeader
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        statusOptions={statusOptions}
        statusLabels={statusLabels}
        setPage={setPage}
      />

      <AdminOrdersTable
        data={data}
        isLoading={isLoading}
        page={page}
        setPage={setPage}
        setSelectedOrder={setSelectedOrder}
        handleStatusChange={handleStatusChange}
        statusOptions={statusOptions}
        statusLabels={statusLabels}
        statusColors={statusColors}
        formatCurrency={formatCurrency}
      />

      <OrderDetailsModal
        selectedOrder={selectedOrder}
        setSelectedOrder={setSelectedOrder}
        handleStatusChange={handleStatusChange}
        statusLabels={statusLabels}
        statusColors={statusColors}
        formatCurrency={formatCurrency}
      />
    </div>
  );
};

export default AdminOrders;
