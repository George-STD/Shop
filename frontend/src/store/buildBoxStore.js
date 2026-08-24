import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BUSINESS_CONFIG, STORAGE_KEYS } from '../constants';

export const useBuildBoxStore = create(
  persist(
    (set, get) => ({
      items: [],
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: Boolean(state) }),
      get maxItems() {
        return BUSINESS_CONFIG.BOX_MAX_ITEMS;
      },
      get minItems() {
        return BUSINESS_CONFIG.BOX_MIN_ITEMS;
      },

      addItem: (product) => {
        if (!product || get().items.length >= BUSINESS_CONFIG.BOX_MAX_ITEMS) {
          return { success: false, reason: 'max_limit_reached' };
        }
        set((state) => ({ items: [...state.items, { ...product }] }));
        return { success: true };
      },

      removeItem: (index) => {
        set((state) => {
          if (index < 0 || index >= state.items.length) return state;
          return { items: state.items.filter((_, itemIndex) => itemIndex !== index) };
        });
      },

      clearBox: () => set((state) => (state.items.length ? { items: [] } : state)),

      getTotal: () => {
        const itemsTotal = get().items.reduce((total, item) => {
          const discountPercent = item.boxDiscount ?? BUSINESS_CONFIG.BOX_DISCOUNT_PERCENTAGE;
          return total + (Number(item.price) || 0) * (1 - discountPercent / 100);
        }, 0);
        return itemsTotal > 0 ? itemsTotal + BUSINESS_CONFIG.BOX_BASE_PRICE_EGP : 0;
      },
    }),
    {
      name: STORAGE_KEYS.BUILD_BOX,
      skipHydration: true,
      version: 1,
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    }
  )
);

export default useBuildBoxStore;
