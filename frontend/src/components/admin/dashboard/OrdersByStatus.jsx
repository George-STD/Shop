import React from 'react';
import { FiPieChart } from 'react-icons/fi';
import { STRINGS } from '../../../constants';

const OrdersByStatus = ({ stats, statusLabels, statusColors }) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h2 className="text-lg font-bold mb-4">{STRINGS.ADMIN.DASHBOARD.ORDERS_BY_STATUS}</h2>
      <div className="space-y-3">
        {Object.entries(stats?.ordersByStatus || {}).map(([status, count]) => (
          <div key={status} className="flex items-center justify-between">
            <span
              className={`px-2 py-1 rounded-full text-xs sm:text-sm ${statusColors[status]}`}
            >
              {statusLabels[status]}
            </span>
            <span className="font-medium">{count}</span>
          </div>
        ))}
        {Object.keys(stats?.ordersByStatus || {}).length === 0 && (
          <p className="text-gray-500 text-center py-4">{STRINGS.ADMIN.DASHBOARD.NO_ORDERS}</p>
        )}
      </div>
    </div>
  );
};

export default OrdersByStatus;
