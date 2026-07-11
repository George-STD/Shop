import React from 'react';
import { FiMail, FiTrash2, FiEye, FiChevronRight, FiChevronLeft } from 'react-icons/fi';
import { STRINGS } from '../../../constants';

const AdminEmailList = ({
  data,
  isLoading,
  page,
  setPage,
  viewEmail,
  handleDelete,
  formatDate,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FiMail className="text-2xl text-purple-600" />
            <h1 className="text-xl font-bold">{STRINGS.ADMIN.EMAILS.INBOX}</h1>
          </div>
          <span className="text-sm text-gray-500">{data?.pagination?.total || 0} {STRINGS.ADMIN.EMAILS.MESSAGE_COUNT_SUFFIX}</span>
        </div>
      </div>

      {/* Email List */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="divide-y">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : !data?.data?.length ? (
          <div className="p-12 text-center text-gray-500">
            <FiMail className="text-4xl mx-auto mb-3 text-gray-300" />
            <p>{STRINGS.ADMIN.EMAILS.NO_MESSAGES}</p>
          </div>
        ) : (
          <div className="divide-y">
            {data.data.map((email) => (
              <div
                key={email._id}
                className={`flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors ${!email.isRead ? 'bg-purple-50' : ''}`}
                onClick={() => viewEmail(email)}
              >
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${!email.isRead ? 'bg-purple-600' : 'bg-transparent'}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-sm truncate ${!email.isRead ? 'font-bold' : 'text-gray-700'}`}
                    >
                      {email.from}
                    </span>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {formatDate(email.createdAt)}
                    </span>
                  </div>
                  <p
                    className={`text-sm truncate ${!email.isRead ? 'font-medium' : 'text-gray-500'}`}
                  >
                    {email.subject}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(email._id);
                    }}
                    className="text-gray-400 hover:text-red-500 p-1"
                    title={STRINGS.ADMIN.TABLE.DELETE}
                  >
                    <FiTrash2 size={16} />
                  </button>
                  <FiEye className="text-gray-400" size={16} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {data?.pagination?.pages > 1 && (
          <div className="flex items-center justify-center gap-4 p-4 border-t">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiChevronRight size={18} />
            </button>
            <span className="text-sm text-gray-600">
              {page} / {data.pagination.pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(data.pagination.pages, p + 1))}
              disabled={page === data.pagination.pages}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiChevronLeft size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminEmailList;
