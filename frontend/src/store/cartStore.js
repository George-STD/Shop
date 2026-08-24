import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BUSINESS_CONFIG, STORAGE_KEYS } from '../constants';

const parseStock = (value) => {
  const stock = Number(value);
  if (!Number.isFinite(stock)) return null;
  return Math.max(0, Math.floor(stock));
};

const getItemKey = ({ id, selectedSize, selectedColor, selectedShape, _variantsKey, boxId }) =>
  [id, selectedSize, selectedColor, selectedShape, _variantsKey || '', boxId || ''].join('::');

const getPrice = (item) => {
  const discountPercent = item.boxId
    ? item.boxDiscount ?? BUSINESS_CONFIG.BOX_DISCOUNT_PERCENTAGE
    : 0;
  const basePrice = Number(item.price) || 0;
  const addonsTotal = Array.isArray(item.addons)
    ? item.addons.reduce((sum, addon) => sum + (Number(addon?.price) || 0), 0)
    : 0;
  return basePrice * (1 - discountPercent / 100) + addonsTotal;
};

export const calculateCartTotal = (items) => {
  const boxGroups = new Set();
  const itemsTotal = items.reduce((total, item) => {
    if (item.boxId) boxGroups.add(item.boxId);
    return total + getPrice(item) * (Number(item.quantity) || 0);
  }, 0);
  return itemsTotal + boxGroups.size * BUSINESS_CONFIG.BOX_BASE_PRICE_EGP;
};

/**
 * Client cart state. Persistence is explicitly rehydrated by Providers after mount so
 * the server render and the first client render always use the same empty baseline.
 */
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: Boolean(state) }),

      addItem: (product, quantity = 1, options = {}) => {
        const requestedQuantity = Math.max(1, Math.floor(Number(quantity) || 1));
        const stockLimit = parseStock(product?.stock);
        const maxAllowed = stockLimit ?? Number.MAX_SAFE_INTEGER;

        if (!product?._id) return { success: false, reason: 'invalid_product' };
        if (stockLimit === 0) return { success: false, reason: 'out_of_stock', maxStock: 0 };

        const variantsKey = options.selectedVariants
          ? JSON.stringify(options.selectedVariants)
          : '';
        const incoming = {
          id: product._id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          oldPrice: product.oldPrice,
          image: product.images?.[0]?.url,
          quantity: Math.min(requestedQuantity, maxAllowed),
          stock: stockLimit,
          selectedSize: options.selectedSize,
          selectedColor: options.selectedColor,
          selectedShape: options.selectedShape,
          selectedVariants: options.selectedVariants,
          _variantsKey: variantsKey,
          addons: options.addons || [],
          boxSelections: options.boxSelections || [],
          boxId: options.boxId,
          boxDiscount: options.boxDiscount,
        };
        const itemKey = getItemKey(incoming);
        let result = { success: true, quantity: incoming.quantity, capped: incoming.quantity < requestedQuantity, maxStock: stockLimit };

        set((state) => {
          const existingIndex = state.items.findIndex((item) => getItemKey(item) === itemKey);
          if (existingIndex === -1) return { items: [...state.items, incoming] };

          const currentItem = state.items[existingIndex];
          const nextQuantity = Math.min((Number(currentItem.quantity) || 0) + requestedQuantity, maxAllowed);
          result = {
            success: nextQuantity > currentItem.quantity,
            quantity: nextQuantity,
            capped: nextQuantity < (Number(currentItem.quantity) || 0) + requestedQuantity,
            maxStock: stockLimit,
            reason: nextQuantity === currentItem.quantity ? 'stock_limit_reached' : undefined,
          };
          if (nextQuantity === currentItem.quantity) return state;

          const items = state.items.slice();
          items[existingIndex] = {
            ...currentItem,
            quantity: nextQuantity,
            ...(stockLimit !== null ? { stock: stockLimit } : {}),
          };
          return { items };
        });

        return result;
      },

      removeItem: (id, selectedSize, selectedColor, selectedShape, _variantsKey, boxId) => {
        const targetKey = getItemKey({ id, selectedSize, selectedColor, selectedShape, _variantsKey, boxId });
        set((state) => {
          const items = state.items.filter((item) => getItemKey(item) !== targetKey);
          return items.length === state.items.length ? state : { items };
        });
      },

      updateQuantity: (id, quantity, selectedSize, selectedColor, selectedShape, _variantsKey, boxId) => {
        const requestedQuantity = Math.max(1, Math.floor(Number(quantity) || 1));
        const targetKey = getItemKey({ id, selectedSize, selectedColor, selectedShape, _variantsKey, boxId });
        let result = { success: false, reason: 'not_found' };

        set((state) => {
          let changed = false;
          const items = state.items.map((item) => {
            if (getItemKey(item) !== targetKey) return item;
            const stockLimit = parseStock(item.stock);
            const nextQuantity = Math.min(requestedQuantity, stockLimit ?? Number.MAX_SAFE_INTEGER);
            result = {
              success: true,
              quantity: nextQuantity,
              capped: nextQuantity < requestedQuantity,
              maxStock: stockLimit,
            };
            if (nextQuantity === item.quantity) return item;
            changed = true;
            return { ...item, quantity: nextQuantity };
          });
          return changed ? { items } : state;
        });
        return result;
      },

      clearCart: () => set((state) => (state.items.length ? { items: [] } : state)),
      getTotal: () => calculateCartTotal(get().items),
      getItemsCount: () => get().items.reduce((count, item) => count + (Number(item.quantity) || 0), 0),
    }),
    {
      name: STORAGE_KEYS.CART,
      skipHydration: true,
      version: 1,
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    }
  )
);

export { getItemKey };
