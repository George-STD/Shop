import React from 'react';
import { FiSearch } from 'react-icons/fi';
import { STRINGS } from '../../../constants';

const AdminOrdersHeader = ({ search, setSearch, statusFilter, setStatusFilter, statusOptions, statusLabels }) => {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={STRINGS.ADMIN.SEARCH_ORDERS}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 text-sm"
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
  );
};

export default AdminOrdersHeader;
