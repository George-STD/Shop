import { Link } from 'react-router-dom';
import { FiTrash2, FiPlus, FiMinus, FiShoppingBag } from 'react-icons/fi';
import { useCartStore } from '../store';
import { BUSINESS_CONFIG, STRINGS } from '../constants';
import toast from 'react-hot-toast';

const CartPage = () => {
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCartStore();

  const increaseQuantity = (item) => {
    const result = updateQuantity(
      item.id,
      item.quantity + 1,
      item.selectedSize,
      item.selectedColor,
      item.selectedShape,
      item._variantsKey,
      item.boxId
    );

    if (result?.capped && result.maxStock !== null) {
      toast.error(`${STRINGS.CART.MAX_STOCK_REACHED}${result.maxStock}`);
    }
  };

  const subtotal = getTotal();
  const shippingCost = BUSINESS_CONFIG.SHIPPING_COST;
  const total = subtotal + shippingCost;

  if (items.length === 0) {
    return (
      <>
        <div className="container-custom py-16 text-center">
          <div className="text-8xl mb-6">🛒</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">{STRINGS.CART.EMPTY}</h1>
          <p className="text-gray-600 mb-8">{STRINGS.CART.EMPTY_MESSAGE}</p>
          <Link to="/products" className="btn-primary">
            <FiShoppingBag className="inline ml-2" />
            {STRINGS.CART.START_SHOPPING}
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="container-custom">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">{STRINGS.CART.TITLE}</h1>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item, index) => (
                <div key={`${item.id}-${index}`} className="bg-white rounded-2xl p-6 flex gap-6">
                  <Link to={`/product/${item.slug}`} className="w-24 h-24 flex-shrink-0">
                    <img
                      src={item.image || '/images/placeholder.jpg'}
                      alt={item.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </Link>

                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div>
                        <Link
                          to={`/product/${item.slug}`}
                          className="font-medium text-gray-800 hover:text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600"
                        >
                          {item.name}
                        </Link>
                        {item.boxId && (
                          <div className="mt-1">
                            <span className="inline-block bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full">
                              {STRINGS.CART.IN_BOX}
                            </span>
                          </div>
                        )}
                        {(item.selectedSize || item.selectedColor) && (
                          <p className="text-sm text-gray-500 mt-1">
                            {item.selectedSize && `${STRINGS.PRODUCT.SIZE} ${item.selectedSize}`}
                            {item.selectedSize && item.selectedColor && ' | '}
                            {item.selectedColor && `${STRINGS.PRODUCT.COLOR} ${item.selectedColor}`}
                          </p>
                        )}
                        {item.selectedShape && (
                          <p className="text-sm text-gray-500 mt-1">{STRINGS.PRODUCT.SHAPE} {item.selectedShape}</p>
                        )}
                        {item.selectedVariants && Object.keys(item.selectedVariants).length > 0 && (
                          <div className="text-sm text-gray-500 mt-1 space-y-0.5">
                            {Object.entries(item.selectedVariants).map(([group, value]) => (
                              <p key={group}>
                                {group}: {value}
                              </p>
                            ))}
                          </div>
                        )}
                        {item.boxSelections?.length > 0 && (
                          <div className="text-sm text-gray-500 mt-1 space-y-0.5">
                            {item.boxSelections.map((sel, i) => (
                              <p key={i}>
                                {sel.slotLabel}: {sel.chosenOption}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() =>
                          removeItem(
                            item.id,
                            item.selectedSize,
                            item.selectedColor,
                            item.selectedShape,
                            item._variantsKey,
                            item.boxId
                          )
                        }
                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg"
                      >
                        <FiTrash2 />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center border border-gray-300 rounded-lg">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              item.quantity - 1,
                              item.selectedSize,
                              item.selectedColor,
                              item.selectedShape,
                              item._variantsKey,
                              item.boxId
                            )
                          }
                          className="p-2 hover:bg-gray-100"
                          disabled={item.quantity <= 1}
                        >
                          <FiMinus size={16} />
                        </button>
                        <span className="px-4 font-medium">{item.quantity}</span>
                        <button
                          onClick={() => increaseQuantity(item)}
                          className="p-2 hover:bg-gray-100"
                          disabled={
                            Number.isFinite(Number(item.stock)) &&
                            item.quantity >= Number(item.stock)
                          }
                        >
                          <FiPlus size={16} />
                        </button>
                      </div>

                      <div className="text-left">
                        <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                          {(item.boxId
                            ? item.price * (1 - (item.boxDiscount !== undefined ? item.boxDiscount : 25) / 100)
                            : item.price) * item.quantity}{' '}
                          {STRINGS.PRODUCT.CURRENCY}
                        </span>
                        {item.boxId ? (
                          <span className="text-sm text-gray-400 line-through mr-2">
                            {item.price * item.quantity} {STRINGS.PRODUCT.CURRENCY}
                          </span>
                        ) : (
                          item.oldPrice && (
                            <span className="text-sm text-gray-400 line-through mr-2">
                              {item.oldPrice * item.quantity} {STRINGS.PRODUCT.CURRENCY}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button onClick={clearCart} className="text-red-500 hover:underline">
                {STRINGS.CART.CLEAR_CART}
              </button>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6 sticky top-24">
                <h2 className="text-xl font-bold text-gray-800 mb-6">{STRINGS.CART.ORDER_SUMMARY}</h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{STRINGS.CART.SUBTOTAL}</span>
                    <span>{subtotal} {STRINGS.PRODUCT.CURRENCY}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{STRINGS.CART.SHIPPING}</span>
                    <span>{`${shippingCost} ${STRINGS.PRODUCT.CURRENCY}`}</span>
                  </div>
                  <div className="border-t pt-4 flex justify-between text-lg font-bold">
                    <span>{STRINGS.CART.TOTAL}</span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                      {total} {STRINGS.PRODUCT.CURRENCY}
                    </span>
                  </div>
                </div>

                <Link to="/checkout" className="btn-primary w-full text-center block mb-4">
                  {STRINGS.CART.CHECKOUT}
                </Link>

                <Link to="/products" className="btn-outline w-full text-center block">
                  {STRINGS.CART.CONTINUE_SHOPPING}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CartPage;
