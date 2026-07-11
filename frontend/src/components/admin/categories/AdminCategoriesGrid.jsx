import React from 'react';
import { FiEdit2, FiTrash2, FiImage } from 'react-icons/fi';
import { STRINGS } from '../../../constants';

const AdminCategoriesGrid = ({ categories, isLoading, handleEdit, handleDelete }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {isLoading
        ? [...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
              <div className="w-16 h-16 bg-gray-200 rounded-xl mb-4" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-full" />
            </div>
          ))
        : categories?.map((category) => (
            <div
              key={category._id}
              className="bg-white rounded-2xl shadow-sm overflow-hidden group"
            >
              {/* Category Image */}
              <div className="h-40 bg-gray-100 relative">
                {category.image ? (
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <FiImage className="w-12 h-12" />
                  </div>
                )}

                {/* Actions Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleEdit(category)}
                    className="p-3 bg-white rounded-full text-blue-600 hover:bg-blue-50"
                  >
                    <FiEdit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(category)}
                    className="p-3 bg-white rounded-full text-red-600 hover:bg-red-50"
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Category Info */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-lg">{category.name}</h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      category.isActive !== false
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {category.isActive !== false ? STRINGS.ADMIN.CATEGORIES.ACTIVE_STATUS : STRINGS.ADMIN.CATEGORIES.HIDDEN_STATUS}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-2">{category.slug}</p>
                {category.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{category.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">{STRINGS.ADMIN.CATEGORIES.ORDER_PREFIX} {category.order || 0}</p>
              </div>
            </div>
          ))}
    </div>
  );
};

export default AdminCategoriesGrid;
