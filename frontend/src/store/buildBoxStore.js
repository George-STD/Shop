import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BUSINESS_CONFIG } from '../constants';

export const useBuildBoxStore = create(
  persist(
    (set, get) => ({
      items: [],

      get maxItems() {
        return BUSINESS_CONFIG.BOX_MAX_ITEMS;
      },
      get minItems() {
        return BUSINESS_CONFIG.BOX_MIN_ITEMS;
      },

      addItem: (product) => {
        const items = get().items;
        if (items.length >= BUSINESS_CONFIG.BOX_MAX_ITEMS) {
          return { success: false, reason: 'max_limit_reached' };
        }
        set({ items: [...items, { ...product }] });
        return { success: true };
      },

      removeItem: (index) => {
        const items = [...get().items];
        items.splice(index, 1);
        set({ items });
      },

      clearBox: () => set({ items: [] }),

      getTotal: () => {
        const itemsTotal = get().items.reduce((total, item) => {
          const discountPercent = item.boxDiscount !== undefined ? item.boxDiscount : 25;
          return total + item.price * (1 - discountPercent / 100);
        }, 0);
        return itemsTotal > 0 ? itemsTotal + BUSINESS_CONFIG.BOX_BASE_PRICE_EGP : 0;
      },
    }),
    {
      name: 'build-box-storage',
    }
  )
);
