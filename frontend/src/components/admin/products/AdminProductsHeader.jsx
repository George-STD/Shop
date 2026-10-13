import React from 'react';
import { FiSearch, FiCamera, FiPlus } from 'react-icons/fi';
import { STRINGS } from '../../../constants';

const AdminProductsHeader = ({
  search,
  setSearch,
  categoryFilter,
  setCategoryFilter,
  setPage,
  categories,
  setShowScanner,
  setShowAiUploader,
  setShowModal,
  resetForm,
}) => {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 space-y-4">
      {/* Search and Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <FiSearch className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder={STRINGS.ADMIN.SEARCH}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (setPage) setPage(1);
            }}
            className="w-full pr-10 pl-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
          />
        </div>

        {/* Category Filter */}
        <div className="w-full sm:w-auto min-w-[160px]">
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              if (setPage) setPage(1);
            }}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all cursor-pointer"
          >
            <option value="">{STRINGS.ADMIN.ALL_CATEGORIES}</option>
            {categories?.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center pt-1 border-t border-gray-50 sm:border-0 sm:pt-0">
        <button
          type="button"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 hover:from-purple-600 hover:via-fuchsia-600 hover:to-pink-600 text-white font-medium text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-sm transition-all active:scale-95"
        >
          <FiPlus className="w-4 h-4 shrink-0" />
          <span>{STRINGS.ADMIN.ADD_PRODUCT}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowAiUploader(true)}
          className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium text-xs sm:text-sm px-3.5 py-2.5 rounded-xl shadow-sm transition-all active:scale-95"
          title="إضافة جماعية بالذكاء الاصطناعي"
        >
          <span>إضافة ذكية</span>
          <span>🤖</span>
        </button>

        <button
          type="button"
          onClick={() => setShowScanner(true)}
          className="flex-none sm:flex-initial flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-medium text-xs sm:text-sm px-3.5 py-2.5 rounded-xl shadow-sm transition-all active:scale-95"
          title={STRINGS.ADMIN.ADD_BY_SERIAL}
        >
          <FiCamera className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">{STRINGS.ADMIN.ADD_BY_SERIAL}</span>
          <span className="sm:hidden">باركود</span>
        </button>
      </div>
    </div>
  );
};

export default AdminProductsHeader;
