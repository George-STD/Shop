import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '../constants';

const clearStoredAuthSession = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.AUTH);
  } catch (_) {
    // Storage can be unavailable in privacy-restricted contexts.
  }
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: Boolean(state) }),

      setAuth: (user, token) => {
        if (typeof window !== 'undefined') {
          try {
            // Security Fix (High #5): Never persist raw JWT in localStorage (XSS protection).
            // Authentication relies on the httpOnly cookie + volatile in-memory state.
            localStorage.removeItem(STORAGE_KEYS.TOKEN);
          } catch (_) {}
        }
        const resolvedToken = user ? (token !== undefined ? token : get().token) : null;
        set({ user, token: resolvedToken || null, isAuthenticated: Boolean(user) });
      },

      logout: async () => {
        try {
          if (get().token || get().isAuthenticated) {
            const { authAPI } = await import('../services/api');
            await authAPI.logout().catch(() => {});
          }
        } catch (_) {}

        clearStoredAuthSession();
        set({ user: null, token: null, isAuthenticated: false });

        try {
          const { useCartStore } = await import('./cartStore');
          const { useWishlistStore } = await import('./wishlistStore');
          const { useBuildBoxStore } = await import('./buildBoxStore');
          useCartStore.getState().clearCart();
          useWishlistStore.getState().clearWishlist();
          useBuildBoxStore.getState().clearBox();
        } catch (_) {}
      },

      updateUser: (userData) => set((state) => ({ user: { ...state.user, ...userData } })),
      isAdmin: () => get().user?.role === 'admin',
    }),
    {
      name: STORAGE_KEYS.AUTH,
      skipHydration: true,
      version: 1,
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem(STORAGE_KEYS.TOKEN);
          } catch (_) {}
        }
        if (state?.isAuthenticated && state?.user) {
          state.setAuth(state.user, null);
        } else if (state?.isAuthenticated) {
          state.setAuth(null, null);
        }
        state?.setHasHydrated(true);
      },
    }
  )
);

export default useAuthStore;
