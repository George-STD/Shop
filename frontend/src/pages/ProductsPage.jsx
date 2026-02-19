import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FiGrid, FiList, FiFilter, FiX, FiChevronDown } from 'react-icons/fi'
import { productsAPI, categoriesAPI } from '../services/api'
import ProductCard from '../components/product/ProductCard'

const ProductsPage = () => {
  const { category: categorySlug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState('grid')
  
  // Get filter values from URL
  const page = parseInt(searchParams.get('page')) || 1
  const sort = searchParams.get('sort') || 'newest'
  const minPrice = searchParams.get('minPrice') || ''
  const maxPrice = searchParams.get('maxPrice') || ''
  const occasion = searchParams.get('occasion') || ''
  const recipient = searchParams.get('recipient') || ''
  const search = searchParams.get('search') || ''

  // Fetch category info (for display only)
  const { data: categoryInfo } = useQuery({
    queryKey: ['category', categorySlug],
    queryFn: () => categoriesAPI.getBySlug(categorySlug).then(res => res.data.data),
    enabled: !!categorySlug
  })

  // Fetch products - use categorySlug directly
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', { categorySlug, page, sort, minPrice, maxPrice, occasion, recipient, search }],
    queryFn: () => productsAPI.getAll({
      categorySlug,
      page,
      sort,
      minPrice,
      maxPrice,
      occasion,
      recipient,
      search
    }).then(res => res.data)
  })

  // Fetch categories for filter
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.getAll().then(res => res.data.data)
  })

  const products = productsData?.data || []
  const pagination = productsData?.pagination || {}

  const sortOptions = [
    { value: 'newest', label: '??????' },
    { value: 'price_asc', label: '?????: ?? ????? ??????' },
    { value: 'price_desc', label: '?????: ?? ?????? ?????' },
    { value: 'rating', label: '?????? ???????' },
    { value: 'bestselling', label: '?????? ??????' },
  ]

  const occasions = [
    '??? ?????', '????', '?????', '??? ????', '??? ????', 
    '??? ????', '????', '?????', '???? ????', '???'
  ]

  const recipients = [
    '????', '???', '??', '??', '???', '??', 
    '?????', '????', '?????', '??????'
  ]

  const priceRanges = [
    { label: '??? ?? 200', min: 0, max: 200 },
    { label: '200 - 500', min: 200, max: 500 },
    { label: '500 - 1000', min: 500, max: 1000 },
    { label: '???? ?? 1000', min: 1000, max: '' },
  ]

  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams)
    if (value) {
      newParams.set(key, value)
    } else {
      newParams.delete(key)
    }
    newParams.set('page', '1') // Reset to first page on filter change
    setSearchParams(newParams)
  }

  const clearFilters = () => {
    setSearchParams({ sort })
  }

  const clearPriceFilter = () => {
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('minPrice')
    newParams.delete('maxPrice')
    newParams.set('page', '1')
    setSearchParams(newParams)
  }

  const hasActiveFilters = minPrice || maxPrice || occasion || recipient

  // Page title and description
  const pageTitle = categoryInfo?.name 
    ? `${categoryInfo.name} | For You`
    : search 
      ? `????? ?????: ${search} | For You`
      : '???? ???????? | For You'

  const pageDescription = categoryInfo?.seo?.metaDescription 
    || `???? ${categoryInfo?.name || '???? ???????'} ?? ???? ?????. ????? ???? ????? ????? ???.`

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={categoryInfo?.seo?.keywords?.join(', ') || '?????? ???? ?????? ????? ???'} />
        <link rel="canonical" href={`https://hadaya.com/products${categorySlug ? `/${categorySlug}` : ''}`} />
      </Helmet>

      <div className="bg-gray-50 min-h-screen">
        {/* Breadcrumb */}
        <div className="bg-white border-b">
          <div className="container-custom py-4">
            <nav className="flex items-center gap-2 text-sm">
              <Link to="/" className="text-gray-500 hover:text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">????????</Link>
              <span className="text-gray-400">/</span>
              <Link to="/products" className="text-gray-500 hover:text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">????????</Link>
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
              {categoryInfo?.name || (search ? `????? ?????: "${search}"` : '???? ????????')}
            </h1>
            {categoryInfo?.description && (
              <p className="text-gray-600 mt-2">{categoryInfo.description}</p>
            )}
            {pagination.total > 0 && (
              <p className="text-gray-500 mt-2">
                ??? {products.length} ?? {pagination.total} ????
              </p>
            )}
          </div>
        </div>

        <div className="container-custom py-8">
          <div className="flex gap-8">
            {/* Sidebar Filters - Desktop */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="bg-white rounded-2xl p-6 sticky top-24">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-gray-800">???????</h2>
                  {hasActiveFilters && (
                    <button 
                      onClick={clearFilters}
                      className="text-sm text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 hover:underline"
                    >
                      ??? ????
                    </button>
                  )}
                </div>

                {/* Categories */}
                <div className="mb-6">
                  <h3 className="font-medium text-gray-700 mb-3">??????</h3>
                  <ul className="space-y-2">
                    <li>
                      <Link 
                        to="/products"
                        className={`block py-1 ${!categorySlug ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 font-medium' : 'text-gray-600 hover:text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600'}`}
                      >
                        ???? ??????
                      </Link>
                    </li>
                    {categories?.map(cat => (
                      <li key={cat._id}>
                        <Link 
                          to={`/products/${cat.slug}`}
                          className={`block py-1 ${categorySlug === cat.slug ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 font-medium' : 'text-gray-600 hover:text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600'}`}
                        >
                          {cat.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Price Range */}
                <div className="mb-6">
                  <h3 className="font-medium text-gray-700 mb-3">?????</h3>
                  <div className="space-y-2">
                    {priceRanges.map((range, index) => (
                      <label key={index} className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio"
                          name="price"
                          checked={minPrice === String(range.min) && maxPrice === String(range.max)}
                          onChange={() => {
                            updateFilter('minPrice', range.min)
                            updateFilter('maxPrice', range.max)
                          }}
                          className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600"
                        />
                        <span className="text-gray-600">{range.label} ?.?</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Occasions */}
                <div className="mb-6">
                  <h3 className="font-medium text-gray-700 mb-3">????????</h3>
                  <div className="space-y-2">
                    {occasions.map((occ) => (
                      <label key={occ} className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio"
                          name="occasion"
                          checked={occasion === occ}
                          onChange={() => updateFilter('occasion', occ)}
                          className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600"
                        />
                        <span className="text-gray-600">{occ}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Recipients */}
                <div>
                  <h3 className="font-medium text-gray-700 mb-3">???? ??</h3>
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
            <div className="flex-1">
              {/* Toolbar */}
              <div className="bg-white rounded-xl p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
                {/* Mobile Filter Toggle */}
                <button 
                  onClick={() => setShowFilters(true)}
                  className="lg:hidden flex items-center gap-2 text-gray-700"
                >
                  <FiFilter />
                  ???????
                  {hasActiveFilters && (
                    <span className="w-5 h-5 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center">
                      !
                    </span>
                  )}
                </button>

                {/* Sort */}
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 hidden sm:inline">????? ???:</span>
                  <select
                    value={sort}
                    onChange={(e) => updateFilter('sort', e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {sortOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* View Mode */}
                <div className="hidden md:flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow' : ''}`}
                  >
                    <FiGrid />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow' : ''}`}
                  >
                    <FiList />
                  </button>
                </div>
              </div>

              {/* Active Filters */}
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {occasion && (
                    <span className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-100 to-pink-100 text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-pink-700 px-3 py-1 rounded-full text-sm">
                      {occasion}
                      <button onClick={() => updateFilter('occasion', '')}>
                        <FiX size={14} />
                      </button>
                    </span>
                  )}
                  {recipient && (
                    <span className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-100 to-pink-100 text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-pink-700 px-3 py-1 rounded-full text-sm">
                      ???? ?? {recipient}
                      <button onClick={() => updateFilter('recipient', '')}>
                        <FiX size={14} />
                      </button>
                    </span>
                  )}
                  {(minPrice || maxPrice) && (
                    <span className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-100 to-pink-100 text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-pink-700 px-3 py-1 rounded-full text-sm">
                      {minPrice && maxPrice ? `${minPrice} - ${maxPrice} ?.?` : minPrice ? `???? ?? ${minPrice} ?.?` : `??? ?? ${maxPrice} ?.?`}
                      <button onClick={clearPriceFilter}>
                        <FiX size={14} />
                      </button>
                    </span>
                  )}
                </div>
              )}

              {/* Products Grid */}
              {isLoading ? (
                <div className={`grid ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1'} gap-6`}>
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="card p-4">
                      <div className="skeleton h-48 mb-4"></div>
                      <div className="skeleton h-4 mb-2"></div>
                      <div className="skeleton h-4 w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : products.length > 0 ? (
                <div className={`grid ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1'} gap-6`}>
                  {products.map(product => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">??</div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">?? ???? ??????</h2>
                  <p className="text-gray-600 mb-6">
                    ??? ????? ??????? ?? ????? ?????? ????
                  </p>
                  <button 
                    onClick={clearFilters}
                    className="btn-primary"
                  >
                    ??? ???????
                  </button>
                </div>
              )}

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  {[...Array(pagination.pages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => updateFilter('page', i + 1)}
                      className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                        pagination.current === i + 1
                          ? 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Filters Modal */}
        {showFilters && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilters(false)} />
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[80vh] overflow-y-auto">
              <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white">
                <h2 className="font-bold text-lg">???????</h2>
                <button onClick={() => setShowFilters(false)}>
                  <FiX size={24} />
                </button>
              </div>
              <div className="p-4">
                {/* Same filter content as sidebar */}
                <div className="space-y-6">
                  {/* Price */}
                  <div>
                    <h3 className="font-medium text-gray-700 mb-3">?????</h3>
                    <div className="flex flex-wrap gap-2">
                      {priceRanges.map((range, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            updateFilter('minPrice', range.min)
                            updateFilter('maxPrice', range.max)
                          }}
                          className={`px-4 py-2 rounded-full border ${
                            minPrice === String(range.min) 
                              ? 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white border-purple-500' 
                              : 'border-gray-300'
                          }`}
                        >
                          {range.label} ?.?
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Occasions */}
                  <div>
                    <h3 className="font-medium text-gray-700 mb-3">????????</h3>
                    <div className="flex flex-wrap gap-2">
                      {occasions.map((occ) => (
                        <button
                          key={occ}
                          onClick={() => updateFilter('occasion', occasion === occ ? '' : occ)}
                          className={`px-4 py-2 rounded-full border ${
                            occasion === occ 
                              ? 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white border-purple-500' 
                              : 'border-gray-300'
                          }`}
                        >
                          {occ}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Recipients */}
                  <div>
                    <h3 className="font-medium text-gray-700 mb-3">???? ??</h3>
                    <div className="flex flex-wrap gap-2">
                      {recipients.map((rec) => (
                        <button
                          key={rec}
                          onClick={() => updateFilter('recipient', recipient === rec ? '' : rec)}
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
                  onClick={clearFilters}
                  className="flex-1 btn-outline"
                >
                  ??? ????
                </button>
                <button 
                  onClick={() => setShowFilters(false)}
                  className="flex-1 btn-primary"
                >
                  ??? ???????
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default ProductsPage

