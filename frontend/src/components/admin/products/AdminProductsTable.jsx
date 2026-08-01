import { LoadingSpinner } from '../../common/LoadingSpinner';
import React from 'react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { STRINGS } from '../../../constants';
import toast from 'react-hot-toast';

const AdminProductsTable = ({ products, isLoading, page, setPage, handleEdit, handleDelete, selectedIds, handleSelect, handleSelectAll }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm overflow-x-auto p-8 text-center">
        <LoadingSpinner size="md" className="mx-auto" />
      </div>
    );
  }

  const allIds = products?.data?.map(p => p._id) || [];
  const isAllSelected = allIds.length > 0 && allIds.every(id => selectedIds.includes(id));

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden relative before:content-[''] before:absolute before:inset-y-0 before:left-0 before:w-4 before:bg-gradient-to-r before:from-white before:to-transparent before:z-10 before:pointer-events-none after:content-[''] after:absolute after:inset-y-0 after:right-0 after:w-8 after:bg-gradient-to-l after:from-white/80 after:to-transparent after:z-10 after:pointer-events-none md:after:hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-xs sm:text-sm">
          <thead className="bg-gray-50 text-xs md:text-sm">
            <tr>
              <th className="py-2 px-2 sm:py-4 sm:px-6 w-12 text-center">
                <input 
                  type="checkbox" 
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer w-4 h-4"
                  checked={isAllSelected}
                  onChange={(e) => handleSelectAll(e.target.checked, allIds)}
                />
              </th>
              <th className="text-right py-2 px-2 sm:py-4 sm:px-6 font-medium text-gray-600">
                {STRINGS.ADMIN.TABLE.PRODUCT}
              </th>
              <th className="text-right py-2 px-2 sm:py-4 sm:px-6 font-medium text-gray-600">
                {STRINGS.ADMIN.TABLE.CATEGORY}
              </th>
              <th className="text-right py-2 px-2 sm:py-4 sm:px-6 font-medium text-gray-600">
                {STRINGS.ADMIN.TABLE.PRICE}
              </th>
              <th className="text-right py-2 px-2 sm:py-4 sm:px-6 font-medium text-gray-600">
                {STRINGS.ADMIN.TABLE.STOCK}
              </th>
              <th className="text-right py-2 px-2 sm:py-4 sm:px-6 font-medium text-gray-600">
                {STRINGS.ADMIN.TABLE.STATUS}
              </th>
              <th className="text-right py-2 px-2 sm:py-4 sm:px-6 font-medium text-gray-600">
                {STRINGS.ADMIN.TABLE.ACTIONS}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products?.data?.map((product, index) => {
              if (!product) return null;
              return (
              <tr key={product._id || index} className="hover:bg-gray-50">
                <td className="py-1 px-1 sm:py-2 sm:px-2 md:py-4 md:px-6 text-center">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer w-4 h-4"
                    checked={selectedIds.includes(product._id)}
                    onChange={(e) => handleSelect(product._id, e.nativeEvent, index)}
                  />
                </td>
                <td className="py-1 px-1 sm:py-2 sm:px-2 md:py-4 md:px-6">
                  <div className="flex items-center gap-3">
                    {product.images?.[0] && (
                      <img
                        src={product.images[0].url}
                        alt={product.name}
                        className="w-8 h-8 sm:w-12 sm:h-12 object-cover rounded-lg"
                      />
                    )}
                    <div>
                      <p className="font-medium text-xs sm:text-sm line-clamp-1 max-w-[220px]" title={product.name}>{product.name}</p>
                      <p className="text-xs sm:text-sm text-gray-500">{product.sku}</p>
                      <p className="text-[10px] text-gray-400 mt-1 cursor-pointer hover:text-blue-500" 
                         onClick={() => {
                           navigator.clipboard.writeText(product._id);
                           toast.success('تم نسخ معرف المنتج (ID)');
                         }}
                         title="انسخ معرف المنتج لاستخدامه في البوكس الجاهز"
                      >
                        ID: {product._id}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-1 px-1 sm:py-2 sm:px-2 md:py-4 md:px-6 text-gray-600">
                  {(Array.isArray(product.category)
                    ? product.category.map((c) => c?.name).filter(Boolean).join(', ')
                    : product.category?.name) || '-'}
                </td>
                <td className="py-1 px-1 sm:py-2 sm:px-2 md:py-4 md:px-6">
                  <span className="font-medium text-xs sm:text-sm">
                    {formatCurrency(product.price)}
                  </span>
                  {product.oldPrice && (
                    <span className="text-xs sm:text-sm text-gray-400 line-through mr-2">
                      {formatCurrency(product.oldPrice)}
                    </span>
                  )}
                </td>
                <td className="py-1 px-1 sm:py-2 sm:px-2 md:py-4 md:px-6">
                  <span
                    className={`${product.stock < 10 ? 'text-red-600' : 'text-gray-600'} text-xs sm:text-sm`}
                  >
                    {product.stock}
                  </span>
                </td>
                <td className="py-1 px-1 sm:py-2 sm:px-2 md:py-4 md:px-6">
                  <span
                    className={`px-1 py-1 rounded-full text-xs ${
                      product.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {product.isActive ? STRINGS.ADMIN.TABLE.ACTIVE : STRINGS.ADMIN.TABLE.HIDDEN}
                  </span>
                </td>
                <td className="py-1 px-1 sm:py-2 sm:px-2 md:py-4 md:px-6">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="p-1 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title={STRINGS.ADMIN.TABLE.EDIT}
                      aria-label={STRINGS.ADMIN.TABLE.EDIT}
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product)}
                      className="p-1 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title={STRINGS.ADMIN.TABLE.DELETE}
                      aria-label={STRINGS.ADMIN.TABLE.DELETE}
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {products?.pagination && (
        <div className="p-2 sm:p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-gray-600 text-xs sm:text-sm">
            {STRINGS.ADMIN.TABLE.SHOWING} {products.data.length} {STRINGS.ADMIN.TABLE.FROM} {products.pagination.total} {STRINGS.ADMIN.TABLE.PRODUCT_SINGLE}
          </p>
          <div className="flex gap-1 sm:gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2 sm:px-4 py-1 sm:py-2 border rounded-lg disabled:opacity-50 text-xs sm:text-sm"
            >
              {STRINGS.ADMIN.TABLE.PREVIOUS}
            </button>
            <span className="px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm">
              {STRINGS.ADMIN.TABLE.PAGE} {page} {STRINGS.ADMIN.TABLE.FROM} {products.pagination.pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(products.pagination.pages, p + 1))}
              disabled={page >= products.pagination.pages}
              className="px-2 sm:px-4 py-1 sm:py-2 border rounded-lg disabled:opacity-50 text-xs sm:text-sm"
            >
              {STRINGS.ADMIN.TABLE.NEXT}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductsTable;

