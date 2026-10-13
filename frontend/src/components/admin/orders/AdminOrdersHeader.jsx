import React from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import { STRINGS } from '../../../constants';

const AdminOrdersHeader = ({ search, setSearch, statusFilter, setStatusFilter, statusOptions, statusLabels, setPage }) => {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 min-h-[72px] sm:min-h-[88px]">
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <FiSearch className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          <input
            type="text"
            placeholder={STRINGS.ADMIN.SEARCH_ORDERS}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (setPage) setPage(1);
            }}
            className="w-full pr-10 pl-10 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm transition-all shadow-sm"
            aria-label={STRINGS.ADMIN.SEARCH_ORDERS}
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                if (setPage) setPage(1);
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="مسح البحث"
            >
              <FiX className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="w-full sm:w-auto min-w-[180px]">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              if (setPage) setPage(1);
            }}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white shadow-sm transition-all cursor-pointer"
            aria-label="تصفية حسب حالة الطلب"
          >
            <option value="">{STRINGS.ADMIN.ALL_STATUSES}</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default AdminOrdersHeader;
