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
        const storedToken =
          typeof window !== 'undefined'
            ? (() => {
                try {
                  return localStorage.getItem(STORAGE_KEYS.TOKEN);
                } catch (_) {
                  return null;
                }
              })()
            : null;
        const currentToken = get().token || storedToken;
        const resolvedToken = user ? (token !== undefined && token !== null ? token : currentToken) : null;

        if (typeof window !== 'undefined') {
          try {
            if (resolvedToken) {
              localStorage.setItem(STORAGE_KEYS.TOKEN, resolvedToken);
            } else {
              localStorage.removeItem(STORAGE_KEYS.TOKEN);
            }
          } catch (_) {}
        }

        set({
          user: user && resolvedToken ? user : null,
          token: resolvedToken || null,
          isAuthenticated: Boolean(user && resolvedToken),
        });
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
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        let token = state?.token || null;
        if (!token && typeof window !== 'undefined') {
          try {
            token = localStorage.getItem(STORAGE_KEYS.TOKEN);
          } catch (_) {}
        }
        if (state?.isAuthenticated && state?.user && token) {
          state.setAuth(state.user, token);
        } else if (state?.isAuthenticated || state?.user) {
          state.setAuth(null, null);
        }
        state?.setHasHydrated(true);
      },
    }
  )
);

export default useAuthStore;
