import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '../constants';

const parseStock = (value) => {
  const stock = Number(value);
  if (!Number.isFinite(stock)) return null;
  return Math.max(0, Math.floor(stock));
};

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [],
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      addItem: (product) => {
        const items = get().items;
        if (!items.find((item) => item.id === product._id)) {
          set({
            items: [
              ...items,
              {
                id: product._id,
                name: product.name,
                slug: product.slug,
                price: product.price,
                oldPrice: product.oldPrice,
                image: product.images?.[0]?.url,
                stock: parseStock(product.stock),
              },
            ],
          });
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) });
      },

      isInWishlist: (id) => {
        return get().items.some((item) => item.id === id);
      },

      syncWishlist: (serverWishlist) => {
        if (!Array.isArray(serverWishlist)) return;
        const currentItems = get().items;
        const map = new Map();
        currentItems.forEach((item) => item.id && map.set(item.id, item));

        serverWishlist.forEach((item) => {
          if (!item) return;
          const id = typeof item === 'string' ? item : (item._id || item.id);
          if (!id) return;
          const existing = map.get(id);
          if (typeof item === 'object') {
            map.set(id, {
              id,
              name: item.name || existing?.name,
              slug: item.slug || existing?.slug,
              price: item.price ?? existing?.price,
              oldPrice: item.oldPrice ?? existing?.oldPrice,
              image: item.images?.[0]?.url || item.image || existing?.image,
              stock: parseStock(item.stock) ?? existing?.stock ?? null,
            });
          } else if (!existing) {
            map.set(id, { id });
          }
        });

        set({ items: Array.from(map.values()) });
      },

      clearWishlist: () => set({ items: [] }),
    }),
    {
      name: STORAGE_KEYS.WISHLIST,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      }
    }
  )
);
