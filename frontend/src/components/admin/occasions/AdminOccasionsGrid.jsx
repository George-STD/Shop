import React from 'react';
import { FiEdit2, FiTrash2, FiEye, FiEyeOff } from 'react-icons/fi';
import { STRINGS } from '../../../constants';

const AdminOccasionsGrid = ({ occasions, isLoading, toggleActive, openEdit, handleDelete, setShowModal }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
            <div className="h-12 bg-gray-200 rounded mb-4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (occasions?.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl">
        <div className="text-5xl mb-4">🎉</div>
        <h3 className="text-lg font-medium text-gray-800 mb-2">{STRINGS.ADMIN.OCCASIONS.NO_OCCASIONS}</h3>
        <p className="text-gray-500 mb-6">{STRINGS.ADMIN.OCCASIONS.NO_OCCASIONS_DESC}</p>
        <button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white px-6 py-2 rounded-lg font-medium hover:opacity-90">
          {STRINGS.ADMIN.OCCASIONS.ADD_OCCASION}
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {occasions?.map((occasion) => (
        <div
          key={occasion._id}
          className={`bg-white rounded-2xl p-5 shadow-sm border-2 transition-all ${
            occasion.isActive ? 'border-transparent' : 'border-red-200 opacity-60'
          }`}
        >
          <div className="flex items-start justify-between mb-4">
            <div
              className={`w-14 h-14 rounded-xl bg-gradient-to-br ${occasion.color} flex items-center justify-center text-2xl`}
            >
              {occasion.icon}
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => toggleActive(occasion)}
                className={`p-2 rounded-lg transition-colors ${
                  occasion.isActive
                    ? 'text-green-600 hover:bg-green-50'
                    : 'text-red-500 hover:bg-red-50'
                }`}
                title={occasion.isActive ? STRINGS.ADMIN.OCCASIONS.HIDE : STRINGS.ADMIN.OCCASIONS.SHOW}
              >
                {occasion.isActive ? <FiEye size={16} /> : <FiEyeOff size={16} />}
              </button>
              <button
                onClick={() => openEdit(occasion)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                title={STRINGS.ADMIN.TABLE.EDIT}
              >
                <FiEdit2 size={16} />
              </button>
              <button
                onClick={() => handleDelete(occasion)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                title={STRINGS.ADMIN.TABLE.DELETE}
              >
                <FiTrash2 size={16} />
              </button>
            </div>
          </div>
          <h3 className="font-bold text-gray-800 text-lg">{occasion.name}</h3>
          <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
            <span>{STRINGS.ADMIN.OCCASIONS.ORDER_PREFIX} {occasion.order}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs ${
                occasion.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}
            >
              {occasion.isActive ? STRINGS.ADMIN.OCCASIONS.ACTIVE_STATUS : STRINGS.ADMIN.OCCASIONS.INACTIVE_STATUS}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminOccasionsGrid;
