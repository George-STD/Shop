'use client';

import dynamic from 'next/dynamic';

const AdminAnalysis = dynamic(() => import('../../legacy-pages/admin/AdminAnalysis'), {
  ssr: false,
  loading: () => <div className="min-h-[680px] animate-pulse rounded-2xl bg-gray-100" aria-label="Loading analytics" />,
});

export default function AdminAnalysisClient() {
  return <AdminAnalysis />;
}
