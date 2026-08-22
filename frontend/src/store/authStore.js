import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '../constants';

const clearStoredAuthSession = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.AUTH);
  } catch (_) {}
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setHasHydrated: (state) => {
        set({ _hasHydrated: state });
      },

      setAuth: (user, token) => {
        if (typeof window !== 'undefined') {
          try {
            if (token) localStorage.setItem(STORAGE_KEYS.TOKEN, token);
          } catch (_) {}
        }
        set({ user, token: token || null, isAuthenticated: true });
      },

      logout: async () => {
        try {
          const token = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.TOKEN) : null;
          if (token) {
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

      updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } });
      },

      isAdmin: () => {
        return get().user?.role === 'admin';
      },
    }),
    {
      name: STORAGE_KEYS.AUTH,
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
      onRehydrateStorage: () => (state) => {
        if (typeof window !== 'undefined') {
          try {
            const savedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
            if (savedToken && state?.isAuthenticated) {
              state.token = savedToken;
            }
          } catch (_) {}
        }
        state?.setHasHydrated(true);
      },
    }
  )
);

export default useAuthStore;
