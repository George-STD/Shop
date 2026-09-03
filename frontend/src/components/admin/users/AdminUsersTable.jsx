import React from 'react';
import TableSkeleton from '../TableSkeleton';
import { FiTrash2, FiUserCheck, FiUserX, FiShield, FiUser } from 'react-icons/fi';
import { STRINGS } from '../../../constants';

const AdminUsersTable = ({ data, isLoading, page, setPage, handleToggleRole, handleToggleStatus, handleDelete }) => {
  if (isLoading) {
    return (
      <TableSkeleton
        headers={[
          { label: STRINGS.ADMIN.TABLE.USER, className: '' },
          { label: STRINGS.ADMIN.TABLE.EMAIL, className: '' },
          { label: STRINGS.ADMIN.TABLE.PHONE, className: 'hidden sm:table-cell' },
          { label: STRINGS.ADMIN.TABLE.ROLE, className: 'hidden md:table-cell' },
          { label: STRINGS.ADMIN.TABLE.STATUS, className: 'hidden md:table-cell' },
          { label: STRINGS.ADMIN.TABLE.REGISTRATION_DATE, className: 'hidden lg:table-cell' },
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
              <th className="text-right py-3 px-3 sm:px-6 font-medium text-gray-600">{STRINGS.ADMIN.TABLE.USER}</th>
              <th className="text-right py-3 px-3 sm:px-6 font-medium text-gray-600">{STRINGS.ADMIN.TABLE.EMAIL}</th>
              <th className="text-right py-3 px-3 sm:px-6 font-medium text-gray-600 hidden sm:table-cell">{STRINGS.ADMIN.TABLE.PHONE}</th>
              <th className="text-right py-3 px-3 sm:px-6 font-medium text-gray-600 hidden md:table-cell">{STRINGS.ADMIN.TABLE.ROLE}</th>
              <th className="text-right py-3 px-3 sm:px-6 font-medium text-gray-600 hidden md:table-cell">{STRINGS.ADMIN.TABLE.STATUS}</th>
              <th className="text-right py-3 px-3 sm:px-6 font-medium text-gray-600 hidden lg:table-cell">{STRINGS.ADMIN.TABLE.REGISTRATION_DATE}</th>
              <th className="text-right py-3 px-3 sm:px-6 font-medium text-gray-600">{STRINGS.ADMIN.TABLE.ACTIONS}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data?.data?.map((user) => (
              <tr key={user._id} className="hover:bg-gray-50 h-14 sm:h-16">
                <td className="py-3 px-3 sm:px-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 min-w-[32px] min-h-[32px] sm:min-w-[40px] sm:min-h-[40px] rounded-full flex items-center justify-center bg-purple-100 text-purple-700 font-semibold text-sm sm:text-base shrink-0">
                      {user.firstName?.charAt(0)}
                    </div>
                    <div>
                      <span className="font-medium text-xs sm:text-sm">
                        {user.firstName} {user.lastName}
                      </span>
                      <div className="flex items-center gap-1 md:hidden mt-0.5">
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-xs ${
                            user.role === 'admin'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {user.role === 'admin' ? STRINGS.ADMIN.ROLE_ADMIN : STRINGS.ADMIN.ROLE_USER}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3 sm:px-6 text-gray-600 text-xs sm:text-sm">
                  <span className="break-all">{user.email}</span>
                </td>
                <td className="py-3 px-3 sm:px-6 text-gray-600 text-xs sm:text-sm hidden sm:table-cell">
                  {user.phone}
                </td>
                <td className="py-3 px-3 sm:px-6 hidden md:table-cell">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                      user.role === 'admin'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {user.role === 'admin' ? (
                      <FiShield className="w-3 h-3" />
                    ) : (
                      <FiUser className="w-3 h-3" />
                    )}
                    {user.role === 'admin' ? STRINGS.ADMIN.ROLE_ADMIN : STRINGS.ADMIN.ROLE_USER}
                  </span>
                </td>
                <td className="py-3 px-3 sm:px-6 hidden md:table-cell">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      user.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {user.isActive ? STRINGS.ADMIN.TABLE.ACTIVE : STRINGS.ADMIN.TABLE.INACTIVE}
                  </span>
                </td>
                <td className="py-3 px-3 sm:px-6 text-gray-600 text-xs sm:text-sm hidden lg:table-cell">
                  {new Date(user.createdAt).toLocaleDateString('ar-EG')}
                </td>
                <td className="py-3 px-3 sm:px-6">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleRole(user)}
                      className="p-1.5 sm:p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                      title={user.role === 'admin' ? STRINGS.ADMIN.TABLE.REMOVE_ADMIN : STRINGS.ADMIN.TABLE.MAKE_ADMIN}
                    >
                      <FiShield className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(user)}
                      className={`p-1.5 sm:p-2 rounded-lg ${
                        user.isActive
                          ? 'text-orange-600 hover:bg-orange-50'
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                      title={user.isActive ? STRINGS.ADMIN.TABLE.DEACTIVATE_ACCOUNT : STRINGS.ADMIN.TABLE.ACTIVATE_ACCOUNT}
                      aria-label={user.isActive ? STRINGS.ADMIN.TABLE.DEACTIVATE_ACCOUNT : STRINGS.ADMIN.TABLE.ACTIVATE_ACCOUNT}
                    >
                      {user.isActive ? (
                        <FiUserX className="w-4 h-4" />
                      ) : (
                        <FiUserCheck className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title={STRINGS.ADMIN.TABLE.DELETE}
                      aria-label={STRINGS.ADMIN.TABLE.DELETE}
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data?.pagination && (
        <div className="p-3 sm:p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2 min-h-[56px] shrink-0 bg-gray-50/50">
          <p className="text-gray-600 text-xs sm:text-sm">
            {STRINGS.ADMIN.TABLE.SHOWING} {data.data.length} {STRINGS.ADMIN.TABLE.FROM} {data.pagination.total} {STRINGS.ADMIN.TABLE.OF}
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

export default AdminUsersTable;

