import React from 'react';
import { Link } from 'react-router-dom';
import { STRINGS } from '../../../constants';
import { FiArrowUpRight, FiUsers, FiPackage, FiShoppingCart, FiDollarSign } from 'react-icons/fi';

const OverviewCards = ({ stats, formatCurrency }) => {
  const overviewCards = [
    {
      title: STRINGS.ADMIN.DASHBOARD.TOTAL_USERS,
      value: stats?.overview?.totalUsers || 0,
      icon: FiUsers,
      color: 'bg-blue-500',
      link: '/admin/users',
    },
    {
      title: STRINGS.ADMIN.DASHBOARD.PRODUCTS,
      value: stats?.overview?.totalProducts || 0,
      icon: FiPackage,
      color: 'bg-green-500',
      link: '/admin/products',
    },
    {
      title: STRINGS.ADMIN.DASHBOARD.ORDERS,
      value: stats?.overview?.totalOrders || 0,
      icon: FiShoppingCart,
      color: 'bg-purple-500',
      link: '/admin/orders',
    },
    {
      title: STRINGS.ADMIN.DASHBOARD.TOTAL_REVENUE,
      value: formatCurrency(stats?.overview?.totalRevenue || 0),
      icon: FiDollarSign,
      color: 'bg-gradient-to-r from-purple-50 to-pink-500',
      isRevenue: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {overviewCards.map((card, index) => (
        <div
          key={index}
          className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs sm:text-sm">{card.title}</p>
              <p className="text-lg sm:text-2xl font-bold mt-1">{card.value}</p>
            </div>
            <div
              className={`w-8 h-8 sm:w-12 sm:h-12 ${card.color} rounded-xl flex items-center justify-center text-white`}
            >
              <card.icon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
          {card.link && (
            <Link
              to={card.link}
              className="inline-flex items-center gap-1 text-xs sm:text-sm text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mt-4 hover:underline"
            >
              {STRINGS.ADMIN.DASHBOARD.VIEW_ALL}
              <FiArrowUpRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      ))}
    </div>
  );
};

export default OverviewCards;
