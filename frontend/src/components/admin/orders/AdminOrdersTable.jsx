import TableSkeleton from '../TableSkeleton';
import React from 'react';
import { FiEye } from 'react-icons/fi';
import { STRINGS } from '../../../constants';

const AdminOrdersTable = ({
  data,
  isLoading,
  page,
  setPage,
  setSelectedOrder,
  handleStatusChange,
  statusOptions,
  statusLabels,
  statusColors,
  formatCurrency,
}) => {
  if (isLoading) {
    return (
      <TableSkeleton
        headers={[
          { label: STRINGS.ADMIN.TABLE.ORDER_NUMBER, className: '' },
          { label: STRINGS.ADMIN.TABLE.CUSTOMER, className: '' },
          { label: STRINGS.ADMIN.TABLE.AMOUNT, className: '' },
          { label: STRINGS.ADMIN.TABLE.STATUS, className: '' },
          { label: STRINGS.ADMIN.TABLE.DATE, className: 'hidden md:table-cell' },
          { label: STRINGS.ADMIN.TABLE.ACTIONS, className: '' },
        ]}
        rows={10}
        hasCheckbox={false}
        hasThumbnail={false}
        minHeight="min-h-[600px]"
      />
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 min-h-[600px] flex flex-col justify-between">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-right py-3 px-3 sm:px-6 font-medium text-gray-600">{STRINGS.ADMIN.TABLE.ORDER_NUMBER}</th>
              <th className="text-right py-3 px-3 sm:px-6 font-medium text-gray-600">{STRINGS.ADMIN.TABLE.CUSTOMER}</th>
              <th className="text-right py-3 px-3 sm:px-6 font-medium text-gray-600">{STRINGS.ADMIN.TABLE.AMOUNT}</th>
              <th className="text-right py-3 px-3 sm:px-6 font-medium text-gray-600">{STRINGS.ADMIN.TABLE.STATUS}</th>
              <th className="text-right py-3 px-3 sm:px-6 font-medium text-gray-600 hidden md:table-cell">{STRINGS.ADMIN.TABLE.DATE}</th>
              <th className="text-right py-3 px-3 sm:px-6 font-medium text-gray-600">{STRINGS.ADMIN.TABLE.ACTIONS}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data?.data?.map((order) => {
              const customerName = order.user?.firstName
                ? `${order.user.firstName} ${order.user.lastName || ''}`.trim()
                : order.shippingAddress?.firstName
                  ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName || ''}`.trim()
                  : order.guestEmail || 'عميل';
              const customerEmail = order.user?.email || order.guestEmail || order.shippingAddress?.email;
              return (
              <tr key={order._id} className="hover:bg-gray-50 h-14 sm:h-16">
                <td className="py-3 px-3 sm:px-6 font-medium text-xs sm:text-sm whitespace-nowrap">#{order.orderNumber}</td>
                <td className="py-3 px-3 sm:px-6">
                  <div>
                    <p className="font-medium text-xs sm:text-sm">
                      {customerName}
                    </p>
                    {customerEmail && (
                      <p className="text-xs text-gray-500 hidden sm:block">{customerEmail}</p>
                    )}
                  </div>
                </td>
                <td className="py-3 px-3 sm:px-6 font-medium text-xs sm:text-sm whitespace-nowrap">
                  {formatCurrency(order.total)}
                </td>
                <td className="py-3 px-3 sm:px-6">
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order._id, e.target.value)}
                    className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm border-0 cursor-pointer ${statusColors[order.status]}`}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {statusLabels[status]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-3 px-3 sm:px-6 text-gray-600 text-xs sm:text-sm hidden md:table-cell">
                  {new Date(order.createdAt).toLocaleDateString('ar-EG', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="py-3 px-3 sm:px-6">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title={STRINGS.ADMIN.TABLE.VIEW_DETAILS}
                    aria-label={STRINGS.ADMIN.TABLE.VIEW_DETAILS}
                  >
                    <FiEye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data?.pagination && (
        <div className="p-3 sm:p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2 min-h-[56px] shrink-0 bg-gray-50/50">
          <p className="text-gray-600 text-xs sm:text-sm">
            {STRINGS.ADMIN.TABLE.SHOWING} {data.data.length} {STRINGS.ADMIN.TABLE.FROM} {data.pagination.total} {STRINGS.ADMIN.TABLE.ORDER_SINGLE}
          </p>
          <div className="flex gap-1 sm:gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 sm:px-4 py-1.5 sm:py-2 border rounded-lg disabled:opacity-50 text-xs sm:text-sm"
            >
              {STRINGS.ADMIN.TABLE.PREVIOUS}
            </button>
            <span className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm">
              {STRINGS.ADMIN.TABLE.PAGE} {page} {STRINGS.ADMIN.TABLE.FROM} {data.pagination.pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(data.pagination.pages, p + 1))}
              disabled={page >= data.pagination.pages}
              className="px-3 sm:px-4 py-1.5 sm:py-2 border rounded-lg disabled:opacity-50 text-xs sm:text-sm"
            >
              {STRINGS.ADMIN.TABLE.NEXT}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersTable;

