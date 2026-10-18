import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BUSINESS_CONFIG, STORAGE_KEYS } from '../constants';

const parseStock = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const stock = Number(value);
  if (!Number.isFinite(stock)) return null;
  return Math.max(0, Math.floor(stock));
};

const getItemKey = ({ id, selectedSize, selectedColor, selectedShape, _variantsKey, boxId }) =>
  [id, selectedSize, selectedColor, selectedShape, _variantsKey || '', boxId || ''].join('::');

const unwrapAndDedupeBoxItems = (items, boxId) => {
  if (!boxId) return items;
  const remainingBoxQty = items
    .filter((i) => i.boxId === boxId)
    .reduce((sum, i) => sum + (Number(i.quantity) || 1), 0);

  if (remainingBoxQty > 0 && remainingBoxQty < BUSINESS_CONFIG.BOX_MIN_ITEMS) {
    const unwrapped = items.map((i) =>
      i.boxId === boxId ? { ...i, boxId: undefined, boxDiscount: undefined } : i
    );
    const mergedMap = new Map();
    for (const item of unwrapped) {
      const key = getItemKey(item);
      if (mergedMap.has(key)) {
        const existing = mergedMap.get(key);
        const limit = parseStock(existing.variantStock ?? existing.stock) ?? Number.MAX_SAFE_INTEGER;
        mergedMap.set(key, {
          ...existing,
          quantity: Math.min(limit, (Number(existing.quantity) || 1) + (Number(item.quantity) || 1)),
        });
      } else {
        mergedMap.set(key, item);
      }
    }
    return Array.from(mergedMap.values());
  }
  return items;
};

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
        const productStockLimit = parseStock(product?.stock);
        const variantStockLimit = parseStock(options?.variantStock);
        const effectiveKeyLimit =
          productStockLimit !== null && variantStockLimit !== null
            ? Math.min(productStockLimit, variantStockLimit)
            : variantStockLimit ?? productStockLimit;
        const maxProductAllowed = productStockLimit ?? Number.MAX_SAFE_INTEGER;
        const maxVariantAllowed = effectiveKeyLimit ?? Number.MAX_SAFE_INTEGER;

        if (!product?._id) return { success: false, reason: 'invalid_product' };
        if (productStockLimit === 0 || variantStockLimit === 0) {
          return { success: false, reason: 'out_of_stock', maxStock: 0 };
        }

        const keyParts = [];
        if (options.selectedVariants && Object.keys(options.selectedVariants).length > 0) {
          keyParts.push(JSON.stringify(options.selectedVariants));
        }
        if (Array.isArray(options.addons) && options.addons.length > 0) {
          keyParts.push('addons:' + options.addons.map((a) => a?.name || '').sort().join(','));
        }
        if (Array.isArray(options.boxSelections) && options.boxSelections.length > 0) {
          keyParts.push('boxSel:' + options.boxSelections.map((s) => `${s?.slotLabel}:${s?.chosenOption}`).join(','));
        }
        const variantsKey = keyParts.join('|');
        const incoming = {
          id: product._id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          oldPrice: product.oldPrice,
          image: product.images?.[0]?.url,
          quantity: Math.min(requestedQuantity, maxVariantAllowed),
          stock: productStockLimit,
          variantStock: variantStockLimit,
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
        let result = {
          success: true,
          quantity: incoming.quantity,
          capped: incoming.quantity < requestedQuantity,
          maxStock: effectiveKeyLimit,
        };

        set((state) => {
          const existingIndex = state.items.findIndex((item) => getItemKey(item) === itemKey);
          const otherVariantsQty = state.items.reduce(
            (sum, item, idx) => (item.id === product._id && idx !== existingIndex ? sum + (Number(item.quantity) || 0) : sum),
            0
          );
          const remainingForProduct = Math.max(0, maxProductAllowed - otherVariantsQty);
          const remainingForThisKey = Math.min(remainingForProduct, maxVariantAllowed);

          if (existingIndex === -1) {
            if (remainingForThisKey === 0) {
              result = { success: false, quantity: 0, capped: true, maxStock: effectiveKeyLimit, reason: 'stock_limit_reached' };
              return state;
            }
            const clampedIncoming = {
              ...incoming,
              quantity: Math.min(requestedQuantity, remainingForThisKey),
            };
            result = {
              success: true,
              quantity: clampedIncoming.quantity,
              capped: clampedIncoming.quantity < requestedQuantity,
              maxStock: effectiveKeyLimit,
            };
            return { items: [...state.items, clampedIncoming] };
          }

          const currentItem = state.items[existingIndex];
          const nextQuantity = Math.min((Number(currentItem.quantity) || 0) + requestedQuantity, remainingForThisKey);
          result = {
            success: nextQuantity > currentItem.quantity,
            quantity: nextQuantity,
            capped: nextQuantity < (Number(currentItem.quantity) || 0) + requestedQuantity,
            maxStock: effectiveKeyLimit,
            reason: nextQuantity === currentItem.quantity ? 'stock_limit_reached' : undefined,
          };
          if (nextQuantity === currentItem.quantity) return state;

          const items = state.items.slice();
          items[existingIndex] = {
            ...currentItem,
            quantity: nextQuantity,
            ...(productStockLimit !== null ? { stock: productStockLimit } : {}),
            ...(variantStockLimit !== null ? { variantStock: variantStockLimit } : {}),
          };
          return { items };
        });

        return result;
      },

      removeItem: (id, selectedSize, selectedColor, selectedShape, _variantsKey, boxId) => {
        let size = selectedSize;
        let color = selectedColor;
        let shape = selectedShape;
        let vKey = _variantsKey;
        let bId = boxId;

        if (selectedSize && typeof selectedSize === 'object' && !Array.isArray(selectedSize)) {
          size = selectedSize.selectedSize;
          color = selectedSize.selectedColor;
          shape = selectedSize.selectedShape;
          vKey = selectedSize._variantsKey;
          bId = selectedSize.boxId;
        }

        const targetKey = getItemKey({
          id,
          selectedSize: size,
          selectedColor: color,
          selectedShape: shape,
          _variantsKey: vKey,
          boxId: bId,
        });

        set((state) => {
          let items = state.items.filter((item) => {
            if (getItemKey(item) === targetKey) return false;
            if (bId && item.id === id && item.boxId === bId && !size && !color && !shape) return false;
            return true;
          });
          if (items.length === state.items.length) return state;

          // If removing an item from a custom box drops that box below BOX_MIN_ITEMS, unwrap and merge remaining items
          items = unwrapAndDedupeBoxItems(items, bId);
          return { items };
        });
      },

      updateQuantity: (id, quantity, selectedSize, selectedColor, selectedShape, _variantsKey, boxId) => {
        const requestedQuantity = Math.max(1, Math.floor(Number(quantity) || 1));
        const targetKey = getItemKey({ id, selectedSize, selectedColor, selectedShape, _variantsKey, boxId });
        let result = { success: false, reason: 'not_found' };

        set((state) => {
          let changed = false;
          const otherVariantsQty = state.items.reduce(
            (sum, item) => (item.id === id && getItemKey(item) !== targetKey ? sum + (Number(item.quantity) || 0) : sum),
            0
          );
          let items = state.items.map((item) => {
            if (getItemKey(item) !== targetKey) return item;
            const productStockLimit = parseStock(item.stock);
            const variantStockLimit = parseStock(item.variantStock);
            const maxProductForKey = Math.max(1, (productStockLimit ?? Number.MAX_SAFE_INTEGER) - otherVariantsQty);
            const maxVariantForKey = variantStockLimit !== null ? Math.max(1, variantStockLimit) : Number.MAX_SAFE_INTEGER;
            const maxForThisKey = Math.min(maxProductForKey, maxVariantForKey);
            const nextQuantity = Math.min(requestedQuantity, maxForThisKey);
            const effectiveLimit =
              productStockLimit !== null && variantStockLimit !== null
                ? Math.min(productStockLimit, variantStockLimit)
                : variantStockLimit ?? productStockLimit;
            result = {
              success: true,
              quantity: nextQuantity,
              capped: nextQuantity < requestedQuantity,
              maxStock: effectiveLimit,
            };
            if (nextQuantity === item.quantity) return item;
            changed = true;
            return { ...item, quantity: nextQuantity };
          });
          if (!changed) return state;
          items = unwrapAndDedupeBoxItems(items, boxId);
          return { items };
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
