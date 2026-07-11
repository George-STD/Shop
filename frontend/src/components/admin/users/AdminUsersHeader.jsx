import React from 'react';
import { FiSearch } from 'react-icons/fi';
import { STRINGS } from '../../../constants';

const AdminUsersHeader = ({ search, setSearch, roleFilter, setRoleFilter, statusFilter, setStatusFilter }) => {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={STRINGS.ADMIN.SEARCH_USERS}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        <div className="flex gap-2 sm:gap-4">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border rounded-lg px-3 sm:px-4 py-2 focus:ring-2 focus:ring-purple-500 text-sm flex-1 sm:flex-none"
          >
            <option value="">{STRINGS.ADMIN.ALL_ROLES}</option>
            <option value="user">{STRINGS.ADMIN.ROLE_USER}</option>
            <option value="admin">{STRINGS.ADMIN.ROLE_ADMIN}</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-lg px-3 sm:px-4 py-2 focus:ring-2 focus:ring-purple-500 text-sm flex-1 sm:flex-none"
          >
            <option value="">{STRINGS.ADMIN.ALL_STATUSES}</option>
            <option value="true">{STRINGS.ADMIN.TABLE.ACTIVE}</option>
            <option value="false">{STRINGS.ADMIN.TABLE.INACTIVE}</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default AdminUsersHeader;
