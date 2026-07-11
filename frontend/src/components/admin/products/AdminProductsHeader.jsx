import React from 'react';
import { FiSearch, FiCamera, FiPlus } from 'react-icons/fi';
import { STRINGS } from '../../../constants';

const AdminProductsHeader = ({
  search,
  setSearch,
  categoryFilter,
  setCategoryFilter,
  categories,
  setShowScanner,
  setShowModal,
  resetForm,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-4 flex-1">
        {/* Search */}
        <div className="relative min-w-[200px]">
          <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={STRINGS.ADMIN.SEARCH}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
        >
          <option value="">{STRINGS.ADMIN.ALL_CATEGORIES}</option>
          {categories?.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setShowScanner(true)}
          className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:from-blue-600 hover:to-indigo-600"
        >
          <FiCamera />
          <span className="hidden sm:inline">{STRINGS.ADMIN.ADD_BY_SERIAL}</span>
        </button>

        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:from-purple-600 hover:via-fuchsia-600 hover:to-pink-600"
        >
          <FiPlus />
          <span className="hidden sm:inline">{STRINGS.ADMIN.ADD_PRODUCT}</span>
        </button>
      </div>
    </div>
  );
};

export default AdminProductsHeader;
