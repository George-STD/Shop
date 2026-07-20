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
                image: product.images[0]?.url,
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
