'use client';

import dynamic from 'next/dynamic';

const HomePage = dynamic(() => import('../../legacy-pages/HomePage'), {
  ssr: true,
  loading: () => <div className="min-h-screen bg-white" aria-label="Loading home page" />,
});

export default function HomePageClient() {
  return <HomePage />;
}
