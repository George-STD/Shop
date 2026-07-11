import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '../constants';

const clearStoredAuthSession = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.AUTH);
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
          localStorage.setItem(STORAGE_KEYS.TOKEN, token);
        }
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        clearStoredAuthSession();
        set({ user: null, token: null, isAuthenticated: false });
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
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

export default useAuthStore;
