import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BUSINESS_CONFIG, STORAGE_KEYS } from '../constants';

/**
 * Custom Gift Box Builder State Store (Zustand)
 * Manages staging items for customized multi-product gift boxes.
 */
export const useBuildBoxStore = create(
  persist(
    (set, get) => ({
      items: [],
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      /** Maximum number of items allowed per custom gift box */
      get maxItems() {
        return BUSINESS_CONFIG.BOX_MAX_ITEMS;
      },
      /** Minimum number of items required to seal a custom gift box */
      get minItems() {
        return BUSINESS_CONFIG.BOX_MIN_ITEMS;
      },

      /**
       * Adds a single product into the staged custom box
       * @param {Object} product - Product candidate
       * @returns {{ success: boolean, reason?: string }}
       */
      addItem: (product) => {
        const items = get().items;
        if (items.length >= BUSINESS_CONFIG.BOX_MAX_ITEMS) {
          return { success: false, reason: 'max_limit_reached' };
        }
        set({ items: [...items, { ...product }] });
        return { success: true };
      },

      /**
       * Removes an item by index from the staged box
       * @param {number} index - Index of item to remove
       */
      removeItem: (index) => {
        const items = [...get().items];
        items.splice(index, 1);
        set({ items });
      },

      /**
       * Clears all items currently in the staged box
       */
      clearBox: () => set({ items: [] }),

      /**
       * Calculates the total discounted price of the staged custom box
       * @returns {number} Subtotal including base packaging price
       */
      getTotal: () => {
        const itemsTotal = get().items.reduce((total, item) => {
          const discountPercent = item.boxDiscount ?? BUSINESS_CONFIG.BOX_DISCOUNT_PERCENTAGE;
          return total + item.price * (1 - discountPercent / 100);
        }, 0);
        return itemsTotal > 0 ? itemsTotal + BUSINESS_CONFIG.BOX_BASE_PRICE_EGP : 0;
      },
    }),
    {
      name: STORAGE_KEYS.BUILD_BOX,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

export default useBuildBoxStore;
