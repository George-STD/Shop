import { create } from 'zustand';

export const useUIStore = create((set) => ({
  isMobileMenuOpen: false,
  isSearchOpen: false,
  isCartOpen: false,

  toggleMobileMenu: () => set((state) => ({ 
    isMobileMenuOpen: !state.isMobileMenuOpen,
    isCartOpen: false, // Close cart if menu opens
  })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),

  toggleSearch: () => set((state) => ({ 
    isSearchOpen: !state.isSearchOpen,
    isMobileMenuOpen: false, // Close mobile menu if search opens
  })),
  closeSearch: () => set({ isSearchOpen: false }),

  toggleCart: () => set((state) => ({ 
    isCartOpen: !state.isCartOpen,
    isMobileMenuOpen: false, // Close mobile menu if cart opens
  })),
  closeCart: () => set({ isCartOpen: false }),
}));
