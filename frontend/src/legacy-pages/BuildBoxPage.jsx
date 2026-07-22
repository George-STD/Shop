import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FiGift,
  FiX,
  FiShoppingCart,
  FiRefreshCw,
  FiTrash2,
  FiSearch,
  FiPlus,
  FiFilter,
  FiGrid,
  FiCheck,
  FiLayers,
} from 'react-icons/fi';
import { productsAPI, categoriesAPI } from '../services/api';
import { useBuildBoxStore, useCartStore } from '../store';
import { BUSINESS_CONFIG } from '../constants/config';
import { STRINGS } from '../constants';
import toast from 'react-hot-toast';

const BuildBoxPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { items: boxItems, addItem, removeItem, clearBox, getTotal } = useBuildBoxStore();
  const maxItems = BUSINESS_CONFIG.BOX_MAX_ITEMS;
  const minItems = BUSINESS_CONFIG.BOX_MIN_ITEMS;
  const { addItem: addCartItem } = useCartStore();
  const navigate = useNavigate();

  // null = Show All Products
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Fetch box categories
  const { data: categoriesData, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['box-categories'],
    queryFn: () => categoriesAPI.getAll({ showInBox: 'true' }).then((res) => res.data.data),
  });

  // Fetch box-eligible products (defaults to ALL products if no category is selected)
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', { canBeAddedToBox: 'true', category: selectedCategory, search: searchTerm }],
    queryFn: () => {
      const params = { canBeAddedToBox: 'true' };
      if (selectedCategory) params.category = selectedCategory;
      if (searchTerm) params.search = searchTerm;
      return productsAPI.getAll(params).then((res) => res.data);
    },
  });

  const products = productsData?.data || [];
  const categories = categoriesData || [];

  const formatPrice = (price) => new Intl.NumberFormat('ar-EG').format(price);

  const handleFinishBox = () => {
    if (boxItems.length < minItems) {
      toast.error(`${STRINGS.BUILD_BOX_PAGE.MIN_ITEMS_ERROR} ${minItems} ${STRINGS.PRODUCTS_PAGE.PRODUCT_COUNT_LABEL}`);
      return;
    }

    const boxId = `box_${Date.now()}`;
    let successCount = 0;

    boxItems.forEach((item) => {
      const result = addCartItem(
        {
          _id: item.id,
          name: item.name,
          slug: item.slug,
          price: item.price,
          images: [{ url: item.image }],
          stock: item.stock,
        },
        1,
        {
          boxId: boxId,
          boxDiscount: item.boxDiscount
        }
      );

      if (result.success) {
        successCount++;
      }
    });

    if (successCount > 0) {
      toast.success(`${STRINGS.BUILD_BOX_PAGE.BOX_ADDED_SUCCESS} (${successCount} ${STRINGS.BUILD_BOX_PAGE.TO_CART}`);
      clearBox();
      navigate('/cart');
    } else {
      toast.error(STRINGS.BUILD_BOX_PAGE.BOX_ADD_ERROR);
    }
  };

  const handleClearBox = () => {
    if (window.confirm(STRINGS.BUILD_BOX_PAGE.CONFIRM_CLEAR_BOX)) {
      clearBox();
      toast.success(STRINGS.BUILD_BOX_PAGE.BOX_CLEARED);
    }
  };

  const handleAddToBox = (product) => {
    if (boxItems.length >= maxItems) {
      toast.error(`${STRINGS.BUILD_BOX_PAGE.MAX_ITEMS_REACHED} (${maxItems} ${STRINGS.PRODUCTS_PAGE.PRODUCT_COUNT_LABEL})`);
      return;
    }
    if (product.stock === 0) {
      toast.error(STRINGS.BUILD_BOX_PAGE.PRODUCT_UNAVAILABLE);
      return;
    }

    const existingCount = boxItems.filter((item) => item.id === product._id).length;
    if (existingCount >= product.stock) {
      toast.error(`${STRINGS.BUILD_BOX_PAGE.MAX_STOCK_REACHED} ${product.stock} ${STRINGS.COMMON.ONLY}`);
      return;
    }

    addItem({
      id: product._id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.images[0]?.url,
      stock: product.stock,
      boxDiscount: product.boxDiscount
    });
    toast.success(STRINGS.BUILD_BOX_PAGE.ADDED_TO_BOX);
  };

  const progressPercent = Math.round((boxItems.length / maxItems) * 100);

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-12 px-4 text-center">
        <h1 className="text-3xl md:text-5xl font-bold mb-4 flex items-center justify-center gap-3">
          <FiGift />
          {STRINGS.BUILD_BOX_PAGE.HERO_TITLE}
        </h1>
        <p className="text-purple-100 max-w-2xl mx-auto text-lg">
          {STRINGS.BUILD_BOX_PAGE.HERO_DESC_1} {minItems} {STRINGS.BUILD_BOX_PAGE.HERO_DESC_2}
          ({BUSINESS_CONFIG.BOX_BASE_PRICE_EGP} {STRINGS.PRODUCT.CURRENCY}),
          <br />
          <span className="font-bold text-white bg-purple-800/50 px-3 py-1 rounded-lg inline-block mt-2">
            استمتع بخصومات حصرية وتوفير كبير على جميع المنتجات داخل البوكس!
          </span>
        </p>
      </div>

      <div className="container-custom py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column: Products List */}
          <div className="flex-1">
            {/* Category Filter Banner / Navigation */}
            <div className="bg-gradient-to-r from-purple-50/90 via-white to-pink-50/90 rounded-2xl p-4 md:p-5 mb-6 border border-purple-100 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-base shadow-md shadow-purple-500/20">
                    <FiFilter />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900 text-base md:text-lg">
                      اختر الفئة لتضييق البحث:
                    </h2>
                    <p className="text-xs text-gray-500">
                      تصفح جميع المنتجات أو اختر فئة محددة لإظهار منتجاتها فقط
                    </p>
                  </div>
                </div>
                {selectedCategory && (
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="self-start sm:self-auto text-xs font-bold text-purple-700 bg-white hover:bg-purple-50 border border-purple-200 px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1 shadow-sm"
                  >
                    <FiRefreshCw className="w-3 h-3" />
                    عرض جميع المنتجات
                  </button>
                )}
              </div>

              {/* Category Options List */}
              <div className="flex gap-2.5 overflow-x-auto pb-1 pt-1 scrollbar-hide -mx-1 px-1">
                {/* All Products Option */}
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                    !selectedCategory
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-500/25 ring-2 ring-purple-400/30'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-purple-300 hover:text-purple-700 shadow-sm'
                  }`}
                >
                  <FiGrid className="w-4 h-4" />
                  <span>جميع المنتجات</span>
                  {!selectedCategory && <FiCheck className="w-4 h-4" />}
                </button>

                {/* Categories List */}
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat._id;
                  return (
                    <button
                      key={cat._id}
                      onClick={() => setSelectedCategory(cat._id)}
                      className={`shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                        isSelected
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-500/25 ring-2 ring-purple-400/30'
                          : 'bg-white text-gray-700 border border-gray-200 hover:border-purple-300 hover:text-purple-700 shadow-sm'
                      }`}
                    >
                      {cat.image ? (
                        <img src={cat.image} alt={cat.name} className="w-5 h-5 object-cover rounded-md" />
                      ) : (
                        <FiLayers className="w-4 h-4 opacity-70" />
                      )}
                      <span>{cat.name}</span>
                      {isSelected && <FiCheck className="w-4 h-4" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search Input */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 sticky top-24 z-10">
              <div className="relative">
                <input
                  type="text"
                  placeholder={STRINGS.BUILD_BOX_PAGE.SEARCH_PLACEHOLDER}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-purple-500 transition-all"
                />
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {isLoading || isCategoriesLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl h-64 skeleton border border-gray-100"
                  ></div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{STRINGS.COMMON.NO_RESULTS}</h3>
                <p className="text-gray-500">{STRINGS.BUILD_BOX_PAGE.NO_PRODUCTS_DESC}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {products.map((product) => (
                  <div
                    key={product._id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:border-purple-200 transition-all group flex flex-col"
                  >
                    <Link
                      to={`/product/${product.slug}`}
                      target="_blank"
                      className="relative h-48 overflow-hidden block"
                    >
                      <img
                        src={product.images[0]?.url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {product.stock === 0 && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                            {STRINGS.PRODUCT.OUT_OF_STOCK}
                          </span>
                        </div>
                      )}
                    </Link>
                    <div className="p-4 flex flex-col flex-1">
                      <Link
                        to={`/product/${product.slug}`}
                        target="_blank"
                        className="font-bold text-gray-800 line-clamp-1 hover:text-purple-600 mb-1"
                      >
                        {product.name}
                      </Link>
                      <div className="mb-4">
                        <span className="text-gray-400 line-through text-sm">
                          {formatPrice(product.price)} {STRINGS.PRODUCT.CURRENCY}
                        </span>
                        <p className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 font-bold text-lg">
                          {formatPrice(
                            product.price * (1 - (product.boxDiscount !== undefined ? product.boxDiscount : 25) / 100)
                          )}{' '}
                          {STRINGS.PRODUCT.CURRENCY}
                        </p>
                      </div>

                      <button
                        onClick={() => handleAddToBox(product)}
                        disabled={product.stock === 0}
                        className="mt-auto w-full btn-outline border-purple-200 text-purple-600 hover:bg-purple-50 disabled:opacity-50 py-2 rounded-xl flex items-center justify-center gap-2"
                      >
                        <FiPlus />
                        {STRINGS.BUILD_BOX_PAGE.ADD_TO_BOX}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Current Box Status */}
          <div className="lg:w-96 flex-shrink-0">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sticky top-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 text-xl">
                  <FiGift />
                </div>
                <div>
                  <h2 className="font-bold text-xl text-gray-800">{STRINGS.BUILD_BOX_PAGE.BOX_CONTENTS}</h2>
                  <p className="text-sm text-gray-500">{boxItems.length} {STRINGS.BUILD_BOX_PAGE.PRODUCTS_IN_BOX}</p>
                </div>
              </div>

              {/* Progress Bar Removed */}

              {/* Visual Box Representation */}
              <div className="mb-6 bg-purple-50/50 rounded-2xl p-4 flex flex-col items-center justify-center border border-purple-100/50 overflow-hidden relative">
                <p className="text-xs font-bold text-purple-600 mb-4 bg-purple-100 px-3 py-1 rounded-full">
                  {STRINGS.BUILD_BOX_PAGE.BOX_PREVIEW}
                </p>
                <div
                  className="relative transition-all duration-700 ease-in-out flex items-center justify-center"
                  style={{
                    width:
                      boxItems.length === 0
                        ? '160px'
                        : boxItems.length <= 2
                          ? '200px'
                          : boxItems.length <= 4
                            ? '240px'
                            : boxItems.length <= 7
                              ? '280px'
                              : '320px',
                    height:
                      boxItems.length === 0
                        ? '160px'
                        : boxItems.length <= 2
                          ? '200px'
                          : boxItems.length <= 4
                            ? '240px'
                            : boxItems.length <= 7
                              ? '280px'
                              : '320px',
                  }}
                >
                  {/* Empty Box Image */}
                  <img
                    src="/images/empty_box.png"
                    alt="Empty Box"
                    className="absolute inset-0 w-full h-full object-contain mix-blend-multiply opacity-90 drop-shadow-xl"
                  />

                  {/* Items inside the box */}
                  <div
                    className="absolute inset-0 flex flex-wrap items-center justify-center content-center gap-1 p-6"
                    style={{ zIndex: 10 }}
                  >
                    {boxItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="transition-all duration-500 animate-fadeInUp hover:scale-110 cursor-pointer relative group drop-shadow-lg"
                        style={{
                          width:
                            boxItems.length <= 2
                              ? '40%'
                              : boxItems.length <= 4
                                ? '35%'
                                : boxItems.length <= 7
                                  ? '28%'
                                  : '20%',
                          aspectRatio: '1/1',
                        }}
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover rounded-lg border-2 border-white/50 bg-white"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeItem(idx);
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                        >
                          <FiX size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Box Items List */}
              <div className="space-y-3 mb-6 max-h-[25vh] overflow-y-auto pr-2 custom-scrollbar">
                {boxItems.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-400 font-medium">{STRINGS.BUILD_BOX_PAGE.BOX_EMPTY}</p>
                    <p className="text-xs text-gray-400 mt-1">{STRINGS.BUILD_BOX_PAGE.START_ADDING}</p>
                  </div>
                ) : (
                  boxItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm relative group"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-xl"
                      />
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <p className="font-medium text-sm text-gray-800 line-clamp-1">
                          {item.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-bold text-sm text-purple-600">
                            {formatPrice(
                              item.price * (1 - (item.boxDiscount !== undefined ? item.boxDiscount : 25) / 100)
                            )}{' '}
                            {STRINGS.PRODUCT.CURRENCY}
                          </span>
                          <span className="text-xs text-gray-400 line-through">
                            {formatPrice(item.price)} {STRINGS.PRODUCT.CURRENCY}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(index)}
                        className="absolute top-2 left-2 p-1.5 bg-red-50 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        title={STRINGS.BUILD_BOX_PAGE.REMOVE_FROM_BOX}
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Total & Actions */}
              <div className="border-t border-gray-100 pt-6">
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>{STRINGS.BUILD_BOX_PAGE.PRODUCTS_AFTER_DISCOUNT}</span>
                    <span className="font-bold text-gray-800">
                      {formatPrice(
                        getTotal() > 0 ? getTotal() - BUSINESS_CONFIG.BOX_BASE_PRICE_EGP : 0
                      )}{' '}
                      {STRINGS.PRODUCT.CURRENCY}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>{STRINGS.BUILD_BOX_PAGE.BOX_PACKAGING}</span>
                    <span className="font-bold text-gray-800">
                      {BUSINESS_CONFIG.BOX_BASE_PRICE_EGP} {STRINGS.PRODUCT.CURRENCY}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center font-bold text-lg mb-6 border-t border-gray-50 pt-4">
                  <span className="text-gray-800">{STRINGS.BUILD_BOX_PAGE.BOX_TOTAL}</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 text-xl">
                    {formatPrice(getTotal())} {STRINGS.PRODUCT.CURRENCY}
                  </span>
                </div>

                {boxItems.length < minItems ? (
                  <div className="text-center p-3 bg-amber-50 text-amber-700 rounded-xl text-sm font-medium mb-4">
                    {STRINGS.BUILD_BOX_PAGE.ADD_MORE_1} {minItems - boxItems.length} {STRINGS.BUILD_BOX_PAGE.ADD_MORE_2}
                  </div>
                ) : (
                  <button
                    onClick={handleFinishBox}
                    className="w-full btn-primary py-3 flex justify-center items-center gap-2 mb-3 shadow-lg shadow-purple-500/25"
                  >
                    <FiShoppingCart />
                    {STRINGS.BUILD_BOX_PAGE.FINISH_AND_ADD}
                  </button>
                )}

                {boxItems.length > 0 && (
                  <button
                    onClick={handleClearBox}
                    className="w-full py-2 text-gray-500 hover:text-red-500 flex items-center justify-center gap-2 transition-colors text-sm font-medium"
                  >
                    <FiRefreshCw size={14} />
                    {STRINGS.BUILD_BOX_PAGE.CLEAR_BOX}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuildBoxPage;
