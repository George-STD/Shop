import React from 'react';
import { Link } from 'react-router-dom';
import { STRINGS } from '../../../constants';

const RecentOrders = ({ stats, statusLabels, statusColors, formatCurrency }) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">{STRINGS.ADMIN.DASHBOARD.RECENT_ORDERS}</h2>
        <Link
          to="/admin/orders"
          className="text-sm text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 hover:underline"
        >
          {STRINGS.ADMIN.DASHBOARD.VIEW_ALL}
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-right py-2 px-1 sm:py-3 sm:px-2 text-gray-500 font-medium">{STRINGS.ADMIN.TABLE.ORDER_NUMBER}</th>
              <th className="text-right py-2 px-1 sm:py-3 sm:px-2 text-gray-500 font-medium">{STRINGS.ADMIN.TABLE.CUSTOMER}</th>
              <th className="text-right py-2 px-1 sm:py-3 sm:px-2 text-gray-500 font-medium">{STRINGS.ADMIN.TABLE.AMOUNT}</th>
              <th className="text-right py-2 px-1 sm:py-3 sm:px-2 text-gray-500 font-medium">{STRINGS.ADMIN.TABLE.STATUS}</th>
              <th className="text-right py-2 px-1 sm:py-3 sm:px-2 text-gray-500 font-medium">{STRINGS.ADMIN.TABLE.DATE}</th>
            </tr>
          </thead>
          <tbody>
            {stats?.recentOrders?.map((order) => (
              <tr key={order._id} className="border-b last:border-0">
                <td className="py-2 px-1 sm:py-3 sm:px-2">
                  <Link
                    to={`/admin/orders/${order._id}`}
                    className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 hover:underline"
                  >
                    #{order.orderNumber}
                  </Link>
                </td>
                <td className="py-2 px-1 sm:py-3 sm:px-2">
                  {order.user?.firstName} {order.user?.lastName}
                </td>
                <td className="py-2 px-1 sm:py-3 sm:px-2">{formatCurrency(order.total)}</td>
                <td className="py-2 px-1 sm:py-3 sm:px-2">
                  <span
                    className={`px-1 py-1 rounded-full text-xs ${statusColors[order.status]}`}
                  >
                    {statusLabels[order.status]}
                  </span>
                </td>
                <td className="py-2 px-1 sm:py-3 sm:px-2 text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString('ar-EG')}
                </td>
              </tr>
            ))}
            {stats?.recentOrders?.length === 0 && (
              <tr>
                <td colSpan="5" className="py-8 text-center text-gray-500 text-xs">
                  {STRINGS.ADMIN.DASHBOARD.NO_ORDERS_YET}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentOrders;
