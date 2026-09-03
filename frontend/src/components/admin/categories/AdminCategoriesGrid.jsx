import React from 'react';
import Image from 'next/image';
import { FiEdit2, FiTrash2, FiImage } from 'react-icons/fi';
import { STRINGS } from '../../../constants';

const AdminCategoriesGrid = ({ categories, isLoading, handleEdit, handleDelete }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[600px]">
      {isLoading
        ? [...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 animate-pulse flex flex-col min-h-[290px]"
            >
              <div className="h-40 bg-gray-200 w-full shrink-0" />
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-5 bg-gray-200 rounded w-1/3" />
                    <div className="h-5 bg-gray-200 rounded-full w-14" />
                  </div>
                  <div className="h-3.5 bg-gray-100 rounded w-1/4 mb-2" />
                  <div className="h-3.5 bg-gray-100 rounded w-3/4" />
                </div>
                <div className="h-3 bg-gray-100 rounded w-16 mt-2" />
              </div>
            </div>
          ))
        : categories?.map((category, index) => (
            <div
              key={category._id}
              className="bg-white rounded-2xl shadow-sm overflow-hidden group border border-gray-100 min-h-[290px] flex flex-col justify-between"
            >
              {/* Category Image */}
              <div className="h-40 bg-gray-100 relative overflow-hidden shrink-0">
                {category.image ? (
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                    loading={index < 6 ? 'eager' : 'lazy'}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <FiImage className="w-12 h-12" />
                  </div>
                )}

                {/* Actions Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
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
