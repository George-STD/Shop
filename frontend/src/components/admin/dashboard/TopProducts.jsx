import React from 'react';
import { FiPackage, FiTrendingUp } from 'react-icons/fi';
import { STRINGS } from '../../../constants';

const TopProducts = ({ stats, formatCurrency }) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h2 className="text-lg font-bold mb-4">{STRINGS.ADMIN.DASHBOARD.TOP_SELLING_PRODUCTS}</h2>
      <div className="space-y-4">
        {stats?.topProducts?.map((product, index) => (
          <div key={product._id} className="flex items-center gap-3">
            <span className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium">
              {index + 1}
            </span>
            {product.images?.[0] && (
              <img
                src={product.images[0].url}
                alt={product.name}
                className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded-lg"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate text-xs sm:text-sm">{product.name}</p>
              <p className="text-xs sm:text-sm text-gray-500">
                {formatCurrency(product.price)}
              </p>
            </div>
            <span className="text-xs sm:text-sm text-gray-500">
              {product.salesCount} {STRINGS.ADMIN.DASHBOARD.SALES}
            </span>
          </div>
        ))}
        {stats?.topProducts?.length === 0 && (
          <p className="text-gray-500 text-center py-4">{STRINGS.ADMIN.DASHBOARD.NO_SALES}</p>
        )}
      </div>
    </div>
  );
};

export default TopProducts;
