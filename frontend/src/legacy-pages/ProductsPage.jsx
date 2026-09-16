import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FiGrid, FiList, FiFilter, FiX, FiChevronDown } from 'react-icons/fi';
import { productsAPI, categoriesAPI, occasionsAPI } from '../services/api';
import ProductCard from '../components/product/ProductCard';
import { STRINGS } from '../constants';

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid');

  // Get filter values from URL
  const page = parseInt(searchParams.get('page')) || 1;
  const sort = searchParams.get('sort') || 'newest';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const occasion = searchParams.get('occasion') || '';
  const recipient = searchParams.get('recipient') || '';
  const search = searchParams.get('search') || '';
  const categorySlug = searchParams.get('category') || '';
  const canBeAddedToBox = searchParams.get('canBeAddedToBox') || '';
  const isReadyBox = searchParams.get('isReadyBox') || '';

  // Close mobile filters on Escape and lock body scroll
  useEffect(() => {
    if (!showFilters) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowFilters(false);
      }
    };
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showFilters]);

  // Windowed pagination items generator
  const getPaginationItems = (current, total) => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 4) {
      return [1, 2, 3, 4, 5, '...', total];
    }
    if (current >= total - 3) {
      return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  // Fetch category info (for display only)
  const { data: categoryInfo } = useQuery({
    queryKey: ['category', categorySlug],
    queryFn: () => categoriesAPI.getBySlug(categorySlug).then((res) => res.data.data),
    enabled: !!categorySlug,
  });

  // Fetch products - use categorySlug directly
  const { data: productsData, isLoading } = useQuery({
    queryKey: [
      'products',
      {
        categorySlug,
        page,
        sort,
        minPrice,
        maxPrice,
        occasion,
        recipient,
        search,
        canBeAddedToBox,
        isReadyBox,
      },
    ],
    queryFn: () =>
      productsAPI
        .getAll({
          categorySlug,
          page,
          sort,
          minPrice,
          maxPrice,
          occasion,
          recipient,
          search,
          canBeAddedToBox: canBeAddedToBox || undefined,
          isReadyBox: isReadyBox || undefined,
        })
        .then((res) => res.data),
  });

  // Fetch categories for filter
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.getAll().then((res) => res.data.data),
  });

  // Fetch occasions for filter
  const { data: occasions } = useQuery({
    queryKey: ['occasions'],
    queryFn: () => occasionsAPI.getAll().then((res) => res.data.data),
  });

  const products = productsData?.data || [];
  const pagination = productsData?.pagination || {};

  const sortOptions = [
    { value: 'newest', label: STRINGS.PRODUCTS_PAGE.NEWEST },
    { value: 'price_asc', label: STRINGS.PRODUCTS_PAGE.PRICE_ASC },
    { value: 'price_desc', label: STRINGS.PRODUCTS_PAGE.PRICE_DESC },
    { value: 'rating', label: STRINGS.PRODUCTS_PAGE.HIGHEST_RATING },
    { value: 'bestselling', label: STRINGS.PRODUCTS_PAGE.BESTSELLING },
  ];

  const recipients = STRINGS.PRODUCTS_PAGE.RECIPIENTS;

  const priceRanges = STRINGS.PRODUCTS_PAGE.PRICE_RANGES;

  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (key === 'page') {
      if (value) {
        newParams.set('page', value);
      } else {
        newParams.delete('page');
      }
    } else {
      if (value || value === 0) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
      newParams.set('page', '1'); // Reset to first page on filter change
    }
    setSearchParams(newParams);
  };

  const updatePriceFilter = (min, max) => {
    const newParams = new URLSearchParams(searchParams);
    if (min || min === 0) {
      newParams.set('minPrice', min);
    } else {
      newParams.delete('minPrice');
    }
    if (max) {
      newParams.set('maxPrice', max);
    } else {
      newParams.delete('maxPrice');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams({ sort });
  };

  const getPriceLabel = () => {
    const range = priceRanges.find((r) => String(r.min) === minPrice && String(r.max) === maxPrice);
    if (range) return `${range.label} ${STRINGS.PRODUCT.CURRENCY}`;
    // fallback for partial matches
    if (minPrice && maxPrice) return `${minPrice} - ${maxPrice} ${STRINGS.PRODUCT.CURRENCY}`;
    if (minPrice) return `${STRINGS.PRODUCTS_PAGE.MORE_THAN} ${minPrice} ${STRINGS.PRODUCT.CURRENCY}`;
    if (maxPrice) return `${STRINGS.PRODUCTS_PAGE.LESS_THAN} ${maxPrice} ${STRINGS.PRODUCT.CURRENCY}`;
    return '';
  };

  const hasActiveFilters = categorySlug || minPrice || maxPrice || occasion || recipient;

  // Page title and description
  const pageTitle = categoryInfo?.name
    ? `${categoryInfo.name} | For You`
    : search
      ? `${STRINGS.PRODUCTS_PAGE.SEARCH_RESULTS}: ${search} | For You`
      : `${STRINGS.PRODUCTS_PAGE.ALL_PRODUCTS} | For You`;

  const pageDescription =
    categoryInfo?.seo?.metaDescription ||
    STRINGS.PRODUCTS_PAGE.SHOP_ALL;

  return (
    <>
      <div className="bg-gray-50 min-h-screen min-h-dvh">
        {/* Breadcrumb */}
        <div className="bg-white border-b">
          <div className="container-custom py-4">
            <nav className="flex items-center gap-2 text-sm">
              <Link
                to="/"
                className="text-gray-500 hover:text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600"
              >
                {STRINGS.NAV.HOME}
              </Link>
              <span className="text-gray-400">/</span>
              <Link
                to="/products"
                className="text-gray-500 hover:text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600"
              >
                {STRINGS.NAV.PRODUCTS}
              </Link>
              {categoryInfo && (
                <>
                  <span className="text-gray-400">/</span>
                  <span className="text-gray-800">{categoryInfo.name}</span>
                </>
              )}
            </nav>
          </div>
        </div>

        {/* Page Header */}
        <div className="bg-white border-b">
          <div className="container-custom py-8">
            <h1 className="text-3xl font-bold text-gray-800">
              {categoryInfo?.name || (search ? `${STRINGS.PRODUCTS_PAGE.SEARCH_RESULTS}: "${search}"` : STRINGS.PRODUCTS_PAGE.ALL_PRODUCTS)}
            </h1>
            {categoryInfo?.description && (
              <p className="text-gray-600 mt-2">{categoryInfo.description}</p>
            )}
          </div>
        </div>

        <div className="container-custom py-8">
          <div className="flex gap-8">
            {/* Sidebar Filters - Desktop */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="bg-white rounded-2xl p-6 sticky sticky-header-offset transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-gray-800">{STRINGS.PRODUCTS_PAGE.FILTER}</h2>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 hover:underline"
                    >
                      {STRINGS.COMMON.CLEAR}
                    </button>
                  )}
                </div>

                {/* Categories */}
                <div className="mb-6">
                  <h3 className="font-medium text-gray-700 mb-3">{STRINGS.PRODUCTS_PAGE.CATEGORIES}</h3>
                  <div className="flex flex-wrap gap-2">
                    {categories?.map((cat) => (
                      <button
                        key={cat._id}
                        onClick={() =>
                          updateFilter('category', categorySlug === cat.slug ? '' : cat.slug)
                        }
                        className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                          categorySlug === cat.slug
                            ? 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white border-purple-500'
                            : 'border-gray-300 text-gray-600 hover:border-purple-500'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div className="mb-6">
                  <h3 className="font-medium text-gray-700 mb-3">{STRINGS.PRODUCTS_PAGE.PRICE_RANGE}</h3>
                  <div className="space-y-2">
                    {priceRanges.map((range, index) => {
                      const isSelected =
                        minPrice === String(range.min) &&
                        (range.max === '' ? !maxPrice : maxPrice === String(range.max));
                      return (
                        <label key={index} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="price"
                            checked={isSelected}
                            onChange={() => updatePriceFilter(range.min, range.max)}
                            className="text-purple-600"
                          />
                          <span className="text-gray-600">{range.label} {STRINGS.PRODUCT.CURRENCY}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Occasions */}
                {occasions?.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-medium text-gray-700 mb-3">{STRINGS.PRODUCTS_PAGE.OCCASIONS}</h3>
                    <div className="flex flex-wrap gap-2">
                      {occasions.map((occ) => (
                        <button
                          key={occ._id}
                          onClick={() =>
                            updateFilter('occasion', occasion === occ.name ? '' : occ.name)
                          }
                          className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                            occasion === occ.name
                              ? 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white border-purple-500'
                              : 'border-gray-300 text-gray-600 hover:border-purple-500'
                          }`}
                        >
                          {occ.icon} {occ.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recipients */}
                <div>
                  <h3 className="font-medium text-gray-700 mb-3">{STRINGS.PRODUCTS_PAGE.RECIPIENT}</h3>
                  <div className="flex flex-wrap gap-2">
                    {recipients.map((rec) => (
                      <button
                        key={rec}
                        onClick={() => updateFilter('recipient', recipient === rec ? '' : rec)}
                        className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                          recipient === rec
                            ? 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white border-purple-500'
                            : 'border-gray-300 text-gray-600 hover:border-purple-500'
                        }`}
                      >
                        {rec}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Toolbar */}
              <div className="bg-white rounded-xl p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
                {/* Mobile Filter Toggle */}
                <button
                  onClick={() => setShowFilters(true)}
                  className="lg:hidden flex items-center gap-2 text-gray-700"
                >
                  <FiFilter />
                  {STRINGS.PRODUCTS_PAGE.FILTER}
                  {hasActiveFilters && (
                    <span className="w-5 h-5 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center">
                      !
                    </span>
                  )}
                </button>

                {/* Sort */}
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 hidden sm:inline">{STRINGS.PRODUCTS_PAGE.SORT_BY}:</span>
                  <select
                    value={sort}
                    onChange={(e) => updateFilter('sort', e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* View Mode */}
                <div className="hidden md:flex items-center gap-1 bg-gray-100 rounded-lg p-1" role="group" aria-label="نمط عرض المنتجات">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded transition-colors ${viewMode === 'grid' ? 'bg-white shadow text-purple-700 font-bold' : 'text-gray-600 hover:text-gray-900'}`}
                    aria-label="عرض المنتجات في شبكة"
                    aria-pressed={viewMode === 'grid'}
                  >
                    <FiGrid />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-white shadow text-purple-700 font-bold' : 'text-gray-600 hover:text-gray-900'}`}
                    aria-label="عرض المنتجات في قائمة"
                    aria-pressed={viewMode === 'list'}
                  >
                    <FiList />
                  </button>
                </div>
              </div>

              {/* Active Filters */}
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {categorySlug && categoryInfo && (
                    <span className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-3 py-1 rounded-full text-sm border border-purple-200">
                      {categoryInfo.name}
                      <button
                        onClick={() => updateFilter('category', '')}
                        className="ml-1 text-gray-500 hover:text-red-500 focus:outline-none"
                      >
                        <FiX size={14} />
                      </button>
                    </span>
                  )}
                  {occasion && (
                    <span className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-3 py-1 rounded-full text-sm border border-purple-200">
                      {occasion}
                      <button
                        onClick={() => updateFilter('occasion', '')}
                        className="ml-1 text-gray-500 hover:text-red-500 focus:outline-none"
                      >
                        <FiX size={14} />
                      </button>
                    </span>
                  )}
                  {recipient && (
                    <span className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-3 py-1 rounded-full text-sm border border-purple-200">
                      {recipient}
                      <button
                        onClick={() => updateFilter('recipient', '')}
                        className="ml-1 text-gray-500 hover:text-red-500 focus:outline-none"
                      >
                        <FiX size={14} />
                      </button>
                    </span>
                  )}
                  {(minPrice || maxPrice) && (
                    <span className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-3 py-1 rounded-full text-sm border border-purple-200">
                      {getPriceLabel()}
                      <button
                        onClick={() => updatePriceFilter('', '')}
                        className="ml-1 text-gray-500 hover:text-red-500 focus:outline-none"
                      >
                        <FiX size={14} />
                      </button>
                    </span>
                  )}
                </div>
              )}

              {/* Products Grid */}
              {isLoading ? (
                <div
                  className={`grid ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1'} gap-3 sm:gap-4 md:gap-6`}
                >
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="card p-4">
                      <div className="skeleton h-48 mb-4"></div>
                      <div className="skeleton h-4 mb-2"></div>
                      <div className="skeleton h-4 w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : products.length > 0 ? (
                <div
                  className={`grid ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1'} gap-2.5 sm:gap-4 md:gap-6 min-w-0 w-full`}
                >
                  {products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">📦</div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">{STRINGS.COMMON.NO_RESULTS}</h2>
                  <p className="text-gray-600 mb-6">{STRINGS.PRODUCTS_PAGE.NO_PRODUCTS_DESC}</p>
                  <button onClick={clearFilters} className="btn-primary">
                    {STRINGS.PRODUCTS_PAGE.CLEAR_FILTERS}
                  </button>
                </div>
              )}

              {/* Pagination */}
              {pagination.pages > 1 && (
                <nav className="flex justify-center items-center gap-1.5 sm:gap-2 mt-10" aria-label="ترقيم الصفحات">
                  <button
                    type="button"
                    onClick={() => updateFilter('page', Math.max(1, (pagination.current || 1) - 1))}
                    disabled={pagination.current <= 1}
                    aria-label="الصفحة السابقة"
                    className="px-3 py-2 rounded-lg text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    السابق
                  </button>
                  {getPaginationItems(pagination.current || 1, pagination.pages).map((p, idx) =>
                    p === '...' ? (
                      <span key={`ellipsis-${idx}`} className="px-2 py-2 text-gray-400 font-bold select-none">
                        ...
                      </span>
                    ) : (
                      <button
                        key={p}
                        type="button"
                        onClick={() => updateFilter('page', p)}
                        aria-current={pagination.current === p ? 'page' : undefined}
                        aria-label={`الصفحة ${p}`}
                        className={`min-w-[40px] h-10 px-3 rounded-lg text-sm font-bold transition-all ${
                          pagination.current === p
                            ? 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white shadow-md shadow-purple-500/20'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                  <button
                    type="button"
                    onClick={() => updateFilter('page', Math.min(pagination.pages, (pagination.current || 1) + 1))}
                    disabled={pagination.current >= pagination.pages}
                    aria-label="الصفحة التالية"
                    className="px-3 py-2 rounded-lg text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    التالي
                  </button>
                </nav>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Filters Modal */}
        {showFilters && (
          <div
            className="fixed inset-0 z-50 lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-filter-title"
          >
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
              onClick={() => setShowFilters(false)}
              aria-hidden="true"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto shadow-2xl">
              <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
                <h2 id="mobile-filter-title" className="font-bold text-lg text-gray-900">
                  {STRINGS.PRODUCTS_PAGE.FILTER}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowFilters(false)}
                  aria-label="إغلاق نافذة التصفية"
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <FiX size={24} />
                </button>
              </div>
              <div className="p-4">
                {/* Same filter content as sidebar */}
                <div className="space-y-6">
                  {/* Price */}
                  <div>
                    <h3 className="font-medium text-gray-700 mb-3">{STRINGS.PRODUCTS_PAGE.PRICE_RANGE}</h3>
                    <div className="flex flex-wrap gap-2">
                      {priceRanges.map((range, index) => {
                        const isSelected =
                          minPrice === String(range.min) &&
                          (range.max === '' ? !maxPrice : maxPrice === String(range.max));
                        return (
                          <button
                            key={index}
                            onClick={() => {
                              updatePriceFilter(range.min, range.max);
                              setShowFilters(false);
                            }}
                            className={`px-4 py-2 rounded-full border ${
                              isSelected
                                ? 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white border-purple-500'
                                : 'border-gray-300'
                            }`}
                          >
                            {range.label} {STRINGS.PRODUCT.CURRENCY}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Categories Filter */}
                  <div>
                    <h3 className="font-medium text-gray-700 mb-3">{STRINGS.PRODUCTS_PAGE.CATEGORIES}</h3>
                    <div className="flex flex-wrap gap-2">
                      {categories?.map((cat) => (
                        <button
                          key={cat._id}
                          onClick={() => {
                            updateFilter('category', categorySlug === cat.slug ? '' : cat.slug);
                            setShowFilters(false);
                          }}
                          className={`px-4 py-2 rounded-full border ${
                            categorySlug === cat.slug
                              ? 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white border-purple-500'
                              : 'border-gray-300'
                          }`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Occasions */}
                  {occasions?.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-700 mb-3">{STRINGS.PRODUCTS_PAGE.OCCASIONS}</h3>
                      <div className="flex flex-wrap gap-2">
                        {occasions.map((occ) => (
                          <button
                            key={occ._id}
                            onClick={() => {
                              updateFilter('occasion', occasion === occ.name ? '' : occ.name);
                              setShowFilters(false);
                            }}
                            className={`px-4 py-2 rounded-full border ${
                              occasion === occ.name
                                ? 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white border-purple-500'
                                : 'border-gray-300'
                            }`}
                          >
                            {occ.icon} {occ.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recipients */}
                  <div>
                    <h3 className="font-medium text-gray-700 mb-3">{STRINGS.PRODUCTS_PAGE.RECIPIENT}</h3>
                    <div className="flex flex-wrap gap-2">
                      {recipients.map((rec) => (
                        <button
                          key={rec}
                          onClick={() => {
                            updateFilter('recipient', recipient === rec ? '' : rec);
                            setShowFilters(false);
                          }}
                          className={`px-4 py-2 rounded-full border ${
                            recipient === rec
                              ? 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white border-purple-500'
                              : 'border-gray-300'
                          }`}
                        >
                          {rec}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t flex gap-4">
                <button
                  onClick={() => {
                    clearFilters();
                    setShowFilters(false);
                  }}
                  className="flex-1 btn-outline"
                >
                  {STRINGS.COMMON.CLEAR}
                </button>
                <button onClick={() => setShowFilters(false)} className="flex-1 btn-primary">
                  {STRINGS.PRODUCTS_PAGE.SHOW_RESULTS}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ProductsPage;
