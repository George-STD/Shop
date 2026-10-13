import Image from 'next/image';
import TableSkeleton from '../TableSkeleton';
import React from 'react';
import { FiEdit2, FiTrash2, FiPackage } from 'react-icons/fi';
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
      <TableSkeleton
        headers={[
          STRINGS.ADMIN.TABLE.PRODUCT,
          STRINGS.ADMIN.TABLE.CATEGORY,
          STRINGS.ADMIN.TABLE.PRICE,
          STRINGS.ADMIN.TABLE.STOCK,
          STRINGS.ADMIN.TABLE.STATUS,
          STRINGS.ADMIN.TABLE.ACTIONS,
        ]}
        rows={10}
        hasCheckbox={true}
        hasThumbnail={true}
        minHeight="min-h-[600px]"
      />
    );
  }

  const allIds = products?.data?.map(p => p._id) || [];
  const isAllSelected = allIds.length > 0 && allIds.every(id => selectedIds.includes(id));

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 min-h-[600px] flex flex-col justify-between">
      {/* --- Mobile Card View (block md:hidden) --- */}
      <div className="block md:hidden">
        {/* Mobile Header: Select All */}
        <div className="p-3 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700 select-none">
            <input 
              type="checkbox" 
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer w-4 h-4"
              checked={isAllSelected}
              onChange={(e) => handleSelectAll(e.target.checked, allIds)}
            />
            <span>تحديد الكل ({selectedIds.length} محدد)</span>
          </label>
          <span className="text-[11px] text-gray-400">
            {products?.data?.length || 0} منتجات
          </span>
        </div>

        {/* Mobile Cards List */}
        <div className="p-3 space-y-3">
          {(!products?.data || products.data.length === 0) ? (
            <div className="text-center py-16 text-gray-500">
              <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-1">
                  <FiPackage className="w-6 h-6" />
                </div>
                <p className="font-bold text-gray-700 text-sm">لا توجد منتجات تطابق هذا البحث أو التصنيف</p>
                <p className="text-xs text-gray-400">جرب تغيير كلمات البحث أو اختيار فئة أخرى</p>
              </div>
            </div>
          ) : (
            products.data.map((product, index) => {
              if (!product) return null;
              const isSelected = selectedIds.includes(product._id);
              const categoryNames = Array.isArray(product.category)
                ? product.category.map((c) => c?.name).filter(Boolean).join(', ')
                : product.category?.name;

              return (
                <div
                  key={product._id || index}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-purple-50/60 border-purple-200 ring-1 ring-purple-300'
                      : 'bg-white border-gray-100 shadow-sm'
                  }`}
                >
                  {/* Top: Checkbox, Thumbnail, Title & Category */}
                  <div className="flex items-start gap-3">
                    <input 
                      type="checkbox" 
                      className="mt-1 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer w-4 h-4 shrink-0"
                      checked={isSelected}
                      onChange={(e) => handleSelect(product._id, e.nativeEvent, index)}
                    />
                    <div className="relative w-14 h-14 min-w-[56px] min-h-[56px] rounded-xl overflow-hidden bg-gray-100 border border-gray-200/60 shrink-0">
                      {product.images?.[0]?.url ? (
                        <Image
                          fill
                          sizes="56px"
                          src={product.images[0].url}
                          alt={product.name || 'صورة المنتج'}
                          className="object-cover"
                          loading={index < 4 ? 'eager' : 'lazy'}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-base">
                          📦
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1.5">
                        <h4 className="font-bold text-xs text-gray-900 line-clamp-1" title={product.name}>
                          {product.name}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                            product.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {product.isActive ? STRINGS.ADMIN.TABLE.ACTIVE : STRINGS.ADMIN.TABLE.HIDDEN}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                          {categoryNames || 'بدون فئة'}
                        </span>
                        {product.sku && (
                          <span className="text-[10px] text-gray-400 font-mono">
                            {product.sku}
                          </span>
                        )}
                      </div>

                      <p
                        className="text-[10px] text-purple-600 mt-1 cursor-pointer hover:underline flex items-center gap-1"
                        onClick={() => {
                          navigator.clipboard.writeText(product._id);
                          toast.success('تم نسخ معرف المنتج (ID)');
                        }}
                        title="انسخ معرف المنتج لاستخدامه في البوكس الجاهز"
                      >
                        <span>ID: {product._id?.substring(0, 8)}...</span>
                        <span className="text-[9px] text-gray-400">(نسخ)</span>
                      </p>
                    </div>
                  </div>

                  {/* Middle: Price & Stock */}
                  <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-gray-100 text-xs">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-extrabold text-sm text-gray-900">
                        {formatCurrency(product.price)}
                      </span>
                      {product.oldPrice && (
                        <span className="text-[11px] text-gray-400 line-through">
                          {formatCurrency(product.oldPrice)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-gray-500 text-[11px]">المخزون:</span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded-md text-xs ${
                          product.stock < 10 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {product.stock}
                      </span>
                    </div>
                  </div>

                  {/* Bottom: Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2 mt-2 border-t border-gray-50">
                    <button
                      type="button"
                      onClick={() => handleEdit(product)}
                      className="py-2 px-3 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-blue-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors active:scale-95"
                    >
                      <FiEdit2 className="w-3.5 h-3.5" />
                      <span>{STRINGS.ADMIN.TABLE.EDIT}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(product)}
                      className="py-2 px-3 bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors active:scale-95"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                      <span>{STRINGS.ADMIN.TABLE.DELETE}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* --- Desktop Table View (hidden md:block) --- */}
      <div className="hidden md:block overflow-x-auto custom-scrollbar">
        <table className="w-full text-xs sm:text-sm min-w-[700px]">
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
          <tbody className="divide-y divide-gray-100">
            {(!products?.data || products.data.length === 0) ? (
              <tr>
                <td colSpan={7} className="text-center py-16 text-gray-500">
                  <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-1">
                      <FiPackage className="w-6 h-6" />
                    </div>
                    <p className="font-bold text-gray-700 text-sm sm:text-base">لا توجد منتجات تطابق هذا البحث أو التصنيف</p>
                    <p className="text-xs text-gray-400">جرب تغيير كلمات البحث أو اختيار فئة أخرى</p>
                  </div>
                </td>
              </tr>
            ) : (
              products.data.map((product, index) => {
              if (!product) return null;
              return (
              <tr key={product._id || index} className="hover:bg-gray-50 h-14 sm:h-16">
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
                    <div className="relative w-10 h-10 sm:w-12 sm:h-12 min-w-[40px] min-h-[40px] sm:min-w-[48px] sm:min-h-[48px] flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      {product.images?.[0]?.url ? (
                        <Image
                          fill
                          sizes="(max-width: 640px) 40px, 48px"
                          src={product.images[0].url}
                          alt={product.name || 'صورة المنتج'}
                          className="object-cover"
                          loading={index < 8 ? 'eager' : 'lazy'}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs bg-gray-100">
                          📦
                        </div>
                      )}
                    </div>
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
            })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {products?.pagination && (
        <div className="p-2 sm:p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2 min-h-[56px] shrink-0 bg-gray-50/50">
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

