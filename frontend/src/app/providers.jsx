'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useEffect, useState } from 'react';

import ErrorBoundary from '../components/common/ErrorBoundary';
import { useAuthStore, useBuildBoxStore, useCartStore, useWishlistStore } from '../store';

const persistedStores = [useAuthStore, useCartStore, useWishlistStore, useBuildBoxStore];

export default function Providers({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 5 * 60 * 1000,
          },
        },
      })
  );

  useEffect(() => {
    // Delaying all persisted reads until after the first client paint makes the
    // server HTML and the first client render deterministic.
    persistedStores.forEach((store) => store.persist?.rehydrate());
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>{children}</ErrorBoundary>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: { fontFamily: 'Tajawal, sans-serif' },
        }}
      />
    </QueryClientProvider>
  );
}
