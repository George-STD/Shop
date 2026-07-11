import { Link, Navigate } from 'react-router-dom';
import { FiHeart, FiTrash2, FiShoppingCart } from 'react-icons/fi';
import { useWishlistStore, useCartStore, useAuthStore } from '../store';
import { STRINGS } from '../constants';
import toast from 'react-hot-toast';

const WishlistPage = () => {
  const { items, removeItem, clearWishlist } = useWishlistStore();
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/account" replace />;
  }

  const handleAddToCart = (product) => {
    const cartProduct = {
      _id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      oldPrice: product.oldPrice,
      stock: product.stock,
      images: [{ url: product.image }],
    };
    const result = addItem(cartProduct);

    if (!result?.success) {
      toast.error(STRINGS.PRODUCT.OUT_OF_STOCK_QTY);
      return;
    }

    if (result.capped && result.maxStock !== null) {
      toast.success(`${STRINGS.PRODUCT.ADDED_MAX_STOCK}${result.maxStock})`);
    } else {
      toast.success(STRINGS.PRODUCT.ADDED_TO_CART);
    }

    removeItem(product.id);
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-custom">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{STRINGS.WISHLIST.TITLE}</h1>
              <p className="text-gray-500 mt-1">{items.length} {STRINGS.PRODUCTS_PAGE.PRODUCT_COUNT_LABEL}</p>
            </div>
            {items.length > 0 && (
              <button
                onClick={clearWishlist}
                className="text-red-500 hover:text-red-600 flex items-center gap-2"
              >
                <FiTrash2 />
                {STRINGS.COMMON.CLEAR_ALL}
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="text-center py-16">
              <FiHeart className="text-6xl text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">{STRINGS.WISHLIST.EMPTY}</h2>
              <p className="text-gray-500 mb-6">{STRINGS.WISHLIST.EMPTY_DESC}</p>
              <Link to="/products" className="btn-primary">
                {STRINGS.PRODUCT.BROWSE_PRODUCTS}
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {items.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm group"
                >
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={product.image || '/images/placeholder.jpg'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <button
                      onClick={() => removeItem(product.id)}
                      className="absolute top-3 left-3 p-2 bg-white rounded-full shadow-md text-red-500 hover:bg-red-50"
                    >
                      <FiTrash2 />
                    </button>
                  </div>

                  <div className="p-4">
                    <Link to={`/product/${product.slug}`} className="block">
                      <h3 className="font-medium text-gray-800 hover:text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2 line-clamp-2">
                        {product.name}
                      </h3>
                    </Link>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {product.oldPrice && (
                          <span className="text-gray-400 line-through text-sm">
                            {product.oldPrice} {STRINGS.PRODUCT.CURRENCY}
                          </span>
                        )}
                        <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                          {product.price} {STRINGS.PRODUCT.CURRENCY}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddToCart(product)}
                      className="mt-4 w-full btn-primary flex items-center justify-center gap-2"
                    >
                      <FiShoppingCart />
                      {STRINGS.PRODUCT.ADD_TO_CART}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default WishlistPage;
