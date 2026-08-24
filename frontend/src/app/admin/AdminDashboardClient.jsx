'use client';

import dynamic from 'next/dynamic';

const AdminDashboard = dynamic(() => import('../../legacy-pages/admin/AdminDashboard'), {
  ssr: false,
  loading: () => <div className="min-h-[520px] animate-pulse rounded-2xl bg-gray-100" aria-label="Loading dashboard" />,
});

export default function AdminDashboardClient() {
  return <AdminDashboard />;
}
